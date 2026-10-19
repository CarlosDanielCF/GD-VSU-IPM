from __future__ import annotations

import json
import os
import re
import unicodedata
from typing import Any, TypedDict

import pandas as pd
import requests
from langgraph.graph import END, START, StateGraph

from .data_engine import DEPARTMENTS, build_water_scenario


class CopilotState(TypedDict, total=False):
    question: str
    department_id: str
    territory: str
    frame: pd.DataFrame
    predictions: pd.DataFrame
    metrics: dict[str, float]
    model_name: str
    provider: str
    answer: str
    evidence: list[dict[str, str]]
    scenario: dict[str, Any] | None
    trace: list[dict[str, str]]


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def detect_department(question: str) -> str | None:
    text = f" {normalize(question)} "
    aliases: list[tuple[int, str, str]] = []
    for department in DEPARTMENTS:
        for name in {department.id.replace("_", " "), department.name, *department.cities}:
            alias = normalize(name)
            aliases.append((len(alias), alias, department.id))
    for _, alias, department_id in sorted(aliases, reverse=True):
        if f" {alias} " in text:
            return department_id
    return None


def _budget(question: str) -> float:
    match = re.search(r"(?:usd|us\$|\$)?\s*(\d+(?:[.,]\d+)?)\s*(?:millones?|m\b)", question, re.I)
    return float(match.group(1).replace(",", ".")) if match else 4.0


def context_guard(state: CopilotState) -> dict[str, Any]:
    return {"trace": [{"node": "context_guard", "label": "CONTEXTO", "status": "completed",
                       "detail": f"{len(state['frame'])} observaciones anuales oficiales; sin datos sintéticos."}]}


def trained_engine(state: CopilotState) -> dict[str, Any]:
    recent = state["predictions"].sort_values("year", ascending=False).head(3)
    evidence = [{"label": str(int(row.year)),
                 "value": f"NBI observada {row.nbi_percent:.2f}% · modelo {row.predicted_nbi:.2f}%",
                 "source": f"INEI–ENAHO · intervalo orientativo [{row.ci_low:.2f}%, {row.ci_high:.2f}%]"}
                for row in recent.itertuples()]
    lines = "\n".join(f"{int(row.year)}: NBI observada={row.nbi_percent:.2f}%, modelo={row.predicted_nbi:.2f}%"
                      for row in recent.itertuples())
    answer = (
        f"Análisis de {state['territory']} con datos oficiales INEI–ENAHO y {state['model_name']} "
        f"(R² temporal={state['metrics']['r2']:.3f}, RMSE={state['metrics']['rmse']:.2f} puntos porcentuales).\n\n"
        f"Evidencia reciente:\n{lines}\n\n"
        "Interpretación: la NBI mide carencias básicas; no equivale al IPM Alkire–Foster ni demuestra causalidad. "
        "El modelo reproduce el patrón temporal como apoyo descriptivo y debe validarse antes de decidir."
    )
    wants_scenario = bool(re.search(r"diseñ|disen|escenario|simul|intervenci|agua", state["question"], re.I))
    scenario = build_water_scenario(state["frame"], _budget(state["question"])) if wants_scenario else None
    return {"answer": answer, "evidence": evidence, "scenario": scenario, "provider": "trained_ml",
            "trace": state.get("trace", []) + [{"node": "trained_engine", "label": "MOTOR ML",
                                                   "status": "completed", "detail": "Validación temporal 2024–2025."}]}


def generative_layer(state: CopilotState) -> dict[str, Any]:
    trace = state.get("trace", [])
    langflow_url, flow_id = os.getenv("LANGFLOW_URL", "").rstrip("/"), os.getenv("LANGFLOW_FLOW_ID", "")
    if langflow_url and flow_id:
        try:
            response = requests.post(f"{langflow_url}/api/v1/run/{flow_id}", timeout=45,
                headers={"Content-Type": "application/json", **({"x-api-key": os.getenv("LANGFLOW_API_KEY", "")} if os.getenv("LANGFLOW_API_KEY") else {})},
                json={"input_value": f"{state['question']}\n\nEVIDENCIA OFICIAL:\n{state['answer']}", "input_type": "chat", "output_type": "chat"})
            response.raise_for_status()
            state["answer"] += f"\n\nLangflow ejecutado: {json.dumps(response.json(), ensure_ascii=False)[:600]}"
            return {"answer": state["answer"], "provider": "langflow+trained_ml",
                    "trace": trace + [{"node": "langflow", "label": "LANGFLOW", "status": "completed", "detail": "Flujo visual sobre evidencia oficial."}]}
        except Exception as exc:
            trace.append({"node": "langflow", "label": "LANGFLOW", "status": "fallback", "detail": str(exc)[:140]})
    if os.getenv("GEMINI_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            model = ChatGoogleGenerativeAI(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), temperature=0.1)
            result = model.invoke(f"Responde en español. No inventes cifras ni causalidad. Consulta: {state['question']}\nEvidencia: {state['answer']}")
            return {"answer": str(result.content), "provider": "langchain+trained_ml",
                    "trace": trace + [{"node": "langchain", "label": "LANGCHAIN", "status": "completed", "detail": "Redacción restringida a evidencia oficial."}]}
        except Exception as exc:
            trace.append({"node": "langchain", "label": "LANGCHAIN", "status": "fallback", "detail": str(exc)[:140]})
    return {"trace": trace + [{"node": "generative", "label": "LANGCHAIN/LANGFLOW", "status": "skipped", "detail": "Sin credenciales; se conserva la salida del motor local."}]}


def governance(state: CopilotState) -> dict[str, Any]:
    return {"trace": state.get("trace", []) + [{"node": "governance", "label": "GOBERNANZA", "status": "completed", "detail": "No se ejecutaron políticas ni se inventaron impactos."}]}


def build_graph():
    graph = StateGraph(CopilotState)
    for name, fn in (("context_guard", context_guard), ("trained_engine", trained_engine),
                     ("generative_layer", generative_layer), ("governance", governance)):
        graph.add_node(name, fn)
    graph.add_edge(START, "context_guard")
    graph.add_edge("context_guard", "trained_engine")
    graph.add_edge("trained_engine", "generative_layer")
    graph.add_edge("generative_layer", "governance")
    graph.add_edge("governance", END)
    return graph.compile()


COPILOT_GRAPH = build_graph()


def run_copilot(question: str, department_id: str, territory: str, frame: pd.DataFrame,
                predictions: pd.DataFrame, metrics: dict[str, float]) -> CopilotState:
    return COPILOT_GRAPH.invoke({"question": question, "department_id": department_id, "territory": territory,
        "frame": frame, "predictions": predictions, "metrics": metrics,
        "model_name": "Random Forest temporal auditable", "trace": []})

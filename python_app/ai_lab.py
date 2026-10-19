from __future__ import annotations

import io
import math
import os
import re
import unicodedata
from typing import Any, TypedDict

import numpy as np
import pandas as pd
from langgraph.graph import END, START, StateGraph
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

REQUIRED = ["department", "year", "nbi_percent"]
ALIASES = {
    "department_id": ["department_id", "departamento_id", "id_departamento", "codigo", "ubigeo"],
    "department": ["department", "departamento", "territorio", "nombre"],
    "region": ["region", "region_natural"],
    "year": ["year", "ano", "anio", "periodo"],
    "nbi_percent": ["nbi_percent", "nbi", "nbi_pct", "porcentaje_nbi", "valor", "target"],
}


def _norm(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn").lower().strip()
    return re.sub(r"[^a-z0-9]+", "_", text).strip("_")


def validate_training_frame(frame: pd.DataFrame, source_name: str) -> tuple[pd.DataFrame, dict[str, Any]]:
    normalized = {_norm(column): column for column in frame.columns}
    selected: dict[str, str] = {}
    for field, aliases in ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                selected[field] = normalized[alias]
                break
    missing = [field for field in REQUIRED if field not in selected]
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {', '.join(missing)}.")
    clean = pd.DataFrame({field: frame[column] for field, column in selected.items()})
    clean["department"] = clean.department.astype(str).str.strip()
    clean["department_id"] = clean.get("department_id", clean.department).map(_norm)
    clean["region"] = clean.get("region", "No especificada").fillna("No especificada").astype(str).str.strip()
    clean["year"] = pd.to_numeric(clean.year, errors="coerce")
    clean["nbi_percent"] = pd.to_numeric(clean.nbi_percent.astype(str).str.replace(",", ".", regex=False), errors="coerce")
    invalid = clean.department.eq("") | clean.year.isna() | clean.nbi_percent.isna() | ~clean.year.between(1990, 2100) | ~clean.nbi_percent.between(0, 100)
    rejected = int(invalid.sum())
    clean = clean.loc[~invalid].copy()
    clean["year"] = clean.year.astype(int)
    clean["source_name"] = source_name
    duplicates = int(clean.duplicated(["department_id", "year"]).sum())
    clean = clean.drop_duplicates(["department_id", "year"], keep="last").sort_values(["department_id", "year"]).reset_index(drop=True)
    if len(clean) < 20:
        raise ValueError("Se requieren al menos 20 filas válidas para ejecutar 10-fold cross-validation.")
    profile = {"source": source_name, "input_rows": len(frame), "valid_rows": len(clean), "rejected_rows": rejected,
               "duplicates_removed": duplicates, "territories": int(clean.department_id.nunique()),
               "min_year": int(clean.year.min()), "max_year": int(clean.year.max())}
    return clean, profile


def read_uploaded_dataset(uploaded) -> tuple[pd.DataFrame, dict[str, Any]]:
    name = uploaded.name
    data = uploaded.getvalue()
    extension = name.rsplit(".", 1)[-1].lower()
    if extension in {"xlsx", "xls"}:
        raw = pd.read_excel(io.BytesIO(data))
    elif extension == "csv":
        raw = pd.read_csv(io.BytesIO(data), sep=None, engine="python")
    elif extension == "tsv":
        raw = pd.read_csv(io.BytesIO(data), sep="\t")
    else:
        raise ValueError("Formato no admitido. Use CSV, TSV, XLS o XLSX.")
    return validate_training_frame(raw, name)


def describe_dataset(frame: pd.DataFrame) -> tuple[dict[str, Any], pd.DataFrame, list[dict[str, Any]]]:
    y = frame.nbi_percent.astype(float)
    q1, q3 = y.quantile([.25, .75]); iqr = q3 - q1
    summary = {"rows": len(frame), "columns": 6, "territories": int(frame.department_id.nunique()),
               "years": f"{int(frame.year.min())}–{int(frame.year.max())}", "missing": int(frame.isna().sum().sum()),
               "duplicates": int(frame.duplicated(["department_id", "year"]).sum()), "mean": float(y.mean()),
               "median": float(y.median()), "std": float(y.std(ddof=0)), "min": float(y.min()),
               "q1": float(q1), "q3": float(q3), "max": float(y.max()),
               "outliers": int(((y < q1 - 1.5 * iqr) | (y > q3 + 1.5 * iqr)).sum())}
    yearly = frame.groupby("year", as_index=False).agg(nbi_media=("nbi_percent", "mean"), observaciones=("nbi_percent", "size"))
    x = frame.year.to_numpy(float); values = y.to_numpy(float)
    correlation = float(np.corrcoef(x, values)[0, 1]); n = len(values)
    t_value = correlation * math.sqrt((n - 2) / max(1e-12, 1 - correlation ** 2))
    p_value = math.erfc(abs(t_value) / math.sqrt(2))
    centered = (values - values.mean()) / (values.std() or 1)
    skew, kurtosis = float(np.mean(centered ** 3)), float(np.mean(centered ** 4))
    jb = n / 6 * (skew ** 2 + (kurtosis - 3) ** 2 / 4); jb_p = math.exp(-jb / 2)
    ordered = frame.sort_values(["department_id", "year"]); residuals = ordered.nbi_percent.to_numpy() - values.mean()
    dw = float(np.sum(np.diff(residuals) ** 2) / max(1e-12, np.sum(residuals ** 2)))
    groups = [group.nbi_percent.to_numpy(float) for _, group in frame.groupby("region")]
    between = sum(len(group) * (group.mean() - values.mean()) ** 2 for group in groups)
    within = sum(np.sum((group - group.mean()) ** 2) for group in groups)
    anova_f = float((between / max(1, len(groups) - 1)) / (within / max(1, n - len(groups))))
    tests = [
        {"Prueba": "Pearson año–NBI", "Estadístico": correlation, "p-valor": p_value, "Interpretación": "Asociación temporal; no implica causalidad."},
        {"Prueba": "Jarque–Bera", "Estadístico": jb, "p-valor": jb_p, "Interpretación": "Evalúa normalidad de la variable objetivo."},
        {"Prueba": "ANOVA descriptiva por región", "Estadístico": anova_f, "p-valor": np.nan, "Interpretación": "Compara variación entre regiones con variación interna."},
        {"Prueba": "Durbin–Watson aproximado", "Estadístico": dw, "p-valor": np.nan, "Interpretación": "Diagnóstico de dependencia serial."},
        {"Prueba": "Atípicos 1.5×IQR", "Estadístico": summary["outliers"], "p-valor": np.nan, "Interpretación": "Los casos se señalan; no se eliminan automáticamente."},
    ]
    return summary, yearly, tests


def train_models_cv(frame: pd.DataFrame, folds: int = 10) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    if folds < 10:
        raise ValueError("El entrenamiento exige un mínimo de 10 folds.")
    features = frame[["department_id", "region", "year"]]
    target = frame.nbi_percent.to_numpy(float)
    preprocessor = ColumnTransformer([
        ("categories", OneHotEncoder(handle_unknown="ignore"), ["department_id", "region"]),
        ("year", StandardScaler(), ["year"]),
    ])
    candidates = {
        "Media global": DummyRegressor(strategy="mean"),
        "Regresión lineal": LinearRegression(),
        "Ridge regularizado": Ridge(alpha=3.0),
        "Random Forest": RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1),
    }
    splitter = KFold(n_splits=folds, shuffle=True, random_state=42)
    model_rows, fold_rows = [], []
    for name, estimator in candidates.items():
        scores = []
        for fold_number, (train_idx, validation_idx) in enumerate(splitter.split(features), 1):
            pipeline = Pipeline([("preprocessor", preprocessor), ("model", estimator)])
            pipeline.fit(features.iloc[train_idx], target[train_idx])
            predicted = np.clip(pipeline.predict(features.iloc[validation_idx]), 0, 100)
            actual = target[validation_idx]
            row = {"Modelo": name, "Fold": fold_number, "Train": len(train_idx), "Validación": len(validation_idx),
                   "R²": float(r2_score(actual, predicted)), "RMSE": float(mean_squared_error(actual, predicted) ** .5),
                   "MAE": float(mean_absolute_error(actual, predicted))}
            scores.append(row); fold_rows.append(row)
        model_rows.append({"Modelo": name, "Folds": folds, "R² medio": np.mean([row["R²"] for row in scores]),
                           "RMSE medio": np.mean([row["RMSE"] for row in scores]), "MAE medio": np.mean([row["MAE"] for row in scores]),
                           "Desv. RMSE": np.std([row["RMSE"] for row in scores])})
    ranking = pd.DataFrame(model_rows).sort_values("RMSE medio").reset_index(drop=True)
    ranking["Estado"] = ["CAMPEÓN" if index == 0 else "Comparado" for index in range(len(ranking))]
    fold_table = pd.DataFrame(fold_rows)
    champion = ranking.iloc[0].to_dict()
    champion["trained_at"] = pd.Timestamp.now().isoformat()
    return ranking, fold_table, champion


class LabChatState(TypedDict, total=False):
    question: str
    summary: dict[str, Any]
    champion: dict[str, Any]
    tests: list[dict[str, Any]]
    answer: str
    trace: list[dict[str, str]]


def _guard(state: LabChatState):
    return {"trace": [{"node": "dataset_guard", "status": "completed", "detail": f"{state['summary']['rows']} filas validadas"}]}


def _analyse(state: LabChatState):
    question = state["question"].lower(); summary, champion = state["summary"], state["champion"]
    if re.search(r"mejor|modelo|entren", question):
        answer = f"El modelo campeón es {champion['Modelo']}: RMSE medio {champion['RMSE medio']:.3f}, MAE {champion['MAE medio']:.3f} y R² medio {champion['R² medio']:.3f} en {champion['Folds']} folds."
    elif re.search(r"calidad|nulo|duplic|falt", question):
        answer = f"Calidad del dataset: {summary['rows']} filas, {summary['missing']} faltantes y {summary['duplicates']} claves duplicadas."
    elif re.search(r"estad|prueba|correl", question):
        answer = " ".join(f"{item['Prueba']}: estadístico {item['Estadístico']:.3f}. {item['Interpretación']}" for item in state["tests"])
    else:
        answer = f"Dataset activo: {summary['rows']} registros, {summary['territories']} territorios, {summary['years']}. NBI media {summary['mean']:.2f}% y mediana {summary['median']:.2f}%."
    return {"answer": answer, "trace": state.get("trace", []) + [{"node": "trained_engine", "status": "completed", "detail": champion["Modelo"]}]}


def _orchestrate(state: LabChatState):
    configured = bool(os.getenv("LANGFLOW_URL") and os.getenv("LANGFLOW_FLOW_ID"))
    return {"trace": state.get("trace", []) + [{"node": "langflow", "status": "configured" if configured else "local-safe", "detail": "Flujo visual opcional; no altera las métricas."}]}


def build_lab_graph():
    graph = StateGraph(LabChatState)
    graph.add_node("dataset_guard", _guard); graph.add_node("trained_engine", _analyse); graph.add_node("langflow", _orchestrate)
    graph.add_edge(START, "dataset_guard"); graph.add_edge("dataset_guard", "trained_engine"); graph.add_edge("trained_engine", "langflow"); graph.add_edge("langflow", END)
    return graph.compile()


LAB_GRAPH = build_lab_graph()


def ask_lab(question: str, summary: dict[str, Any], champion: dict[str, Any], tests: list[dict[str, Any]]):
    return LAB_GRAPH.invoke({"question": question, "summary": summary, "champion": champion, "tests": tests, "trace": []})

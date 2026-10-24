from __future__ import annotations

from datetime import datetime
import os

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from dotenv import load_dotenv

from python_app.ai_lab import (
    ask_lab, describe_dataset, read_uploaded_dataset, train_models_cv,
    validate_training_frame,
)
from python_app.data_engine import NBI_SOURCE, SOURCE_LABEL, SOURCE_URL, national_dataset
from python_app.demo_simulation import run_demo_simulation

load_dotenv()
st.set_page_config(page_title="Motor IA · Vulnerabilidad Socioeconómica", page_icon="◈", layout="wide")
st.markdown("""
<style>
.stApp{background:radial-gradient(circle at 75% -10%,#122238 0,#0b1018 32%,#080b10 66%);color:#E5E7EB}
[data-testid="stSidebar"]{background:linear-gradient(180deg,#101722,#0b0f16);border-right:1px solid #253247}
[data-testid="stHeader"]{background:rgba(8,11,16,.75);backdrop-filter:blur(12px)}
.block-container{max-width:1500px;padding-top:2rem;padding-bottom:3rem}
h1,h2,h3{letter-spacing:-.02em} h1{font-weight:750!important}
div[data-testid="stMetric"]{background:linear-gradient(145deg,#121a26,#0c121b);border:1px solid #27364c;padding:15px 16px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.16)}
div[data-testid="stMetric"] label{color:#8fa1b7!important;font-size:.75rem!important;text-transform:uppercase;letter-spacing:.08em}
div[data-testid="stMetricValue"]{color:#f8fafc;font-weight:650}
.stTabs [data-baseweb="tab-list"]{gap:6px;background:#0d141e;padding:6px;border:1px solid #243246;border-radius:12px}
.stTabs [data-baseweb="tab"]{height:42px;border-radius:8px;padding:0 16px;color:#94a3b8}
.stTabs [aria-selected="true"]{background:#173047!important;color:#67e8f9!important}
.hero{padding:26px 28px;border:1px solid #2a4360;border-radius:16px;background:linear-gradient(125deg,rgba(15,45,68,.94),rgba(14,22,34,.96) 55%,rgba(20,35,48,.94));box-shadow:0 20px 60px rgba(0,0,0,.24);margin-bottom:18px}
.hero-kicker{color:#67e8f9;font:700 11px monospace;letter-spacing:.16em}.hero h1{font-size:2rem;margin:.35rem 0 .35rem;color:#f8fafc}.hero p{color:#a9b7c9;margin:0;max-width:900px}
.flow-node{border:1px solid #6544a5;background:linear-gradient(145deg,#1a1530,#111522);padding:12px;border-radius:10px;text-align:center;font:12px monospace;color:#d8ccff;min-height:82px;box-shadow:0 8px 20px rgba(0,0,0,.15)}
.success-box{border:1px solid #22c7a1;background:linear-gradient(120deg,#071d19,#0c1821);padding:18px;border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.18)}
.section-note{padding:12px 14px;border-left:3px solid #38bdf8;background:#0e1824;border-radius:0 8px 8px 0;color:#b8c6d8;font-size:13px;margin:.5rem 0 1rem}
.muted{color:#8E9299;font-size:12px}
</style>""", unsafe_allow_html=True)


def explain(title: str, interpretation: str, method: str, limitation: str) -> None:
    with st.expander(f"Interpretabilidad y explicabilidad · {title}", expanded=True):
        st.markdown(f"**Qué muestra.** {interpretation}")
        st.markdown(f"**Cómo se obtuvo.** {method}")
        st.markdown(f"**Límite.** {limitation}")


def style_figure(figure, title: str, subtitle: str = "", height: int = 430):
    figure.update_layout(
        title={"text": f"<b>{title}</b><br><sup>{subtitle}</sup>", "x": .02, "xanchor": "left"},
        height=height, margin=dict(l=35, r=25, t=78, b=45),
        paper_bgcolor="#0e151f", plot_bgcolor="#0e151f", font=dict(color="#cbd5e1", family="Inter, Arial"),
        hoverlabel=dict(bgcolor="#111827", font_color="#f8fafc"), legend=dict(orientation="h", y=1.08, x=1, xanchor="right"),
        xaxis=dict(gridcolor="rgba(148,163,184,.12)", zeroline=False), yaxis=dict(gridcolor="rgba(148,163,184,.12)", zeroline=False),
    )
    return figure


@st.cache_data(show_spinner=False)
def official_training_data():
    raw = national_dataset()[["department_id", "department", "region", "year", "nbi_percent"]]
    return validate_training_frame(raw, "INEI_NBI_departamento.xlsx")


@st.cache_data(show_spinner="Ejecutando EDA, pruebas estadísticas y 10-fold cross-validation…")
def analyse_and_train(active_frame: pd.DataFrame):
    active_summary, active_yearly, active_tests = describe_dataset(active_frame)
    active_ranking, active_folds, active_champion = train_models_cv(active_frame, folds=10)
    return active_summary, active_yearly, active_tests, active_ranking, active_folds, active_champion


if "lab_frame" not in st.session_state:
    st.session_state.lab_frame, st.session_state.lab_profile = official_training_data()
if "lab_chat" not in st.session_state:
    st.session_state.lab_chat = []

frame: pd.DataFrame = st.session_state.lab_frame
profile = st.session_state.lab_profile
summary, yearly, tests, ranking, fold_table, champion = analyse_and_train(frame)

with st.sidebar:
    st.markdown("## ◈ MOTOR IA")
    st.caption("Laboratorio independiente de ciencia de datos")
    st.success("✓ Dataset activo y validado")
    st.metric("Filas entrenadas", summary["rows"])
    st.metric("Territorios", summary["territories"])
    st.metric("Validación", "10 folds")
    st.markdown(f"**Fuente activa:** {profile['source']}")
    st.caption("Este motor no recibe hogares, barrios, IPM, escenarios, sensores ni telemetría del Gemelo Digital.")
    with open(NBI_SOURCE, "rb") as source_file:
        st.download_button("Descargar XLSX original", source_file, file_name=NBI_SOURCE.name)
    st.download_button("Descargar dataset activo limpio", frame.to_csv(index=False).encode("utf-8-sig"), "dataset_activo_motor_ia.csv", "text/csv")
    st.link_button("Abrir fuente oficial INEI", SOURCE_URL)

st.markdown(f"""<section class="hero"><div class="hero-kicker">LABORATORIO AUTÓNOMO · PYTHON / STREAMLIT</div>
<h1>Motor IA de Vulnerabilidad Socioeconómica</h1>
<p>Analítica reproducible, pruebas estadísticas y comparación de modelos con validación cruzada. Dataset activo: <b>{profile['source']}</b> · ejecución {datetime.now():%Y-%m-%d %H:%M}.</p></section>""", unsafe_allow_html=True)
st.markdown("<div class='section-note'><b>Separación funcional:</b> el análisis usa datos tabulares oficiales. La pestaña Simulación es un experimento independiente con agentes sintéticos y no recibe estados ni telemetría del Gemelo Digital React.</div>", unsafe_allow_html=True)

metrics = st.columns(6)
metrics[0].metric("Filas", summary["rows"])
metrics[1].metric("Territorios", summary["territories"])
metrics[2].metric("Periodo", summary["years"])
metrics[3].metric("Faltantes", summary["missing"])
metrics[4].metric("Modelo campeón", champion["Modelo"])
metrics[5].metric("RMSE 10-fold", f"{champion['RMSE medio']:.3f}")

dataset_tab, eda_tab, stats_tab, training_tab, simulation_tab, flow_tab, chat_tab = st.tabs([
    "Datasets", "EDA", "Pruebas estadísticas", "Entrenamiento 10-fold",
    "Simulación", "LangGraph · Langflow", "Chatbot",
])

with dataset_tab:
    st.subheader("Carga, validación y catálogo completo")
    left, right = st.columns([2, 1])
    with left:
        uploaded = st.file_uploader("Subir dataset CSV o Excel", type=["csv", "tsv", "xls", "xlsx"],
                                    help="Columnas mínimas: departamento, año y nbi_percent. Mínimo 20 filas válidas.")
        if uploaded and st.button("Validar, cargar y reentrenar", type="primary"):
            try:
                clean, uploaded_profile = read_uploaded_dataset(uploaded)
                st.session_state.lab_frame, st.session_state.lab_profile = clean, uploaded_profile
                st.session_state.lab_chat = []
                st.success(f"{len(clean)} filas integradas. Se ejecutarán nuevamente EDA, pruebas y 10-fold CV.")
                st.rerun()
            except Exception as exc:
                st.error(str(exc))
        if st.button("Restaurar dataset oficial INEI"):
            st.session_state.lab_frame, st.session_state.lab_profile = official_training_data()
            st.session_state.lab_chat = []
            st.rerun()
    with right:
        st.markdown("**Esquema aceptado**")
        st.code("department_id (opcional)\ndepartamento\nregion (opcional)\naño\nnbi_percent", language="text")
        st.caption("Se verifican tipos, rango 0–100, años 1990–2100, duplicados y mínimo de observaciones.")
    profile_cols = st.columns(6)
    for column, (label, value) in zip(profile_cols, [
        ("Entrada", profile.get("input_rows", len(frame))), ("Válidas", profile.get("valid_rows", len(frame))),
        ("Rechazadas", profile.get("rejected_rows", 0)), ("Duplicados retirados", profile.get("duplicates_removed", 0)),
        ("Territorios", summary["territories"]), ("Periodo", summary["years"]),
    ]):
        column.metric(label, value)
    st.dataframe(frame, hide_index=True, width="stretch", height=520,
                 column_config={"nbi_percent": st.column_config.NumberColumn("NBI (%)", format="%.4f")})
    st.caption(f"La tabla muestra el catálogo activo completo: {len(frame)} filas. Todas participan en el entrenamiento.")
    explain("dataset activo", "Permite revisar cada observación que entra al entrenamiento.",
            "El archivo se normaliza a una clave departamento+año, sin imputar valores ni inventar registros.",
            "Una carga válida no garantiza representatividad estadística; revise fuente, cobertura y definición del indicador.")

with eda_tab:
    st.subheader("Análisis exploratorio del dataset activo")
    labels = [("Media", summary["mean"]), ("Mediana", summary["median"]), ("Desv. estándar", summary["std"]),
              ("Mínimo", summary["min"]), ("Q1", summary["q1"]), ("Q3", summary["q3"]),
              ("Máximo", summary["max"]), ("Atípicos IQR", summary["outliers"])]
    for column, (label, value) in zip(st.columns(8), labels):
        column.metric(label, f"{value:.2f}")
    eda_left, eda_right = st.columns([1.15, 1])
    with eda_left:
        trend = go.Figure()
        trend.add_trace(go.Scatter(x=yearly.year, y=yearly.nbi_media, mode="lines+markers",
                                   name="NBI media", line=dict(color="#38bdf8", width=3),
                                   marker=dict(size=8, color="#67e8f9", line=dict(width=2, color="#0e151f")),
                                   fill="tozeroy", fillcolor="rgba(56,189,248,.10)",
                                   hovertemplate="Año %{x}<br>NBI media %{y:.2f}%<extra></extra>"))
        trend.add_hline(y=summary["mean"], line_dash="dot", line_color="#fbbf24",
                        annotation_text=f"Media global {summary['mean']:.2f}%", annotation_position="top left")
        style_figure(trend, "Evolución temporal", "Promedio nacional del indicador NBI por año", 450)
        trend.update_xaxes(dtick=1, title="Año"); trend.update_yaxes(title="NBI media (%)", rangemode="tozero")
        st.plotly_chart(trend, width="stretch")
    with eda_right:
        region_order = frame.groupby("region").nbi_percent.median().sort_values().index
        regional = px.box(frame, x="region", y="nbi_percent", color="region", points="outliers",
                          category_orders={"region": list(region_order)},
                          labels={"region": "Región", "nbi_percent": "NBI (%)"},
                          color_discrete_sequence=["#38bdf8", "#a78bfa", "#2dd4bf", "#f59e0b"])
        style_figure(regional, "Dispersión regional", "Mediana, rango intercuartílico y valores atípicos", 450)
        regional.update_layout(showlegend=False)
        st.plotly_chart(regional, width="stretch")
    distribution = px.histogram(frame, x="nbi_percent", color="region", nbins=24, barmode="overlay", opacity=.72,
                                labels={"nbi_percent": "NBI (%)", "region": "Región"},
                                color_discrete_sequence=["#38bdf8", "#a78bfa", "#2dd4bf", "#f59e0b"])
    distribution.add_vline(x=summary["median"], line_dash="dash", line_color="#f8fafc",
                           annotation_text=f"Mediana {summary['median']:.2f}%")
    style_figure(distribution, "Distribución del indicador", "Frecuencia de observaciones; colores superpuestos por región", 450)
    distribution.update_yaxes(title="Frecuencia")
    st.plotly_chart(distribution, width="stretch")
    explain("EDA", "Resume centro, dispersión, evolución temporal y distribución regional.",
            "Estadísticos calculados sobre las filas válidas del dataset activo.",
            "La exploración detecta patrones; no demuestra relaciones causales.")

with stats_tab:
    st.subheader("Pruebas estadísticas ejecutadas")
    tests_frame = pd.DataFrame(tests)
    st.dataframe(tests_frame, hide_index=True, width="stretch",
                 column_config={"Estadístico": st.column_config.NumberColumn(format="%.5f"), "p-valor": st.column_config.NumberColumn(format="%.5f")})
    p_values = tests_frame.dropna(subset=["p-valor"]).copy()
    if not p_values.empty:
        p_values["Resultado"] = p_values["p-valor"].map(lambda value: "Significativo (p<0.05)" if value < .05 else "No significativo")
        p_chart = px.bar(p_values, x="p-valor", y="Prueba", orientation="h", color="Resultado", text_auto=".4f",
                         color_discrete_map={"Significativo (p<0.05)": "#f59e0b", "No significativo": "#38bdf8"})
        p_chart.add_vline(x=.05, line_dash="dash", line_color="#f8fafc", annotation_text="α = 0.05")
        style_figure(p_chart, "Significancia estadística", "p-valores disponibles y umbral de referencia α=0.05", 330)
        p_chart.update_xaxes(title="p-valor", range=[0, max(.065, float(p_values["p-valor"].max()) * 1.15)])
        st.plotly_chart(p_chart, width="stretch")
    st.markdown("""
    - **Pearson:** asociación lineal entre año y NBI.
    - **Jarque–Bera:** diagnóstico de normalidad.
    - **ANOVA regional:** relación entre variación regional e interna.
    - **Durbin–Watson:** dependencia temporal aproximada.
    - **1.5×IQR:** observaciones potencialmente atípicas, conservadas para auditoría.
    """)
    explain("pruebas estadísticas", "Presenta estadístico, p-valor cuando corresponde e interpretación.",
            "Las pruebas se recalculan después de cada carga de dataset.",
            "La significancia estadística no equivale a importancia práctica ni causalidad.")

with training_tab:
    st.subheader("Comparación de modelos con 10-fold cross-validation")
    st.markdown(f"<div class='success-box'><b>MODELO CAMPEÓN: {champion['Modelo']}</b><br>RMSE medio {champion['RMSE medio']:.3f} · MAE {champion['MAE medio']:.3f} · R² {champion['R² medio']:.3f} · desviación RMSE {champion['Desv. RMSE']:.3f}</div>", unsafe_allow_html=True)
    st.dataframe(ranking, hide_index=True, width="stretch", column_config={
        "R² medio": st.column_config.NumberColumn(format="%.4f"), "RMSE medio": st.column_config.NumberColumn(format="%.4f"),
        "MAE medio": st.column_config.NumberColumn(format="%.4f"), "Desv. RMSE": st.column_config.NumberColumn(format="%.4f")})
    train_left, train_right = st.columns([1, 1.15])
    with train_left:
        benchmark = px.bar(ranking.sort_values("RMSE medio", ascending=False), x="RMSE medio", y="Modelo", orientation="h",
                           color="Estado", text_auto=".3f", error_x="Desv. RMSE",
                           color_discrete_map={"CAMPEÓN": "#22c7a1", "Comparado": "#3b82f6"})
        style_figure(benchmark, "Error de generalización", "RMSE medio ± desviación estándar en 10 folds", 450)
        benchmark.update_xaxes(title="RMSE (puntos porcentuales)"); benchmark.update_yaxes(title="")
        st.plotly_chart(benchmark, width="stretch")
    with train_right:
        champion_folds = fold_table[fold_table.Modelo == champion["Modelo"]].copy()
        fold_chart = go.Figure()
        fold_chart.add_trace(go.Scatter(x=champion_folds.Fold, y=champion_folds.RMSE, name="RMSE",
                                        mode="lines+markers", line=dict(color="#38bdf8", width=3), marker=dict(size=8)))
        fold_chart.add_trace(go.Scatter(x=champion_folds.Fold, y=champion_folds.MAE, name="MAE",
                                        mode="lines+markers", line=dict(color="#a78bfa", width=2), marker=dict(size=7)))
        fold_chart.add_hline(y=champion["RMSE medio"], line_dash="dot", line_color="#22c7a1",
                            annotation_text=f"RMSE medio {champion['RMSE medio']:.3f}")
        style_figure(fold_chart, "Estabilidad del modelo campeón", f"{champion['Modelo']} · error observado en cada fold", 450)
        fold_chart.update_xaxes(title="Fold", dtick=1); fold_chart.update_yaxes(title="Error (pp)", rangemode="tozero")
        st.plotly_chart(fold_chart, width="stretch")
    st.markdown(f"#### Detalle de los 10 folds · {champion['Modelo']}")
    st.dataframe(champion_folds, hide_index=True, width="stretch", column_config={
        "R²": st.column_config.NumberColumn(format="%.4f"), "RMSE": st.column_config.NumberColumn(format="%.4f"),
        "MAE": st.column_config.NumberColumn(format="%.4f")})
    explain("entrenamiento", "El campeón es el modelo con menor RMSE promedio en los diez conjuntos de validación.",
            "KFold de 10 particiones, mezcla reproducible con semilla 42 y preprocesamiento dentro de cada fold para evitar fuga de información.",
            "El desempeño histórico no garantiza precisión futura; la validación debe repetirse cuando cambien fuente o definición.")

with simulation_tab:
    st.subheader("Simulación demostrativa en Python")
    st.warning("Experimento con agentes sintéticos. No representa hogares reales ni reemplaza el ABM TypeScript de React.")
    sim_col1, sim_col2, sim_col3 = st.columns(3)
    scenario = sim_col1.selectbox("Escenario", ["base", "desempleo", "inflacion", "inundacion"])
    agents = sim_col2.number_input("Número de agentes", min_value=100, max_value=100_000, value=1_000, step=100)
    seed = sim_col3.number_input("Semilla", min_value=0, max_value=4_294_967_295, value=42, step=1)
    if st.button("Ejecutar simulación", type="primary"):
        st.session_state.demo_simulation = run_demo_simulation(scenario, int(agents), int(seed))
    simulation = st.session_state.get("demo_simulation")
    if simulation:
        sim_metrics = st.columns(4)
        sim_metrics[0].metric("Vulnerabilidad inicial", f"{simulation['baseline_vulnerability_rate']:.2f}%")
        sim_metrics[1].metric("Vulnerabilidad final", f"{simulation['final_vulnerability_rate']:.2f}%",
                              f"{simulation['vulnerability_change_pp']:+.2f} pp")
        sim_metrics[2].metric("Desempleo", f"{simulation['unemployment_rate']:.2f}%")
        sim_metrics[3].metric("Carencia de servicios", f"{simulation['service_deprivation_rate']:.2f}%")
        simulation_chart = px.bar(pd.DataFrame(simulation["chart"]), x="indicator", y="percent",
                                  color="indicator", text_auto=".2f",
                                  labels={"indicator": "Indicador", "percent": "Porcentaje"})
        style_figure(simulation_chart, f"Escenario: {simulation['scenario']}",
                     f"{simulation['agents']:,} agentes sintéticos · semilla {simulation['seed']}", 390)
        simulation_chart.update_layout(showlegend=False)
        simulation_chart.update_yaxes(range=[0, 100])
        st.plotly_chart(simulation_chart, width="stretch")
        st.caption(simulation["note"])

with flow_tab:
    st.subheader("Orquestación independiente")
    flow = [("INGESTA", "CSV / Excel"), ("VALIDACIÓN", "Esquema y calidad"), ("EDA + TESTS", "Evidencia estadística"),
            ("CV 10-FOLD", "Cuatro modelos"), ("CAMPEÓN", "Menor RMSE"), ("CHATBOT", "Solo resultados activos")]
    for column, (title, detail) in zip(st.columns(6), flow):
        column.markdown(f"<div class='flow-node'><b>{title}</b><br><small>{detail}</small></div>", unsafe_allow_html=True)
    graph_status = "ACTIVO"
    langflow_status = "ACTIVO" if os.getenv("LANGFLOW_URL") and os.getenv("LANGFLOW_FLOW_ID") else "CONFIGURABLE"
    chain_status = "ACTIVO" if os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "MY_GEMINI_API_KEY" else "MODO LOCAL"
    col1, col2, col3 = st.columns(3)
    col1.success(f"LangGraph: {graph_status}")
    col2.info(f"LangChain: {chain_status}")
    col3.warning(f"Langflow: {langflow_status}")
    st.code("dataset_guard → trained_engine → langflow/local-safe → respuesta auditable", language="text")
    explain("LangGraph y Langflow", "Separa protección del contexto, cálculo, orquestación y respuesta.",
            "LangGraph ejecuta el chatbot local; Langflow puede conectarse con LANGFLOW_URL y LANGFLOW_FLOW_ID.",
            "Las capas generativas redactan resultados, pero no sustituyen métricas ni seleccionan el campeón.")

with chat_tab:
    st.subheader("Chatbot del Motor IA")
    st.caption("Responde exclusivamente sobre el dataset activo, EDA, pruebas estadísticas y entrenamiento.")
    for message in st.session_state.lab_chat:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message.get("trace"):
                trace_columns = st.columns(len(message["trace"]))
                for column, step in zip(trace_columns, message["trace"]):
                    column.markdown(f"<div class='flow-node'><b>{step['node']}</b><br><small>{step['status']}</small><br><small>{step['detail']}</small></div>", unsafe_allow_html=True)
    question = st.chat_input("Ejemplo: ¿cuál fue el mejor entrenamiento y por qué?")
    if question:
        result = ask_lab(question, summary, champion, tests)
        st.session_state.lab_chat.extend([
            {"role": "user", "content": question},
            {"role": "assistant", "content": result["answer"], "trace": result["trace"]},
        ])
        st.rerun()

st.divider()
st.caption(f"Motor IA independiente · Fuente base: {SOURCE_LABEL} · Dataset auditable: {NBI_SOURCE.as_posix()}")

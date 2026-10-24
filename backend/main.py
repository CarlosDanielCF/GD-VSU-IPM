"""API científica y de datos para GD-VSU/IPM.

Esta primera etapa expone el dataset oficial y describe los motores existentes.
No ejecuta ni presenta como científico el ABM experimental de React/TypeScript.
"""

from __future__ import annotations

from functools import lru_cache
import os
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, HttpUrl
from starlette.exceptions import HTTPException as StarletteHTTPException

from python_app.data_engine import SOURCE_LABEL, SOURCE_URL, national_dataset
from python_app.demo_simulation import SCENARIOS, Scenario, run_demo_simulation


API_VERSION = "0.2.0"
SYSTEM_NAME = "GD-VSU/IPM"


def _cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class HealthResponse(ApiModel):
    status: Literal["ok"]
    system: str
    service: str
    version: str


class Period(ApiModel):
    start: int
    end: int


class DatasetInfoResponse(ApiModel):
    dataset: str
    records: int = Field(ge=0)
    territories: int = Field(ge=0)
    period: Period
    indicator: str
    source: str
    source_url: HttpUrl
    observation_unit: str
    generated: Literal[False] = False
    imputed: Literal[False] = False


class DatasetRecord(ApiModel):
    department_id: str
    department: str
    region: str
    year: int
    nbi_percent: float = Field(ge=0, le=100)
    source: str
    source_url: HttpUrl


class DatasetRecordsResponse(ApiModel):
    total: int = Field(ge=0)
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=500)
    count: int = Field(ge=0)
    records: list[DatasetRecord]


class IndicatorSummary(ApiModel):
    id: str
    name: str
    unit: str
    description: str
    observation_level: str
    records: int = Field(ge=0)
    territories: int = Field(ge=0)
    period: Period
    latest_year: int
    latest_mean: float
    latest_minimum: float
    latest_maximum: float
    source: str


class IndicatorsResponse(ApiModel):
    indicators: list[IndicatorSummary]
    note: str


class AnalyticalModelInfo(ApiModel):
    id: str
    name: str
    runtime: str
    category: Literal["real_data_analysis", "experimental_simulation"]
    status: Literal["available", "experimental"]
    data_basis: str
    purpose: str
    validation: str
    served_by_fastapi: bool
    implementation_path: str


class ModelInfoResponse(ApiModel):
    models: list[AnalyticalModelInfo]
    separation_note: str


class SimulationInfoResponse(ApiModel):
    name: str
    runtime: str
    scenarios: list[Scenario]
    reproducible: Literal[True] = True
    synthetic_agents: Literal[True] = True
    experimental: Literal[True] = True
    note: str


class SimulationRequest(ApiModel):
    scenario: Scenario = "base"
    agents: int = Field(default=1000, ge=100, le=100_000)
    seed: int = Field(default=42, ge=0, le=4_294_967_295)


class SimulationChartItem(ApiModel):
    indicator: str
    percent: float = Field(ge=0, le=100)


class SimulationRunResponse(ApiModel):
    scenario: Scenario
    seed: int
    agents: int
    synthetic_agents: Literal[True]
    experimental: Literal[True]
    baseline_vulnerability_rate: float = Field(ge=0, le=100)
    final_vulnerability_rate: float = Field(ge=0, le=100)
    unemployment_rate: float = Field(ge=0, le=100)
    service_deprivation_rate: float = Field(ge=0, le=100)
    vulnerability_change_pp: float
    chart: list[SimulationChartItem]
    note: str


class ErrorResponse(ApiModel):
    status_code: int
    error: str


app = FastAPI(
    title="GD-VSU/IPM Scientific API",
    summary="API científica y de datos del gemelo digital socioeconómico.",
    description=(
        "Expone el dataset oficial INEI y metadatos de los motores analíticos. "
        "El ABM de React/TypeScript continúa siendo una simulación experimental independiente."
    ),
    version=API_VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

origins = _cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials="*" not in origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"status_code": exc.status_code, "error": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"status_code": 422, "error": "Parámetros de solicitud inválidos", "details": exc.errors()},
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"status_code": 500, "error": "Error interno del backend científico"},
    )


@lru_cache(maxsize=1)
def _dataset() -> pd.DataFrame:
    """Load the validated official table once per backend process."""
    return national_dataset()


def _read_dataset() -> pd.DataFrame:
    try:
        frame = _dataset()
    except (FileNotFoundError, OSError, ValueError) as exc:
        raise HTTPException(status_code=503, detail=f"Dataset oficial no disponible: {exc}") from exc
    if frame.empty:
        raise HTTPException(status_code=503, detail="El dataset oficial no contiene registros")
    return frame


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Comprueba el estado del backend",
)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        system=SYSTEM_NAME,
        service="Scientific Data API",
        version=API_VERSION,
    )


@app.get(
    "/api/dataset/info",
    response_model=DatasetInfoResponse,
    responses={503: {"model": ErrorResponse}},
    tags=["Dataset"],
    summary="Describe el dataset oficial activo",
)
def dataset_info() -> DatasetInfoResponse:
    frame = _read_dataset()
    return DatasetInfoResponse(
        dataset="INEI NBI por departamento 2015-2025",
        records=len(frame),
        territories=frame["department_id"].nunique(),
        period=Period(start=int(frame["year"].min()), end=int(frame["year"].max())),
        indicator="nbi_percent",
        source=SOURCE_LABEL,
        source_url=SOURCE_URL,
        observation_unit="departamento-año",
    )


@app.get(
    "/api/dataset/records",
    response_model=DatasetRecordsResponse,
    responses={503: {"model": ErrorResponse}},
    tags=["Dataset"],
    summary="Lista registros oficiales procesados",
)
def dataset_records(
    offset: int = Query(default=0, ge=0, description="Primera fila solicitada"),
    limit: int = Query(default=100, ge=1, le=500, description="Máximo de filas devueltas"),
) -> DatasetRecordsResponse:
    frame = _read_dataset()
    page = frame.iloc[offset : offset + limit]
    records = [DatasetRecord.model_validate(row) for row in page.to_dict(orient="records")]
    return DatasetRecordsResponse(
        total=len(frame), offset=offset, limit=limit, count=len(records), records=records
    )


@app.get(
    "/api/indicators",
    response_model=IndicatorsResponse,
    responses={503: {"model": ErrorResponse}},
    tags=["Indicators"],
    summary="Describe los indicadores socioeconómicos disponibles",
)
def indicators() -> IndicatorsResponse:
    frame = _read_dataset()
    latest_year = int(frame["year"].max())
    latest = frame.loc[frame["year"] == latest_year, "nbi_percent"]
    return IndicatorsResponse(
        indicators=[
            IndicatorSummary(
                id="nbi_percent",
                name="Población con al menos una Necesidad Básica Insatisfecha",
                unit="porcentaje",
                description=(
                    "Porcentaje departamental de población con al menos una NBI. "
                    "No equivale al IPM Alkire-Foster."
                ),
                observation_level="departamento-año",
                records=len(frame),
                territories=frame["department_id"].nunique(),
                period=Period(start=int(frame["year"].min()), end=latest_year),
                latest_year=latest_year,
                latest_mean=float(latest.mean()),
                latest_minimum=float(latest.min()),
                latest_maximum=float(latest.max()),
                source=SOURCE_LABEL,
            )
        ],
        note="La primera etapa publica únicamente indicadores respaldados por el dataset procesado.",
    )


@app.get(
    "/api/model/info",
    response_model=ModelInfoResponse,
    tags=["Models"],
    summary="Describe los motores analíticos y experimentales",
)
def model_info() -> ModelInfoResponse:
    return ModelInfoResponse(
        models=[
            AnalyticalModelInfo(
                id="streamlit_ml_benchmark",
                name="Benchmark ML de vulnerabilidad socioeconómica",
                runtime="Python / Streamlit / scikit-learn",
                category="real_data_analysis",
                status="available",
                data_basis="Serie oficial INEI-ENAHO NBI 2015-2025",
                purpose="EDA, pruebas estadísticas y comparación de modelos predictivos",
                validation="KFold reproducible de 10 particiones; selección por RMSE medio",
                served_by_fastapi=False,
                implementation_path="streamlit_app.py + python_app/ai_lab.py",
            ),
            AnalyticalModelInfo(
                id="temporal_random_forest",
                name="Random Forest temporal NBI",
                runtime="Python / scikit-learn",
                category="real_data_analysis",
                status="available",
                data_basis="Serie oficial INEI-ENAHO NBI 2015-2025",
                purpose="Análisis temporal departamental con rezagos y tendencia",
                validation="Entrenamiento hasta 2023 y evaluación temporal 2024-2025",
                served_by_fastapi=False,
                implementation_path="python_app/data_engine.py",
            ),
            AnalyticalModelInfo(
                id="react_typescript_abm",
                name="ABM territorial experimental",
                runtime="React / TypeScript (navegador)",
                category="experimental_simulation",
                status="experimental",
                data_basis="Hogares y transiciones sintéticas para ensayo de mecanismos",
                purpose="Explorar escenarios de choques y políticas públicas",
                validation="No constituye inferencia oficial ni simulación Python",
                served_by_fastapi=False,
                implementation_path="src/services/abmSimulator.ts",
            ),
        ],
        separation_note=(
            "FastAPI expone datos científicos y metadatos. Streamlit ejecuta análisis real; "
            "el ABM permanece experimental en React/TypeScript y no se presenta como Python."
        ),
    )


@app.get(
    "/api/simulation/info",
    response_model=SimulationInfoResponse,
    tags=["Simulation"],
    summary="Describe la simulación demostrativa Python",
)
def simulation_info() -> SimulationInfoResponse:
    return SimulationInfoResponse(
        name="Simulación demostrativa de vulnerabilidad",
        runtime="Python / NumPy",
        scenarios=list(SCENARIOS),
        note=(
            "Experimento reproducible con agentes sintéticos. No utiliza hogares reales "
            "y no reemplaza el ABM experimental de React/TypeScript."
        ),
    )


@app.post(
    "/api/simulation/run",
    response_model=SimulationRunResponse,
    tags=["Simulation"],
    summary="Ejecuta una simulación sintética reproducible",
)
def simulation_run(request: SimulationRequest) -> SimulationRunResponse:
    result = run_demo_simulation(request.scenario, request.agents, request.seed)
    return SimulationRunResponse.model_validate(result)

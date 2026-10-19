from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
import re
import unicodedata

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parents[1]
NBI_SOURCE = ROOT / "data" / "raw" / "INEI_NBI_departamento.xlsx"
SOURCE_URL = "https://www.inei.gob.pe/media/MenuRecursivo/indices_tematicos/cd4_55.xlsx"
SOURCE_LABEL = "INEI–ENAHO: población con al menos una NBI por departamento, 2015–2025"


@dataclass(frozen=True)
class Department:
    id: str
    name: str
    region: str
    cities: tuple[str, ...] = ()


# Solo metadatos y alias geográficos. Todos los indicadores se leen del XLSX.
DEPARTMENTS = (
    Department("amazonas", "Amazonas", "Selva", ("Chachapoyas", "Bagua")),
    Department("ancash", "Áncash", "Sierra", ("Huaraz", "Chimbote")),
    Department("apurimac", "Apurímac", "Sierra", ("Abancay", "Andahuaylas")),
    Department("arequipa", "Arequipa", "Costa", ("Arequipa",)),
    Department("ayacucho", "Ayacucho", "Sierra", ("Huamanga",)),
    Department("cajamarca", "Cajamarca", "Sierra", ("Cajamarca", "Jaén")),
    Department("callao", "Prov. Const. del Callao", "Costa", ("Callao", "Ventanilla")),
    Department("cusco", "Cusco", "Sierra", ("Cusco", "Sicuani")),
    Department("huancavelica", "Huancavelica", "Sierra", ("Huancavelica",)),
    Department("huanuco", "Huánuco", "Sierra", ("Huánuco", "Tingo María")),
    Department("ica", "Ica", "Costa", ("Ica", "Chincha", "Pisco")),
    Department("junin", "Junín", "Sierra", ("Huancayo", "Jauja")),
    Department("la_libertad", "La Libertad", "Costa", ("Trujillo",)),
    Department("lambayeque", "Lambayeque", "Costa", ("Chiclayo",)),
    Department("lima", "Lima Metropolitana", "Costa", ("Lima",)),
    Department("lima_region", "Región Lima", "Costa", ("Huaral", "Huaura", "Cañete")),
    Department("loreto", "Loreto", "Selva", ("Iquitos", "Yurimaguas")),
    Department("madre_de_dios", "Madre de Dios", "Selva", ("Puerto Maldonado",)),
    Department("moquegua", "Moquegua", "Costa", ("Moquegua", "Ilo")),
    Department("pasco", "Pasco", "Sierra", ("Cerro de Pasco",)),
    Department("piura", "Piura", "Costa", ("Piura", "Sullana")),
    Department("puno", "Puno", "Sierra", ("Puno", "Juliaca")),
    Department("san_martin", "San Martín", "Selva", ("Moyobamba", "Tarapoto")),
    Department("tacna", "Tacna", "Costa", ("Tacna",)),
    Department("tumbes", "Tumbes", "Costa", ("Tumbes",)),
    Department("ucayali", "Ucayali", "Selva", ("Pucallpa",)),
)
# Canonical display names repair damaged accent bytes present in the downloaded XLSX.
_CANONICAL_DEPARTMENT_NAMES = {
    "ancash": "Áncash",
    "apurimac": "Apurímac",
    "huanuco": "Huánuco",
    "junin": "Junín",
    "lima_region": "Región Lima",
    "san_martin": "San Martín",
}
DEPARTMENTS = tuple(
    Department(item.id, _CANONICAL_DEPARTMENT_NAMES.get(item.id, item.name), item.region, item.cities)
    for item in DEPARTMENTS
)
SOURCE_LABEL = "INEI–ENAHO: población con al menos una NBI por departamento, 2015–2025"
DEPARTMENT_BY_ID = {item.id: item for item in DEPARTMENTS}
YEARS = list(range(2015, 2026))
FEATURES = ["nbi_lag_1", "nbi_lag_2", "rolling_3", "year", "region_costa", "region_sierra", "region_selva"]


def _normalized_label(value: Any) -> str:
    """Normalize source labels only for safe row matching."""
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char)).lower().strip()
    text = re.sub(r"\s+\d+/$", "", text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


SOURCE_ROW_TO_ID = {
    **{_normalized_label(item.name): item.id for item in DEPARTMENTS},
    "lima": "lima_region",
    "ncash": "ancash",
    "apur mac": "apurimac",
    "hu nuco": "huanuco",
    "jun n": "junin",
    "san mart n": "san_martin",
}


def national_dataset() -> pd.DataFrame:
    """Carga la serie oficial en formato largo; nunca genera ni imputa datos."""
    if not NBI_SOURCE.exists():
        raise FileNotFoundError(f"Falta {NBI_SOURCE}. Descárguelo de {SOURCE_URL}.")
    raw = pd.read_excel(NBI_SOURCE, sheet_name="cd4", header=3)
    values = raw.iloc[3:29, 1:12].apply(pd.to_numeric, errors="coerce")
    if values.shape != (26, 11) or values.isna().any().any():
        raise ValueError("Cambió la estructura del XLSX de INEI; se detiene para no inventar ni imputar valores.")
    records: list[dict[str, Any]] = []
    for department, (_, row) in zip(DEPARTMENTS, values.iterrows()):
        for year, value in zip(YEARS, row.tolist()):
            records.append({"department_id": department.id, "department": department.name,
                            "region": department.region, "year": year, "nbi_percent": float(value),
                            "source": SOURCE_LABEL, "source_url": SOURCE_URL})
    return pd.DataFrame(records)


def _validated_national_dataset() -> pd.DataFrame:
    """Extract only territorial observations; ignore titles, totals, blanks and notes."""
    raw = pd.read_excel(NBI_SOURCE, sheet_name="cd4", header=None)
    header_rows = raw.index[raw.iloc[:, 0].map(_normalized_label).eq("departamento")].tolist()
    if len(header_rows) != 1:
        raise ValueError("No se encontro una unica fila de encabezado Departamento en el XLSX de INEI.")
    header_row = header_rows[0]
    year_columns = {int(value): column for column, value in raw.iloc[header_row].items()
                    if isinstance(value, (int, float)) and float(value).is_integer()}
    if set(year_columns) != set(YEARS):
        raise ValueError(f"Anios inesperados en el XLSX: {sorted(year_columns)}; se esperaban {YEARS}.")

    extracted: dict[str, pd.Series] = {}
    for _, source_row in raw.iloc[header_row + 1:].iterrows():
        department_id = SOURCE_ROW_TO_ID.get(_normalized_label(source_row.iloc[0]))
        if not department_id:
            continue
        if department_id in extracted:
            raise ValueError(f"Departamento duplicado en el XLSX oficial: {department_id}.")
        extracted[department_id] = source_row
    expected = set(DEPARTMENT_BY_ID)
    if set(extracted) != expected:
        raise ValueError(f"Cobertura territorial invalida. Faltan={sorted(expected - set(extracted))}.")

    records: list[dict[str, Any]] = []
    for department in DEPARTMENTS:
        row = extracted[department.id]
        for year in YEARS:
            value = pd.to_numeric(row.iloc[year_columns[year]], errors="coerce")
            if pd.isna(value) or not 0 <= float(value) <= 100:
                raise ValueError(f"NBI invalida para {department.name}, {year}: {value!r}.")
            records.append({"department_id": department.id, "department": department.name,
                            "region": department.region, "year": year, "nbi_percent": float(value),
                            "source": SOURCE_LABEL, "source_url": SOURCE_URL})
    result = pd.DataFrame(records).sort_values(["department_id", "year"]).reset_index(drop=True)
    if result.duplicated(["department_id", "year"]).any() or len(result) != 26 * len(YEARS):
        raise ValueError("La tabla limpia no tiene una clave unica departamento+anio.")
    return result


# Public loader uses the validated extractor above. The earlier positional parser remains
# only to keep the historical transformation visible during code review.
national_dataset = _validated_national_dataset


def load_department_history(department_id: str) -> pd.DataFrame:
    return national_dataset().query("department_id == @department_id").reset_index(drop=True)


def generate_neighborhoods(department_id: str) -> pd.DataFrame:
    """Alias de compatibilidad: devuelve años reales, no barrios sintéticos."""
    return load_department_history(department_id)


def territory_summary(frame: pd.DataFrame) -> dict[str, float]:
    ordered = frame.sort_values("year")
    current, previous = ordered.iloc[-1], ordered.iloc[-2]
    return {"year": int(current.year), "nbi_percent": float(current.nbi_percent),
            "annual_change_pp": float(current.nbi_percent - previous.nbi_percent),
            "minimum": float(frame.nbi_percent.min()), "maximum": float(frame.nbi_percent.max()),
            "observations": int(len(frame))}


def _model_table() -> pd.DataFrame:
    data = national_dataset().sort_values(["department_id", "year"]).copy()
    grouped = data.groupby("department_id")["nbi_percent"]
    data["nbi_lag_1"] = grouped.shift(1)
    data["nbi_lag_2"] = grouped.shift(2)
    data["rolling_3"] = grouped.transform(lambda s: s.shift(1).rolling(3).mean())
    for region in ("costa", "sierra", "selva"):
        data[f"region_{region}"] = (data.region.str.lower() == region).astype(int)
    return data.dropna(subset=FEATURES).reset_index(drop=True)


def train_national_model(random_state: int = 42) -> tuple[RandomForestRegressor, dict[str, float], pd.DataFrame]:
    data = _model_table()
    train, test = data[data.year <= 2023], data[data.year >= 2024]
    model = RandomForestRegressor(n_estimators=400, min_samples_leaf=3, max_features=.85,
                                  random_state=random_state, n_jobs=-1)
    model.fit(train[FEATURES], train.nbi_percent)
    predicted = model.predict(test[FEATURES])
    metrics = {"r2": float(r2_score(test.nbi_percent, predicted)),
               "rmse": float(mean_squared_error(test.nbi_percent, predicted) ** .5),
               "train_rows": int(len(train)), "test_rows": int(len(test))}
    importance = pd.DataFrame({"variable": FEATURES, "importance": model.feature_importances_})
    return model, metrics, importance.sort_values("importance", ascending=False)


def predict_department(model: RandomForestRegressor, frame: pd.DataFrame, rmse: float) -> pd.DataFrame:
    department_id = str(frame.department_id.iloc[0])
    result = _model_table().query("department_id == @department_id").copy()
    result["predicted_nbi"] = model.predict(result[FEATURES]).clip(0, 100)
    result["ci_low"] = (result.predicted_nbi - 1.96 * rmse).clip(0, 100)
    result["ci_high"] = (result.predicted_nbi + 1.96 * rmse).clip(0, 100)
    result["absolute_error"] = (result.predicted_nbi - result.nbi_percent).abs()
    return result


def build_water_scenario(frame: pd.DataFrame, budget_usd_m: float) -> dict[str, Any]:
    current = frame.sort_values("year").iloc[-1]
    shares = {"Infraestructura y conexiones": .55, "Operación, mantenimiento y calidad": .25,
              "Diagnóstico y expediente técnico": .12, "Monitoreo y participación ciudadana": .08}
    return {"title": f"Borrador de intervención hídrica – {current.department}",
            "budget_usd_m": budget_usd_m,
            "reference_indicator": f"NBI 2025: {current.nbi_percent:.2f}% (INEI–ENAHO)",
            "allocations": [{"component": key, "share_percent": value * 100,
                             "usd_m": round(budget_usd_m * value, 3)} for key, value in shares.items()],
            "impact_estimate": None,
            "limitation": "El dataset NBI no contiene costos unitarios ni déficit hídrico por proyecto; no se inventa una reducción esperada.",
            "next_evidence_required": "Padrón de conexiones, continuidad, calidad, costos unitarios y cartera georreferenciada.",
            "status": "BORRADOR — REQUIERE DATOS SECTORIALES Y APROBACIÓN HUMANA"}

"""Validated ingestion of real ENAHO microdata into a household-period table.

This module deliberately fails closed: it never creates households, imputes missing
modules, or labels a cross-section as longitudinal.  All output rows are observed
ENAHO household-period records assembled from files supplied by the user.
"""
from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
import re
import unicodedata
from typing import BinaryIO, Iterable

import pandas as pd


REQUIRED_MODULES = ("100", "200", "300", "400", "500", "sumaria")
HOUSEHOLD_KEYS = ("conglome", "vivienda", "hogar")
MODULE_LABELS = {
    "100": "Características de la vivienda y el hogar",
    "200": "Miembros del hogar",
    "300": "Educación",
    "400": "Salud",
    "500": "Empleo e ingresos",
    "sumaria": "Sumaria (gasto, ingreso y pobreza)",
}


class EnahoValidationError(ValueError):
    """Raised when the supplied files cannot support a real longitudinal table."""


@dataclass(frozen=True)
class EnahoFile:
    source: object
    name: str
    year: int
    module: str


def _normalise_column(value: object) -> str:
    text = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "_", text).strip("_").lower()
    return "anio" if text in {"ano", "ao", "a_o", "year"} else text


def identify_enaho_file(source: object) -> EnahoFile:
    name = Path(getattr(source, "name", source)).name
    lower = name.lower()
    year_match = re.search(r"(?:19|20)\d{2}", lower)
    if not year_match:
        raise EnahoValidationError(f"No se pudo identificar el año en '{name}'.")
    year = int(year_match.group())
    if "sumaria" in lower:
        module = "sumaria"
    else:
        module_match = re.search(r"(?:^|[-_])(?:0?1a?[-_])?(100|200|300|400|500)(?:[-_.]|$)", lower)
        if not module_match:
            module_match = re.search(r"(100|200|300|400|500)", lower)
        if not module_match:
            raise EnahoValidationError(f"No se pudo identificar el módulo ENAHO en '{name}'.")
        module = module_match.group(1)
    return EnahoFile(source=source, name=name, year=year, module=module)


def _read_file(item: EnahoFile) -> pd.DataFrame:
    source = item.source
    suffix = Path(item.name).suffix.lower()
    if hasattr(source, "seek"):
        source.seek(0)
    try:
        if suffix in {".xlsx", ".xls"}:
            frame = pd.read_excel(source, dtype=str)
        elif suffix in {".csv", ".txt", ".tsv"}:
            separator = "\t" if suffix == ".tsv" else ","
            last_error: Exception | None = None
            for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
                try:
                    if hasattr(source, "seek"):
                        source.seek(0)
                    frame = pd.read_csv(source, sep=separator, dtype=str, encoding=encoding, low_memory=False)
                    break
                except UnicodeDecodeError as exc:
                    last_error = exc
            else:
                raise last_error or EnahoValidationError("Codificación no reconocida.")
        else:
            raise EnahoValidationError(
                f"Formato no admitido para '{item.name}'. Use CSV, TSV, XLS o XLSX."
            )
    except EnahoValidationError:
        raise
    except Exception as exc:
        raise EnahoValidationError(f"No se pudo leer '{item.name}': {exc}") from exc

    frame.columns = [_normalise_column(column) for column in frame.columns]
    duplicate_columns = frame.columns[frame.columns.duplicated()].tolist()
    if duplicate_columns:
        raise EnahoValidationError(f"'{item.name}' contiene columnas duplicadas: {duplicate_columns}.")
    missing_keys = [key for key in HOUSEHOLD_KEYS if key not in frame.columns]
    if missing_keys:
        raise EnahoValidationError(
            f"'{item.name}' no contiene las claves oficiales requeridas: {', '.join(missing_keys)}."
        )
    for key in HOUSEHOLD_KEYS:
        frame[key] = frame[key].astype("string").str.strip().str.replace(r"\.0$", "", regex=True).str.zfill(
            {"conglome": 6, "vivienda": 3, "hogar": 2}[key]
        )
    frame["anio"] = item.year
    return frame


def inspect_enaho_files(sources: Iterable[object]) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for source in sources:
        try:
            item = identify_enaho_file(source)
            rows.append({"archivo": item.name, "anio": item.year, "modulo": item.module, "estado": "reconocido"})
        except EnahoValidationError as exc:
            rows.append({"archivo": Path(getattr(source, "name", source)).name, "anio": None,
                         "modulo": None, "estado": str(exc)})
    return pd.DataFrame(rows, columns=["archivo", "anio", "modulo", "estado"])


def missing_enaho_modules(sources: Iterable[object]) -> dict[int, list[str]]:
    identified = [identify_enaho_file(source) for source in sources]
    by_year: dict[int, set[str]] = {}
    for item in identified:
        by_year.setdefault(item.year, set()).add(item.module)
    return {year: [module for module in REQUIRED_MODULES if module not in modules]
            for year, modules in sorted(by_year.items())}


def _unique_households(frame: pd.DataFrame, item: EnahoFile) -> pd.DataFrame:
    keys = list(HOUSEHOLD_KEYS)
    duplicates = frame.duplicated(keys, keep=False)
    if duplicates.any():
        non_key_columns = [column for column in frame.columns if column not in keys]
        conflicts = frame.loc[duplicates].groupby(keys, dropna=False)[non_key_columns].nunique(dropna=False).gt(1).any(axis=1)
        if conflicts.any():
            raise EnahoValidationError(
                f"'{item.name}' tiene registros contradictorios para {int(conflicts.sum())} hogares."
            )
    return frame.drop_duplicates(keys, keep="first")


def _selected_household_fields(frame: pd.DataFrame, prefix: str) -> pd.DataFrame:
    keys = list(HOUSEHOLD_KEYS)
    known = (
        "ubigeo", "dominio", "estrato", "periodo", "panel", "factor07",
        "nbi1", "nbi2", "nbi3", "nbi4", "nbi5", "pobreza", "mieperho",
        "inghog2d", "gashog2d", "linea", "linpe",
    )
    selected = [column for column in known if column in frame.columns]
    output = frame[keys + selected].copy()
    return output.rename(columns={column: f"{prefix}{column}" for column in selected})


def build_household_period_table(sources: Iterable[object]) -> tuple[pd.DataFrame, dict[str, object]]:
    """Build an observed ENAHO household-period panel from complete annual modules.

    At least two complete years are required.  Linkage uses the official household
    keys CONGLOME+VIVIENDA+HOGAR; the output identifier is deterministically
    pseudonymised.  No values are imputed and no synthetic record is generated.
    """
    materialised = list(sources)
    if not materialised:
        raise EnahoValidationError("No se proporcionaron archivos ENAHO.")
    items = [identify_enaho_file(source) for source in materialised]
    duplicates = pd.DataFrame([{"anio": item.year, "modulo": item.module} for item in items]).duplicated()
    if duplicates.any():
        repeated = pd.DataFrame([{"anio": item.year, "modulo": item.module} for item in items])[duplicates]
        raise EnahoValidationError(f"Hay módulos repetidos: {repeated.to_dict('records')}.")

    years = sorted({item.year for item in items})
    if len(years) < 2:
        raise EnahoValidationError(
            "Una tabla longitudinal requiere al menos dos años completos de ENAHO; "
            f"solo se recibió {', '.join(map(str, years))}."
        )
    missing = missing_enaho_modules(materialised)
    incomplete = {year: modules for year, modules in missing.items() if modules}
    if incomplete:
        detail = "; ".join(f"{year}: {', '.join(modules)}" for year, modules in incomplete.items())
        raise EnahoValidationError(f"Faltan módulos ENAHO obligatorios ({detail}). No se generó ninguna tabla.")

    loaded = {(item.year, item.module): (_read_file(item), item) for item in items}
    annual_tables: list[pd.DataFrame] = []
    audit: list[dict[str, object]] = []
    keys = list(HOUSEHOLD_KEYS)
    for year in years:
        housing, housing_item = loaded[(year, "100")]
        housing = _unique_households(housing, housing_item)
        annual = _selected_household_fields(housing, "vivienda_")

        sumaria, sumaria_item = loaded[(year, "sumaria")]
        sumaria = _unique_households(sumaria, sumaria_item)
        annual = annual.merge(_selected_household_fields(sumaria, "sumaria_"), on=keys, how="inner", validate="one_to_one")

        for module, column_name in (("200", "registros_miembros"), ("300", "registros_educacion"),
                                    ("400", "registros_salud"), ("500", "registros_empleo")):
            person_frame, person_item = loaded[(year, module)]
            counts = person_frame.groupby(keys, dropna=False).size().rename(column_name).reset_index()
            annual = annual.merge(counts, on=keys, how="left", validate="one_to_one")
            audit.append({"anio": year, "modulo": module, "archivo": person_item.name,
                          "filas_origen": len(person_frame)})
        count_columns = [column for column in annual.columns if column.startswith("registros_")]
        annual[count_columns] = annual[count_columns].fillna(0).astype("int64")
        annual["anio"] = year
        annual["fuentes_enaho"] = " | ".join(sorted(item.name for item in items if item.year == year))
        annual_tables.append(annual)
        audit.extend([
            {"anio": year, "modulo": "100", "archivo": housing_item.name, "filas_origen": len(housing)},
            {"anio": year, "modulo": "sumaria", "archivo": sumaria_item.name, "filas_origen": len(sumaria)},
        ])

    result = pd.concat(annual_tables, ignore_index=True)
    raw_key = result[keys].astype(str).agg("|".join, axis=1)
    result.insert(0, "household_id", raw_key.map(lambda value: sha256(value.encode("utf-8")).hexdigest()[:20]))
    result.insert(1, "household_period_id", result["household_id"] + ":" + result["anio"].astype(str))
    periods = result.groupby("household_id")["anio"].transform("nunique")
    result.insert(3, "periodos_observados", periods.astype("int64"))
    result.insert(4, "es_longitudinal", periods.ge(2))
    result.insert(5, "tipo_registro", "observado_enaho")
    result.insert(6, "es_sintetico", False)
    result = result.drop(columns=keys).sort_values(["household_id", "anio"]).reset_index(drop=True)
    if result["household_period_id"].duplicated().any():
        raise EnahoValidationError("La clave hogar-periodo no es única; se canceló la salida.")

    profile = {
        "rows": len(result),
        "households": int(result["household_id"].nunique()),
        "years": years,
        "longitudinal_households": int(result.loc[result["es_longitudinal"], "household_id"].nunique()),
        "observed_only": True,
        "linkage_key": "CONGLOME+VIVIENDA+HOGAR (pseudonimizada con SHA-256)",
        "audit": pd.DataFrame(audit).sort_values(["anio", "modulo"]).to_dict("records"),
    }
    return result, profile


def repository_enaho_files(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    supported = {".csv", ".tsv", ".xls", ".xlsx"}
    return [path for path in directory.rglob("*") if path.is_file() and path.suffix.lower() in supported
            and ("enaho" in path.name.lower() or "sumaria" in path.name.lower())]

"""Export the official INEI workbook into validated training artifacts."""
from hashlib import sha256
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from python_app.data_engine import NBI_SOURCE, national_dataset, SOURCE_LABEL, SOURCE_URL

TRAINING_COLUMNS = ["department_id", "department", "region", "year", "nbi_percent"]


def file_sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


frame = national_dataset()
clean = frame[TRAINING_COLUMNS].copy()
processed = ROOT / "data" / "processed" / "inei_nbi_training.csv"
public_csv = ROOT / "public" / "data" / "inei_nbi_training.csv"
processed.parent.mkdir(parents=True, exist_ok=True)
public_csv.parent.mkdir(parents=True, exist_ok=True)
clean.to_csv(processed, index=False, encoding="utf-8-sig")
clean.to_csv(public_csv, index=False, encoding="utf-8-sig")

payload = {
    "metadata": {
        "source": SOURCE_LABEL,
        "url": SOURCE_URL,
        "source_file": NBI_SOURCE.name,
        "source_sha256": file_sha256(NBI_SOURCE),
        "training_file": processed.name,
        "training_sha256": file_sha256(processed),
        "rows": len(clean),
        "territories": int(clean.department_id.nunique()),
        "years": [int(clean.year.min()), int(clean.year.max())],
        "generated": False,
        "imputed": False,
        "excluded_source_rows": ["titulo", "unidad", "vacios", "total nacional", "notas", "fuente"],
        "validation": {
            "null_values": int(clean.isna().sum().sum()),
            "duplicate_department_year": int(clean.duplicated(["department_id", "year"]).sum()),
            "expected_rows": 26 * 11,
            "nbi_range": [float(clean.nbi_percent.min()), float(clean.nbi_percent.max())],
        },
        "unit": "Porcentaje de poblacion con al menos una NBI",
    },
    "records": clean.to_dict("records"),
}
target = ROOT / "public" / "data" / "inei_nbi_2015_2025.json"
target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(target)
print(processed)

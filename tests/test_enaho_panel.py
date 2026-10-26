from io import BytesIO

import pytest

from python_app.enaho_panel import EnahoValidationError, build_household_period_table


def csv_file(name: str, body: str) -> BytesIO:
    stream = BytesIO(body.encode("utf-8"))
    stream.name = name
    return stream


def complete_test_modules(year: int) -> list[BytesIO]:
    household = "CONGLOME,VIVIENDA,HOGAR,UBIGEO,PANEL,NBI1\n005009,012,11,010101,1,0\n"
    person = "CONGLOME,VIVIENDA,HOGAR,CODPERSO\n005009,012,11,01\n005009,012,11,02\n"
    sumaria = "CONGLOME,VIVIENDA,HOGAR,POBREZA,MIEPERHO\n005009,012,11,2,2\n"
    return [
        csv_file(f"Enaho01-{year}-100.csv", household),
        csv_file(f"Enaho01-{year}-200.csv", person),
        csv_file(f"Enaho01A-{year}-300.csv", person),
        csv_file(f"Enaho01A-{year}-400.csv", person),
        csv_file(f"Enaho01A-{year}-500.csv", person),
        csv_file(f"Sumaria-{year}.csv", sumaria),
    ]


def test_builds_observed_household_period_table_without_synthetic_rows():
    table, profile = build_household_period_table(complete_test_modules(2020) + complete_test_modules(2021))

    assert len(table) == 2
    assert table["household_period_id"].is_unique
    assert table["household_id"].nunique() == 1
    assert table["es_longitudinal"].all()
    assert not table["es_sintetico"].any()
    assert set(table["tipo_registro"]) == {"observado_enaho"}
    assert not {"conglome", "vivienda", "hogar"}.intersection(table.columns)
    assert profile["observed_only"] is True
    assert profile["longitudinal_households"] == 1


def test_refuses_incomplete_or_single_year_input():
    with pytest.raises(EnahoValidationError, match="al menos dos años"):
        build_household_period_table(complete_test_modules(2020))

    incomplete = complete_test_modules(2020) + complete_test_modules(2021)
    incomplete = [item for item in incomplete if item.name != "Enaho01A-2021-500.csv"]
    with pytest.raises(EnahoValidationError, match="Faltan módulos"):
        build_household_period_table(incomplete)

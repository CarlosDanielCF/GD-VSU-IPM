from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "system": "GD-VSU/IPM",
        "service": "Scientific Data API",
        "version": "0.1.0",
    }


def test_dataset_info_uses_official_catalogue() -> None:
    response = client.get("/api/dataset/info")
    assert response.status_code == 200
    data = response.json()
    assert data["records"] == 286
    assert data["territories"] == 26
    assert data["period"] == {"start": 2015, "end": 2025}
    assert data["generated"] is False
    assert data["imputed"] is False


def test_dataset_records_are_paginated() -> None:
    response = client.get("/api/dataset/records", params={"offset": 5, "limit": 7})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 286
    assert data["offset"] == 5
    assert data["limit"] == 7
    assert data["count"] == 7
    assert len(data["records"]) == 7


def test_indicators_report_only_observed_dataset_metrics() -> None:
    response = client.get("/api/indicators")
    assert response.status_code == 200
    indicators = response.json()["indicators"]
    assert len(indicators) == 1
    assert indicators[0]["id"] == "nbi_percent"
    assert indicators[0]["latest_year"] == 2025
    assert indicators[0]["records"] == 286


def test_model_info_separates_analysis_and_experimental_simulation() -> None:
    response = client.get("/api/model/info")
    assert response.status_code == 200
    models = response.json()["models"]
    assert any(model["category"] == "real_data_analysis" for model in models)
    abm = next(model for model in models if model["id"] == "react_typescript_abm")
    assert abm["category"] == "experimental_simulation"
    assert abm["runtime"] == "React / TypeScript (navegador)"
    assert abm["served_by_fastapi"] is False


def test_openapi_and_invalid_route() -> None:
    assert client.get("/openapi.json").status_code == 200
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.json()["status_code"] == 404

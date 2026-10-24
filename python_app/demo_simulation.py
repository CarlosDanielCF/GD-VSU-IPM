"""Simulación sintética mínima, reproducible y exclusiva para demostración."""

from __future__ import annotations

from typing import Literal, TypedDict

import numpy as np


Scenario = Literal["base", "desempleo", "inflacion", "inundacion"]
SCENARIOS: tuple[Scenario, ...] = ("base", "desempleo", "inflacion", "inundacion")


class DemoSimulationResult(TypedDict):
    scenario: Scenario
    seed: int
    agents: int
    synthetic_agents: bool
    experimental: bool
    baseline_vulnerability_rate: float
    final_vulnerability_rate: float
    unemployment_rate: float
    service_deprivation_rate: float
    vulnerability_change_pp: float
    chart: list[dict[str, float | str]]
    note: str


def run_demo_simulation(scenario: Scenario, agents: int, seed: int) -> DemoSimulationResult:
    """Run a small synthetic population experiment with deterministic randomness."""
    if scenario not in SCENARIOS:
        raise ValueError(f"Escenario no soportado: {scenario}")
    if not 100 <= agents <= 100_000:
        raise ValueError("agents debe estar entre 100 y 100000")

    rng = np.random.default_rng(seed)
    baseline_unemployed = rng.random(agents) < 0.16
    baseline_services = rng.random(agents) < 0.24
    baseline_low_income = rng.random(agents) < 0.30
    baseline_vulnerable = baseline_unemployed | baseline_services | baseline_low_income

    unemployment = baseline_unemployed.copy()
    services = baseline_services.copy()
    low_income = baseline_low_income.copy()

    if scenario == "desempleo":
        unemployment |= rng.random(agents) < 0.14
        low_income |= unemployment & (rng.random(agents) < 0.48)
    elif scenario == "inflacion":
        low_income |= rng.random(agents) < 0.20
    elif scenario == "inundacion":
        exposed = rng.random(agents) < 0.28
        services |= exposed & (rng.random(agents) < 0.72)
        low_income |= exposed & (rng.random(agents) < 0.35)

    final_vulnerable = unemployment | services | low_income
    baseline_rate = float(baseline_vulnerable.mean() * 100)
    final_rate = float(final_vulnerable.mean() * 100)
    unemployment_rate = float(unemployment.mean() * 100)
    service_rate = float(services.mean() * 100)

    return {
        "scenario": scenario,
        "seed": seed,
        "agents": agents,
        "synthetic_agents": True,
        "experimental": True,
        "baseline_vulnerability_rate": round(baseline_rate, 2),
        "final_vulnerability_rate": round(final_rate, 2),
        "unemployment_rate": round(unemployment_rate, 2),
        "service_deprivation_rate": round(service_rate, 2),
        "vulnerability_change_pp": round(final_rate - baseline_rate, 2),
        "chart": [
            {"indicator": "Vulnerabilidad inicial", "percent": round(baseline_rate, 2)},
            {"indicator": "Vulnerabilidad final", "percent": round(final_rate, 2)},
            {"indicator": "Desempleo", "percent": round(unemployment_rate, 2)},
            {"indicator": "Carencia de servicios", "percent": round(service_rate, 2)},
        ],
        "note": (
            "Simulación demostrativa experimental con agentes sintéticos. "
            "No representa hogares reales ni sustituye el ABM TypeScript."
        ),
    }

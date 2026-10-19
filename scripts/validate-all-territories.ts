import { PERU_DEPARTMENTS_DATA, generateDepartmentData } from '../src/data/peruNationalData';
import { AlkireFosterEngine } from '../src/services/alkireFoster';

const safe = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const endpoint = process.env.AI_TEST_URL || 'http://localhost:3001/api/ai/chat';
const failures: string[] = [];

for (const department of PERU_DEPARTMENTS_DATA) {
  try {
    const data = generateDepartmentData(department.id);
    const af = AlkireFosterEngine.calculateMPI(data.hogares);
    const body = {
      message: 'Diseña un escenario para reducir la carencia de agua con un presupuesto de USD 4 millones',
      sessionId: `coverage-${department.id}`,
      preferredProvider: 'local',
      context: {
        role: 'municipal_analyst', departmentId: department.id, territoryName: department.nombre, year: 2030, selectedNeighborhood: null,
        cityMetrics: {
          M0: safe(af.M0), H: safe(af.H), A: safe(af.A), poorHouseholds: safe(af.poorHouseholdsCount), totalHouseholds: safe(af.totalHouseholds),
          extremePovertyRate: safe(af.extremePovertyRate), gini: safe(af.giniCoefficient),
          dimensions: Object.fromEntries(Object.entries(af.dimensionalContributionsPct).map(([key, value]) => [key, safe(value)]))
        },
        neighborhoods: data.barrios.map(n => ({
          id: n.id, name: n.nombre, district: n.distrito, ipmM0: safe(n.ipm_M0), ipmH: safe(n.ipm_H), ipmA: safe(n.ipm_A), population: safe(n.poblacionTotal),
          alert: n.nivelAlerta || 'normal', waterDeprivation: safe(n.contribucionDimensiones?.vivienda_servicios), informalCoverage: safe(n.coberturaGHSLInformal), infrastructureIndex: safe(n.indiceInfraestructura)
        })),
        activeShockNames: [], activePolicyNames: [], lastSimulation: null
      }
    };
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json() as { scenarioDraft?: { policies?: unknown[] }; executionTrace?: unknown[]; error?: string };
    if (!response.ok || !result.scenarioDraft?.policies?.length || !result.executionTrace?.length) throw new Error(result.error || `HTTP ${response.status}`);
    console.log(`✓ ${department.nombre.padEnd(28)} ${data.barrios.length} barrios`);
  } catch (error) {
    failures.push(`${department.nombre}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`✗ ${department.nombre}`);
  }
}

if (failures.length) {
  console.error(`\nFallaron ${failures.length} territorios:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`\nCobertura completa: ${PERU_DEPARTMENTS_DATA.length} departamentos validados.`);

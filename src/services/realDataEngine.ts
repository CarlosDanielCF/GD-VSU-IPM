import type { RealDataset, RealModelResult, RealNBIRecord } from '../types/realData';

export async function loadRealDataset(): Promise<RealDataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/inei_nbi_2015_2025.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`No se pudo cargar INEI (${response.status})`);
  const data = await response.json() as RealDataset;
  if (data.metadata.generated || data.metadata.imputed || data.records.length !== 286) throw new Error('Integridad del dataset oficial no válida');
  return data;
}

// Regresión temporal explicable: NBI(t) = intercepto + β1·NBI(t-1) + β2·año.
// Se entrena hasta 2023 y se prueba exclusivamente en 2024–2025.
export function trainRealModel(dataset: RealDataset): RealModelResult {
  const sorted = [...dataset.records].sort((a, b) => a.department_id.localeCompare(b.department_id) || a.year - b.year);
  const rows = sorted.flatMap((row, index) => {
    const previous = sorted[index - 1];
    return previous?.department_id === row.department_id ? [{ ...row, lag: previous.nbi_percent, centeredYear: row.year - 2020 }] : [];
  });
  const maxYear=Math.max(...rows.map(row=>row.year));
  const trainMaxYear=maxYear-2, testMinYear=maxYear-1;
  const train = rows.filter(row => row.year <= trainMaxYear);
  const test = rows.filter(row => row.year >= testMinYear);
  if(train.length<30||test.length<2) throw new Error('Se requieren al menos 30 observaciones de entrenamiento y dos de prueba temporal.');
  const n = train.length;
  const sums = train.reduce((a, r) => ({ y:a.y+r.nbi_percent, x1:a.x1+r.lag, x2:a.x2+r.centeredYear,
    x1x1:a.x1x1+r.lag*r.lag, x2x2:a.x2x2+r.centeredYear*r.centeredYear, x1x2:a.x1x2+r.lag*r.centeredYear,
    x1y:a.x1y+r.lag*r.nbi_percent, x2y:a.x2y+r.centeredYear*r.nbi_percent }), {y:0,x1:0,x2:0,x1x1:0,x2x2:0,x1x2:0,x1y:0,x2y:0});
  const A = [[n,sums.x1,sums.x2],[sums.x1,sums.x1x1,sums.x1x2],[sums.x2,sums.x1x2,sums.x2x2]];
  const b = [sums.y,sums.x1y,sums.x2y];
  for(let i=0;i<3;i++){ let p=i; for(let j=i+1;j<3;j++) if(Math.abs(A[j][i])>Math.abs(A[p][i])) p=j; [A[i],A[p]]=[A[p],A[i]]; [b[i],b[p]]=[b[p],b[i]]; const d=A[i][i]; for(let k=i;k<3;k++) A[i][k]/=d; b[i]/=d; for(let j=0;j<3;j++) if(j!==i){const f=A[j][i]; for(let k=i;k<3;k++)A[j][k]-=f*A[i][k]; b[j]-=f*b[i];}}
  const predict = (r: typeof rows[number]) => b[0] + b[1]*r.lag + b[2]*r.centeredYear;
  const predictions = test.map(r => ({ department_id:r.department_id, department:r.department, region:r.region, year:r.year, nbi_percent:r.nbi_percent, predicted:predict(r), error:Math.abs(predict(r)-r.nbi_percent) }));
  const mean = predictions.reduce((s,r)=>s+r.nbi_percent,0)/predictions.length;
  const sse = predictions.reduce((s,r)=>s+(r.nbi_percent-r.predicted)**2,0), sst=predictions.reduce((s,r)=>s+(r.nbi_percent-mean)**2,0);
  return { r2:1-sse/sst, rmse:Math.sqrt(sse/predictions.length), trainRows:train.length, testRows:test.length, trainMaxYear, testMinYear,
    coefficients:[{name:'Intercepto',value:b[0]},{name:'NBI año anterior',value:b[1]},{name:'Tendencia anual',value:b[2]}], predictions };
}

export function historyFor(dataset: RealDataset, id: string): RealNBIRecord[] { return dataset.records.filter(r=>r.department_id===id).sort((a,b)=>a.year-b.year); }

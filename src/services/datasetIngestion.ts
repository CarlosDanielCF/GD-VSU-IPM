import readXlsxFile from 'read-excel-file/browser';
import type { DatasetProfile, RealNBIRecord } from '../types/realData';

const aliases: Record<string,string[]> = {
  department_id:['department_id','departamento_id','id_departamento','codigo','ubigeo'],
  department:['department','departamento','territorio','region_name','nombre'],
  region:['region','región','region_natural'], year:['year','año','anio','periodo'],
  nbi_percent:['nbi_percent','nbi','nbi_pct','porcentaje_nbi','valor','target'],
};
const norm=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_');
const slug=(v:string)=>norm(v).replace(/^prov_const_del_/,'').replace(/^lima_metropolitana.*$/,'lima');

function rowsFromDelimited(text:string, separator:string){
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
  const parse=(line:string)=>{const out:string[]=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===separator&&!q){out.push(cur.trim());cur='';}else cur+=c;}out.push(cur.trim());return out;};
  return lines.map(parse);
}
function mapRows(matrix:unknown[][], fileName:string){
  if(matrix.length<2) throw new Error('El archivo debe contener encabezado y al menos una fila.');
  const headers=matrix[0].map(norm); const indexes:Record<string,number>={};
  Object.entries(aliases).forEach(([field,names])=>{const i=headers.findIndex(h=>names.map(norm).includes(h));if(i>=0)indexes[field]=i;});
  const required=['department','year','nbi_percent']; const missing=required.filter(k=>indexes[k]===undefined);
  if(missing.length) throw new Error(`Faltan columnas: ${missing.join(', ')}. Use departamento, año y nbi_percent.`);
  let rejected=0; const records:RealNBIRecord[]=[]; const datasetId=`upload-${Date.now()}`;
  matrix.slice(1).forEach(row=>{const department=String(row[indexes.department]??'').trim(), year=Number(row[indexes.year]), nbi=Number(String(row[indexes.nbi_percent]).replace(',','.'));
    if(!department||!Number.isInteger(year)||year<1990||year>2100||!Number.isFinite(nbi)||nbi<0||nbi>100){rejected++;return;}
    records.push({department_id:indexes.department_id===undefined?slug(department):slug(String(row[indexes.department_id])),department,
      region:indexes.region===undefined?'No especificada':String(row[indexes.region]||'No especificada'),year,nbi_percent:nbi,dataset_id:datasetId,source_name:fileName});});
  const keys=records.map(r=>`${r.department_id}|${r.year}`), duplicateKeys=keys.length-new Set(keys).size;
  const profile:DatasetProfile={id:datasetId,name:fileName,format:fileName.split('.').pop()?.toUpperCase()||'DATA',rows:matrix.length-1,validRows:records.length,rejectedRows:rejected,duplicateKeys,
    minYear:Math.min(...records.map(r=>r.year)),maxYear:Math.max(...records.map(r=>r.year)),territories:new Set(records.map(r=>r.department_id)).size,addedAt:new Date().toISOString()};
  if(!records.length) throw new Error('Ninguna fila válida después de comprobar tipos y rangos.');
  return {records,profile};
}

export async function parseDatasetFile(file:File){
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(ext==='xlsx') return mapRows(await readXlsxFile(file) as unknown as unknown[][],file.name);
  if(ext==='json'){const raw=JSON.parse(await file.text());const items=Array.isArray(raw)?raw:raw.records;if(!Array.isArray(items))throw new Error('JSON debe ser un arreglo o contener records.');const headers=Object.keys(items[0]||{});return mapRows([headers,...items.map((x:Record<string,unknown>)=>headers.map(h=>x[h]))],file.name);}
  if(ext==='csv'||ext==='tsv'){const text=await file.text();return mapRows(rowsFromDelimited(text,ext==='tsv'?'\t':','),file.name);}
  throw new Error('Formato no admitido. Use CSV, TSV, JSON o XLSX.');
}

import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, ChevronDown, ChevronUp, Database, Lightbulb } from 'lucide-react';

export type SystemModule = 'dashboard' | 'real_data' | 'scenarios' | 'comparator' | 'forecasting' | 'ml_engine' | 'iot_sensors' | 'stress_test' | 'ai_copilot' | 'architecture';

interface Props {
  module: SystemModule;
  territory: string;
  year: number;
  m0: number;
}

const CONTENT: Record<SystemModule, { title: string; interpretation: string; explanation: string; limit: string }> = {
  real_data: { title:'Datos oficiales y motor auditable', interpretation:'Compare la NBI observada con la predicción reservada; una separación menor indica menos error.', explanation:'El JSON reproducible procede del XLSX de INEI y el modelo se entrena en el navegador hasta 2023.', limit:'NBI no es IPM y la asociación temporal no demuestra causalidad.' },
  dashboard: {
    title: 'Mapa, indicadores y descomposición',
    interpretation: 'Los colores más intensos representan mayor vulnerabilidad modelada. M₀ resume incidencia × intensidad; compare territorios bajo el mismo año y umbral.',
    explanation: 'Los KPI, radar, Sankey y capas usan el mismo estado activo del gemelo. Seleccionar un barrio filtra el diagnóstico y permite rastrear qué privaciones elevan su resultado.',
    limit: 'La geometría barrial y los hogares del módulo React son una simulación experimental. Para cifras oficiales y comparaciones departamentales use “Datos reales” en Streamlit.',
  },
  scenarios: {
    title: 'Configuración de escenarios',
    interpretation: 'Choques aumentan privaciones y políticas buscan mitigarlas. Presupuesto o cobertura mayores no garantizan por sí solos una reducción real.',
    explanation: 'Cada control modifica supuestos del ABM; el resultado debe compararse contra la línea base manteniendo constantes los demás parámetros.',
    limit: 'Es análisis “qué pasaría si”, no evaluación causal ni compromiso presupuestal. Los coeficientes requieren calibración sectorial antes de uso público.',
  },
  comparator: {
    title: 'Comparación línea base vs. simulación',
    interpretation: 'Una diferencia negativa en M₀ sugiere mejora dentro del modelo; una positiva indica deterioro. Revise también H y A para saber si cambia la extensión o la profundidad.',
    explanation: 'Las tablas y figuras comparan dos estados del mismo conjunto de agentes y reportan variaciones absolutas y relativas.',
    limit: 'La diferencia es efecto simulado condicionado a los supuestos, no impacto observado en hogares reales.',
  },
  forecasting: {
    title: 'Alertas y sensibilidad',
    interpretation: 'Una alerta alta prioriza revisión, no confirma que el evento ocurrirá. La sensibilidad ordena variables por respuesta del modelo.',
    explanation: 'Las proyecciones aplican reglas de riesgo a los indicadores del gemelo y muestran horizonte, factor detonante y recomendación asociada.',
    limit: 'No incluye probabilidad calibrada ni intervalo estadístico; toda alerta debe contrastarse con fuentes administrativas recientes.',
  },
  ml_engine: {
    title: 'Motor IA autónomo de datos socioeconómicos',
    interpretation: 'Compare modelos por el RMSE medio de 10 folds; un menor error y una variabilidad reducida indican mejor generalización.',
    explanation: 'El módulo usa únicamente el dataset tabular activo. Ejecuta validaciones, EDA, pruebas estadísticas y cuatro modelos antes de seleccionar el campeón.',
    limit: 'La validación cruzada mide desempeño predictivo, no causalidad. El motor no recibe hogares, barrios, escenarios ni telemetría del gemelo digital.',
  },
  iot_sensors: {
    title: 'Telemetría IoT',
    interpretation: 'Picos, caídas y estados críticos representan señales operativas que requieren corroboración antes de declarar una falla territorial.',
    explanation: 'Series y tarjetas comparten marca temporal, unidad, umbral y sensor; compare valores únicamente cuando esas cuatro condiciones coincidan.',
    limit: 'La telemetría mostrada es demostrativa y no proviene de dispositivos desplegados físicamente.',
  },
  stress_test: {
    title: 'Pruebas de estrés urbano',
    interpretation: 'La curva muestra la respuesta del modelo a un choque extremo y la recuperación supuesta con o sin paquete de resiliencia.',
    explanation: 'Cada punto se calcula desde la línea base más el delta del escenario, modificado por la mitigación configurada.',
    limit: 'Los daños, costos y tiempos son supuestos experimentales; no sustituyen ingeniería, defensa civil ni evaluación económica.',
  },
  ai_copilot: {
    title: 'Copiloto territorial',
    interpretation: 'La respuesta debe leerse junto con sus tarjetas de evidencia y la traza del flujo; una afirmación sin evidencia no debe usarse para decidir.',
    explanation: 'LangChain/Langflow redactan y orquestan; no deben reemplazar los cálculos. Los escenarios quedan como borradores sujetos a aprobación.',
    limit: 'Un modelo generativo puede equivocarse. Compruebe territorio, año, fuente y granularidad antes de adoptar una recomendación.',
  },
  architecture: {
    title: 'Arquitectura y trazabilidad',
    interpretation: 'El diagrama separa captura, cálculo, simulación, IA y gobernanza para identificar el origen de cada salida.',
    explanation: 'Siga las flechas desde la fuente hasta la visualización y revise qué componentes transforman el dato.',
    limit: 'Que un componente exista en la arquitectura no acredita que tenga conexión productiva o datos en tiempo real.',
  },
};

export const SystemInterpretabilityPanel: React.FC<Props> = ({ module, territory, year, m0 }) => {
  const [expanded, setExpanded] = useState(true);
  const content = useMemo(() => CONTENT[module], [module]);

  return (
    <section className="rounded-lg border border-[#38BDF8]/45 bg-[#0B1720] shadow-[0_0_24px_rgba(56,189,248,0.08)]" aria-label="Interpretabilidad y explicabilidad del módulo">
      <button type="button" onClick={() => setExpanded(value => !value)} className="w-full px-4 py-3 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="w-4 h-4 text-[#38BDF8]" />
          <div>
            <p className="text-[10px] font-mono font-bold tracking-[0.16em] text-[#38BDF8]">INTERPRETABILIDAD Y EXPLICABILIDAD</p>
            <h2 className="text-sm font-semibold text-white">{content.title}</h2>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#8E9299]" /> : <ChevronDown className="w-4 h-4 text-[#8E9299]" />}
      </button>
      {expanded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 border-t border-[#24404E] p-4">
          <article className="rounded border border-[#00FFC2]/25 bg-black/20 p-3">
            <h3 className="mb-1 flex items-center gap-2 text-[10px] font-mono font-bold text-[#00FFC2]"><Lightbulb className="w-3.5 h-3.5" /> CÓMO INTERPRETAR</h3>
            <p className="text-xs leading-relaxed text-[#C7CDD4]">{content.interpretation}</p>
          </article>
          <article className="rounded border border-[#38BDF8]/25 bg-black/20 p-3">
            <h3 className="mb-1 flex items-center gap-2 text-[10px] font-mono font-bold text-[#38BDF8]"><Database className="w-3.5 h-3.5" /> CÓMO SE OBTUVO</h3>
            <p className="text-xs leading-relaxed text-[#C7CDD4]">{content.explanation}</p>
            {module !== 'ml_engine' && <p className="mt-2 text-[10px] font-mono text-[#8E9299]">Contexto: {territory} · {year} · M₀ mostrado {m0.toFixed(4)}</p>}
          </article>
          <article className="rounded border border-[#FFAA00]/30 bg-[#FFAA00]/5 p-3">
            <h3 className="mb-1 flex items-center gap-2 text-[10px] font-mono font-bold text-[#FFAA00]"><AlertTriangle className="w-3.5 h-3.5" /> LÍMITE Y USO CORRECTO</h3>
            <p className="text-xs leading-relaxed text-[#C7CDD4]">{content.limit}</p>
          </article>
          <p className="lg:col-span-3 text-[10px] font-mono text-[#8E9299]">Esta explicación aplica a todas las tablas y figuras visibles del módulo. Pase el cursor o seleccione elementos para ver el detalle; no compare unidades, años o territorios distintos como si fueran equivalentes.</p>
        </div>
      )}
    </section>
  );
};

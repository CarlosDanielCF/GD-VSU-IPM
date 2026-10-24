# Gemelo Digital Urbano - Vulnerabilidad Social Urbana (GD-VSU)

> **Dataset verificable:** Streamlit carga directamente
> `data/raw/INEI_NBI_departamento.xlsx`, tabla oficial INEI–ENAHO 2015–2025.
> No genera observaciones aleatorias ni imputa faltantes. La URL, checksum y
> limitaciones están documentados en [`data/DATA_SOURCES.md`](data/DATA_SOURCES.md).

La analítica evaluable y el copiloto usan exclusivamente esa serie oficial. El
panel React heredado conserva el simulador ABM como módulo experimental y está
rotulado en Streamlit como no autoritativo: sus agentes sintéticos sirven para
ensayar mecanismos, nunca se presentan como observaciones reales ni alimentan
las cifras oficiales del tablero.

> **Runtime principal actual:** arquitectura híbrida sin pérdida funcional. Streamlit + Python + scikit-learn + LangGraph aportan analítica y copiloto; React/Vite conserva íntegramente el sistema GD‑VSU original con mapas, ABM, IoT, stress testing, reportes y gobernanza. No requiere FastAPI.

Plataforma analítica avanzada de gemelo digital urbano para la simulación, monitoreo satelital e IoT, y evaluación multidimensional de vulnerabilidad social y resiliencia territorial (basada en la metodología Alkire-Foster y micro-simulación basada en agentes).

---

## 🚀 Requisitos Previos

- **Python**: 3.11 o superior
- **pip**: incluido con Python

---

## 🛠️ Instalación y Ejecución Local

### Paso 1: Descomprimir el archivo
Si descargaste `gemelo-digital-vsu.zip`:
```bash
unzip gemelo-digital-vsu.zip -d gemelo-digital-vsu
cd gemelo-digital-vsu
```

### Paso 2: Instalar dependencias Python
```bash
python -m pip install -r requirements.txt
```

### Paso 3: Configurar variables de entorno (Opcional)
Copia el archivo de variables de ejemplo:
```bash
cp .env.example .env
```
*(Nota: Si deseas usar las funciones generativas de Gemini AI de forma directa, puedes añadir tu `GEMINI_API_KEY` en `.env`).*

### Paso 4: Iniciar el servidor de desarrollo
```bash
python -m streamlit run streamlit_app.py
```

La aplicación inicia en **`http://localhost:8501`**. En Windows también puede ejecutar `run_streamlit.ps1`.

Abre tu navegador en esa dirección para interactuar con la plataforma completa.

---

## Despliegue demostrativo en Streamlit Community Cloud

La aplicación Streamlit se puede desplegar directamente desde este repositorio
sin iniciar React ni el servicio Node/Express.

- Repositorio: `CarlosDanielCF/GD-VSU-IPM`
- Rama: `main`
- Archivo principal: `streamlit_app.py`
- Versión de Python recomendada: `3.12`
- Dependencias: `requirements.txt`

En Streamlit Community Cloud, seleccione **Create app**, indique los valores
anteriores y pulse **Deploy**. El dataset oficial requerido está versionado en
`data/raw/INEI_NBI_departamento.xlsx` y se resuelve mediante una ruta relativa
al repositorio, por lo que no requiere una ruta local de Windows.

La demostración funciona sin secretos y conserva el chatbot local
determinístico. Para habilitar integraciones opcionales, agregue en **Advanced
settings → Secrets** únicamente los valores que vaya a utilizar:

```toml
GEMINI_API_KEY = "clave-real"
GEMINI_MODEL = "gemini-2.5-flash"

# Langflow debe estar publicado en una URL accesible desde Internet;
# no utilice localhost en Community Cloud.
LANGFLOW_URL = "https://langflow.example.com"
LANGFLOW_FLOW_ID = "id-del-flujo"
LANGFLOW_API_KEY = "clave-opcional"
```

No cree ni suba `.streamlit/secrets.toml`: ese archivo está excluido por
`.gitignore`. Los secretos se introducen exclusivamente en la consola de
Streamlit Community Cloud.

---

## 📦 Scripts Disponibles

- `npm run dev`: Inicia el runtime Python/Streamlit (puerto 8501).
- `npm run dev:legacy`: Inicia la versión heredada React/Express.
- `npm run dev:web`: Inicia únicamente la interfaz Vite.
- `npm run dev:ai`: Inicia la API del Copiloto Territorial con recarga automática.
- `npm run start:ai`: Inicia únicamente la API del Copiloto Territorial.
- `npm run build`: Compila la aplicación optimizada para producción en la carpeta `dist/`.
- `npm run preview`: Previsualiza localmente el build de producción.
- `npm run lint`: Ejecuta el chequeo estricto de tipos con TypeScript (`tsc --noEmit`).

---

## 🏙️ Módulos y Capacidades del Sistema

1. **Visor Territorial 3D & 2D (Dashboard Principal):**
   - Gemelo digital tridimensional con visualización batimétrica/altimétrica de edificios y texturas volumétricas (Three.js).
   - Capas SIG interactivas (Leaflet): ISVU (Índice de Vulnerabilidad), Pobreza Multidimensional, Densidad de Asentamientos Informales, Cobertura Sanitaria y Riesgo de Inundación fluvial/pluvial.
   - Tour Cinemático 360° en dron virtual y modo pantalla completa.

2. **Simulador de Escenarios Contrafactuales (Gobernanza & Políticas Públicas):**
   - Modela subsidios de arriendo, regularización de campamentos, ampliación de red de agua potable y pavimentación.
   - Cálculo del Retorno Social de Inversión (SROI), costo fiscal proyectado y población impactada.

3. **Comparador Satelital Temporal Bi-Temporal:**
   - Cortina deslizable interactiva para comparar ortofotos satelitales históricas (2018 vs 2026).
   - Detección de expansión no planificada y pérdida de suelo permeable.

4. **Proyecciones Demográficas & Pobreza (2026-2035):**
   - Modelo de dinámica demográfica estocástica con bandas de confianza (Monte Carlo a 10 años).

5. **Motor Científico Multidimensional (Alkire-Foster Engine):**
   - Descomposición dimensional de privaciones: Vivienda, Servicios Básicos, Educación, Salud y Empleo.
   - Auditoría de umbral $k$ y cálculo de Tasa de Incidencia ($H$), Intensidad ($A$) e Índice Multidimensional ($M_0 = H \times A$).

6. **Red de Sensores IoT Urbanos en Tiempo Real:**
   - Telemetría en vivo de estaciones meteorológicas, calidad de aire (PM2.5), presión de red hídrica y afluencia de transporte público.
   - Alarmas tempranas de anomalías y visualización de frecuencias de muestreo.

7. **Laboratorio de Pruebas de Estrés y Resiliencia (Stress Testing):**
   - Simulación de eventos extremos: Terremoto 8.4 Mw, Crisis Hídrica severa, Megaincendio en interfaz urbana-forestal y Pandemia respiratoria.
   - Curva de recuperación de infraestructura crítica, degradación de servicios y costo de reconstrucción.

8. **Inspector de Micro-Agentes Sintéticos (10,000 Hogares):**
   - Exploración granular de la población sintética de agentes.
   - Simulador What-If a nivel de hogar individual: permite conmutar acceso a agua, empleo o luz para ver si el hogar sale o entra en situación de pobreza multidimensional en tiempo real.

9. **Copiloto Territorial IA (LangChain + Langflow):**
   - Consulta en lenguaje natural sobre IPM, barrios prioritarios, alertas y simulaciones.
   - Evidencias calculadas directamente desde el estado agregado del gemelo digital.
   - Creación de borradores estructurados de choques y políticas con aprobación humana.
   - Modo local seguro sin claves, motor LangChain con Gemini y orquestación Langflow opcional.
   - Auditoría de consultas en memoria y exclusión deliberada de microdatos de hogares.
   - Flujo ejecutable LangGraph: contexto seguro → herramientas → razonamiento → borrador → aprobación.
   - Traza visible de cada nodo y del motor realmente utilizado en cada respuesta.
   - Inferencia mediante el modelo campeón del Motor ML y, cuando el usuario entrena una sesión, mediante sus pesos, sesgo, RMSE e intervalos de confianza reales.

> **Aclaración de arquitectura:** la aplicación ejecutable es React + TypeScript + Vite. No usa Streamlit ni FastAPI. Los fragmentos Python/FastAPI visibles en el explorador de arquitectura son ejemplos descargables, no el runtime de la aplicación. El servicio Express solo protege credenciales y orquesta LangGraph; el análisis numérico proviene de Alkire-Foster, ABM y el Motor ML entrenado de GD-VSU.

---

## Configuración del Copiloto Territorial IA

El copiloto funciona inmediatamente en modo local determinístico. Para activar LangChain con Gemini, crea `.env` a partir de `.env.example` y define:

```env
GEMINI_API_KEY="tu-clave"
GEMINI_MODEL="gemini-2.5-flash"
```

Para ejecutar un flujo visual de Langflow, configura además:

```env
LANGFLOW_URL="http://localhost:7860"
LANGFLOW_FLOW_ID="id-del-flujo"
LANGFLOW_API_KEY="clave-de-langflow"
```

El flujo debe aceptar una entrada de chat y devolver texto. El frontend nunca recibe estas claves: todas las llamadas pasan por `server/index.ts`.

### Validación territorial completa

Con la aplicación en ejecución, puede comprobar que el copiloto acepta los datasets de los 25 departamentos:

```bash
npm run test:territories
```

La prueba genera el contexto real de cada departamento, consulta el grafo y verifica evidencias, traza y borrador de escenario.

---

## 🏗️ Pila Tecnológica

- **Frontend Core:** React 19, TypeScript, Vite 6
- **Estilos:** Tailwind CSS v4 con diseño de centro de comando oscuro de alta precisión
- **Renderizado 3D:** Three.js con sombras dinámicas, shaders y volumetría urbana
- **Cartografía SIG:** Leaflet con mapas base satelitales y capas GeoJSON/vectoriales
- **Gráficos & Visualización:** Recharts, D3.js
- **Iconografía:** Lucide React

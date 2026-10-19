# Fuentes de datos auditables

## Indicador territorial activo

- **Entidad:** Instituto Nacional de Estadística e Informática (INEI).
- **Encuesta:** Encuesta Nacional de Hogares (ENAHO).
- **Tabla:** Población con al menos una Necesidad Básica Insatisfecha, según departamento, 2015–2025.
- **Archivo original:** `raw/INEI_NBI_departamento.xlsx`.
- **URL oficial:** https://www.inei.gob.pe/media/MenuRecursivo/indices_tematicos/cd4_55.xlsx
- **SHA-256:** `BCFEE9154DC52CF9E42DC591F2662A44D0F9EB63F4005A2F87D4BC2963B4C55C`.
- **Granularidad:** 26 ámbitos territoriales por año. INEI publica Lima Metropolitana y Región Lima por separado.

La aplicación lee el XLSX en tiempo de ejecución. No copia valores a constantes,
no completa faltantes y no genera observaciones aleatorias. Si cambia la estructura
del archivo o aparece un valor faltante, el proceso se detiene explícitamente.

## Archivos complementarios conservados

- `raw/INEI_NBI_indicador.xlsx`: serie nacional por cada tipo de NBI.
- `raw/INEI_pobreza_ambitos.xlsx`: pobreza monetaria por ámbito geográfico.
- `raw/Enaho01-2020-100.csv`: muestra pública del módulo de vivienda ENAHO 2020.

Estos archivos se conservan para auditoría y ampliaciones futuras, pero no se
mezclan silenciosamente con el indicador departamental activo.

## Alcance metodológico

NBI e IPM Alkire–Foster no son sinónimos. El tablero muestra NBI porque es el
indicador que la fuente oficial permite reproducir de forma íntegra. No presenta
esta serie como M₀ ni calcula impactos causales. Los escenarios presupuestales son
borradores cuyos supuestos se muestran y cuyo impacto permanece vacío hasta
incorporar datos sectoriales verificables.

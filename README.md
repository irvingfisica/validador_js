# Validador de Datos CSV/ZIP

Una herramienta ligera basada en web para la validación, perfilado y limpieza de archivos CSV. Diseñada para detectar problemas de codificación (encoding), caracteres especiales y consistencia en los datos antes de procesos de carga masiva.

## Características
- **Carga Dual:** Soporta archivos `.csv` directos y archivos `.zip` (extrae automáticamente el primer CSV encontrado).
- **Detección de Encoding:** Analiza el archivo con múltiples codificaciones (`UTF-8`, `Windows-1252`, `ISO-8859-1`) y sugiere la más limpia basada en un algoritmo de puntuación de caracteres extraños.
- **Validación de Reglas:** - Limpieza de nombres de archivos (sin espacios, tildes ni artículos).
  - Identificación de caracteres "rotos" o mal codificados.

## Stack Tecnológico
- **D3.js (v7):** Manipulación de interfaz y lógica de datos.
- **JSZip:** Procesamiento de archivos comprimidos.
- **PapaParse:** Parseo eficiente de CSV mediante Web Workers.
- **Bootstrap 5:** Framework de UI.

## Estructura del Proyecto
- `index.html`: Punto de entrada y estructura base.
- `main.js`: Orquestador principal e importación de módulos.
- `style.css`: Estilos personalizados y manejo de la Drop Zone.
- `tools/`:
  - `carga.js`: Lógica de importación, descompresión y detección de encoding.
  - `utils.js`: Funciones auxiliares de validación y estado de la UI.

## Instalación y Uso
No requiere instalación de dependencias vía NPM. Basta con clonar el repositorio y abrir el `index.html` mediante un servidor local (como *Live Server* de VS Code) para evitar problemas de CORS con los módulos de JS.

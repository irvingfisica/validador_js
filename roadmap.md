### 1. Reestructuración del Estado 

* **Creación del `appState` Global:** Definir un objeto en `main.js` que centralice el `dataframe`, el nombre del archivo, el encoding y los metadatos.
* **Persistencia entre herramientas:** Modificar la función `intface` de carga para que, si ya existe un dataframe en el estado, muestre las validaciones del dataframe activo.
* **Migración a Estructura Columnar:** Agregar lógica columnar al dataframe.

---

### 2. Validación de Estructura

* **Validación de Nombres de Columnas:** Crear función de validación de nombres de columnas.

---

### 3. Perfilado de Datos (Data Profiling)

* **Inferencia de Tipos de Datos:** Crear un motor que determine si una columna es:
* *Numérica:* (Detección de floats e integers).
* *Temporal:* (Detección de formatos de fecha).
* *Textual:* (Las columnas por defecto son texto pero hay que validar si tiene incidencias de capitulado).
* *Categórica:* (Textos que se repiten constantemente, validar incidencias de semejanzas).


* **Detección de "Ruido" en Tipos:** Identificar columnas que deberían ser de un tipo pero tienen celdas que lo rompen (ej: una columna de "Edad" que tiene un texto "Desconocido").

---

### 4. Limpieza de Texto Avanzada

Herramientas específicas para columnas de tipo `string`.

* **Capitulación:** Detectar columnas que están totalmente en mayúsculas para sugerir estandarizarlas.
* **Detección de Categorías Similares (Fuzzy Matching):** Encontrar valores únicos que se parecen mucho (ej: "México" vs "Mexico" o "S.A. de C.V." vs "SA de CV") para sugerir una unificación.

---

### 5. Exportación y Feedback

* **Generador de Incidencias Detallado:** Crear un panel que no solo diga "hay un error", sino que enumere exactamente qué columnas y qué filas necesitan atención.
* **Descarga de Datos Limpios:** Implementar la función para exportar el dataframe modificado de vuelta a un archivo CSV en UTF-8 (o un ZIP con el CSV dentro).

---

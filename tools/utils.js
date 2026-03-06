export function enableTB(boton) {
  d3.selectAll(".tools").classed("active", false);
  d3.selectAll(".tools").attr("aria-pressed", false);
  d3.select(boton).classed("active", true);
  d3.select(boton).attr("aria-pressed", true);
}

const statusBox = d3.select("#status");
const spinner = d3.select("#spinner");

export function setStatus(msg) {
  statusBox.html(msg);
}

export function clearStatus() {
  statusBox.html("");
}

export function showSpinner() {
  spinner.classed("d-none", false);
}

export function hideSpinner() {
  spinner.classed("d-none", true);
}

export function ratioScoreWithContext(
  text,
  { contextSize = 15, maxSamplesPerChar = 5, alpha = 5 } = {},
) {
  const NORMAL = /[a-zA-Z0-9\s.,;:()"'¿?¡!\-_/]/;
  const TYPICAL = /[áéíóúÁÉÍÓÚñÑüÜ“”"%°ºª€]/;

  let typicalWeird = 0;
  let badWeird = 0;

  const badMap = new Map();
  const slice = text;

  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    const code = c.codePointAt(0);

    let isBad = false;

    if (c === "�") {
      isBad = true;
    } else if (code < 32 && ![9, 10, 13].includes(code)) {
      isBad = true;
    } else if (code === 127) {
      isBad = true;
    } else if (!NORMAL.test(c)) {
      if (TYPICAL.test(c)) {
        typicalWeird++;
        continue;
      } else {
        isBad = true;
      }
    }

    if (isBad) {
      badWeird++;

      if (!badMap.has(c)) {
        badMap.set(c, { char: c, count: 0, samples: [] });
      }

      const entry = badMap.get(c);
      entry.count++;

      if (entry.samples.length < maxSamplesPerChar) {
        const start = Math.max(0, i - contextSize);
        const end = Math.min(slice.length, i + contextSize + 1);
        entry.samples.push(
          esc(slice.slice(start, i)) +
            '<span class="weirdcar">' +
            esc(c) +
            "</span>" +
            esc(slice.slice(i + 1, end)),
        );
      }
    }
  }

  const score = badWeird / (badWeird + typicalWeird + alpha);
  const badones = Array.from(badMap.values());
  badones.sort((a, b) => b.count - a.count);

  return {
    score,
    typicalWeird,
    badWeird,
    badChars: badones,
  };
}

function esc(s) {
  return s.replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
  );
}

export function validarNombreCol(texto) {
  let incidencias = [];

  if (texto.startsWith("columna_sin_nombre_")) {
    incidencias.push({
      razon: "La columna no tenía nombre en el archivo original.",
      tipo: "error",
    });
  }

  if (/_\d{2,}$/.test(texto)) {
    incidencias.push({
      razon:
        "El nombre de columna estaba repetido y se le asignó un sufijo numérico.",
      tipo: "cuidado",
    });
  }

  if (texto !== texto.toLowerCase()) {
    incidencias.push({
      razon: "El nombre de columna contiene mayúsculas",
      tipo: "cuidado",
    });
  }

  const regexBasica = /^[a-zA-Z0-9_]+$/;

  if (!regexBasica.test(texto)) {
    incidencias.push({
      razon:
        "El nombre de columna contiene caracteres especiales, ñ, tildes, puntuación o espacios.",
      tipo: "error",
    });
  }

  const palabras = texto.toLowerCase().split(/[\s._]+/);

  if (palabras.length > 5) {
    incidencias.push({
      razon: "El nombre de columna tiene más de 5 palabras",
      tipo: "cuidado",
    });
  }

  for (let palabra of palabras) {
    if (prohibidas.has(palabra)) {
      incidencias.push({
        razon: `El nombre de columna contiene un artículo o preposición innecesaria: "${palabra}".`,
        tipo: "cuidado",
      });
    }
  }

  if (texto.includes("_1")) {
    incidencias.push({
      razon: "El nombre de columna contiene '_1'",
      tipo: "error",
    });
  }

  return incidencias;
}

export function sugerirNombre(cadena, prefix = "") {
  if (!cadena) return "";

  let limpio = cadena.toLowerCase().trim();

  limpio = limpio.replace(/ñ/g, "ni");
  limpio = limpio.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  limpio = limpio.replace(/[^a-z0-9]/g, "_");

  let palabras = limpio.split("_");
  palabras = palabras.filter((p) => p.length > 0 && !prohibidas.has(p));
  limpio = palabras.join("_");
  if (/^[0-9]/.test(limpio)) {
    limpio = prefix + limpio;
  }

  limpio = limpio.replace("_1", "_01");

  return limpio;
}

export function validarCadena(texto) {
  const textoMin = texto.toLowerCase().trim();

  const regexBasica = /^[a-zA-Z0-9_]+$/;

  if (!regexBasica.test(texto)) {
    return {
      valida: false,
      razon:
        "Contiene caracteres especiales, ñ, tildes, puntuación o espacios.",
    };
  }

  const palabras = textoMin.split(/[._]/);

  for (let palabra of palabras) {
    if (prohibidas.has(palabra)) {
      return {
        valida: false,
        razon: `El nombre contiene un artículo o preposición innecesaria: "${palabra}".`,
      };
    }
  }

  return { valida: true };
}

const prohibidas = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "a",
  "ante",
  "bajo",
  "cabe",
  "con",
  "contra",
  "de",
  "desde",
  "durante",
  "en",
  "entre",
  "hacia",
  "hasta",
  "mediante",
  "para",
  "por",
  "segun",
  "sin",
  "so",
  "sobre",
  "tras",
  "versus",
  "via",
]);

export function resetState() {
  d3.select("#descargaTool").property("disabled", true);
  d3.select("#validacionTool").property("disabled", true);
  d3.select("#incidenciaTool").property("disabled", true);

  window.appState = {
    file: null,
    ratios: null,
    encoding: null,
    dataframe: null,
    grid: null,
    tipos: null,
  };
}

function esNumerica(arr) {
  return arr.every((v) => {
    if (v === null || v === undefined) return true;

    const s = String(v).trim();
    if (s === "") return true;

    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return false;

    return Number.isFinite(Number(s));
  });
}

function esFechaValida(str, formato) {
  let y, m, d;

  if (formato === "YYYY-MM-DD" || formato === "YYYY/MM/DD") {
    [y, m, d] = str.split(/[-\/]/).map(Number);
  }

  if (formato === "DD-MM-YYYY" || formato === "DD/MM/YYYY") {
    [d, m, y] = str.split(/[-\/]/).map(Number);
  }

  if (!y || !m || !d) return false;

  // Mes válido
  if (m < 1 || m > 12) return false;

  // Días por mes (considerando bisiesto)
  const diasMes = new Date(y, m, 0).getDate();
  if (d < 1 || d > diasMes) return false;

  // Validación final por Date
  const fecha = new Date(y, m - 1, d);
  return (
    fecha.getFullYear() === y &&
    fecha.getMonth() === m - 1 &&
    fecha.getDate() === d
  );
}

function esFecha(arr) {
  const formatos = [
    { name: "YYYY-MM-DD", regex: /^\d{4}-\d{2}-\d{2}$/ },
    { name: "YYYY/MM/DD", regex: /^\d{4}\/\d{2}\/\d{2}$/ },
    { name: "DD-MM-YYYY", regex: /^\d{2}-\d{2}-\d{4}$/ },
    { name: "DD/MM/YYYY", regex: /^\d{2}\/\d{2}\/\d{4}$/ },
  ];

  for (let f of formatos) {
    if (arr.every((v) => f.regex.test(v) && esFechaValida(v, f.name))) {
      return { esFecha: true, formato: f.name };
    }
  }

  return { esFecha: false };
}

export function esCategorica(arr) {
  const unicos = new Set(arr);
  const totalValidos = arr.length;

  if (totalValidos === 0) return false;

  const ratioUnicidad = unicos.size / totalValidos;

  return unicos.size >= 1 && ratioUnicidad <= 0.2;
}

export function analizarColumna(columna, colname) {
  const totalOriginal = columna.length;

  const arr = columna
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v).trim())
    .filter((v) => v !== "");

  if (arr.length === 0) {
    if (
      window.appState.tipos[colname] &&
      window.appState.tipos[colname] === "numerica"
    ) {
      const salida = { tipo: "numerica" };
      if (esVacia(arr)) {
        salida["posible_vacia"] = true;
      } else {
        salida["posible_vacia"] = false;
      }
      return salida;
    }
    window.appState.tipos[colname] = "vacia";
    return { tipo: "vacia" };
  }

  if (esNumerica(arr)) {
    if (
      window.appState.tipos[colname] &&
      window.appState.tipos[colname] === "texto"
    ) {
      return { tipo: "texto" };
    }

    window.appState.tipos[colname] = "numerica";
    const salida = { tipo: "numerica" };
    if (esVacia(arr)) {
      salida["posible_vacia"] = true;
    } else {
      salida["posible_vacia"] = false;
    }
    return salida;
  }

  const fechaInfo = esFecha(arr);
  if (fechaInfo.esFecha) {
    if (
      window.appState.tipos[colname] &&
      window.appState.tipos[colname] === "texto"
    ) {
      return { tipo: "texto" };
    }
    window.appState.tipos[colname] = "fecha";
    return { tipo: "fecha", formato: fechaInfo.formato };
  }

  if (esCategorica(arr, totalOriginal)) {
    window.appState.tipos[colname] = "texto";
    const salida = { tipo: "categorica" };
    if (esTextoConvertibleANumerico(arr)) {
      salida["posible_numerico"] = true;
    } else {
      salida["posible_numerico"] = false;
    }

    if (esTextoConvertibleAFecha(arr)) {
      salida["posible_fecha"] = true;
    } else {
      salida["posible_fecha"] = false;
    }

    if (esTextoMayusculas(arr)) {
      salida["mayusculas"] = true;
    } else {
      salida["mayusculas"] = false;
    }
    return salida;
  }

  window.appState.tipos[colname] = "texto";
  const salida = { tipo: "texto" };
  if (esTextoConvertibleANumerico(arr)) {
    salida["posible_numerico"] = true;
  } else {
    salida["posible_numerico"] = false;
  }

  if (esTextoConvertibleAFecha(arr)) {
    salida["posible_fecha"] = true;
  } else {
    salida["posible_fecha"] = false;
  }

  if (esTextoMayusculas(arr)) {
    salida["mayusculas"] = true;
  } else {
    salida["mayusculas"] = false;
  }

  return salida;
}

function transformarANumerica(arr) {
  const salida = arr.map((v) => {
    if (v === null || v === undefined) return null;

    let s = String(v);

    s = s.trim();
    s = s.replace(/\s+/g, " ");
    s = s.replace(/[\r\n]+/g, "; ");
    s = s.replace(/[\$,€]/g, "");
    s = s.replace(/\s*%$/, "");
    s = s.replace(/,/g, "");

    if (
      [
        "",
        "-",
        " ",
        "NA",
        "N/A",
        "ND",
        "nd",
        "*",
        "na",
        "nan",
        "null",
        "None",
        "Sin dato",
      ].includes(s)
    ) {
      return null;
    }

    return s;
  });
  return salida;
}

function transformarACoordenadas(arr) {
  return arr.map((v) => {
    if (v === null || v === undefined) return 0.0;

    let s = String(v);

    s = s.trim();
    s = s.replace(/\s+/g, " ");

    if (
      [
        "",
        "-",
        " ",
        "NA",
        "N/A",
        "ND",
        "nd",
        "*",
        "na",
        "nan",
        "null",
        "None",
        "Sin dato",
      ].includes(s)
    ) {
      return 0.0;
    }

    return s;
  });
}

function transformarATexto(arr) {
  return arr.map((v) => {
    let s = String(v);

    s = s.trim();
    s = s.replace(/\s+/g, " ");

    if (v === null || v === undefined || v === "" || v === " ")
      return "Sin dato";

    return s;
  });
}

function transformarATextoCapitalizado(arr) {
  return arr.map((v) => {
    if (v === "Sin dato") return v;
    const s = String(v).toLowerCase();
    const palabras = s.split(/[._]/);
    return palabras
      .map((pal, index) => {
        if (prohibidas.has(pal) && index !== 0) {
          return pal;
        } else {
          return pal.charAt(0).toUpperCase() + pal.slice(1);
        }
      })
      .join(" ");
  });
}

function esVacia(arr) {
  const limpio = transformarANumerica(arr);

  const validos = limpio.filter((v) => v !== null);

  if (validos.length === 0) {
    return true;
  }
}

function esTextoConvertibleANumerico(arr) {
  const limpio = transformarANumerica(arr);

  const validos = limpio.filter((v) => v !== null);

  if (validos.length === 0) {
    return true;
  }

  if (!esNumerica(validos)) {
    return false;
  }

  return true;
}

function transformarAFecha(arr) {
  return arr.map((v) => {
    if (v === null || v === undefined) return null;

    let s = String(v);
    s = s.trim();
    s = s.replace(/\s+/g, " ");
    s = s.replace(/[\r\n]+/g, " ");
    s = s.replace(/\s+\d{2}:\d{2}(:\d{2})?.*$/, "");
    s = s.replace(/[._]/g, "-");
    if (/^\d{8}$/.test(s)) {
      s = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    }
    s = s.replace(/^[^\d]+/, "").replace(/[^\d]+$/, "");

    if (
      [
        "",
        "-",
        " ",
        "NA",
        "N/A",
        "ND",
        "nd",
        "*",
        "na",
        "nan",
        "null",
        "None",
        "Sin dato",
      ].includes(s)
    ) {
      return null;
    }

    return s;
  });
}

function esTextoConvertibleAFecha(arr) {
  const limpio = transformarAFecha(arr);
  const validos = limpio.filter((v) => v !== null);

  if (validos.length === 0) {
    return false;
  }

  if (!esFecha(validos).esFecha) {
    return false;
  }

  return true;
}

function esTextoMayusculas(arr) {
  const letras = arr
    .map((v) => String(v))
    .map((s) => s.trim())
    .filter((s) => s !== "");

  if (letras.length === 0) return false;

  return letras.every((s) => {
    const soloLetras = s.replace(/[^a-zA-ZÀ-ÿ]/g, "");

    if (soloLetras === "") return true;

    return soloLetras === soloLetras.toUpperCase();
  });
}

export function mostrarGrid(dataframe) {
  if (window.appState.grid) {
    window.appState.grid.destroy();
    window.appState.grid = null;
  }

  const mesa = d3.select("#mesaTrabajo");

  const block = d3.select("#gridBlock");
  block.selectAll("*").remove();

  block.append("h2").html("Vista de los datos");

  block
    .append("div")
    .attr("id", "myGrid")
    .attr("class", "ag-theme-quartz")
    .style("height", "500px")
    .style("width", "100%");

  const columnDefs = dataframe.headers.map((h) => ({
    headerName: h,
    valueGetter: (params) => params.data[h],
    filter: true,
    //editable: true,
  }));

  const gridOptions = {
    columnDefs: columnDefs,
    rowData: dataframe.rows,
    defaultColDef: {
      sortable: false,
      resizable: true,
    },
    //pagination: true,
    //paginationPageSize: 100,
    domLayout: "normal",
    onCellValueChanged: (event) => {
      console.log("Dato editado manualmente:", event);
      // Aquí podrías sincronizar con window.appState.dataframe.columns
    },
  };

  const gridDiv = document.querySelector("#myGrid");

  return agGrid.createGrid(gridDiv, gridOptions);
}

export function transformarColumna(datos, tipo) {
  switch (tipo) {
    case "numerica":
      return transformarANumerica(datos);
    case "coordenadas":
      return transformarACoordenadas(datos);
    case "fecha":
      return transformarAFecha(datos);
    case "texto sin guiones bajos":
      return transformarATexto(datos).map((v) => String(v).replace(/_/g, " "));
    case "texto en minúsculas":
      return transformarATexto(datos).map((v) => String(v).toLowerCase());
    case "texto capitalizado":
      return transformarATextoCapitalizado(transformarATexto(datos));
    case "texto":
      return transformarATexto(datos);
    default:
      return transformarATexto(datos);
  }
}

export function showToast(message, type = "danger") {
  // type: "success", "danger", "warning", "info"

  const container = document.getElementById("toast-container");

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toastEl.role = "alert";
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();

  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

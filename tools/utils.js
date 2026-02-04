export function enableTB(boton) {
  d3.selectAll(".tools").attr("disabled", true);
  d3.select(boton).attr("disabled", null);
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
  window.appState = {
    file: null,
    ratios: null,
    encoding: null,
    dataframe: null,
  };
}

function esNumerica(arr) {
  return arr.every((v) => {
    if (v === null || v === undefined) return false;

    const s = String(v).trim();
    if (s === "") return false;

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

function esCategorica(arr) {
  const unicos = new Set(arr);
  const totalValidos = arr.length;

  if (totalValidos === 0) return false;

  const ratioUnicidad = unicos.size / totalValidos;

  return unicos.size > 1 && ratioUnicidad <= 0.2;
}

export function analizarColumna(columna) {
  const totalOriginal = columna.length;

  const arr = columna
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v).trim())
    .filter((v) => v !== "");

  if (arr.length === 0) {
    return { tipo: "vacia" };
  }

  if (esNumerica(arr)) {
    return { tipo: "numerica" };
  }

  const fechaInfo = esFecha(arr);
  if (fechaInfo.esFecha) {
    return { tipo: "fecha", formato: fechaInfo.formato };
  }

  if (esCategorica(arr, totalOriginal)) {
    return { tipo: "categorica" };
  }

  const salida = { tipo: "texto" };
  if (esTextoConvertibleANumerico(arr)) {
    salida["posible_numerico"] = true;
  }

  if (esTextoConvertibleAFecha(arr)) {
    salida["posible_fecha"] = true;
  }

  if (esTextoMayusculas(arr)) {
    salida["mayusculas"] = true;
  }

  return salida;
}

function transformarANumerica(arr) {
  return arr.map((v) => {
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
      ].includes(s)
    ) {
      return null;
    }

    return s;
  });
}

function esTextoConvertibleANumerico(arr) {
  const limpio = transformarANumerica(arr);

  const validos = limpio.filter((v) => v !== null);

  if (validos.length === 0) {
    return false;
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

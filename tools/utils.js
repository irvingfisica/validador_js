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

  const palabras = texto.toLowerCase().split(/[._]/);

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

import * as utils from "./utils.js";

const ENCODINGS = ["utf-8", "windows-1252", "iso-8859-1"];

export function intface() {
  utils.enableTB("#cargarTool");

  const contenedor = d3.select("#mesaTrabajo");
  contenedor.selectAll("*").remove();

  const desc = contenedor.append("div").attr("class", "col-md-12");

  desc.append("h1").html("Herramientas de limpieza para CSV");
  desc.append("h2").html("¿Cómo funciona esta herramienta?");
  desc
    .append("p")
    .html(
      "Aplica las transformaciones que necesites para que tu base de datos esté más limpia.",
    );
  desc.append("p").html("Comienza cargando un archivo.");

  const drop = contenedor
    .append("div")
    .attr("class", "col-md-10")
    .append("div")
    .attr("id", "dropZone")
    .attr("class", "drop-zone");
  drop.append("p").html("Arrastra un CSV o un CSV Zipeado.");

  contenedor
    .append("div")
    .attr("class", "col-md-2")
    .append("div")
    .attr("id", "encodingButtons")
    .attr("class", "encoding-buttons d-grid gap-2");

  const incid = contenedor
    .append("div")
    .attr("id", "incBlock")
    .attr("class", "col-md-10");

  incid.append("h2").html("Incidencias");
  incid.append("ul").attr("id", "incidencias");

  drop
    .on("dragover", function (event) {
      event.preventDefault();
      d3.select(this).classed("dragover", true);
    })
    .on("dragleave", function () {
      d3.select(this).classed("dragover", false);
    })
    .on("drop", function (event) {
      event.preventDefault();

      const selection = d3.select(this);
      selection.classed("dragover", false);

      const file = event.dataTransfer.files[0];
      handleFile(file);
    });

  console.log(window.appState);
  if (window.appState.dataframe) {
    d3.select("#dropZone p").html(
      `Archivo actual: <strong>${window.appState.file.name}</strong>`,
    );

    renderButtons(
      window.appState.file,
      window.appState.ratios,
      window.appState.encoding,
    );
  }
}

async function handleFile(file) {
  utils.resetState();
  const encbuts = d3.select("#encodingButtons");
  encbuts.selectAll("*").remove();

  limpiarIncidencias();

  utils.showSpinner();
  utils.setStatus("Leyendo archivo...");

  let ratios = [];

  let buffer;

  if (file.name.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file);
    const csvFile = Object.values(zip.files).find((f) =>
      f.name.endsWith(".csv"),
    );
    if (!csvFile) {
      d3.select("#dropZone p").html(
        `<strong>El archivo ZIP no contiene un CSV</strong>`,
      );
      utils.hideSpinner();
      utils.setStatus("El archivo no se pudo cargar.");
      return;
    }

    const nombreParaValidar = csvFile.name.split("/").pop();

    buffer = await csvFile.async("arraybuffer");
    file = new File([buffer], nombreParaValidar, { type: "text/csv" });
    console.log(file);
  } else if (file.name.endsWith(".csv")) {
    buffer = await file.arrayBuffer();
  } else {
    d3.select("#dropZone p").html(
      `<strong>El archivo no es ni CSV ni ZIP</strong>`,
    );
    utils.hideSpinner();
    utils.setStatus("El archivo no se pudo cargar.");
    return;
  }

  utils.hideSpinner();
  utils.setStatus("Detectando codificación...");

  d3.select("#dropZone p").html(
    `Archivo cargado: <strong>${file.name}</strong>`,
  );

  for (let enc of ENCODINGS) {
    try {
      const decoder = new TextDecoder(enc);
      const textSample = decoder.decode(buffer);
      const ratio = utils.ratioScoreWithContext(textSample);
      ratio["encoding"] = enc;
      ratios.push(ratio);
    } catch (e) {
      console.warn(enc, e);
    }
  }
  utils.setStatus("Selecciona una codificación.");
  ratios.sort((a, b) => a.score - b.score);
  console.log(ratios);

  window.appState.file = file;
  window.appState.ratios = ratios;
  const enc = ratios[0].encoding;
  renderButtons(file, ratios, enc);
}

function renderButtons(file, ratios, enc) {
  const encbuts = d3.select("#encodingButtons");
  encbuts.selectAll("*").remove();

  encbuts
    .selectAll("button")
    .data(ratios)
    .join("button")
    .attr("class", (d) => "btn encbot " + colorFromRatio(d.score))
    .attr("id", (d) => d.encoding)
    .html(
      (d) =>
        "<small><strong>" +
        d.encoding +
        "</strong> - " +
        (1.0 - d.score).toFixed(2) +
        "</small>",
    )
    .on("click", (e, d) => activateEncoding(d, file));

  encbuts
    .append("p")
    .style("margin-bottom", "0.2rem")
    .append("small")
    .html(
      "El encoding seleccionado es <strong>" +
        enc +
        "</strong>, presiona algún botón para probar con otro.",
    );

  encbuts
    .append("p")
    .append("small")
    .append("strong")
    .style("color", "red")
    .html(
      "Toma en cuenta que si cambias el encoding se perderán los cambios realizados.",
    );

  const selrat = ratios.find((elem) => elem.encoding === enc);
  activateEncoding(selrat, file);
}

async function activateEncoding(ratio, file) {
  limpiarIncidencias();
  let dataframe = window.appState.dataframe;
  if (
    !window.appState.dataframe ||
    window.appState.encoding !== ratio.encoding
  ) {
    dataframe = await streamCSV(file, ratio.encoding);
    window.appState.dataframe = dataframe;
    window.appState.encoding = ratio.encoding;
    console.log(dataframe);
    utils.setStatus(
      `CSV cargado: ${dataframe.rows.length.toLocaleString()} filas; ${dataframe.headers.length.toLocaleString()} columnas.`,
    );
  }

  console.log(window.appState.dataframe);

  validacionBase(ratio, file, dataframe);
}

function validacionBase(ratio, file, dataframe) {
  limpiarIncidencias();
  const base = d3.select("#incidencias").append("ul").attr("id", "listaBase");
  validarNombre(file, base);
  validarEncoding(ratio, base);
  validarColumnas(dataframe);
}

function validarNombre(file, base) {
  const validName = utils.validarCadena(file.name.replace(".csv", ""));
  base.append("li").attr("id", "nombre");
  if (validName.valida) {
    agregarIncidencia(
      "nombre",
      "El nombre de archivo: <strong>" + file.name + "</strong> es válido.",
      "exito",
    );
  } else {
    agregarIncidencia(
      "nombre",
      "El nombre de archivo: <strong>" +
        file.name +
        "</strong> NO es válido, es necesario cambiarlo. " +
        validName.razon,
      "cuidado",
    );
  }
}

function validarEncoding(ratio, base) {
  base.append("li").attr("id", "encoding");
  if (ratio.badChars.length == 0) {
    agregarIncidencia(
      "encoding",
      "No se encontraron caracteres extraños.",
      "exito",
    );
  } else {
    agregarIncidencia(
      "encoding",
      "Se encontraron caracteres extraños. La calificación obtenida es <strong>" +
        (1.0 - ratio.score).toLocaleString() +
        '</strong> <small>(idealmente 1)</small>. <button class="btn btn-outline-dark btn-sm mx-1" id="revisarEncoding">revisar</button>',
      tipoFromRatio(ratio.score),
    );
  }

  d3.select("#revisarEncoding").on("click", () => weirdTable(ratio.badChars));
}

function validarColumnas(dataframe) {
  const divo = d3.select("#incidencias").append("div");
  divo.append("h3").html("Columnas:");
  dataframe.headers.forEach((col, i) => {
    const divc = divo.append("div");
    divc.append("p").html("Columna: <strong>" + col + "</strong>");
    const ul = divc.append("ul");

    const incidencias = utils.validarNombreCol(col);
    console.log(col, incidencias);
    incidencias.forEach((inc, j) => {
      ul.append("li").attr("id", "ele_" + i + "_" + j);
      agregarIncidencia("ele_" + i + "_" + j, inc.razon, inc.tipo);
    });

    const tipocol = utils.analizarColumna(dataframe.columns[col]);
    if (tipocol.tipo === "vacia") {
      ul.append("li").attr("id", "tipo_" + i);
      agregarIncidencia(
        "tipo_" + i,
        "<strong>La columna está vacía</strong>",
        "error",
      );
    } else if (tipocol.tipo === "numerica") {
      ul.append("li").attr("id", "tipo_" + i);
      agregarIncidencia(
        "tipo_" + i,
        'La columna es <span class="tipo">numérica</span>',
        "",
      );
    } else if (tipocol.tipo === "fecha") {
      ul.append("li").attr("id", "tipo_" + i);
      agregarIncidencia(
        "tipo_" + i,
        'La columna es de <span class="tipo">fechas</span>, con el formato <span class="tipo">' +
          tipocol.formato +
          "</span>",
        "",
      );
    } else if (tipocol.tipo === "categorica") {
      ul.append("li").attr("id", "tipo_" + i);
      agregarIncidencia(
        "tipo_" + i,
        'La columna es de <span class="tipo">categorías</span>',
        "",
      );
    } else {
      ul.append("li").attr("id", "tipo_" + i);
      agregarIncidencia(
        "tipo_" + i,
        'La columna es de <span class="tipo">texto</span>',
        "",
      );

      if ("posible_numerico" in tipocol) {
        ul.append("li").attr("id", "posnum_" + i);
        agregarIncidencia(
          "posnum_" + i,
          "La columna podría ser numérica",
          "conversion",
        );
      }

      if ("posible_fecha" in tipocol) {
        ul.append("li").attr("id", "posfec_" + i);
        agregarIncidencia(
          "posfec_" + i,
          "La columna podría ser de fechas",
          "conversion",
        );
      }

      if ("mayusculas" in tipocol) {
        ul.append("li").attr("id", "may_" + i);
        agregarIncidencia(
          "may_" + i,
          "Los textos de la columna están todos en mayúsculas.",
          "cuidado",
        );
      }
    }
  });
}

function weirdTable(raros) {
  const myModal = new bootstrap.Modal(document.getElementById("modal"));

  console.log(raros);
  d3.select("#modalTitle").html("Tabla de caracteres extraños");
  d3.select("#modalBody").selectAll("*").remove();

  const tabla = d3
    .select("#modalBody")
    .append("table")
    .attr("class", "table table-sm");

  const cabeza = tabla.append("thead");
  const cuerpo = tabla.append("tbody");

  cabeza
    .append("tr")
    .selectAll("th")
    .data(["caracter", "frecuencia", "ejemplos"])
    .join("th")
    .html((d) => d);

  const filas = cuerpo.selectAll("tr").data(raros).join("tr");
  filas
    .append("td")
    .html((d) => '<span class="weirdcar">' + d.char + "</span>");
  filas.append("td").html((d) => d.count);
  filas
    .append("td")
    .selectAll("p")
    .data((d) => d.samples)
    .join("p")
    .style("margin-bottom", "0.5rem")
    .html((p) => p);

  myModal.show();
}

function streamCSV(file, encoding) {
  return new Promise((resolve) => {
    const rows = [];
    const columns = {};
    let headers = null;
    let index = 0;
    let lastUpdate = 0;

    Papa.parse(file, {
      worker: true,
      encoding,
      skipEmptyLines: true,
      chunkSize: 1024 * 1024,
      step: function (results) {
        utils.showSpinner();
        if (!headers) {
          headers = results.data.map((ele) => ele.trim());
          headers.forEach((h) => (columns[h] = []));
          return;
        } else {
          let obj = { _index: index++ };
          headers.forEach((h, i) => {
            const valor = results.data[i].trim();
            obj[h] = valor;
            columns[h].push(valor);
          });
          rows.push(obj);

          if (index - lastUpdate > 1000) {
            lastUpdate = index;
            utils.setStatus(`Parseando CSV… ${index.toLocaleString()} filas`);
          }
        }
      },
      complete: function () {
        utils.hideSpinner();
        resolve({ headers, rows, columns, meta: {} });
      },
    });
  });
}

function colorFromRatio(r) {
  if (r < 0.1) return "btn-success";
  if (r < 0.5) return "btn-warning";
  return "btn-danger";
}

function tipoFromRatio(r) {
  if (r < 0.1) return "exito";
  if (r < 0.5) return "cuidado";
  return "error";
}

function agregarIncidencia(ancla, texto, tipo) {
  const inco = d3.select("#incidencias").select("#" + ancla);
  const mensaje = inco.append("p");

  if (tipo == "error") {
    mensaje.style("color", "red").html("<strong>" + texto + "</strong>");
    return;
  }

  if (tipo == "exito") {
    mensaje.style("color", "green").html(texto);
    return;
  }

  if (tipo == "cuidado") {
    mensaje.style("color", "#F25912").html(texto);
    return;
  }

  if (tipo == "conversion") {
    mensaje.style("color", "#001BB7").html("<strong>" + texto + "</strong>");
    return;
  }

  mensaje.html(texto);
}

function limpiarIncidencias() {
  const inco = d3.select("#incidencias");
  inco.selectAll("*").remove();
}

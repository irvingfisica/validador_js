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

  const dropd = contenedor.append("div").attr("class", "col-md-10");

  const drop = dropd
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

  const framec = dropd
    .append("div")
    .attr("id", "gridBlock")
    .attr("class", "col-md-12 bloque");

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

    d3.select("#validacionTool").property("disabled", false);
    d3.select("#incidenciasTool").property("disabled", false);
    d3.select("#categosTool").property("disabled", false);
  }
}

async function handleFile(file) {
  if (window.appState.grid) {
    window.appState.grid.destroy();
    window.appState.grid = null;
  }

  d3.select("#gridBlock").selectAll("*").remove();

  d3.select("#dropZone p").html(`Procesando archivo...`);
  utils.resetState();
  const encbuts = d3.select("#encodingButtons");
  encbuts.selectAll("*").remove();

  utils.showSpinner();
  utils.setStatus("Leyendo archivo...");

  let ratios = [];

  let buffer;

  if (file.name.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file);
    const csvFile = Object.values(zip.files).find(
      (f) => f.name.endsWith(".csv") || file.name.endsWith(".CSV"),
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
  } else if (file.name.endsWith(".csv") || file.name.endsWith(".CSV")) {
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

  window.appState.file = file;
  window.appState.ratios = ratios;
  const enc = ratios[0].encoding;
  renderButtons(file, ratios, enc);
  d3.select("#descargaTool").property("disabled", false);
  d3.select("#validacionTool").property("disabled", false);
  d3.select("#incidenciasTool").property("disabled", false);
  d3.select("#categosTool").property("disabled", false);
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

  window.appState.grid = utils.mostrarGrid(window.appState.dataframe);
  console.log(window.appState);
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
      dynamicTyping: false,
      step: function (results) {
        utils.showSpinner();
        if (!headers) {
          let rawHeaders = results.data.map((ele) => ele.trim());
          headers = [];
          let counts = {};

          rawHeaders.forEach((h, i) => {
            let finalName = h;

            if (finalName === "") {
              finalName = "columna_sin_nombre".padStart(2, "0");
            }

            if (counts[finalName] !== undefined) {
              counts[finalName]++;
              finalName =
                finalName + "_" + String(counts[finalName]).padStart(2, "0");
            } else {
              counts[finalName] = 0;
            }

            headers.push(finalName);
            columns[finalName] = [];
          });
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

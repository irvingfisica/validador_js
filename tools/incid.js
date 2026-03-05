import * as utils from "./utils.js";

export function intface() {
  utils.enableTB("#incidenciasTool");

  const contenedor = d3.select("#mesaTrabajo");
  contenedor.selectAll("*").remove();

  const desc = contenedor.append("div").attr("class", "col-md-12");

  desc.append("h1").html("Herramientas de limpieza para CSV");
  desc
    .append("p")
    .html(
      "En esta sección puedes revisar las incidencias que aún tiene la base de datos. Procura no tener incidencias antes de exportar el archivo.",
    );

  const incid = contenedor.append("div").attr("class", "col-md-4 bloque");

  incid.append("h2").html("Incidencias");
  incid.append("div").attr("id", "incBlock");

  const framec = contenedor
    .append("div")
    .attr("id", "gridBlock")
    .attr("class", "col-md-8 bloque");

  const ratios = window.appState.ratios;
  const encoding = window.appState.encoding;
  const file = window.appState.file;
  const dataframe = window.appState.dataframe;
  const selrat = ratios.find((elem) => elem.encoding === encoding);

  window.appState.grid = utils.mostrarGrid(dataframe);
  validacionBase(selrat, file, dataframe);
}

function validacionBase(ratio, file, dataframe) {
  const bloque = d3.select("#incBlock");
  bloque.selectAll("*").remove();

  bloque.append("ul").attr("id", "incidencias");

  const base = d3.select("#incidencias").append("ul").attr("id", "listaBase");
  validarNombre(file, base);
  validarEncoding(ratio, base);
  validarColumnas(dataframe);
}

function validarNombre(file, base) {
  const validName = utils.validarCadena(
    file.name.replace(".csv", "").replace(".CSV", ""),
  );
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

      if ("posible_numerico" in tipocol && tipocol["posible_numerico"]) {
        ul.append("li").attr("id", "posnum_" + i);
        agregarIncidencia(
          "posnum_" + i,
          "La columna podría ser numérica (revisar)",
          "conversion",
        );
      }

      if ("posible_fecha" in tipocol && tipocol["posible_fecha"]) {
        ul.append("li").attr("id", "posfec_" + i);
        agregarIncidencia(
          "posfec_" + i,
          "La columna podría ser de fechas (revisar)",
          "conversion",
        );
      }

      if ("mayusculas" in tipocol && tipocol["mayusculas"]) {
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

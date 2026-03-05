import * as utils from "./utils.js";

export function intface() {
  utils.enableTB("#validacionTool");

  const contenedor = d3.select("#mesaTrabajo");
  contenedor.selectAll("*").remove();

  const desc = contenedor.append("div").attr("class", "col-md-12");

  desc.append("h1").html("Herramienta de columnas");
  desc
    .append("p")
    .html(
      "La herramienta sugiere nombres de columna que puedes editar. Permite aplicar transformaciones a las columnas para corregir características del texto, o transformar en columnas numéricas o de fecha.",
    );

  const framec = contenedor
    .append("div")
    .attr("id", "gridBlock")
    .attr("class", "col-md-10 bloque");

  const cols = contenedor
    .append("div")
    .attr("id", "colBlock")
    .attr("class", "col-md-10 bloque");

  if (window.appState.grid) {
    window.appState.grid = utils.mostrarGrid(window.appState.dataframe);
  }

  cols.append("h2").html("Validación de columnas");
  cols
    .append("p")
    .html(
      "Valida el nombre a usar en cada columna y el tipo de datos que debería de contener.",
    );

  console.log(window.appState);

  const tabla = cols.append("table").attr("class", "table");
  tabla
    .append("thead")
    .append("tr")
    .selectAll("th")
    .data([
      "Nombre actual de la columna",
      "Nombre a usar",
      "Tipo de datos deseado",
    ])
    .join("th")
    .html((d) => d);

  const filas = tabla
    .append("tbody")
    .selectAll("tr")
    .data(window.appState.dataframe.headers)
    .join("tr");

  filas
    .append("td")
    .style("color", (d) => {
      if (d == utils.sugerirNombre(d)) {
        return "green";
      } else {
        return "red";
      }
    })
    .html((d) => d);
  filas
    .append("td")
    .append("input")
    .attr("type", "text")
    .attr("class", "form-control")
    .attr("id", (d, i) => "colinp_" + i)
    .attr("value", (d) => utils.sugerirNombre(d));
  const selecto = filas
    .append("td")
    .append("select")
    .attr("class", "form-select");

  selecto
    .selectAll("option")
    .data((d) => opciones(d))
    .join("option")
    .attr("value", (d) => d)
    .html((d) => d);

  cols
    .append("div")
    .append("button")
    .attr("class", "btn btn-primary")
    .html("Promover los cambios")
    .on("click", promover);
}

function opciones(d) {
  const datos = window.appState.dataframe.columns[d];
  const analisis = utils.analizarColumna(datos);

  switch (analisis.tipo) {
    case "vacia":
      return ["vacia", "eliminar columna"];

    case "numerica":
      return ["numerica", "coordenadas", "texto", "eliminar columna"];

    case "fecha":
      return ["fecha", "texto", "eliminar columna"];

    case "categorica":
      return [
        "texto",
        "texto sin giuones bajos",
        "texto en minúsculas",
        "texto capitalizado",
        "eliminar columna",
      ];

    case "texto": {
      let salida = [
        "texto",
        "texto sin giuones bajos",
        "texto en minúsculas",
        "texto capitalizado",
        "eliminar columna",
      ];
      if (analisis.posible_numerico) {
        salida.push("numerica");
      }
      if (analisis.posible_fecha) {
        salida.push("fecha");
      }
      return salida;
    }
  }
}

function promover() {
  const df = window.appState.dataframe;
  const nuevosHeaders = [];
  const nuevasColumnas = {};
  const transformaciones = [];

  df.headers.forEach((h, i) => {
    const nuevoNombre = d3.select("#colinp_" + i).property("value");
    const accion = d3.selectAll("select").nodes()[i].value;

    if (accion !== "eliminar columna") {
      nuevosHeaders.push(nuevoNombre);
      transformaciones.push({
        original: h,
        nuevo: nuevoNombre,
        accion: accion,
      });
    }
  });

  transformaciones.forEach((t) => {
    const datosLimpios = utils.transformarColumna(
      df.columns[t.original],
      t.accion,
    );
    nuevasColumnas[t.nuevo] = datosLimpios;
  });

  const nuevasRows = df.rows.map((row, i) => {
    const nuevaRow = { _index: i };
    transformaciones.forEach((t) => {
      nuevaRow[t.nuevo] = nuevasColumnas[t.nuevo][i];
    });
    return nuevaRow;
  });

  window.appState.dataframe.headers = nuevosHeaders;
  window.appState.dataframe.columns = nuevasColumnas;
  window.appState.dataframe.rows = nuevasRows;

  intface();
  utils.showToast("Cambios promovidos", "success");
}

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
    .data(function (d) {
      const datos = window.appState.dataframe.columns[d];
      const analisis = utils.analizarColumna(datos);

      if (analisis.tipo === "vacia") {
        return ["vacia", "eliminar columna"];
      }

      if (analisis.tipo === "numerica") {
        return ["numerica", "coordenadas", "texto", "eliminar columna"];
      }

      if (analisis.tipo === "fecha") {
        return ["fecha", "texto", "eliminar columna"];
      }

      if (analisis.tipo === "categorica") {
        return [
          "texto",
          "texto sin guones bajos",
          "texto en minúsculas",
          "texto capitalizado",
          "eliminar columna",
        ];
      }

      if (analisis.tipo === "texto") {
        let salida = [
          "texto",
          "texto sin guones bajos",
          "texto en minúsculas",
          "texto capitalizado",
          "anonimizar",
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
    })
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

function promover(e, d) {}

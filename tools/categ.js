import * as utils from "./utils.js";

export function intface() {
  utils.enableTB("#categosTool");

  const contenedor = d3.select("#mesaTrabajo");
  contenedor.selectAll("*").remove();

  const desc = contenedor.append("div").attr("class", "col-md-12");

  desc.append("h1").html("Herramientas de limpieza para CSV");
  desc.append("h2").html("Editor de valores");
  desc
    .append("p")
    .html(
      "Esta herramienta permite aplicar reglas de edición a valores en cada columna.",
    );

  const framec = contenedor
    .append("div")
    .attr("id", "gridBlock")
    .attr("class", "col-md-12 bloque");

  const cols = contenedor
    .append("div")
    .attr("id", "colBlock")
    .attr("class", "col-md-12 bloque");

  if (window.appState.grid) {
    window.appState.grid = utils.mostrarGrid(window.appState.dataframe);
  }

  cols.append("h2").html("Selección de columna");
  cols
    .append("p")
    .html("Selecciona una columna con categorías para explorar sus valores");

  console.log(window.appState);

  const categos = Object.entries(window.appState.dataframe.columns)
    .filter((e) => utils.esCategorica(e[1]))
    .map((e) => {
      const cats = new Set(e[1]);
      return {
        columna: e[0],
        categorias: cats.size,
      };
    });
  console.log(categos);

  cols
    .append("div")
    .attr("class", "col-md-4")
    .append("select")
    .attr("class", "form-select")
    .selectAll("option")
    .data(categos)
    .join("option")
    .attr("value", (d) => d.columna)
    .html((d) => d.columna + " - (categorías: " + d.categorias + ")");
}

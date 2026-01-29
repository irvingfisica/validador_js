import * as carga from "./tools/carga.js";

window.appState = {
  file: null,
  ratios: null,
  encoding: null,
  dataframe: null,
};

d3.select("#cargarTool").on("click", carga.intface);

carga.intface();

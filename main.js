import * as utils from "./tools/utils.js";
import * as carga from "./tools/carga.js";

utils.resetState();

d3.select("#cargarTool").on("click", carga.intface);

carga.intface();

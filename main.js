import * as utils from "./tools/utils.js";
import * as carga from "./tools/carga.js";
import * as valid from "./tools/valid.js";

utils.resetState();

d3.select("#cargarTool").on("click", carga.intface);
d3.select("#validacionTool").on("click", valid.intface);

carga.intface();

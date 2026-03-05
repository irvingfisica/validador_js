import * as utils from "./tools/utils.js";
import * as carga from "./tools/carga.js";
import * as valid from "./tools/valid.js";
import * as incid from "./tools/incid.js";
import * as categ from "./tools/categ.js";

utils.resetState();

d3.select("#cargarTool").on("click", carga.intface);
d3.select("#validacionTool").on("click", valid.intface);
d3.select("#incidenciasTool").on("click", incid.intface);
d3.select("#categosTool").on("click", categ.intface);

carga.intface();

d3.select("#descargaTool").on("click", function () {
  const api = window.appState.grid;

  const nombreBase = window.appState.file.name
    .replace(".csv", "")
    .replace(".CSV", "");
  const nombreCorregido = utils.sugerirNombre(nombreBase) + ".csv";

  const csvContent = api.getDataAsCsv({
    columnSeparator: ",",
    allColumns: true,
    skipHeader: false,
  });

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", nombreCorregido);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    utils.setStatus(`Archivo "${nombreCorregido}" exportado en UTF-8.`);
  }
});

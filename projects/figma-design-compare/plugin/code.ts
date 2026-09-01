/// <reference types="@figma/plugin-typings" />

// Tipos de nodos que tiene sentido exportar como "diseño original".
const EXPORTABLE_TYPES: NodeType[] = ["FRAME", "COMPONENT", "COMPONENT_SET", "INSTANCE"];

figma.showUI(__html__, { width: 360, height: 520 });

async function exportSelectionAsPng() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: "export-error",
      message: "No hay nada seleccionado. Elegí un frame o componente en el canvas.",
    });
    return;
  }

  if (selection.length > 1) {
    figma.ui.postMessage({
      type: "export-error",
      message: "Seleccioná un solo frame/componente a la vez.",
    });
    return;
  }

  const node = selection[0];

  if (!EXPORTABLE_TYPES.includes(node.type)) {
    figma.ui.postMessage({
      type: "export-error",
      message: `El tipo de nodo seleccionado (${node.type}) no se puede exportar. Elegí un frame, componente o instancia.`,
    });
    return;
  }

  try {
    const bytes = await (node as ExportMixin).exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 2 },
    });

    figma.ui.postMessage({
      type: "export-success",
      base64: figma.base64Encode(bytes),
      fileName: node.name,
      width: "width" in node ? Math.round((node as SceneNode & { width: number }).width) : null,
      height: "height" in node ? Math.round((node as SceneNode & { height: number }).height) : null,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: "export-error",
      message: `Error al exportar: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  const node = selection[0];
  const isValid = selection.length === 1 && !!node && EXPORTABLE_TYPES.includes(node.type);

  figma.ui.postMessage({
    type: "selection-changed",
    hasValidSelection: isValid,
    nodeName: isValid ? node.name : null,
  });
});

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === "export-selection") {
    exportSelectionAsPng();
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};

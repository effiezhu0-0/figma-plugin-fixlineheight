figma.showUI(__html__, {
  width: 360,
  height: 560
});

type ApplyPhase2Result = {
  updatedCount: number;
  noSelection: boolean;
  noTextFound: boolean;
  errorMessage?: string;
};

function hasChildren(node: SceneNode): node is SceneNode & ChildrenMixin {
  return "children" in node;
}

function collectTextNodes(node: SceneNode): TextNode[] {
  if (node.type === "TEXT") {
    return [node];
  }

  if (!hasChildren(node)) {
    return [];
  }

  const nestedTextNodes: TextNode[] = [];
  for (const child of node.children) {
    nestedTextNodes.push(...collectTextNodes(child));
  }
  return nestedTextNodes;
}

async function applyPhase2(): Promise<ApplyPhase2Result> {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    return {
      updatedCount: 0,
      noSelection: true,
      noTextFound: false
    };
  }

  const textNodeMap = new Map<string, TextNode>();
  for (const selectedNode of selection) {
    for (const textNode of collectTextNodes(selectedNode)) {
      textNodeMap.set(textNode.id, textNode);
    }
  }

  const textNodes = Array.from(textNodeMap.values());
  if (textNodes.length === 0) {
    return {
      updatedCount: 0,
      noSelection: false,
      noTextFound: true
    };
  }

  let updatedCount = 0;

  for (const textNode of textNodes) {
    try {
      if (textNode.fontName === figma.mixed || typeof textNode.fontSize !== "number") {
        continue;
      }

      await figma.loadFontAsync(textNode.fontName);
      textNode.lineHeight = {
        unit: "PIXELS",
        value: textNode.fontSize
      };
      updatedCount += 1;
    } catch (_error) {
      // Keep processing other nodes even if one fails.
    }
  }

  return {
    updatedCount,
    noSelection: false,
    noTextFound: false
  };
}

figma.ui.onmessage = async (message: { type?: string }) => {
  if (message.type === "phase1-ready") {
    figma.ui.postMessage({ type: "phase1-ack" });
    return;
  }

  if (message.type === "apply-phase2") {
    try {
      const result = await applyPhase2();
      figma.ui.postMessage({
        type: "apply-phase2-result",
        payload: result
      });
    } catch (_error) {
      figma.ui.postMessage({
        type: "apply-phase2-result",
        payload: {
          updatedCount: 0,
          noSelection: false,
          noTextFound: false,
          errorMessage: "Unexpected error."
        }
      });
    }
  }
};

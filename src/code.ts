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

type ApplyPhase2Settings = {
  applyMultiline: boolean;
  includeComponents: boolean;
  includeInstances: boolean;
  includeMainComponents: boolean;
};

type ComponentContext = "none" | "instance" | "main";

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

function getTargetLineHeight(fontSize: number, isMultiline: boolean, applyMultiline: boolean): number | null {
  if (!isMultiline) {
    return fontSize;
  }

  if (!applyMultiline) {
    return null;
  }

  return Math.round(fontSize * 1.618);
}

function getComponentContext(textNode: TextNode): ComponentContext {
  let current: BaseNode | null = textNode.parent;

  while (current) {
    if (current.type === "INSTANCE") {
      return "instance";
    }
    if (current.type === "COMPONENT" || current.type === "COMPONENT_SET") {
      return "main";
    }
    current = current.parent;
  }

  return "none";
}

function shouldProcessByComponentSettings(
  textNode: TextNode,
  settings: ApplyPhase2Settings
): boolean {
  const context = getComponentContext(textNode);
  if (context === "none") {
    return true;
  }

  if (!settings.includeComponents) {
    return false;
  }

  if (context === "instance") {
    return settings.includeInstances;
  }

  return settings.includeMainComponents;
}

async function applyPhase2(settings: ApplyPhase2Settings): Promise<ApplyPhase2Result> {
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

      if (!shouldProcessByComponentSettings(textNode, settings)) {
        continue;
      }

      const isMultiline = textNode.characters.includes("\n");
      const targetLineHeight = getTargetLineHeight(textNode.fontSize, isMultiline, settings.applyMultiline);
      if (targetLineHeight === null) {
        continue;
      }

      await figma.loadFontAsync(textNode.fontName);
      textNode.lineHeight = {
        unit: "PIXELS",
        value: targetLineHeight
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

figma.ui.onmessage = async (message: {
  type?: string;
  payload?: {
    applyMultiline?: boolean;
    includeComponents?: boolean;
    includeInstances?: boolean;
    includeMainComponents?: boolean;
  };
}) => {
  if (message.type === "phase1-ready") {
    figma.ui.postMessage({ type: "phase1-ack" });
    return;
  }

  if (message.type === "apply-phase2") {
    try {
      const applyMultiline =
        message.payload && typeof message.payload.applyMultiline === "boolean"
          ? message.payload.applyMultiline
          : true;
      const includeComponents =
        message.payload && typeof message.payload.includeComponents === "boolean"
          ? message.payload.includeComponents
          : true;
      const includeInstances =
        message.payload && typeof message.payload.includeInstances === "boolean"
          ? message.payload.includeInstances
          : true;
      const includeMainComponents =
        message.payload && typeof message.payload.includeMainComponents === "boolean"
          ? message.payload.includeMainComponents
          : true;

      const result = await applyPhase2({
        applyMultiline,
        includeComponents,
        includeInstances,
        includeMainComponents
      });
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

figma.showUI(__html__, {
  width: 360,
  height: 640
});

type ApplyPhase2Result = {
  updatedCount: number;
  autoLayoutCount: number;
  skippedMissingFontCount: number;
  skippedMultilineCount: number;
  skippedMixedFontCount: number;
  skippedComponentCount: number;
  noSelection: boolean;
  noTextFound: boolean;
  errorMessage?: string;
};

type ApplyPhase2Settings = {
  lineHeightPercent: number;
  applyMultiline: boolean;
  includeComponents: boolean;
  includeInstances: boolean;
  includeMainComponents: boolean;
  skipMixedFontSizes: boolean;
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

function normalizeLineHeightPercent(raw: unknown): number {
  var n = 100;
  if (typeof raw === "number" && !isNaN(raw) && isFinite(raw)) {
    n = raw;
  } else if (typeof raw === "string") {
    var trimmed = raw.replace(/^\s+|\s+$/g, "");
    if (trimmed.length === 0) {
      return 100;
    }
    var parsed = parseFloat(trimmed);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return 100;
    }
    n = parsed;
  }
  if (n < 50) {
    return 50;
  }
  if (n > 300) {
    return 300;
  }
  return Math.round(n);
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

function isInAutoLayout(textNode: TextNode): boolean {
  let current: BaseNode | null = textNode.parent;
  while (current) {
    if ("layoutMode" in current) {
      const frameLike = current as FrameNode | ComponentNode | InstanceNode;
      if (frameLike.layoutMode !== "NONE") {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
}

/** Load every font used on the node (needed when `fontName` is mixed). */
async function loadAllFontsForTextNode(textNode: TextNode): Promise<boolean> {
  if (textNode.fontName !== figma.mixed) {
    try {
      await figma.loadFontAsync(textNode.fontName);
      return true;
    } catch (_e) {
      return false;
    }
  }

  const segments = textNode.getStyledTextSegments(["fontName"]);
  const seen = new Set<string>();

  for (const segment of segments) {
    const key = segment.fontName.family + "\0" + segment.fontName.style;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    try {
      await figma.loadFontAsync(segment.fontName);
    } catch (_e) {
      return false;
    }
  }

  return seen.size > 0;
}

type MixedFontSizeResolution = {
  maxFontSize: number;
};

/**
 * Uses TextNode range/segment APIs (`getStyledTextSegments`) to find the largest
 * `fontSize` when the node-level `fontSize` is `figma.mixed`.
 */
function resolveMixedFontSizeMetrics(textNode: TextNode): MixedFontSizeResolution | null {
  if (textNode.characters.length === 0) {
    return null;
  }

  const segments = textNode.getStyledTextSegments(["fontSize", "fontName"]);
  let maxFontSize = 0;

  for (const segment of segments) {
    if (typeof segment.fontSize === "number") {
      maxFontSize = Math.max(maxFontSize, segment.fontSize);
    }
  }

  if (maxFontSize <= 0) {
    return null;
  }

  return { maxFontSize };
}

async function applyPhase2(settings: ApplyPhase2Settings): Promise<ApplyPhase2Result> {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    return {
      updatedCount: 0,
      autoLayoutCount: 0,
      skippedMissingFontCount: 0,
      skippedMultilineCount: 0,
      skippedMixedFontCount: 0,
      skippedComponentCount: 0,
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
      autoLayoutCount: 0,
      skippedMissingFontCount: 0,
      skippedMultilineCount: 0,
      skippedMixedFontCount: 0,
      skippedComponentCount: 0,
      noSelection: false,
      noTextFound: true
    };
  }

  let updatedCount = 0;
  let autoLayoutCount = 0;
  let skippedMissingFontCount = 0;
  let skippedMultilineCount = 0;
  let skippedMixedFontCount = 0;
  let skippedComponentCount = 0;

  for (const textNode of textNodes) {
    try {
      if (!shouldProcessByComponentSettings(textNode, settings)) {
        skippedComponentCount += 1;
        continue;
      }

      if (settings.skipMixedFontSizes) {
        if (textNode.fontName === figma.mixed || textNode.fontSize === figma.mixed) {
          skippedMixedFontCount += 1;
          continue;
        }
      }

      const isMultiline = textNode.characters.indexOf("\n") !== -1;
      if (isMultiline && !settings.applyMultiline) {
        skippedMultilineCount += 1;
        continue;
      }

      const percentValue = settings.lineHeightPercent;

      if (textNode.fontSize === figma.mixed) {
        const resolved = resolveMixedFontSizeMetrics(textNode);
        if (!resolved) {
          continue;
        }

        const fontsLoaded = await loadAllFontsForTextNode(textNode);
        if (!fontsLoaded) {
          skippedMissingFontCount += 1;
          continue;
        }

        textNode.lineHeight = {
          unit: "PIXELS",
          value: Math.round((resolved.maxFontSize * percentValue) / 100)
        };
        updatedCount += 1;
        if (isInAutoLayout(textNode)) {
          autoLayoutCount += 1;
        }
        continue;
      }

      if (textNode.fontName === figma.mixed || typeof textNode.fontSize !== "number") {
        continue;
      }

      const fontsLoaded = await loadAllFontsForTextNode(textNode);
      if (!fontsLoaded) {
        skippedMissingFontCount += 1;
        continue;
      }

      textNode.lineHeight = {
        unit: "PERCENT",
        value: percentValue
      };
      updatedCount += 1;
      if (isInAutoLayout(textNode)) {
        autoLayoutCount += 1;
      }
    } catch (_error) {
      // Keep processing other nodes even if one fails.
    }
  }

  return {
    updatedCount,
    autoLayoutCount,
    skippedMissingFontCount,
    skippedMultilineCount,
    skippedMixedFontCount,
    skippedComponentCount,
    noSelection: false,
    noTextFound: false
  };
}

figma.ui.onmessage = async (message: {
  type?: string;
  payload?: {
    lineHeightPercent?: number;
    applyMultiline?: boolean;
    includeComponents?: boolean;
    includeInstances?: boolean;
    includeMainComponents?: boolean;
    skipMixedFontSizes?: boolean;
  };
}) => {
  if (message.type === "phase1-ready") {
    figma.ui.postMessage({ type: "phase1-ack" });
    return;
  }

  if (message.type === "apply-phase2") {
    try {
      const lineHeightPercentRaw =
        message.payload && typeof message.payload.lineHeightPercent === "number"
          ? message.payload.lineHeightPercent
          : 100;
      const lineHeightPercent = normalizeLineHeightPercent(lineHeightPercentRaw);

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
      const skipMixedFontSizes =
        message.payload && typeof message.payload.skipMixedFontSizes === "boolean"
          ? message.payload.skipMixedFontSizes
          : true;

      const result = await applyPhase2({
        lineHeightPercent,
        applyMultiline,
        includeComponents,
        includeInstances,
        includeMainComponents,
        skipMixedFontSizes
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
          autoLayoutCount: 0,
          skippedMissingFontCount: 0,
          skippedMultilineCount: 0,
          skippedMixedFontCount: 0,
          skippedComponentCount: 0,
          noSelection: false,
          noTextFound: false,
          errorMessage: "Unexpected error."
        }
      });
    }
  }
};

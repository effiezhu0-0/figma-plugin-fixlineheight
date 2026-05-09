figma.showUI(__html__, {
  width: 360,
  height: 560
});

figma.ui.onmessage = (message: { type?: string }) => {
  if (message.type === "phase1-ready") {
    figma.ui.postMessage({ type: "phase1-ack" });
    return;
  }
};

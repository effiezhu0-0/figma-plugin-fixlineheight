export type UiToPluginMessage = {
  type: "phase1-ready";
};

export type PluginToUiMessage = {
  type: "phase1-ack";
};

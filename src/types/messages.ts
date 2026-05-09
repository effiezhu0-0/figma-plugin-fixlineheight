export type UiToPluginMessage =
  | { type: "phase1-ready" }
  | { type: "apply-phase2"; payload: { applyMultiline: boolean } };

export type ApplyPhase2Result = {
  updatedCount: number;
  noSelection: boolean;
  noTextFound: boolean;
  errorMessage?: string;
};

export type PluginToUiMessage =
  | { type: "phase1-ack" }
  | {
      type: "apply-phase2-result";
      payload: ApplyPhase2Result;
    };

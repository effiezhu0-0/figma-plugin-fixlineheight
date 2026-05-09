import ReactDOM from "react-dom/client";
import App from "./App";
import type { PluginToUiMessage, UiToPluginMessage } from "../types/messages";

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginToUiMessage }>) => {
  const message = event.data.pluginMessage;
  if (!message) {
    return;
  }

  if (message.type === "phase1-ack") {
    // Reserved for future UI readiness checks.
  }
};

const readyMessage: UiToPluginMessage = { type: "phase1-ready" };
parent.postMessage({ pluginMessage: readyMessage }, "*");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);

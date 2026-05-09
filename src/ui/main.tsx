import ReactDOM from "react-dom/client";
import App from "./App";
import type { UiToPluginMessage } from "../types/messages";

const readyMessage: UiToPluginMessage = { type: "phase1-ready" };
parent.postMessage({ pluginMessage: readyMessage }, "*");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);

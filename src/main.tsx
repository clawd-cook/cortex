import { Tooltip } from "@base-ui/react/tooltip";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="root">
      <Tooltip.Provider delay={400}>
        <App />
      </Tooltip.Provider>
    </div>
  </React.StrictMode>,
);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AlertProvider } from "./context/AlertContext.jsx";
import { LoaderProvider } from "./context/LoaderContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AlertProvider>
      <LoaderProvider>
        <AuthProvider>
          {" "}
          {/* Wrap here */}
          <App />
        </AuthProvider>
      </LoaderProvider>
    </AlertProvider>
  </React.StrictMode>
);

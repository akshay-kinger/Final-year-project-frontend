import React, { createContext, useState, useContext } from "react";
import CustomAlert from "../components/CustomAlert";

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    type: "info",
    onConfirm: null, // New: Stores the function to run if confirmed
  });

  // Regular alert: showAlert("Deleted!", "success")
  const showAlert = (message, type = "info") => {
    setAlertState({ isOpen: true, message, type, onConfirm: null });
  };

  // Confirmation: showConfirm("Delete this?", () => deleteFunction())
  const showConfirm = (message, onConfirm) => {
    setAlertState({ isOpen: true, message, type: "warning", onConfirm });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert }}>
      {children}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm} // Pass confirm callback to the UI
      />
    </AlertContext.Provider>
  );
};

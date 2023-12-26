import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import MyProvider from "./Pages/ContextApi/MyProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <MyProvider>
  <BrowserRouter>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </BrowserRouter>

  </MyProvider>
);

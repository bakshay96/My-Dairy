import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";
import { NextUIProvider } from "@nextui-org/react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import MyProvider from "./Pages/ContextApi/MyProvider.jsx";
import { store } from "./Redux/store.js";
import './i18n';

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NextUIProvider>
      <ChakraProvider>
        <Provider store={store}>
          <MyProvider>
            <App />
          </MyProvider>
        </Provider>
      </ChakraProvider>
    </NextUIProvider>
  </BrowserRouter>
);

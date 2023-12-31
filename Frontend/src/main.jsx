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

ReactDOM.createRoot(document.getElementById("root")).render(
  <NextUIProvider>
    <ChakraProvider>
      <Provider store={store}>
        <MyProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MyProvider>
      </Provider>
    </ChakraProvider>
  </NextUIProvider>
);

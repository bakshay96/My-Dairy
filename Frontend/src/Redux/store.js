import { applyMiddleware, combineReducers, legacy_createStore } from "redux";
import {thunk} from "redux-thunk";
import { reducer as authReducer } from "./AuthReducer/reducer";
import {reducer as farmerReducer} from "./UserReducer/reducer";



let rootReducer = combineReducers({authReducer,farmerReducer});

export const store = legacy_createStore(rootReducer, applyMiddleware(thunk));


// `http://localhost:${process.env.REACT_APP_JSON_SERVER_PORT}/milkify`
// http://localhost:8080/books
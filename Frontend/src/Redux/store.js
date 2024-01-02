import { applyMiddleware, combineReducers, legacy_createStore } from "redux";
import {thunk} from "redux-thunk";
import { reducer as authReducer } from "./AuthReducer/reducer";
import {reducer as farmerReducer} from "./UserReducer/reducer";
import { reducer as milkReducer } from "./MilkReducer/reducer";



let rootReducer = combineReducers({authReducer,farmerReducer,milkReducer});

export const store = legacy_createStore(rootReducer, applyMiddleware(thunk));


// `http://localhost:${process.env.REACT_APP_JSON_SERVER_PORT}/milkify`
// http://localhost:8080/app
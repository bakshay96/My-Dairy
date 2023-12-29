import { applyMiddleware, combineReducers, legacy_createStore } from "redux";
import { reducer as productReducer } from "./Farmer/reducer";
import thunk from "redux-thunk";
let  rootReducer=combineReducers({productReducer})
export const store=legacy_createStore(rootReducer, applyMiddleware(thunk));
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
exports.useVariable = (variable) => {
    const stateRef = react_1.useRef(variable);
    stateRef.current = variable;
    return stateRef;
};
exports.useStateVariable = (variable) => {
    const [state, setState] = react_1.useState(variable);
    const stateRef = react_1.useRef(state);
    stateRef.current = state;
    return [state, stateRef, setState];
};

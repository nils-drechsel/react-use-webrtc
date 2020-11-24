"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
exports.useWebRtc = (variable) => {
    const stateRef = react_1.useRef(variable);
    stateRef.current = variable;
    return stateRef;
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const WebRtcContext_1 = __importDefault(require("./WebRtcContext"));
exports.useWebRtcManager = () => {
    return react_1.useContext(WebRtcContext_1.default);
};

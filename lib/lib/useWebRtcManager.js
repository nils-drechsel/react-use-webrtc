"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebRtcManager = void 0;
const react_1 = require("react");
const WebRtcContext_1 = __importDefault(require("./WebRtcContext"));
const webrtc_adapter_1 = __importDefault(require("webrtc-adapter"));
const useWebRtcManager = () => {
    webrtc_adapter_1.default.browserDetails.browser;
    return react_1.useContext(WebRtcContext_1.default);
};
exports.useWebRtcManager = useWebRtcManager;
//# sourceMappingURL=useWebRtcManager.js.map
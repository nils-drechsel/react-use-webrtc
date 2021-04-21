"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRtcProvider = void 0;
const react_1 = __importStar(require("react"));
const WebRtcContext_1 = __importDefault(require("./WebRtcContext"));
const WebRtcManager_1 = require("./WebRtcManager");
const WebRtcProvider = ({ signallingChannel, sid, children, config, logging }) => {
    const managerRef = react_1.useRef();
    if (!managerRef.current) {
        managerRef.current = new WebRtcManager_1.WebRtcManager(signallingChannel, sid, config, logging);
    }
    react_1.useEffect(() => {
        managerRef.current.setSid(sid);
    }, [sid]);
    return (react_1.default.createElement(WebRtcContext_1.default.Provider, { value: managerRef.current }, children));
};
exports.WebRtcProvider = WebRtcProvider;
//# sourceMappingURL=WebRtcProvider.js.map
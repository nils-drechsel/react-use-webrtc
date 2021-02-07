"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const WebRtcContext_1 = __importDefault(require("./WebRtcContext"));
const WebRtcManager_1 = require("./WebRtcManager");
exports.WebRtcProvider = ({ signallingChannel, sid, children, config, logging }) => {
    const managerRef = react_1.useRef();
    if (!managerRef.current) {
        managerRef.current = new WebRtcManager_1.WebRtcManager(signallingChannel, sid, config, logging);
    }
    react_1.useEffect(() => {
        managerRef.current.setSid(sid);
    }, [sid]);
    return (react_1.default.createElement(WebRtcContext_1.default.Provider, { value: managerRef.current }, children));
};
//# sourceMappingURL=WebRtcProvider.js.map
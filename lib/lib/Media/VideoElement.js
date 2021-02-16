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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoElement = void 0;
const react_1 = __importStar(require("react"));
const useWebRtcManager_1 = require("../useWebRtcManager");
exports.VideoElement = ({ deviceId, bundleId, streamId, cssClassName, width, height, fullscreen, muted }) => {
    const ref = react_1.useRef();
    const manager = useWebRtcManager_1.useWebRtcManager();
    react_1.useEffect(() => {
        manager.mediaDevicesManager.registerVideoOutput(deviceId, ref, bundleId, streamId);
        if (ref.current) {
            ref.current.onloadedmetadata = () => {
                if (ref.current)
                    manager.mediaDevicesManager.updateStreamDimensions(bundleId, streamId, ref.current.videoWidth, ref.current.videoHeight);
            };
            ref.current.onloadeddata = () => {
                if (ref.current)
                    manager.mediaDevicesManager.updateStreamDimensions(bundleId, streamId, ref.current.videoWidth, ref.current.videoHeight);
            };
        }
        return () => {
            manager.mediaDevicesManager.deregisterVideoOutput(deviceId);
        };
    }, [ref.current, bundleId, streamId]);
    let pxWidth = width ? width + 'px' : undefined;
    let pxHeight = height ? height + 'px' : undefined;
    if (fullscreen) {
        pxWidth = "100%";
        pxHeight = "100%";
    }
    return react_1.default.createElement("video", { width: pxWidth, height: pxHeight, className: cssClassName, ref: ref, muted: muted, autoPlay: true });
};
//# sourceMappingURL=VideoElement.js.map
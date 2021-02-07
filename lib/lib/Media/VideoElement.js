"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
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
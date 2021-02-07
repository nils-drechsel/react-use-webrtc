"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ControllerManager_1 = require("./Controller/ControllerManager");
const MediaDevicesManager_1 = require("./Media/MediaDevicesManager");
const TransmissionManager_1 = require("./Transmission/TransmissionManager");
class WebRtcManager {
    constructor(signallingChannel, sid, configuration, logging = true) {
        this.signallingChannel = signallingChannel;
        this.mediaDevicesManager = new MediaDevicesManager_1.MediaDevicesManager(logging);
        this.transmissionManager = new TransmissionManager_1.TransmissionManager(this.signallingChannel, this.mediaDevicesManager, sid, configuration, logging);
        this.controllerManager = new ControllerManager_1.ControllerManager(this, logging);
    }
    setSid(sid) {
        this.transmissionManager.setSid(sid);
    }
}
exports.WebRtcManager = WebRtcManager;
//# sourceMappingURL=WebRtcManager.js.map
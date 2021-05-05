"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractController = exports.RtcControllerMessage = exports.ControllerState = void 0;
const uuid_1 = require("uuid");
var ControllerState;
(function (ControllerState) {
    ControllerState["STARTING"] = "STARTING";
    ControllerState["READY"] = "READY";
    ControllerState["FAILED"] = "FAILED";
    ControllerState["STOPPED"] = "STOPPED";
})(ControllerState = exports.ControllerState || (exports.ControllerState = {}));
var RtcControllerMessage;
(function (RtcControllerMessage) {
    RtcControllerMessage["RTC_ADD_INBOUND_CONTROLLER"] = "RTC_ADD_INBOUND_CONTROLLER";
    RtcControllerMessage["RTC_REMOVE_INBOUND_CONTROLLER"] = "RTC_REMOVE_INBOUND_CONTROLLER";
    RtcControllerMessage["RTC_MODIFY_INBOUND_CONTROLLER"] = "RTC_MODIFY_INBOUND_CONTROLLER";
    RtcControllerMessage["RTC_MODIFY_OUTBOUND_CONTROLLER"] = "RTC_MODIFY_OUTBOUND_CONTROLLER";
})(RtcControllerMessage = exports.RtcControllerMessage || (exports.RtcControllerMessage = {}));
class AbstractController {
    constructor(webRtcManager, label, type, controllerId) {
        this.controllerState = ControllerState.STOPPED;
        this.mediaObjectId = null;
        this.webRtcManager = webRtcManager;
        this.label = label;
        this.controllerId = controllerId !== null && controllerId !== void 0 ? controllerId : uuid_1.v4();
        this.type = type;
    }
    getMediaObject() {
        return this.mediaObjectId
            ? this.webRtcManager.mediaDevicesManager.getMediaObject(this.mediaObjectId)
            : undefined;
    }
    getMediaObjectId() {
        return this.mediaObjectId;
    }
    setMediaObjectId(mediaObjectId) {
        this.mediaObjectId = mediaObjectId;
    }
    getType() {
        return this.type;
    }
    start() {
        if (this.getState() === ControllerState.STARTING)
            return;
        this.setState(ControllerState.STARTING);
        this.notify();
    }
    ready() {
        if (this.getState() === ControllerState.READY)
            return;
        this.setState(ControllerState.READY);
        this.notify();
    }
    stop() {
        if (this.getState() === ControllerState.STOPPED)
            return;
        this.setState(ControllerState.STOPPED);
        this.notify();
    }
    fail() {
        if (this.getState() === ControllerState.FAILED)
            return;
        this.setState(ControllerState.FAILED);
        this.notify();
    }
    setState(state) {
        this.controllerState = state;
    }
    getState() {
        return this.controllerState;
    }
    getLabel() {
        return this.label;
    }
    getControllerId() {
        return this.controllerId;
    }
}
exports.AbstractController = AbstractController;
//# sourceMappingURL=Controller.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
var ControllerState;
(function (ControllerState) {
    ControllerState["STARTING"] = "STARTING";
    ControllerState["READY"] = "READY";
    ControllerState["FAILED"] = "FAILED";
    ControllerState["CLOSED"] = "CLOSED";
})(ControllerState = exports.ControllerState || (exports.ControllerState = {}));
var RtcControllerMessage;
(function (RtcControllerMessage) {
    RtcControllerMessage["RTC_ADD_INBOUND_CONTROLLER"] = "RTC_ADD_INBOUND_CONTROLLER";
    RtcControllerMessage["RTC_REMOVE_INBOUND_CONTROLLER"] = "RTC_REMOVE_INBOUND_CONTROLLER";
    RtcControllerMessage["RTC_MODIFY_INBOUND_CONTROLLER"] = "RTC_MODIFY_INBOUND_CONTROLLER";
})(RtcControllerMessage = exports.RtcControllerMessage || (exports.RtcControllerMessage = {}));
class AbstractController {
    constructor(webRtcManager, label, controllerId) {
        this.controllerState = ControllerState.STARTING;
        this.mediaObject = null;
        this.webRtcManager = webRtcManager;
        this.label = label;
        this.controllerId = controllerId || uuid_1.v4();
    }
    fail() {
        this.setState(ControllerState.FAILED);
        this.notifyModification();
    }
    restart() {
        this.setState(ControllerState.STARTING);
        this.notifyModification();
    }
    setState(state) {
        this.controllerState = state;
    }
    getState() {
        return this.controllerState;
    }
    notifyModification() {
        this.webRtcManager.controllerManager.getInboundControllers().modify(this.controllerId);
    }
    getMediaObject() {
        return this.mediaObject;
    }
    getLabel() {
        return this.label;
    }
    getControllerId() {
        return this.controllerId;
    }
}
exports.AbstractController = AbstractController;
class AbstractRemoteController extends AbstractController {
    constructor(webRtcManager, remoteSid, label, controllerId) {
        super(webRtcManager, label, controllerId);
        this.transmissionId = null;
        this.remoteSid = remoteSid;
    }
    getState() {
        return this.controllerState;
    }
    setTransmissionId(transmissionId) {
        this.transmissionId = transmissionId;
    }
    getTransmission() {
        if (this.controllerState !== ControllerState.READY || !this.transmissionId)
            return undefined;
        return this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
    }
    getRemoteSid() {
        return this.remoteSid;
    }
}
exports.AbstractRemoteController = AbstractRemoteController;
//# sourceMappingURL=Controller.js.map
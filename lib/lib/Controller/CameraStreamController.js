"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebRtcManager_1 = require("../Rtc/WebRtcManager");
const Controller_1 = require("./Controller");
const react_use_listeners_1 = require("react-use-listeners");
class InboundController extends Controller_1.AbstractController {
    constructor(controllerId, controllerManager, webRtcManager, mediaDevicesManager, label, remoteSid, transmissionId) {
        super(controllerManager, webRtcManager, mediaDevicesManager, controllerId);
        this.remoteSid = remoteSid;
        this.label = label;
        this.transmissionId = transmissionId;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.webRtcManager.listenForInboundTransmission(this.transmissionId, (event) => {
                switch (event) {
                    case react_use_listeners_1.ListenerEvent.ADDED:
                    case react_use_listeners_1.ListenerEvent.MODIFIED:
                        const transmission = this.webRtcManager.getTransmission(this.remoteSid, this.transmissionId);
                        switch (transmission.state) {
                            case WebRtcManager_1.TransmissionState.CONNECTED:
                                this.controllerState = Controller_1.ControllerState.READY;
                                break;
                            case WebRtcManager_1.TransmissionState.CONNECTING:
                                this.controllerState = Controller_1.ControllerState.STARTING;
                                break;
                            case WebRtcManager_1.TransmissionState.FAILED:
                                this.controllerState = Controller_1.ControllerState.FAILED;
                                break;
                        }
                        break;
                    case react_use_listeners_1.ListenerEvent.REMOVED:
                        this.controllerState = Controller_1.ControllerState.CLOSED;
                        break;
                }
            });
        });
    }
    stop() {
        this.controllerState = Controller_1.ControllerState.CLOSED;
    }
}
exports.InboundController = InboundController;
class OutboundCameraStreamController extends Controller_1.AbstractController {
    constructor(controllerManager, webRtcManager, mediaDevicesManager, label, remoteSid, cameraDeviceId, audioDeviceId) {
        super(controllerManager, webRtcManager, mediaDevicesManager);
        this.transmissionId = null;
        this.cameraDeviceId = cameraDeviceId;
        this.audioDeviceId = audioDeviceId;
        this.remoteSid = remoteSid;
        this.label = label;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mediaStreamObject = yield this.mediaDevicesManager.getCameraStream(this.cameraDeviceId, this.audioDeviceId);
                this.transmissionId = this.webRtcManager.addStreamTransmission(this.remoteSid, mediaStreamObject.stream, this.label);
                this.controllerManager.sendAddInboundController(this.remoteSid, { controllerId: this.controllerId, label: this.label, transmissionId: this.transmissionId });
            }
            catch (e) {
                this.controllerState = Controller_1.ControllerState.FAILED;
            }
        });
    }
    stop() {
        this.controllerManager.sendRemoveInboundController(this.remoteSid, { controllerId: this.controllerId });
        this.controllerState = Controller_1.ControllerState.CLOSED;
    }
}
exports.OutboundCameraStreamController = OutboundCameraStreamController;
//# sourceMappingURL=CameraStreamController.js.map
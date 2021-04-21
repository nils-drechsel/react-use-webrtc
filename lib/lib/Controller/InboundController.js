"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransmissionInboundController = exports.AbstractInboundController = void 0;
const TransmissionManager_1 = require("../Transmission/TransmissionManager");
const Controller_1 = require("./Controller");
const react_use_listeners_1 = require("react-use-listeners");
class AbstractInboundController extends Controller_1.AbstractRemoteController {
    constructor(webRtcManager, remoteSid, label, controllerId) {
        super(webRtcManager, remoteSid, label, controllerId);
    }
    notify() {
        this.webRtcManager.controllerManager.inboundControllers.modify(this.getControllerId());
    }
}
exports.AbstractInboundController = AbstractInboundController;
class TransmissionInboundController extends AbstractInboundController {
    constructor(webRtcManager, remoteSid, label, controllerId) {
        super(webRtcManager, remoteSid, label, controllerId);
        this.unsubscribeListener = null;
    }
    load(transmissionId) {
        if (this.unsubscribeListener)
            this.unsubscribeListener();
        this.setTransmissionId(transmissionId);
        if (this.transmissionId) {
            this.unsubscribeListener = this.webRtcManager.transmissionManager.listenForInboundTransmission(this.transmissionId, (event) => {
                switch (event) {
                    case react_use_listeners_1.ListenerEvent.ADDED:
                    case react_use_listeners_1.ListenerEvent.MODIFIED:
                        const transmission = this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
                        switch (transmission.state) {
                            case TransmissionManager_1.TransmissionState.CONNECTED:
                                this.controllerState = Controller_1.ControllerState.READY;
                                break;
                            case TransmissionManager_1.TransmissionState.CONNECTING:
                                this.controllerState = Controller_1.ControllerState.STARTING;
                                break;
                            case TransmissionManager_1.TransmissionState.FAILED:
                                this.controllerState = Controller_1.ControllerState.FAILED;
                                this.removeStream();
                                break;
                        }
                        break;
                    case react_use_listeners_1.ListenerEvent.REMOVED:
                        this.controllerState = Controller_1.ControllerState.CLOSED;
                        this.removeStream();
                        break;
                }
                this.notify();
            });
        }
        this.notify();
    }
    removeStream() {
        if (this.transmissionId)
            this.webRtcManager.mediaDevicesManager.removeMediaObject(this.transmissionId);
    }
    stop() {
        this.controllerState = Controller_1.ControllerState.CLOSED;
        this.removeStream();
    }
}
exports.TransmissionInboundController = TransmissionInboundController;
//# sourceMappingURL=InboundController.js.map
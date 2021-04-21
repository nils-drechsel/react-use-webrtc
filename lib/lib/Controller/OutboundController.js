"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboundStreamController = exports.AbstractOutboundController = void 0;
const react_use_listeners_1 = require("react-use-listeners");
const Controller_1 = require("./Controller");
class AbstractOutboundController extends Controller_1.AbstractRemoteController {
    constructor(webRtcManager, remoteSid, label, localController) {
        super(webRtcManager, remoteSid, label, null);
        this.transmissionId = null;
        this.remoteSid = remoteSid;
        this.localController = localController;
        webRtcManager.controllerManager.outboundControllers.addSubIdListener(remoteSid, localController.getControllerId(), (event) => {
            switch (event) {
                case react_use_listeners_1.ListenerEvent.ADDED:
                case react_use_listeners_1.ListenerEvent.MODIFIED:
                    switch (localController.getState()) {
                        case Controller_1.ControllerState.STARTING:
                            if (this.getState() !== Controller_1.ControllerState.STARTING)
                                this.start();
                            break;
                        case Controller_1.ControllerState.READY:
                            if (this.getState() !== Controller_1.ControllerState.READY)
                                this.load();
                            break;
                        case Controller_1.ControllerState.FAILED:
                            if (this.getState() !== Controller_1.ControllerState.FAILED)
                                this.fail();
                            break;
                        case Controller_1.ControllerState.STOPPED:
                            if (this.getState() !== Controller_1.ControllerState.STOPPED)
                                this.fail();
                            break;
                        case Controller_1.ControllerState.CLOSED:
                            if (this.getState() !== Controller_1.ControllerState.FAILED)
                                this.close();
                            break;
                        default: throw new Error("unknown state");
                    }
                    break;
                case react_use_listeners_1.ListenerEvent.REMOVED:
                    this.stop();
                    break;
                default: throw new Error("unknown event " + event);
            }
        });
    }
    notify() {
        this.webRtcManager.controllerManager.outboundControllers.modify(this.getControllerId());
    }
}
exports.AbstractOutboundController = AbstractOutboundController;
class OutboundStreamController extends AbstractOutboundController {
    load() {
        const mediaObject = this.localController.getMediaObject();
        if (mediaObject.stream)
            this.transmissionId = this.webRtcManager.transmissionManager.addStreamTransmission(this.remoteSid, mediaObject.stream, this.label);
        this.setState(Controller_1.ControllerState.READY);
        this.webRtcManager.controllerManager.sendAddInboundController(this.remoteSid, { controllerId: this.controllerId, label: this.label, transmissionId: this.transmissionId, state: this.getState() });
    }
    start() {
        super.start();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    fail() {
        super.fail();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    restart() {
        super.restart();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    close() {
        this.setState(Controller_1.ControllerState.CLOSED);
        this.transmissionId = null;
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    stop() {
        this.webRtcManager.controllerManager.sendRemoveInboundController(this.remoteSid, { controllerId: this.controllerId });
        this.controllerState = Controller_1.ControllerState.CLOSED;
    }
    getTransmission() {
        if (this.controllerState !== Controller_1.ControllerState.READY || !this.transmissionId)
            return undefined;
        return this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
    }
}
exports.OutboundStreamController = OutboundStreamController;
//# sourceMappingURL=OutboundController.js.map
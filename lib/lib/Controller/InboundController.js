"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractTransmissionInboundController = exports.AbstractInboundController = void 0;
const Controller_1 = require("./Controller");
const react_use_listeners_1 = require("react-use-listeners");
const RemoteController_1 = require("./RemoteController");
class AbstractInboundController extends RemoteController_1.AbstractRemoteController {
    constructor(webRtcManager, remoteSid, label, type, controllerId) {
        super(webRtcManager, remoteSid, label, type, controllerId);
    }
    notify() {
        this.webRtcManager.controllerManager.inboundControllers.modifySub(this.remoteSid, this.getControllerId());
    }
    destroy() {
        this.stop();
    }
    start() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: Controller_1.ControllerState.STARTING,
        });
        super.start();
    }
    ready() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: Controller_1.ControllerState.READY,
        });
        super.ready();
    }
    fail() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: Controller_1.ControllerState.FAILED,
        });
        super.fail();
    }
    stop() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: Controller_1.ControllerState.STOPPED,
        });
        super.stop();
    }
    setRemoteState(state) {
        super.setRemoteState(state);
        switch (state) {
            case Controller_1.ControllerState.STARTING:
                this.start();
                break;
            case Controller_1.ControllerState.READY:
                break;
            case Controller_1.ControllerState.FAILED:
                this.fail();
                break;
            case Controller_1.ControllerState.STOPPED:
                this.stop();
                break;
        }
    }
}
exports.AbstractInboundController = AbstractInboundController;
class AbstractTransmissionInboundController extends AbstractInboundController {
    constructor(webRtcManager, remoteSid, label, type, controllerId) {
        super(webRtcManager, remoteSid, label, type, controllerId);
        this.unsubscribeMediaObject = null;
    }
    load(mediaObjectId) {
        if (mediaObjectId === this.mediaObjectId && this.getState() === Controller_1.ControllerState.READY)
            return;
        this.setMediaObjectId(mediaObjectId);
        console.log("inbound controller loaded with transmission", this.mediaObjectId);
        if (this.unsubscribeMediaObject)
            this.unsubscribeMediaObject();
        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(mediaObjectId, (_id, event) => {
            switch (event) {
                case react_use_listeners_1.ListenerEvent.ADDED:
                case react_use_listeners_1.ListenerEvent.MODIFIED:
                    if (this.getState() !== Controller_1.ControllerState.READY && this.getMediaObject())
                        this.ready();
                    else
                        this.notify();
                    break;
                case react_use_listeners_1.ListenerEvent.REMOVED:
                    this.stop();
            }
        });
    }
    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        super.stop();
    }
}
exports.AbstractTransmissionInboundController = AbstractTransmissionInboundController;
//# sourceMappingURL=InboundController.js.map
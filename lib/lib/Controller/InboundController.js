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
        this.webRtcManager.controllerManager.inboundControllers.modify(this.getControllerId());
    }
    destroy() {
        this.stop();
        this.webRtcManager.controllerManager.inboundControllers.delete(this.getControllerId());
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
                    break;
                case react_use_listeners_1.ListenerEvent.REMOVED:
                    this.stop();
            }
        });
    }
    removeStream() {
        if (this.mediaObjectId)
            this.webRtcManager.mediaDevicesManager.removeMediaObject(this.mediaObjectId);
    }
    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        this.removeStream();
        super.stop();
    }
}
exports.AbstractTransmissionInboundController = AbstractTransmissionInboundController;
//# sourceMappingURL=InboundController.js.map
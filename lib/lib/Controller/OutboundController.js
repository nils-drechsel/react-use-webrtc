"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractOutboundStreamController = exports.AbstractOutboundController = void 0;
const react_use_listeners_1 = require("react-use-listeners");
const Controller_1 = require("./Controller");
const RemoteController_1 = require("./RemoteController");
class AbstractOutboundController extends RemoteController_1.AbstractRemoteController {
    constructor(webRtcManager, remoteSid, label, type, localControllerId) {
        super(webRtcManager, remoteSid, label, type, localControllerId);
        this.unsubscribeMediaObject = null;
        this.remoteSid = remoteSid;
        this.localControllerId = localControllerId;
        this.unsubscribeLocalController = this.webRtcManager.controllerManager.localControllers.addIdListener(this.localControllerId, (_id, event) => {
            switch (event) {
                case react_use_listeners_1.ListenerEvent.ADDED:
                case react_use_listeners_1.ListenerEvent.MODIFIED:
                    const localController = this.webRtcManager.controllerManager.localControllers.get(this.localControllerId);
                    if (!localController) {
                        this.destroy();
                        return;
                    }
                    switch (localController.getState()) {
                        case Controller_1.ControllerState.STARTING:
                            if (this.getState() !== Controller_1.ControllerState.STARTING)
                                this.start();
                            break;
                        case Controller_1.ControllerState.READY:
                            if (this.getState() !== Controller_1.ControllerState.READY && this.getMediaObject())
                                this.load(localController.getMediaObjectId());
                            break;
                        case Controller_1.ControllerState.FAILED:
                            if (this.getState() !== Controller_1.ControllerState.FAILED)
                                this.fail();
                            break;
                        case Controller_1.ControllerState.STOPPED:
                            if (this.getState() !== Controller_1.ControllerState.STOPPED)
                                this.stop();
                            break;
                        default:
                            throw new Error("unknown state");
                    }
                    break;
                case react_use_listeners_1.ListenerEvent.REMOVED:
                    this.destroy();
                    break;
                default:
                    throw new Error("unknown event " + event);
            }
        });
    }
    load(mediaObjectId) {
        if (mediaObjectId === this.mediaObjectId && this.getState() === Controller_1.ControllerState.READY)
            return;
        this.setMediaObjectId(mediaObjectId);
        if (this.unsubscribeMediaObject)
            this.unsubscribeMediaObject();
        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(mediaObjectId, (_id, event) => {
            const localController = this.webRtcManager.controllerManager.localControllers.get(this.localControllerId);
            if (!localController) {
                this.destroy();
                return;
            }
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
    start() {
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: null,
            state: Controller_1.ControllerState.STARTING,
        });
        super.start();
    }
    ready() {
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: this.mediaObjectId,
            state: Controller_1.ControllerState.READY,
        });
        super.ready();
    }
    fail() {
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: null,
            state: Controller_1.ControllerState.FAILED,
        });
        super.fail();
    }
    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: null,
            state: Controller_1.ControllerState.STOPPED,
        });
        super.stop();
    }
    notify() {
        this.webRtcManager.controllerManager.outboundControllers.modifySub(this.remoteSid, this.getControllerId());
    }
    destroy() {
        this.unsubscribeLocalController();
        this.stop();
        this.webRtcManager.controllerManager.removeOutboundController(this.remoteSid, this.controllerId);
    }
}
exports.AbstractOutboundController = AbstractOutboundController;
class AbstractOutboundStreamController extends AbstractOutboundController {
    ready() {
        const localController = this.webRtcManager.controllerManager.localControllers.get(this.localControllerId);
        if (!localController)
            throw new Error("local controller cannot be found: " + this.remoteSid + " " + this.getControllerId());
        const mediaObject = localController.getMediaObject();
        if (!mediaObject || !mediaObject.stream || !this.mediaObjectId) {
            this.fail();
            return;
        }
        this.webRtcManager.transmissionManager.addOutboundStreamTransmission(this.remoteSid, mediaObject.stream);
        super.ready();
    }
}
exports.AbstractOutboundStreamController = AbstractOutboundStreamController;
//# sourceMappingURL=OutboundController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractLocalStreamController = exports.AbstractLocalController = void 0;
const react_use_listeners_1 = require("react-use-listeners");
const Controller_1 = require("./Controller");
class AbstractLocalController extends Controller_1.AbstractController {
    constructor(webRtcManager, label, type, controllerId) {
        super(webRtcManager, label, type, controllerId);
        this.unsubscribeMediaObject = null;
    }
    destroy() {
        this.stop();
    }
    notify() {
        console.log("notifying local controller", this.getControllerId());
        this.webRtcManager.controllerManager.localControllers.modify(this.getControllerId());
    }
    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        if (this.mediaObjectId)
            this.webRtcManager.mediaDevicesManager.removeMediaObject(this.mediaObjectId);
        this.mediaObjectId = null;
        super.stop();
    }
    load(mediaObjectId) {
        console.log("loading mediaObject", this.getControllerId(), "objId:", mediaObjectId);
        if (this.unsubscribeMediaObject)
            this.unsubscribeMediaObject();
        this.setMediaObjectId(mediaObjectId);
        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(mediaObjectId, (_id, event) => {
            console.log("media object changed: ", mediaObjectId, event, this.getState());
            switch (event) {
                case react_use_listeners_1.ListenerEvent.ADDED:
                    if (this.getState() !== Controller_1.ControllerState.READY)
                        this.ready();
                    break;
                case react_use_listeners_1.ListenerEvent.REMOVED:
                    if (this.getState() !== Controller_1.ControllerState.STOPPED)
                        this.stop();
                    break;
                case react_use_listeners_1.ListenerEvent.ADDED:
                    this.notify();
                    break;
            }
        });
    }
}
exports.AbstractLocalController = AbstractLocalController;
class AbstractLocalStreamController extends AbstractLocalController {
    constructor(webRtcManager, label, type, controllerId) {
        super(webRtcManager, label, type, controllerId);
    }
    stop() {
        console.log("stopping local stream controller", this.getControllerId(), this.mediaObjectId);
        if (this.mediaObjectId)
            this.webRtcManager.mediaDevicesManager.stopStream(this.mediaObjectId);
        super.stop();
    }
}
exports.AbstractLocalStreamController = AbstractLocalStreamController;
//# sourceMappingURL=LocalController.js.map
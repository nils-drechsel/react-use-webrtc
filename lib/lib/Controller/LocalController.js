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
        this.webRtcManager.controllerManager.localControllers.delete(this.getControllerId());
    }
    notify() {
        console.log("notifying local controller", this.getControllerId());
        this.webRtcManager.controllerManager.localControllers.modify(this.getControllerId());
    }
    stop() {
        this.webRtcManager.mediaDevicesManager.removeMediaObject(this.controllerId);
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        super.stop();
    }
    load(mediaObjectId) {
        if (this.unsubscribeMediaObject)
            this.unsubscribeMediaObject();
        this.setMediaObjectId(mediaObjectId);
        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(this.getControllerId(), (_id, event) => {
            switch (event) {
                case react_use_listeners_1.ListenerEvent.ADDED:
                    if (this.getState() !== Controller_1.ControllerState.READY)
                        this.ready();
                    break;
                case react_use_listeners_1.ListenerEvent.REMOVED:
                    if (this.getState() !== Controller_1.ControllerState.STOPPED)
                        this.stop();
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
        console.log("stopping local controller", this.getControllerId());
        const obj = this.getMediaObject();
        if (obj)
            this.webRtcManager.mediaDevicesManager.stopStream(obj.objId);
        super.stop();
    }
}
exports.AbstractLocalStreamController = AbstractLocalStreamController;
//# sourceMappingURL=LocalController.js.map
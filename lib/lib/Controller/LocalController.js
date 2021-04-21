"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractLocalCameraStreamController = exports.AbstractLocalStreamController = exports.AbstractLocalController = void 0;
const Controller_1 = require("./Controller");
class AbstractLocalController extends Controller_1.AbstractController {
    constructor(webRtcManager, label, resourceId) {
        super(webRtcManager, label, resourceId);
    }
    notify() {
        console.log("notifying local controller", this.getControllerId());
        this.webRtcManager.controllerManager.localControllers.modify(this.getControllerId());
    }
}
exports.AbstractLocalController = AbstractLocalController;
class AbstractLocalStreamController extends AbstractLocalController {
    constructor(webRtcManager, label, resourceId) {
        super(webRtcManager, label, resourceId);
    }
    stop() {
        var _a;
        super.stop();
        const obj = this.mediaObject;
        if (!obj)
            return;
        (_a = obj.stream) === null || _a === void 0 ? void 0 : _a.getTracks().forEach(track => track.stop());
        this.webRtcManager.mediaDevicesManager.stopStream(obj.objId);
    }
}
exports.AbstractLocalStreamController = AbstractLocalStreamController;
class AbstractLocalCameraStreamController extends AbstractLocalStreamController {
    constructor(webRtcManager, label, resourceId) {
        super(webRtcManager, label, resourceId);
    }
    createOrGetOutboundController(remoteSid) {
        return this.webRtcManager.controllerManager.createOrGetOutboundStreamController(remoteSid, this.getLabel(), this);
    }
    load(mediaObject) {
        this.mediaObject = mediaObject;
        this.controllerState = Controller_1.ControllerState.READY;
        this.notify();
    }
    stop() {
        super.stop();
        this.webRtcManager.mediaDevicesManager.removeMediaObject(this.controllerId);
    }
}
exports.AbstractLocalCameraStreamController = AbstractLocalCameraStreamController;
//# sourceMappingURL=LocalController.js.map
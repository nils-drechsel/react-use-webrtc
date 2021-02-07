"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MediaDevicesManager_1 = require("../Media/MediaDevicesManager");
const Controller_1 = require("./Controller");
class AbstractLocalStreamController extends Controller_1.AbstractController {
    constructor(webRtcManager, label, controllerId) {
        super(webRtcManager, label, controllerId);
        this.outboundControllers = new Map();
    }
    registerOutboundController(controller) {
        this.outboundControllers.set(controller.getControllerId(), controller);
        switch (this.getState()) {
            case Controller_1.ControllerState.READY:
                const mediaObject = this.getMediaObject();
                if (!mediaObject)
                    break;
                controller.load(mediaObject);
                break;
            case Controller_1.ControllerState.FAILED:
                controller.fail();
                break;
        }
    }
    deregisterOutboundController(controllerId) {
        this.outboundControllers.delete(controllerId);
    }
    getResourceId() {
        return this.controllerId;
    }
    fail() {
        super.fail();
        this.outboundControllers.forEach((controller) => {
            controller.fail();
        });
    }
    restart() {
        super.restart();
        this.outboundControllers.forEach((controller) => {
            controller.restart();
        });
    }
    stop() {
        var _a;
        // FIXME questionable
        const controllers = Array.from(this.outboundControllers.values());
        controllers.forEach((controller) => {
            this.webRtcManager.controllerManager.removeOutboundController(controller.getControllerId());
        });
        this.controllerState = Controller_1.ControllerState.CLOSED;
        const obj = this.mediaObject;
        (_a = obj === null || obj === void 0 ? void 0 : obj.stream) === null || _a === void 0 ? void 0 : _a.getTracks().forEach(track => track.stop());
        this.notifyModification();
    }
}
exports.AbstractLocalStreamController = AbstractLocalStreamController;
class LocalCameraStreamController extends AbstractLocalStreamController {
    constructor(webRtcManager, label, controllerId) {
        super(webRtcManager, label, controllerId);
    }
    load(mediaObject) {
        this.mediaObject = mediaObject;
        this.controllerState = Controller_1.ControllerState.READY;
        this.loadOutboundControllers(mediaObject);
        this.notifyModification();
    }
    loadOutboundControllers(mediaObject) {
        this.outboundControllers.forEach(controller => {
            controller.load(mediaObject);
        });
    }
    stop() {
        super.stop();
        this.webRtcManager.mediaDevicesManager.removeMediaObject(MediaDevicesManager_1.MediaIdent.LOCAL, this.controllerId);
    }
}
exports.LocalCameraStreamController = LocalCameraStreamController;
//# sourceMappingURL=LocalController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_use_listeners_1 = require("react-use-listeners");
const MediaDevicesManager_1 = require("../Media/MediaDevicesManager");
const Controller_1 = require("./Controller");
class AbstractLocalStreamController extends Controller_1.AbstractController {
    constructor(webRtcManager, label, controllerId) {
        super(webRtcManager, label, controllerId);
        this.outboundControllers = new Map();
    }
    registerOutboundController(controller) {
        this.outboundControllers.set(controller.getControllerId(), controller);
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
        this.webRtcManager.mediaDevicesManager.listenForObject(MediaDevicesManager_1.MediaIdent.LOCAL, this.controllerId, (event) => {
            switch (event) {
                case react_use_listeners_1.ListenerEvent.ADDED:
                case react_use_listeners_1.ListenerEvent.MODIFIED:
                    const mediaObject = this.webRtcManager.mediaDevicesManager.getMediaObject(MediaDevicesManager_1.MediaIdent.LOCAL, this.controllerId);
                    if (!mediaObject || mediaObject.type !== MediaDevicesManager_1.MediaType.STREAM) {
                        this.setState(Controller_1.ControllerState.FAILED);
                        this.notifyModification();
                    }
                    const mediaStreamObject = mediaObject;
                    this.load(mediaStreamObject);
                    this.loadOutboundControllers(mediaStreamObject);
            }
        });
    }
    load(mediaObject) {
        this.mediaObject = mediaObject;
        this.controllerState = Controller_1.ControllerState.READY;
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
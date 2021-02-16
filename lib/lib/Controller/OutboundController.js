"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboundStreamController = exports.AbstractOutboundController = void 0;
const Controller_1 = require("./Controller");
class AbstractOutboundController extends Controller_1.AbstractRemoteController {
    constructor(webRtcManager, remoteSid, label, localController) {
        super(webRtcManager, remoteSid, label, null);
        this.transmissionId = null;
        this.remoteSid = remoteSid;
        this.localController = localController;
        this.localController.registerOutboundController(this);
    }
    notifyModification() {
        this.webRtcManager.controllerManager.outboundControllers.modify(this.getControllerId());
    }
}
exports.AbstractOutboundController = AbstractOutboundController;
class OutboundStreamController extends AbstractOutboundController {
    load(mediaObject) {
        if (mediaObject.stream)
            this.transmissionId = this.webRtcManager.transmissionManager.addStreamTransmission(this.remoteSid, mediaObject.stream, this.label);
        this.setState(Controller_1.ControllerState.READY);
        this.webRtcManager.controllerManager.sendAddInboundController(this.remoteSid, { controllerId: this.controllerId, label: this.label, transmissionId: this.transmissionId, state: this.getState() });
    }
    fail() {
        super.fail();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    restart() {
        super.restart();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    unload() {
        this.setState(Controller_1.ControllerState.CLOSED);
        this.transmissionId = null;
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    stop() {
        this.webRtcManager.controllerManager.sendRemoveInboundController(this.remoteSid, { controllerId: this.controllerId });
        this.controllerState = Controller_1.ControllerState.CLOSED;
        if (this.localController)
            this.localController.deregisterOutboundController(this.controllerId);
    }
    getTransmission() {
        if (this.controllerState !== Controller_1.ControllerState.READY || !this.transmissionId)
            return undefined;
        return this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
    }
}
exports.OutboundStreamController = OutboundStreamController;
//# sourceMappingURL=OutboundController.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerManager = void 0;
const react_use_listeners_1 = require("react-use-listeners");
const InboundController_1 = require("./InboundController");
const Controller_1 = require("./Controller");
const OutboundController_1 = require("./OutboundController");
class ControllerManager {
    constructor(webRtcManager, logging = true) {
        this.outboundControllers = new react_use_listeners_1.ObservedPlainMapMapImpl();
        this.localControllers = new react_use_listeners_1.ObservedMapImpl();
        this.inboundControllers = new react_use_listeners_1.ObservedMapImpl();
        this.logging = logging;
        this.webRtcManager = webRtcManager;
        this.webRtcManager.signallingChannel.addListener(Controller_1.RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerAdded(fromSid, payload));
        this.webRtcManager.signallingChannel.addListener(Controller_1.RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerRemoved(fromSid, payload));
        this.webRtcManager.signallingChannel.addListener(Controller_1.RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerModified(fromSid, payload));
    }
    getInboundController(controllerId) {
        return this.inboundControllers.get(controllerId);
    }
    getLocalController(controllerId) {
        return this.localControllers.get(controllerId);
    }
    inboundControllerAdded(fromSid, payload) {
        if (this.logging)
            console.log("inbound controller was added. sid:", fromSid);
        if (this.inboundControllers.has(payload.controllerId))
            return;
        const controller = new InboundController_1.TransmissionInboundController(this.webRtcManager, fromSid, payload.label, payload.controllerId);
        this.inboundControllers.set(controller.controllerId, controller);
        controller.load(payload.transmissionId);
    }
    inboundControllerRemoved(fromSid, payload) {
        if (this.logging)
            console.log("inbound controller was removed. sid: ", fromSid);
        if (!this.inboundControllers.has(payload.controllerId))
            return;
        const controller = this.inboundControllers.get(payload.controllerId);
        if (controller.getRemoteSid() !== fromSid)
            return; // would be weird if we'd ever see this
        controller.stop();
    }
    inboundControllerModified(fromSid, payload) {
        if (this.logging)
            console.log("inbound controller was modified. sid: ", fromSid);
        if (!this.inboundControllers.has(payload.controllerId))
            return;
        const controller = this.inboundControllers.get(payload.controllerId);
        if (controller.getRemoteSid() !== fromSid)
            return; // would be weird if we'd ever see this
        controller.load(payload.transmissionId);
    }
    addLocalController(localController) {
        if (this.logging)
            console.log("local camera stream controller was added. resourceId: ", localController.getControllerId());
        this.localControllers.set(localController.getControllerId(), localController);
    }
    createOrGetOutboundStreamController(remoteSid, label, localController) {
        const outboundController = this.outboundControllers.getSub(remoteSid, localController.getControllerId());
        if (outboundController) {
            if (!(outboundController instanceof OutboundController_1.OutboundStreamController))
                throw new Error("outbound controller is not an outbound stream controller");
            return outboundController;
        }
        if (this.logging)
            console.log("outbound controller was added. sid: ", remoteSid);
        const controller = new OutboundController_1.OutboundStreamController(this.webRtcManager, remoteSid, label, localController);
        this.outboundControllers.set(localController.getControllerId(), controller);
        return controller;
    }
    removeOutboundController(remoteSid, resourceId) {
        if (this.logging)
            console.log("outbound controller was removed. remoteSid:", remoteSid, "resourceId: ", resourceId);
        if (!this.outboundControllers.hasSub(remoteSid, resourceId))
            return;
        const controller = this.outboundControllers.getSub(remoteSid, resourceId);
        controller.stop();
        this.outboundControllers.deleteSub(remoteSid, resourceId);
    }
    removeLocalController(controllerId) {
        if (this.logging)
            console.log("local controller was removed. controllerId: ", controllerId);
        if (!this.localControllers.has(controllerId))
            return;
        const controller = this.localControllers.get(controllerId);
        controller.stop();
        this.localControllers.delete(controllerId);
    }
    sendAddInboundController(remoteSid, payload) {
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, payload, remoteSid);
    }
    sendModifyInboundController(remoteSid, payload) {
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, payload, remoteSid);
    }
    sendRemoveInboundController(remoteSid, payload) {
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, payload, remoteSid);
    }
    getOutboundControllers() {
        return this.outboundControllers;
    }
    getLocalControllers() {
        return this.localControllers;
    }
    getInboundControllers() {
        return this.inboundControllers;
    }
}
exports.ControllerManager = ControllerManager;
//# sourceMappingURL=ControllerManager.js.map
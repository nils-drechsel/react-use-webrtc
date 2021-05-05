"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerManager = void 0;
const react_use_listeners_1 = require("react-use-listeners");
const Controller_1 = require("./Controller");
class ControllerManager {
    constructor(webRtcManager, inboundControllerBuilder, logging = true) {
        this.outboundControllers = new react_use_listeners_1.ObservedMapMapImpl();
        this.localControllers = new react_use_listeners_1.ObservedMapImpl();
        this.inboundControllers = new react_use_listeners_1.ObservedMapImpl();
        this.logging = logging;
        this.webRtcManager = webRtcManager;
        this.inboundControllerBuilder = inboundControllerBuilder;
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
            console.log("inbound controller was added. sid:", fromSid, payload);
        if (this.inboundControllers.has(payload.controllerId))
            return;
        const controller = this.inboundControllerBuilder(this.webRtcManager, fromSid, payload.label, payload.controllerId, payload.type);
        this.inboundControllers.set(controller.getControllerId(), controller);
    }
    inboundControllerRemoved(fromSid, payload) {
        if (this.logging)
            console.log("inbound controller was removed. sid: ", fromSid, payload);
        if (!this.inboundControllers.has(payload.controllerId))
            return;
        const controller = this.inboundControllers.get(payload.controllerId);
        if (controller.getRemoteSid() !== fromSid)
            return; // would be weird if we'd ever see this
        controller.destroy();
    }
    inboundControllerModified(fromSid, payload) {
        if (this.logging)
            console.log("inbound controller was modified. sid: ", fromSid, payload);
        if (!this.inboundControllers.has(payload.controllerId))
            return;
        const controller = this.inboundControllers.get(payload.controllerId);
        controller.setRemoteState(payload.state);
        if (payload.mediaObjectId)
            controller.load(payload.mediaObjectId);
    }
    outboundControllerModified(fromSid, payload) {
        if (this.logging)
            console.log("outbound controller was modified. sid: ", fromSid, payload);
        if (!this.outboundControllers.has(payload.controllerId))
            return;
        const controller = this.outboundControllers.getSub(fromSid, payload.controllerId);
        controller.setRemoteState(payload.state);
    }
    addLocalController(localController) {
        if (this.logging)
            console.log("local camera stream controller was added. resourceId: ", localController.getControllerId());
        this.localControllers.set(localController.getControllerId(), localController);
    }
    addOutboundController(remoteSid, localController) {
        const payload = {
            controllerId: localController.getControllerId(),
            label: localController.getLabel(),
            state: Controller_1.ControllerState.STARTING,
            type: localController.getType(),
        };
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, payload, remoteSid);
        const outboundController = localController.createOutboundController(remoteSid);
        this.outboundControllers.setSub(remoteSid, outboundController.getControllerId(), outboundController);
        return outboundController;
    }
    removeOutboundController(remoteSid, controllerId) {
        if (this.logging)
            console.log("outbound controller was removed. remoteSid:", remoteSid, "resourceId: ", controllerId);
        if (!this.outboundControllers.hasSub(remoteSid, controllerId))
            return;
        const controller = this.outboundControllers.getSub(remoteSid, controllerId);
        controller.destroy();
        const payload = {
            controllerId,
        };
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, payload, remoteSid);
    }
    removeLocalController(controllerId) {
        if (this.logging)
            console.log("local controller was removed. controllerId: ", controllerId);
        if (!this.localControllers.has(controllerId))
            return;
        const controller = this.localControllers.get(controllerId);
        controller.destroy();
    }
    sendModifyInboundController(remoteSid, payload) {
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, payload, remoteSid);
    }
    sendModifyOutboundController(remoteSid, payload) {
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_MODIFY_OUTBOUND_CONTROLLER, payload, remoteSid);
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
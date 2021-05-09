"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerManager = void 0;
const react_use_listeners_1 = require("react-use-listeners");
const Controller_1 = require("./Controller");
class ControllerManager {
    constructor(webRtcManager, inboundControllerBuilder, logging = true) {
        this.outboundControllers = new react_use_listeners_1.ObservedMapMapImpl();
        this.localControllers = new react_use_listeners_1.ObservedMapImpl();
        this.inboundControllers = new react_use_listeners_1.ObservedMapMapImpl();
        this.logging = logging;
        this.webRtcManager = webRtcManager;
        this.inboundControllerBuilder = inboundControllerBuilder;
        this.webRtcManager.signallingChannel.addListener(Controller_1.RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, (payload, remoteSid) => this.inboundControllerAdded(remoteSid, payload));
        this.webRtcManager.signallingChannel.addListener(Controller_1.RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, (payload, remoteSid) => this.inboundControllerRemoved(remoteSid, payload));
        this.webRtcManager.signallingChannel.addListener(Controller_1.RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, (payload, remoteSid) => this.inboundControllerModified(remoteSid, payload));
    }
    getLocalController(controllerId) {
        return this.localControllers.get(controllerId);
    }
    inboundControllerAdded(remoteSid, payload) {
        if (this.logging)
            console.log("inbound controller was added. sid:", remoteSid, payload);
        if (this.inboundControllers.hasSub(remoteSid, payload.controllerId))
            return;
        const controller = this.inboundControllerBuilder(this.webRtcManager, remoteSid, payload.label, payload.controllerId, payload.type);
        this.inboundControllers.setSub(remoteSid, controller.getControllerId(), controller);
    }
    inboundControllerRemoved(remoteSid, payload) {
        if (this.logging)
            console.log("inbound controller was removed. sid: ", remoteSid);
        if (!this.inboundControllers.hasSub(remoteSid, payload.controllerId))
            return;
        const controller = this.inboundControllers.getSub(remoteSid, payload.controllerId);
        controller.destroy();
        this.inboundControllers.deleteSub(remoteSid, payload.controllerId);
        this.disconnectP2pIfPossible(remoteSid);
    }
    inboundControllerModified(remoteSid, payload) {
        if (this.logging)
            console.log("inbound controller was modified. sid: ", remoteSid, payload);
        if (!this.inboundControllers.hasSub(remoteSid, payload.controllerId))
            return;
        const controller = this.inboundControllers.getSub(remoteSid, payload.controllerId);
        controller.setRemoteState(payload.state);
        if (payload.mediaObjectId)
            controller.load(payload.mediaObjectId);
    }
    removeInboundController(remoteSid, controllerId) {
        if (this.logging)
            console.log("inbound controller was removed. remoteSid:", remoteSid, "resourceId: ", controllerId);
        if (!this.inboundControllers.hasSub(remoteSid, controllerId))
            return;
        const controller = this.inboundControllers.getSub(remoteSid, controllerId);
        controller.destroy();
        this.inboundControllers.deleteSub(remoteSid, controllerId);
        this.disconnectP2pIfPossible(remoteSid);
    }
    removeInboundParticipant(remoteSid) {
        this.inboundControllers.forEachSub(remoteSid, (controller) => {
            controller.destroy();
        });
        this.inboundControllers.delete(remoteSid);
        this.disconnectP2pIfPossible(remoteSid);
    }
    outboundControllerModified(remoteSid, payload) {
        if (this.logging)
            console.log("outbound controller was modified. sid: ", remoteSid, payload);
        if (!this.outboundControllers.hasSub(remoteSid, payload.controllerId))
            return;
        const controller = this.outboundControllers.getSub(remoteSid, payload.controllerId);
        controller.setRemoteState(payload.state);
    }
    addLocalController(localController) {
        if (this.logging)
            console.log("local controller was added. controllerId: ", localController.getControllerId());
        this.localControllers.set(localController.getControllerId(), localController);
    }
    addOutboundController(remoteSid, localController) {
        if (this.logging)
            console.log("outbound/inbound controller pair was added. resourceId: ", localController.getControllerId());
        const payload = {
            controllerId: localController.getControllerId(),
            label: localController.getLabel(),
            state: Controller_1.ControllerState.STOPPED,
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
        this.outboundControllers.deleteSub(remoteSid, controllerId);
        this.disconnectP2pIfPossible(remoteSid);
    }
    disconnectP2pIfPossible(remoteSid) {
        console.log("disconnecting p2p if possible", this.outboundControllers.has(remoteSid), this.inboundControllers.has(remoteSid), this.inboundControllers);
        if (!this.outboundControllers.has(remoteSid) && !this.inboundControllers.has(remoteSid)) {
            if (this.logging)
                console.log("disconnecting remote sid", remoteSid);
            this.webRtcManager.transmissionManager.disconnect(remoteSid);
        }
    }
    removeLocalController(controllerId) {
        if (this.logging)
            console.log("local controller was removed. controllerId: ", controllerId);
        if (!this.localControllers.has(controllerId))
            return;
        const controller = this.localControllers.get(controllerId);
        controller.destroy();
        this.localControllers.delete(controllerId);
    }
    sendModifyInboundController(remoteSid, payload) {
        if (this.logging)
            console.log("sending modify inbound controller", remoteSid, payload);
        this.webRtcManager.signallingChannel.send(Controller_1.RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, payload, remoteSid);
    }
    sendModifyOutboundController(remoteSid, payload) {
        if (this.logging)
            console.log("sending modify outbound controller", remoteSid, payload);
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
    destroy() {
        this.localControllers.forEach((controller) => {
            this.removeLocalController(controller.getControllerId());
        });
        this.outboundControllers.forEach((controller, remoteSid) => {
            this.removeOutboundController(remoteSid, controller.getControllerId());
        });
        this.inboundControllers.forEach((controller, remoteSid) => {
            this.removeInboundController(remoteSid, controller.getControllerId());
        });
    }
}
exports.ControllerManager = ControllerManager;
//# sourceMappingURL=ControllerManager.js.map
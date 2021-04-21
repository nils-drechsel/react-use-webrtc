import { ObservedMap, ObservedMapImpl, ObservedPlainMapMap, ObservedPlainMapMapImpl } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
import { InboundController, TransmissionInboundController } from "./InboundController";
import { AddInboundControllerPayload, RtcControllerMessage, RemoveInboundControllerPayload, ModifyInboundControllerPayload } from "./Controller";
import { LocalController, LocalStreamController } from "./LocalController";
import { OutboundController, OutboundStreamController } from "./OutboundController";
import { MediaObject } from "../Media/MediaDevicesManager";






export class ControllerManager {

    webRtcManager: WebRtcManager;

    outboundControllers: ObservedPlainMapMap<OutboundController> = new ObservedPlainMapMapImpl();
    localControllers: ObservedMap<LocalController> = new ObservedMapImpl();
    inboundControllers: ObservedMap<InboundController> = new ObservedMapImpl();

    logging: boolean;

    constructor(webRtcManager: WebRtcManager, logging = true) {
        this.logging = logging;
        this.webRtcManager = webRtcManager;

        this.webRtcManager.signallingChannel.addListener(RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerAdded(fromSid!, payload));
        this.webRtcManager.signallingChannel.addListener(RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerRemoved(fromSid!, payload));
        this.webRtcManager.signallingChannel.addListener(RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerModified(fromSid!, payload));

    }

    getInboundController(controllerId: string): InboundController<MediaObject> | undefined {
        return this.inboundControllers.get(controllerId);
    }

    getLocalController(controllerId: string): LocalController<MediaObject> | undefined {
        return this.localControllers.get(controllerId);
    }

    inboundControllerAdded(fromSid: string, payload: AddInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was added. sid:", fromSid);
        if (this.inboundControllers.has(payload.controllerId)) return;
        const controller = new TransmissionInboundController(this.webRtcManager, fromSid, payload.label, payload.controllerId);
        this.inboundControllers.set(controller.controllerId, controller);
        controller.load(payload.transmissionId);
        
    }

    inboundControllerRemoved(fromSid: string, payload: RemoveInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was removed. sid: ", fromSid);
        if (!this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllers.get(payload.controllerId)!;
        if (controller.getRemoteSid() !== fromSid) return; // would be weird if we'd ever see this
        controller.stop();
    }

    inboundControllerModified(fromSid: string, payload: ModifyInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was modified. sid: ", fromSid);
        if (!this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllers.get(payload.controllerId)!;
        if (controller.getRemoteSid() !== fromSid) return; // would be weird if we'd ever see this
        controller.load(payload.transmissionId);
    }

    addLocalController(localController: LocalController) {
        if (this.logging) console.log("local camera stream controller was added. resourceId: ", localController.getControllerId());
        this.localControllers.set(localController.getControllerId(), localController);
    }

    createOrGetOutboundStreamController(remoteSid: string, label: string, localController: LocalStreamController): OutboundStreamController {
        const outboundController = this.outboundControllers.getSub(remoteSid, localController.getControllerId());
        if (outboundController) {
            if (!(outboundController instanceof OutboundStreamController)) throw new Error("outbound controller is not an outbound stream controller");
            return outboundController as OutboundStreamController;
        }

        if (this.logging) console.log("outbound controller was added. sid: ", remoteSid);
        const controller = new OutboundStreamController(this.webRtcManager, remoteSid, label, localController);
        this.outboundControllers.set(localController.getControllerId(), controller);
        return controller;
    }

    removeOutboundController(remoteSid: string, resourceId: string) {
        if (this.logging) console.log("outbound controller was removed. remoteSid:", remoteSid, "resourceId: ", resourceId);
        if (!this.outboundControllers.hasSub(remoteSid, resourceId)) return;
        const controller = this.outboundControllers.getSub(remoteSid, resourceId)!;
        controller.stop();
        this.outboundControllers.deleteSub(remoteSid, resourceId);
    }

    removeLocalController(controllerId: string) {
        if (this.logging) console.log("local controller was removed. controllerId: ", controllerId);
        if (!this.localControllers.has(controllerId)) return;
        const controller = this.localControllers.get(controllerId)!;
        controller.stop();
        this.localControllers.delete(controllerId);
    }

    sendAddInboundController(remoteSid: string, payload: AddInboundControllerPayload) {
        this.webRtcManager.signallingChannel.send(RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, payload, remoteSid);
    }

    sendModifyInboundController(remoteSid: string, payload: ModifyInboundControllerPayload) {
        this.webRtcManager.signallingChannel.send(RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, payload, remoteSid);
    }

    sendRemoveInboundController(remoteSid: string, payload: RemoveInboundControllerPayload) {
        this.webRtcManager.signallingChannel.send(RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, payload, remoteSid);
    }

    getOutboundControllers(): ObservedPlainMapMap<OutboundController<MediaObject>> {
        return this.outboundControllers;
    }    

    getLocalControllers(): ObservedMap<LocalController<MediaObject>> {
        return this.localControllers;
    }

    getInboundControllers(): ObservedMap<InboundController<MediaObject>> {
        return this.inboundControllers;
    }

}
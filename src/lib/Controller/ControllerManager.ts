import { ObservedMap } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
import { InboundController, TransmissionInboundController } from "./InboundController";
import { AddInboundControllerPayload, RtcControllerMessage, RemoveInboundControllerPayload, ModifyInboundControllerPayload } from "./Controller";
import { LocalCameraStreamController, LocalController, LocalStreamController } from "./LocalController";
import { OutboundController, OutboundStreamController } from "./OutboundController";
import { MediaObject } from "../Media/MediaDevicesManager";






export class ControllerManager {

    webRtcManager: WebRtcManager;

    outboundControllers: Map<string, OutboundController<MediaObject>> = new Map();
    localControllers: ObservedMap<LocalController<MediaObject>> = new ObservedMap();
    inboundControllers: ObservedMap<InboundController<MediaObject>> = new ObservedMap();

    logging: boolean;

    constructor(webRtcManager: WebRtcManager, logging = true) {
        this.logging = logging;
        this.webRtcManager = webRtcManager;

        this.webRtcManager.signallingChannel.addListener(RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerAdded(fromSid!, payload));
        this.webRtcManager.signallingChannel.addListener(RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerRemoved(fromSid!, payload));
        this.webRtcManager.signallingChannel.addListener(RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER, (payload, fromSid) => this.inboundControllerModified(fromSid!, payload));

    }

    getOutboundController(controllerId: string): OutboundController<MediaObject> | undefined {
        return this.outboundControllers.get(controllerId);
    }

    getInboundController(controllerId: string): InboundController<MediaObject> | undefined {
        return this.inboundControllers.get(controllerId);
    }

    getLocalController(controllerId: string): LocalController<MediaObject> | undefined {
        return this.localControllers.get(controllerId);
    }

    inboundControllerAdded(fromSid: string, payload: AddInboundControllerPayload) {
        if (this.inboundControllers.has(payload.controllerId)) return;
        const controller = new TransmissionInboundController(this.webRtcManager, fromSid, payload.label, payload.controllerId);
        this.inboundControllers.set(controller.controllerId, controller);
        controller.load(payload.transmissionId);
        
    }

    inboundControllerRemoved(fromSid: string, payload: RemoveInboundControllerPayload) {
        if (!this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllers.get(payload.controllerId)!;
        if (controller.getRemoteSid() !== fromSid) return; // would be weird if we'd ever see this
        controller.stop();
    }

    inboundControllerModified(fromSid: string, payload: ModifyInboundControllerPayload) {
        if (!this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllers.get(payload.controllerId)!;
        if (controller.getRemoteSid() !== fromSid) return; // would be weird if we'd ever see this
        controller.load(payload.transmissionId);
    }

    addLocalCameraStreamController(objId:string, label: string): LocalStreamController {
        const controller = new LocalCameraStreamController(this.webRtcManager, objId, label);
        this.localControllers.set(controller.controllerId, controller);
        return controller;
    }

    addOutboundStreamController(remoteSid: string, label: string, localController: LocalStreamController): OutboundStreamController {
        const controller = new OutboundStreamController(this.webRtcManager, remoteSid, label, localController);
        this.outboundControllers.set(controller.controllerId, controller);
        return controller;
    }

    removeOutboundController(controllerId: string) {
        if (!this.outboundControllers.has(controllerId)) return;
        const controller = this.outboundControllers.get(controllerId)!;
        controller.stop();
        this.outboundControllers.delete(controllerId);
    }

    removeLocalController(controllerId: string) {
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

    getLocalControllers(): ObservedMap<LocalController<MediaObject>> {
        return this.localControllers;
    }

    getInboundControllers(): ObservedMap<InboundController<MediaObject>> {
        return this.inboundControllers;
    }

}
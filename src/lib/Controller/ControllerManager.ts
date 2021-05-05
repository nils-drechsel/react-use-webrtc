import { ObservedMap, ObservedMapImpl, ObservedMapMap, ObservedMapMapImpl } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
import { InboundController } from "./InboundController";
import {
    AddInboundControllerPayload,
    RtcControllerMessage,
    RemoveInboundControllerPayload,
    ModifyInboundControllerPayload,
    InboundControllerBuilder,
    ModifyOutboundControllerPayload,
    ControllerState,
} from "./Controller";
import { LocalController } from "./LocalController";
import { OutboundController } from "./OutboundController";
import { MediaObject } from "../Media/MediaDevicesManager";

export class ControllerManager {
    webRtcManager: WebRtcManager;

    outboundControllers: ObservedMapMap<OutboundController> = new ObservedMapMapImpl();
    localControllers: ObservedMap<LocalController> = new ObservedMapImpl();
    inboundControllers: ObservedMap<InboundController> = new ObservedMapImpl();

    inboundControllerBuilder: InboundControllerBuilder;

    logging: boolean;

    constructor(webRtcManager: WebRtcManager, inboundControllerBuilder: InboundControllerBuilder, logging = true) {
        this.logging = logging;
        this.webRtcManager = webRtcManager;
        this.inboundControllerBuilder = inboundControllerBuilder;

        this.webRtcManager.signallingChannel.addListener(
            RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER,
            (payload, fromSid) => this.inboundControllerAdded(fromSid!, payload)
        );
        this.webRtcManager.signallingChannel.addListener(
            RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER,
            (payload, fromSid) => this.inboundControllerRemoved(fromSid!, payload)
        );
        this.webRtcManager.signallingChannel.addListener(
            RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER,
            (payload, fromSid) => this.inboundControllerModified(fromSid!, payload)
        );
    }

    getInboundController(controllerId: string): InboundController<MediaObject> | undefined {
        return this.inboundControllers.get(controllerId);
    }

    getLocalController(controllerId: string): LocalController<MediaObject> | undefined {
        return this.localControllers.get(controllerId);
    }

    inboundControllerAdded(fromSid: string, payload: AddInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was added. sid:", fromSid, payload);
        if (this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllerBuilder(
            this.webRtcManager,
            fromSid,
            payload.label,
            payload.controllerId,
            payload.type
        );
        this.inboundControllers.set(controller.getControllerId(), controller);
    }

    inboundControllerRemoved(fromSid: string, payload: RemoveInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was removed. sid: ", fromSid, payload);
        if (!this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllers.get(payload.controllerId)!;
        if (controller.getRemoteSid() !== fromSid) return; // would be weird if we'd ever see this
        controller.destroy();
    }

    inboundControllerModified(fromSid: string, payload: ModifyInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was modified. sid: ", fromSid, payload);
        if (!this.inboundControllers.has(payload.controllerId)) return;
        const controller = this.inboundControllers.get(payload.controllerId)!;
        controller.setRemoteState(payload.state);
        if (payload.mediaObjectId) controller.load(payload.mediaObjectId);
    }

    outboundControllerModified(fromSid: string, payload: ModifyOutboundControllerPayload) {
        if (this.logging) console.log("outbound controller was modified. sid: ", fromSid, payload);
        if (!this.outboundControllers.has(payload.controllerId)) return;
        const controller = this.outboundControllers.getSub(fromSid, payload.controllerId)!;
        controller.setRemoteState(payload.state);
    }

    addLocalController(localController: LocalController) {
        if (this.logging)
            console.log("local camera stream controller was added. resourceId: ", localController.getControllerId());
        this.localControllers.set(localController.getControllerId(), localController);
    }

    addOutboundController(remoteSid: string, localController: LocalController): OutboundController {
        const payload: AddInboundControllerPayload = {
            controllerId: localController.getControllerId(),
            label: localController.getLabel(),
            state: ControllerState.STARTING,
            type: localController.getType(),
        };
        this.webRtcManager.signallingChannel.send(RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER, payload, remoteSid);

        const outboundController = localController.createOutboundController(remoteSid);
        this.outboundControllers.setSub(remoteSid, outboundController.getControllerId(), outboundController);
        return outboundController;
    }

    removeOutboundController(remoteSid: string, controllerId: string) {
        if (this.logging)
            console.log("outbound controller was removed. remoteSid:", remoteSid, "resourceId: ", controllerId);
        if (!this.outboundControllers.hasSub(remoteSid, controllerId)) return;
        const controller = this.outboundControllers.getSub(remoteSid, controllerId)!;
        controller.destroy();
        const payload: RemoveInboundControllerPayload = {
            controllerId,
        };
        this.webRtcManager.signallingChannel.send(
            RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER,
            payload,
            remoteSid
        );
    }

    removeLocalController(controllerId: string) {
        if (this.logging) console.log("local controller was removed. controllerId: ", controllerId);
        if (!this.localControllers.has(controllerId)) return;
        const controller = this.localControllers.get(controllerId)!;
        controller.destroy();
    }

    sendModifyInboundController(remoteSid: string, payload: ModifyInboundControllerPayload) {
        this.webRtcManager.signallingChannel.send(
            RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER,
            payload,
            remoteSid
        );
    }

    sendModifyOutboundController(remoteSid: string, payload: ModifyOutboundControllerPayload) {
        this.webRtcManager.signallingChannel.send(
            RtcControllerMessage.RTC_MODIFY_OUTBOUND_CONTROLLER,
            payload,
            remoteSid
        );
    }

    getOutboundControllers(): ObservedMapMap<OutboundController<MediaObject>> {
        return this.outboundControllers;
    }

    getLocalControllers(): ObservedMap<LocalController<MediaObject>> {
        return this.localControllers;
    }

    getInboundControllers(): ObservedMap<InboundController<MediaObject>> {
        return this.inboundControllers;
    }
}

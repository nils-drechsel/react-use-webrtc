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
    inboundControllers: ObservedMapMap<InboundController> = new ObservedMapMapImpl();

    inboundControllerBuilder: InboundControllerBuilder;

    logging: boolean;

    constructor(webRtcManager: WebRtcManager, inboundControllerBuilder: InboundControllerBuilder, logging = true) {
        this.logging = logging;
        this.webRtcManager = webRtcManager;
        this.inboundControllerBuilder = inboundControllerBuilder;

        this.webRtcManager.signallingChannel.addListener(
            RtcControllerMessage.RTC_ADD_INBOUND_CONTROLLER,
            (payload, remoteSid) => this.inboundControllerAdded(remoteSid!, payload)
        );
        this.webRtcManager.signallingChannel.addListener(
            RtcControllerMessage.RTC_REMOVE_INBOUND_CONTROLLER,
            (payload, remoteSid) => this.inboundControllerRemoved(remoteSid!, payload)
        );
        this.webRtcManager.signallingChannel.addListener(
            RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER,
            (payload, remoteSid) => this.inboundControllerModified(remoteSid!, payload)
        );
    }

    getLocalController(controllerId: string): LocalController<MediaObject> | undefined {
        return this.localControllers.get(controllerId);
    }

    inboundControllerAdded(remoteSid: string, payload: AddInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was added. sid:", remoteSid, payload);
        if (this.inboundControllers.hasSub(remoteSid, payload.controllerId)) return;
        const controller = this.inboundControllerBuilder(
            this.webRtcManager,
            remoteSid,
            payload.label,
            payload.controllerId,
            payload.type
        );
        this.inboundControllers.setSub(remoteSid, controller.getControllerId(), controller);
    }

    inboundControllerRemoved(remoteSid: string, payload: RemoveInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was removed. sid: ", remoteSid);
        if (!this.inboundControllers.hasSub(remoteSid, payload.controllerId)) return;
        const controller = this.inboundControllers.getSub(remoteSid, payload.controllerId)!;
        controller.destroy();
        this.inboundControllers.deleteSub(remoteSid, payload.controllerId);
        this.disconnectP2pIfPossible(remoteSid);
    }

    inboundControllerModified(remoteSid: string, payload: ModifyInboundControllerPayload) {
        if (this.logging) console.log("inbound controller was modified. sid: ", remoteSid, payload);
        if (!this.inboundControllers.hasSub(remoteSid, payload.controllerId)) return;
        const controller = this.inboundControllers.getSub(remoteSid, payload.controllerId)!;
        controller.setRemoteState(payload.state);
        if (payload.mediaObjectId) controller.load(payload.mediaObjectId);
    }

    removeInboundController(remoteSid: string, controllerId: string) {
        if (this.logging)
            console.log("inbound controller was removed. remoteSid:", remoteSid, "resourceId: ", controllerId);
        if (!this.inboundControllers.hasSub(remoteSid, controllerId)) return;
        const controller = this.inboundControllers.getSub(remoteSid, controllerId)!;
        controller.destroy();
        this.inboundControllers.deleteSub(remoteSid, controllerId);
        this.disconnectP2pIfPossible(remoteSid);
    }

    removeInboundParticipant(remoteSid: string): void {
        this.inboundControllers.forEachSub(remoteSid, (controller) => {
            controller.destroy();
        });
        this.inboundControllers.delete(remoteSid);
        this.disconnectP2pIfPossible(remoteSid);
    }

    outboundControllerModified(remoteSid: string, payload: ModifyOutboundControllerPayload) {
        if (this.logging) console.log("outbound controller was modified. sid: ", remoteSid, payload);
        if (!this.outboundControllers.hasSub(remoteSid, payload.controllerId)) return;
        const controller = this.outboundControllers.getSub(remoteSid, payload.controllerId)!;
        controller.setRemoteState(payload.state);
    }

    addLocalController(localController: LocalController) {
        if (this.logging) console.log("local controller was added. controllerId: ", localController.getControllerId());
        this.localControllers.set(localController.getControllerId(), localController);
    }

    addOutboundController(remoteSid: string, localController: LocalController): OutboundController {
        if (this.logging)
            console.log("outbound/inbound controller pair was added. resourceId: ", localController.getControllerId());
        const payload: AddInboundControllerPayload = {
            controllerId: localController.getControllerId(),
            label: localController.getLabel(),
            state: ControllerState.STOPPED,
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
        this.outboundControllers.deleteSub(remoteSid, controllerId);
        this.disconnectP2pIfPossible(remoteSid);
    }

    disconnectP2pIfPossible(remoteSid: string) {
        console.log(
            "disconnecting p2p if possible",
            this.outboundControllers.has(remoteSid),
            this.inboundControllers.has(remoteSid),
            this.inboundControllers
        );
        if (!this.outboundControllers.has(remoteSid) && !this.inboundControllers.has(remoteSid)) {
            if (this.logging) console.log("disconnecting remote sid", remoteSid);
            this.webRtcManager.transmissionManager.disconnect(remoteSid);
        }
    }

    removeLocalController(controllerId: string) {
        if (this.logging) console.log("local controller was removed. controllerId: ", controllerId);
        if (!this.localControllers.has(controllerId)) return;
        const controller = this.localControllers.get(controllerId)!;
        controller.destroy();
        this.localControllers.delete(controllerId);
    }

    sendModifyInboundController(remoteSid: string, payload: ModifyInboundControllerPayload) {
        if (this.logging) console.log("sending modify inbound controller", remoteSid, payload);
        this.webRtcManager.signallingChannel.send(
            RtcControllerMessage.RTC_MODIFY_INBOUND_CONTROLLER,
            payload,
            remoteSid
        );
    }

    sendModifyOutboundController(remoteSid: string, payload: ModifyOutboundControllerPayload) {
        if (this.logging) console.log("sending modify outbound controller", remoteSid, payload);
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

    getInboundControllers(): ObservedMapMap<InboundController<MediaObject>> {
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

import { ObservedMap } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
import { InboundController } from "./InboundController";
import { AddInboundControllerPayload, RemoveInboundControllerPayload, ModifyInboundControllerPayload } from "./Controller";
import { LocalController, LocalStreamController } from "./LocalController";
import { OutboundController, OutboundStreamController } from "./OutboundController";
import { MediaObject } from "../Media/MediaDevicesManager";
export declare class ControllerManager {
    webRtcManager: WebRtcManager;
    outboundControllers: Map<string, OutboundController<MediaObject>>;
    localControllers: ObservedMap<LocalController<MediaObject>>;
    inboundControllers: ObservedMap<InboundController<MediaObject>>;
    logging: boolean;
    constructor(webRtcManager: WebRtcManager, logging?: boolean);
    getOutboundController(controllerId: string): OutboundController<MediaObject> | undefined;
    getInboundController(controllerId: string): InboundController<MediaObject> | undefined;
    getLocalController(controllerId: string): LocalController<MediaObject> | undefined;
    inboundControllerAdded(fromSid: string, payload: AddInboundControllerPayload): void;
    inboundControllerRemoved(fromSid: string, payload: RemoveInboundControllerPayload): void;
    inboundControllerModified(fromSid: string, payload: ModifyInboundControllerPayload): void;
    addLocalCameraStreamController(objId: string, label: string): LocalStreamController;
    addOutboundStreamController(remoteSid: string, label: string, localController: LocalStreamController): OutboundStreamController;
    removeOutboundController(controllerId: string): void;
    removeLocalController(controllerId: string): void;
    sendAddInboundController(remoteSid: string, payload: AddInboundControllerPayload): void;
    sendModifyInboundController(remoteSid: string, payload: ModifyInboundControllerPayload): void;
    sendRemoveInboundController(remoteSid: string, payload: RemoveInboundControllerPayload): void;
    getLocalControllers(): ObservedMap<LocalController<MediaObject>>;
    getInboundControllers(): ObservedMap<InboundController<MediaObject>>;
}

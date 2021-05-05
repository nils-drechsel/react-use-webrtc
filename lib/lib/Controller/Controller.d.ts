import { MediaObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { InboundController } from "./InboundController";
export declare enum ControllerState {
    STARTING = "STARTING",
    READY = "READY",
    FAILED = "FAILED",
    STOPPED = "STOPPED"
}
export declare enum RtcControllerMessage {
    RTC_ADD_INBOUND_CONTROLLER = "RTC_ADD_INBOUND_CONTROLLER",
    RTC_REMOVE_INBOUND_CONTROLLER = "RTC_REMOVE_INBOUND_CONTROLLER",
    RTC_MODIFY_INBOUND_CONTROLLER = "RTC_MODIFY_INBOUND_CONTROLLER",
    RTC_MODIFY_OUTBOUND_CONTROLLER = "RTC_MODIFY_OUTBOUND_CONTROLLER"
}
export interface AddInboundControllerPayload {
    controllerId: string;
    label: string;
    state: ControllerState;
    type: string;
}
export interface RemoveInboundControllerPayload {
    controllerId: string;
}
export interface ModifyInboundControllerPayload {
    controllerId: string;
    mediaObjectId: string | null;
    state: ControllerState;
}
export interface ModifyOutboundControllerPayload {
    controllerId: string;
    state: ControllerState;
}
export interface InboundControllerBuilder {
    (webRtcManagr: WebRtcManager, remoteSid: string, label: string, controllerId: string, controllerType: string): InboundController;
}
export interface Controller<T extends MediaObject> {
    start(): void;
    ready(): void;
    fail(): void;
    stop(): void;
    destroy(): void;
    load(mediaObjectId: string): void;
    setState(state: ControllerState): void;
    getState(): ControllerState;
    getMediaObject(): T | undefined;
    getMediaObjectId(): string | null;
    getLabel(): string;
    getControllerId(): string;
    getType(): string;
}
export declare abstract class AbstractController<T extends MediaObject> implements Controller<T> {
    webRtcManager: WebRtcManager;
    controllerId: string;
    controllerState: ControllerState;
    label: string;
    type: string;
    mediaObjectId: string | null;
    constructor(webRtcManager: WebRtcManager, label: string, type: string, controllerId?: string | null);
    abstract load(mediaObjectId: string): void;
    abstract destroy(): void;
    protected abstract notify(): void;
    getMediaObject(): T | undefined;
    getMediaObjectId(): string | null;
    protected setMediaObjectId(mediaObjectId: string): void;
    getType(): string;
    start(): void;
    ready(): void;
    stop(): void;
    fail(): void;
    setState(state: ControllerState): void;
    getState(): ControllerState;
    getLabel(): string;
    getControllerId(): string;
}

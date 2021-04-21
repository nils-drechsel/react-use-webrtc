import { MediaObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from '../WebRtcManager';
export declare enum ControllerState {
    STARTING = "STARTING",
    READY = "READY",
    FAILED = "FAILED",
    STOPPED = "STOPPED",
    CLOSED = "CLOSED"
}
export declare enum RtcControllerMessage {
    RTC_ADD_INBOUND_CONTROLLER = "RTC_ADD_INBOUND_CONTROLLER",
    RTC_REMOVE_INBOUND_CONTROLLER = "RTC_REMOVE_INBOUND_CONTROLLER",
    RTC_MODIFY_INBOUND_CONTROLLER = "RTC_MODIFY_INBOUND_CONTROLLER"
}
export interface AddInboundControllerPayload {
    controllerId: string;
    transmissionId: string | null;
    label: string;
    state: ControllerState;
}
export interface RemoveInboundControllerPayload {
    controllerId: string;
}
export interface ModifyInboundControllerPayload {
    controllerId: string;
    transmissionId: string | null;
    state: ControllerState;
}
export interface Controller<T extends MediaObject> {
    start(): void;
    fail(): void;
    restart(): void;
    stop(): void;
    close(): void;
    setState(state: ControllerState): void;
    getState(): ControllerState;
    getMediaObject(): T;
    getLabel(): string;
    getControllerId(): string;
}
export interface RemoteController<T extends MediaObject> extends Controller<T> {
    setTransmissionId(transmissionId: string): void;
    getTransmission(): Transmission | undefined;
    getRemoteSid(): string;
}
export declare abstract class AbstractController<T extends MediaObject> implements Controller<T> {
    webRtcManager: WebRtcManager;
    controllerId: string;
    controllerState: ControllerState;
    label: string;
    mediaObject: T | null;
    constructor(webRtcManager: WebRtcManager, label: string, controllerId?: string | null);
    start(): void;
    stop(): void;
    fail(): void;
    restart(): void;
    close(): void;
    setState(state: ControllerState): void;
    getState(): ControllerState;
    protected abstract notify(): void;
    getMediaObject(): T;
    getLabel(): string;
    getControllerId(): string;
}
export declare abstract class AbstractRemoteController<T extends MediaObject> extends AbstractController<T> implements RemoteController<T> {
    transmissionId: string | null;
    remoteSid: string;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, controllerId: string | null);
    getState(): ControllerState;
    setTransmissionId(transmissionId: string | null): void;
    getTransmission(): Transmission | undefined;
    getRemoteSid(): string;
}

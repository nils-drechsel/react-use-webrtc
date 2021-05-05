import { v4 as uuidv4 } from "uuid";
import { MediaObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { InboundController } from "./InboundController";

export enum ControllerState {
    STARTING = "STARTING",
    READY = "READY",
    FAILED = "FAILED",
    STOPPED = "STOPPED",
}

export enum RtcControllerMessage {
    RTC_ADD_INBOUND_CONTROLLER = "RTC_ADD_INBOUND_CONTROLLER",
    RTC_REMOVE_INBOUND_CONTROLLER = "RTC_REMOVE_INBOUND_CONTROLLER",
    RTC_MODIFY_INBOUND_CONTROLLER = "RTC_MODIFY_INBOUND_CONTROLLER",
    RTC_MODIFY_OUTBOUND_CONTROLLER = "RTC_MODIFY_OUTBOUND_CONTROLLER",
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
    (
        webRtcManagr: WebRtcManager,
        remoteSid: string,
        label: string,
        controllerId: string,
        controllerType: string
    ): InboundController;
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

export abstract class AbstractController<T extends MediaObject> implements Controller<T> {
    webRtcManager: WebRtcManager;
    controllerId: string;
    controllerState: ControllerState = ControllerState.STOPPED;
    label: string;
    type: string;
    mediaObjectId: string | null = null;

    constructor(webRtcManager: WebRtcManager, label: string, type: string, controllerId?: string | null) {
        this.webRtcManager = webRtcManager;
        this.label = label;
        this.controllerId = controllerId ?? uuidv4();
        this.type = type;
    }

    public abstract load(mediaObjectId: string): void;

    public abstract destroy(): void;

    protected abstract notify(): void;

    public getMediaObject(): T | undefined {
        return this.mediaObjectId
            ? (this.webRtcManager.mediaDevicesManager.getMediaObject(this.mediaObjectId) as T)
            : undefined;
    }

    public getMediaObjectId() {
        return this.mediaObjectId;
    }

    protected setMediaObjectId(mediaObjectId: string) {
        this.mediaObjectId = mediaObjectId;
    }

    getType(): string {
        return this.type;
    }

    start(): void {
        if (this.getState() === ControllerState.STARTING) return;
        this.setState(ControllerState.STARTING);
        this.notify();
    }

    ready(): void {
        if (this.getState() === ControllerState.READY) return;
        this.setState(ControllerState.READY);
        this.notify();
    }

    stop(): void {
        if (this.getState() === ControllerState.STOPPED) return;
        this.setState(ControllerState.STOPPED);
        this.notify();
    }

    fail(): void {
        if (this.getState() === ControllerState.FAILED) return;
        this.setState(ControllerState.FAILED);
        this.notify();
    }

    setState(state: ControllerState) {
        this.controllerState = state;
    }

    getState(): ControllerState {
        return this.controllerState;
    }

    getLabel(): string {
        return this.label;
    }

    getControllerId() {
        return this.controllerId;
    }
}

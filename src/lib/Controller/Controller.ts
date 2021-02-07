import { v4 as uuidv4 } from 'uuid';
import { MediaObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from '../WebRtcManager';

export enum ControllerState {
    STARTING = "STARTING",
    READY = "READY",
    FAILED = "FAILED",
    CLOSED = "CLOSED"
}


export enum RtcControllerMessage {
    RTC_ADD_INBOUND_CONTROLLER = "RTC_ADD_INBOUND_CONTROLLER",
    RTC_REMOVE_INBOUND_CONTROLLER = "RTC_REMOVE_INBOUND_CONTROLLER",
    RTC_MODIFY_INBOUND_CONTROLLER = "RTC_MODIFY_INBOUND_CONTROLLER",
}

export interface AddInboundControllerPayload {
    controllerId: string,
    transmissionId: string | null,
    label: string,
    state: ControllerState,
}

export interface RemoveInboundControllerPayload {
    controllerId: string,
}

export interface ModifyInboundControllerPayload {
    controllerId: string,
    transmissionId: string | null,
    state: ControllerState,
}



export interface Controller<T extends MediaObject> {
    fail(): void;
    restart(): void;
    stop(): void;
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



export abstract class AbstractController<T extends MediaObject> implements Controller<T> {

    webRtcManager: WebRtcManager;
    controllerId: string;
    controllerState: ControllerState = ControllerState.STARTING;
    label: string;
    mediaObject: T | null = null;

    constructor(webRtcManager: WebRtcManager, label: string, controllerId?: string | null) {
        this.webRtcManager = webRtcManager;
        this.label = label;
        this.controllerId = controllerId || uuidv4();
    }

    abstract stop(): void;

    fail(): void {
        this.setState(ControllerState.FAILED);
        this.notifyModification();
    }

    restart(): void {
        this.setState(ControllerState.STARTING);
        this.notifyModification();
    }

    setState(state: ControllerState) {
        this.controllerState = state;
    }

    getState(): ControllerState {
        return this.controllerState;
    }

    protected notifyModification() {
        this.webRtcManager.controllerManager.getInboundControllers().modify(this.controllerId);
    }

    getMediaObject(): T {
        return this.mediaObject!;
    }

    getLabel(): string {
        return this.label;
    }

    getControllerId() {
        return this.controllerId;
    }

}



export abstract class AbstractRemoteController<T extends MediaObject> extends AbstractController<T> implements RemoteController<T> {

    transmissionId: string | null = null;
    remoteSid: string;

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, controllerId: string | null) {
        super(webRtcManager, label, controllerId);
        this.remoteSid = remoteSid;
    }

    getState(): ControllerState {
        return this.controllerState;
    }

    setTransmissionId(transmissionId: string | null) {
        this.transmissionId = transmissionId;
    }

    getTransmission(): Transmission | undefined {
        if (this.controllerState !== ControllerState.READY || !this.transmissionId) return undefined;
        return this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
    }   

    getRemoteSid(): string {
        return this.remoteSid;
    }

}

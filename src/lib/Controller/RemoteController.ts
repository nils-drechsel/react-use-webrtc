import { MediaObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractController, Controller, ControllerState } from "./Controller";

export interface RemoteController<T extends MediaObject> extends Controller<T> {
    getRemoteSid(): string;
    getRemoteState(): ControllerState;
    setRemoteState(state: ControllerState): void;
}

export abstract class AbstractRemoteController<T extends MediaObject = MediaObject>
    extends AbstractController<T>
    implements RemoteController<T> {
    remoteSid: string;
    remoteState: ControllerState = ControllerState.STARTING;

    constructor(
        webRtcManager: WebRtcManager,
        remoteSid: string,
        label: string,
        type: string,
        controllerId: string | null
    ) {
        super(webRtcManager, label, type, controllerId);
        this.remoteSid = remoteSid;
    }

    getState(): ControllerState {
        return this.controllerState;
    }

    setRemoteState(state: ControllerState) {
        this.remoteState = state;
    }

    getRemoteState(): ControllerState {
        return this.remoteState;
    }
    getRemoteSid(): string {
        return this.remoteSid;
    }
}

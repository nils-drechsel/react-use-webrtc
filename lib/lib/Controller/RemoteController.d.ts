import { MediaObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractController, Controller, ControllerState } from "./Controller";
export interface RemoteController<T extends MediaObject> extends Controller<T> {
    getRemoteSid(): string;
    getRemoteState(): ControllerState;
    setRemoteState(state: ControllerState): void;
}
export declare abstract class AbstractRemoteController<T extends MediaObject = MediaObject> extends AbstractController<T> implements RemoteController<T> {
    remoteSid: string;
    remoteState: ControllerState;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, type: string, controllerId: string | null);
    getState(): ControllerState;
    setRemoteState(state: ControllerState): void;
    getRemoteState(): ControllerState;
    getRemoteSid(): string;
}

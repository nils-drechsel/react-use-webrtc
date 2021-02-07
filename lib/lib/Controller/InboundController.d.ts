import { MediaObject } from "../Media/MediaDevicesManager";
import { AbstractRemoteController, RemoteController } from "./Controller";
import { UnsubscribeCallback } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
export interface InboundController<T extends MediaObject> extends RemoteController<T> {
    load(transmissionId: string | null): void;
}
export declare abstract class AbstractInboundController<T extends MediaObject> extends AbstractRemoteController<T> {
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, controllerId: string);
    abstract load(transmissionId: string | null): void;
}
export declare class TransmissionInboundController<T extends MediaObject> extends AbstractInboundController<T> {
    unsubscribeListener: UnsubscribeCallback | null;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, controllerId: string);
    load(transmissionId: string | null): void;
    private removeStream;
    stop(): void;
}

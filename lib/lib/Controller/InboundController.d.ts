import { MediaItem, MediaObject } from "../Media/MediaDevicesManager";
import { ControllerState } from "./Controller";
import { UnsubscribeCallback } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractRemoteController, RemoteController } from "./RemoteController";
export interface InboundController<T extends MediaObject = MediaObject> extends RemoteController<T> {
    load(transmissionId: string): void;
    getMediaItem(): MediaItem;
}
export declare abstract class AbstractInboundController<T extends MediaObject = MediaObject> extends AbstractRemoteController<T> implements InboundController<T> {
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, type: string, controllerId: string);
    abstract load(transmissionId: string): void;
    abstract getMediaItem(): MediaItem;
    protected notify(): void;
    destroy(): void;
    start(): void;
    ready(): void;
    fail(): void;
    stop(): void;
    setRemoteState(state: ControllerState): void;
}
export declare abstract class AbstractTransmissionInboundController<T extends MediaObject = MediaObject> extends AbstractInboundController<T> {
    unsubscribeMediaObject: UnsubscribeCallback | null;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, type: string, controllerId: string);
    load(mediaObjectId: string): void;
    stop(): void;
}

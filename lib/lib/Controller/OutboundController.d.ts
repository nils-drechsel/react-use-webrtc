import { UnsubscribeCallback } from "react-use-listeners";
import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractRemoteController, RemoteController } from "./RemoteController";
export interface OutboundController<T extends MediaObject = MediaObject> extends RemoteController<T> {
}
export declare abstract class AbstractOutboundController<T extends MediaObject = MediaObject> extends AbstractRemoteController<T> implements OutboundController<T> {
    unsubscribeMediaObject: UnsubscribeCallback | null;
    unsubscribeLocalController: UnsubscribeCallback;
    localControllerId: string;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, type: string, localControllerId: string);
    load(mediaObjectId: string): void;
    start(): void;
    ready(): void;
    fail(): void;
    stop(): void;
    protected notify(): void;
    destroy(): void;
}
export declare abstract class AbstractOutboundStreamController extends AbstractOutboundController<MediaStreamObject> {
    ready(): void;
}

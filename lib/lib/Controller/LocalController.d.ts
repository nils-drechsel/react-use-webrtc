import { UnsubscribeCallback } from "react-use-listeners";
import { MediaItem, MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractController, Controller } from "./Controller";
import { OutboundController } from "./OutboundController";
/**
 * A local controller is related to a local resource. It can be a camera, a screencapture, picture galleries, etc..
 * Such controller can have corresponding outbout controllers which are in charge of delivering the local data to remote destinations.
 * The controllers have a controller state. When a controller is first created, it is in its STOPPED state.
 * When the controller gets started, it will switch to the STARTING state. Once it has finished, or failed, loading the resource,
 * it will switch to either the READY, or the FAIL state. If it is then stopped, if will once again adopt the STOPPED state. If the
 * local controller is removed, it will temporarily adopt the CLOSED state.
 */
export interface LocalController<T extends MediaObject = MediaObject> extends Controller<T> {
    createOutboundController(remoteSid: string): OutboundController<T>;
    getMediaItem(): MediaItem;
}
export declare abstract class AbstractLocalController<T extends MediaObject> extends AbstractController<T> implements LocalController<T> {
    unsubscribeMediaObject: UnsubscribeCallback | null;
    constructor(webRtcManager: WebRtcManager, label: string, type: string, controllerId?: string);
    abstract createOutboundController(remoteSid: string): OutboundController<T>;
    abstract getMediaItem(): MediaItem;
    destroy(): void;
    protected notify(): void;
    stop(): void;
    load(mediaObjectId: string): void;
}
export interface LocalStreamController extends LocalController<MediaStreamObject> {
}
export declare abstract class AbstractLocalStreamController extends AbstractLocalController<MediaStreamObject> implements LocalStreamController {
    constructor(webRtcManager: WebRtcManager, label: string, type: string, controllerId?: string);
    stop(): void;
}

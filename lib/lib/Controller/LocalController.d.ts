import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractController, Controller } from "./Controller";
import { OutboundController, OutboundStreamController } from "./OutboundController";
export interface LocalController<T extends MediaObject> extends Controller<T> {
    deregisterOutboundController(controllerId: string): void;
    registerOutboundController(controller: OutboundController<MediaObject>): void;
    getResourceId(): string;
}
export declare abstract class AbstractLocalController<T extends MediaObject> extends AbstractController<T> implements LocalController<T> {
    outboundControllers: Map<string, OutboundController<T>>;
    constructor(webRtcManager: WebRtcManager, label: string, controllerId?: string);
    abstract deregisterOutboundController(controllerId: string): void;
    abstract registerOutboundController(controller: OutboundController<MediaObject>): void;
    abstract getResourceId(): string;
    protected notifyModification(): void;
}
export interface LocalStreamController extends LocalController<MediaStreamObject> {
    deregisterOutboundController(controllerId: string): void;
    registerOutboundController(controller: OutboundStreamController): void;
}
export declare abstract class AbstractLocalStreamController extends AbstractLocalController<MediaStreamObject> implements LocalStreamController {
    constructor(webRtcManager: WebRtcManager, label: string, controllerId?: string);
    registerOutboundController(controller: OutboundStreamController): void;
    deregisterOutboundController(controllerId: string): void;
    getResourceId(): string;
    fail(): void;
    restart(): void;
    stop(): void;
}
export declare class LocalCameraStreamController extends AbstractLocalStreamController {
    constructor(webRtcManager: WebRtcManager, label: string, controllerId: string);
    load(mediaObject: MediaStreamObject): void;
    private loadOutboundControllers;
    stop(): void;
}

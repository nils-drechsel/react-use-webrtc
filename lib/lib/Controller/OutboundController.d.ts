import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from "../WebRtcManager";
import { RemoteController, AbstractRemoteController } from "./Controller";
import { LocalController } from "./LocalController";
export interface OutboundController<T extends MediaObject> extends RemoteController<T> {
    load(mediaObject: T): void;
}
export declare abstract class AbstractOutboundController<T extends MediaObject> extends AbstractRemoteController<T> implements OutboundController<T> {
    localController: LocalController<T>;
    transmissionId: string | null;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, localController: LocalController<T>);
    abstract load(mediaObject: T): void;
    protected notifyModification(): void;
}
export declare class OutboundStreamController extends AbstractOutboundController<MediaStreamObject> {
    load(mediaObject: MediaStreamObject): void;
    fail(): void;
    restart(): void;
    unload(): void;
    start(): Promise<void>;
    stop(): void;
    getTransmission(): Transmission | undefined;
}

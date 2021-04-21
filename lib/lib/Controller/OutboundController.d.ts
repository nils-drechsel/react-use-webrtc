import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from "../WebRtcManager";
import { RemoteController, AbstractRemoteController } from "./Controller";
import { LocalController } from "./LocalController";
export interface OutboundController<T extends MediaObject = MediaObject> extends RemoteController<T> {
    load(mediaObject: T): void;
}
export declare abstract class AbstractOutboundController<T extends MediaObject = MediaObject> extends AbstractRemoteController<T> implements OutboundController<T> {
    localController: LocalController<T>;
    transmissionId: string | null;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, localController: LocalController<T>);
    abstract load(): void;
    protected notify(): void;
}
export declare class OutboundStreamController extends AbstractOutboundController<MediaStreamObject> {
    load(): void;
    start(): void;
    fail(): void;
    restart(): void;
    close(): void;
    stop(): void;
    getTransmission(): Transmission | undefined;
}

import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from "../WebRtcManager";
import { RemoteController, AbstractRemoteController } from "./Controller";
import { LocalStreamController } from "./LocalController";
export interface OutboundController<T extends MediaObject> extends RemoteController<T> {
    load(mediaObject: MediaObject): void;
}
export declare class OutboundStreamController extends AbstractRemoteController<MediaStreamObject> implements OutboundController<MediaStreamObject> {
    localController: LocalStreamController;
    transmissionId: string | null;
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, localController: LocalStreamController);
    load(mediaObject: MediaStreamObject): void;
    fail(): void;
    unload(): void;
    start(): Promise<void>;
    stop(): void;
    getTransmission(): Transmission | undefined;
}

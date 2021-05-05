import { InboundControllerBuilder } from "./Controller/Controller";
import { ControllerManager } from "./Controller/ControllerManager";
import { MediaDevicesManager } from "./Media/MediaDevicesManager";
import { TransmissionManager } from "./Transmission/TransmissionManager";
export interface SignallingChannel {
    addListener(message: string, callback: (payload: any, fromSid?: string | null) => void): void;
    send(message: string, payload: any, toSid?: string | null): void;
}
export declare class WebRtcManager {
    controllerManager: ControllerManager;
    transmissionManager: TransmissionManager;
    mediaDevicesManager: MediaDevicesManager;
    signallingChannel: SignallingChannel;
    constructor(signallingChannel: SignallingChannel, sid: string, configuration: RTCConfiguration, inboundControllerBuilder: InboundControllerBuilder, logging?: boolean);
    setSid(sid: string): void;
}

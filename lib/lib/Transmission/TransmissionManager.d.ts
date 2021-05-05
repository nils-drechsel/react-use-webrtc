import { ObservedMap } from "react-use-listeners";
import { MediaDevicesManager } from "../Media/MediaDevicesManager";
import { SignallingChannel } from "../WebRtcManager";
export declare enum ConnectionState {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    FAILED = "FAILED",
    CLOSED = "CLOSED"
}
interface Connection {
    pc: RTCPeerConnection;
    makingOffer: boolean;
    ignoreOffer: boolean;
    isAnswerPending: boolean;
}
export declare class TransmissionManager {
    sid: string | null;
    signallingChannel: SignallingChannel;
    mediaDevicesManager: MediaDevicesManager;
    connections: ObservedMap<Connection>;
    logging: boolean;
    configuration: RTCConfiguration;
    constructor(signallingChannel: SignallingChannel, mediaDevicesManager: MediaDevicesManager, sid: string, configuration: RTCConfiguration, logging?: boolean);
    isPolite(remoteSid: string): boolean;
    private iceListener;
    private descriptionListener;
    setSid(sid: string): void;
    addOutboundStreamTransmission(remoteSid: string, stream: MediaStream): void;
    removeOutboundStreamTransmission(remoteSid: string, mediaObjectId: string): void;
    private createP2pConnectionIfNecessary;
    translateConnectionState(state: string): ConnectionState;
    connect(remoteSid: string): void;
    disconnect(remoteSid: string): void;
    getSignallingChannel(): SignallingChannel;
    destroy(): void;
}
export {};

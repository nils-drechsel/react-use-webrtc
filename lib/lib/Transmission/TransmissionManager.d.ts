import { IdListeners, ListenerEvent, UnsubscribeCallback } from "react-use-listeners";
import { MediaDevicesManager } from "../Media/MediaDevicesManager";
import { SignallingChannel } from "../WebRtcManager";
export declare enum ConnectionState {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    FAILED = "FAILED",
    CLOSED = "CLOSED"
}
export declare enum TransmissionState {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    FAILED = "FAILED"
}
interface InboundTransmissionAddedPayload {
    transmissionId: string;
    label: string;
    type: TransmissionType;
}
interface InboundTransmissionRemovedPayload {
    transmissionId: string;
}
export declare enum TransmissionType {
    STREAM = 0,
    DATA = 1
}
export interface Transmission {
    type: TransmissionType;
    remoteSid: string;
    transmissionId: string;
    label: string | null;
    state: TransmissionState;
}
export interface StreamTransmission extends Transmission {
    stream: MediaStream;
}
interface Connection {
    pc: RTCPeerConnection;
    makingOffer: boolean;
    ignoreOffer: boolean;
    isAnswerPending: boolean;
    outboundtransmissions: Map<string, Transmission>;
    inboundtransmissions: Map<string, Transmission>;
}
export declare class TransmissionManager {
    sid: string | null;
    signallingChannel: SignallingChannel;
    mediaDevicesManager: MediaDevicesManager;
    connections: Map<string, Connection>;
    logging: boolean;
    configuration: RTCConfiguration;
    inboundTransmissionListeners: IdListeners;
    constructor(signallingChannel: SignallingChannel, mediaDevicesManager: MediaDevicesManager, sid: string, configuration: RTCConfiguration, logging?: boolean);
    sendAddInboundTransmission(remoteSid: string, payload: InboundTransmissionAddedPayload): void;
    sendRemoveInboundTransmission(remoteSid: string, payload: InboundTransmissionRemovedPayload): void;
    hasTransmission(remoteSid: string, transmissionId: string): boolean;
    getTransmission(remoteSid: string, transmissionId: string): Transmission | undefined;
    isPolite(remoteSid: string): boolean;
    private iceListener;
    private descriptionListener;
    setSid(sid: string): void;
    addStreamTransmission(remoteSid: string, stream: MediaStream, label: string): string;
    removeOutboundTransmission(remoteSid: string, transmissionId: string): void;
    private inboundTransmissionAdded;
    private inboundTransmissionRemoved;
    private outboundTransmissionStateChanged;
    private createP2pConnectionIfNecessary;
    translateConnectionState(state: string): ConnectionState;
    connect(remoteSid: string): void;
    disconnect(remoteSid: string): void;
    listenForInboundTransmission(transmissionId: string, listener: (event: ListenerEvent) => void): UnsubscribeCallback;
    getSignallingChannel(): SignallingChannel;
    destroy(): void;
}
export {};

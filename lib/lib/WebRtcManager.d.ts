export interface MediaStreamProvider {
    addMediaStream(bundleId: string, streamId: string, stream: MediaStream, trackId: string): void;
    removeMediaObject(bundleId: string, streamId: string): void;
    setTrackLabels(bundleId: string, trackIds: Array<string>, label: string): void;
}
export interface SignallingChannel {
    addListener(message: string, callback: (payload: any, fromSid?: string | null) => void): void;
    send(message: string, payload: any, toSid?: string | null): void;
}
interface Connection {
    pc: RTCPeerConnection;
    makingOffer: boolean;
    ignoreOffer: boolean;
    isAnswerPending: boolean;
}
export declare class WebRtcManager {
    sid: string | null;
    signallingChannel: SignallingChannel;
    connections: Map<string, Connection>;
    mediaStreamProvider: MediaStreamProvider;
    logging: boolean;
    configuration: RTCConfiguration;
    constructor(signallingChannel: SignallingChannel, mediaStreamProvider: MediaStreamProvider, sid: string, configuration: RTCConfiguration, logging?: boolean);
    isPolite(remoteSid: string): boolean;
    private iceListener;
    private descriptionListener;
    setSid(sid: string): void;
    addStream(remoteSid: string, stream: MediaStream, label: string): void;
    removeTracks(remoteSid: string, trackIds: Set<string>): void;
    private labelListener;
    private createP2pConnectionIfNecessary;
    connect(remoteSid: string): void;
    disconnect(remoteSid: string): void;
    release(): void;
}
export {};

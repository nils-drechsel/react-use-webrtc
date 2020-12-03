export interface MediaStreamProvider {
    addMediaStream(bundleId: string, streamId: string, stream: MediaStream, trackId: string): void;
    removeMediaObject(bundleId: string, streamId: string): void;
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
    constructor(signallingChannel: SignallingChannel, mediaStreamProvider: MediaStreamProvider, sid: string, logging?: boolean);
    isPolite(remoteSid: string): boolean;
    private iceListener;
    private descriptionListener;
    setSid(sid: string): void;
    addStream(remoteSid: string, stream: MediaStream): void;
    removeTracks(remoteSid: string, trackIds: Set<string>): void;
    private createP2pConnectionIfNecessary;
    connect(remoteSid: string): void;
    disconnect(remoteSid: string): void;
    release(): void;
}
export {};

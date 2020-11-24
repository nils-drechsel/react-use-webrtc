export interface MediaStreamProvider {
    addMediaStream(bundleId: string, streamId: string, stream: MediaStream): void;
    removeMediaStream(bundleId: string, streamId: string): void;
    removeMediaStreams(bundleId: string): void;
}
export interface SignallingChannel {
    addListener(message: string, callback: (payload: any, fromSid: string) => void): void;
    send(message: string, payload: any, remoteSid: string): void;
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
    constructor(signallingChannel: SignallingChannel, mediaStreamProvider: MediaStreamProvider);
    isPolite(remoteSid: string): boolean;
    private iceListener;
    private descriptionListener;
    setSid(sid: string): void;
    addStream(remoteSid: string, stream: MediaStream): void;
    private createP2pConnection;
    connect(remoteSid: string): void;
    disconnect(remoteSid: string): void;
    release(): void;
}
export {};

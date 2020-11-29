import { RtcMessage } from "./RtcMessage";
import { v4 as uuidv4 } from 'uuid';


const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};




export interface MediaStreamProvider {
    addMediaStream(bundleId: string, streamId: string, stream: MediaStream): void;
    //addMediaData(bundleId: string, dataId: string, data: any): void;
    removeMediaStream(bundleId: string, streamId: string): void;
    removeMediaStreams(bundleId: string): void;
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


export class WebRtcManager {

    sid: string | null;
    signallingChannel: SignallingChannel;
    connections: Map<string, Connection> = new Map();
    mediaStreamProvider: MediaStreamProvider;

    constructor(signallingChannel: SignallingChannel, mediaStreamProvider: MediaStreamProvider, sid: string) {
        this.sid = sid;
        this.signallingChannel = signallingChannel;
        this.mediaStreamProvider = mediaStreamProvider;
        this.signallingChannel.addListener(RtcMessage.RTC_ICE, (payload, fromSid) => this.iceListener(fromSid!, payload));
        this.signallingChannel.addListener(RtcMessage.RTC_DESCRIPTION, (payload, fromSid) => this.descriptionListener(fromSid!, payload));
    }



    isPolite(remoteSid: string) {
        return this.sid! > remoteSid;
    }


    private async iceListener(remoteSid: string, ice: RTCIceCandidate) {
        const connection = this.connections.has(remoteSid) ? this.connections.get(remoteSid) : this.createP2pConnection(remoteSid);
        if (!connection) return;
        
        try {
            await connection.pc.addIceCandidate(new RTCIceCandidate(ice));
        } catch (err) {
            if (!connection.ignoreOffer) throw err; // Suppress ignored offer's candidates
        }

    }

    private async descriptionListener(remoteSid: string, description: RTCSessionDescriptionInit) {

        const connection = this.connections.has(remoteSid) ? this.connections.get(remoteSid) : this.createP2pConnection(remoteSid);
        if (!connection) return;
        const pc = connection.pc;

        const readyForOffer = !connection.makingOffer && (pc.signalingState == "stable" || connection.isAnswerPending);
        const offerCollision = description.type == "offer" && !readyForOffer;

        connection.ignoreOffer = !this.isPolite(remoteSid) && offerCollision;
        if (connection.ignoreOffer) {
            return;
        }
        connection.isAnswerPending = description.type == "answer";
        await pc.setRemoteDescription(description); // SRD rolls back as needed
        connection.isAnswerPending = false;
        if (description.type == "offer") {
            await (pc as any).setLocalDescription();
            this.signallingChannel.send(RtcMessage.RTC_DESCRIPTION, pc.localDescription, remoteSid);
        }
    } 

    setSid(sid: string) {
        this.sid = sid;
    }

    addStream(remoteSid: string, stream: MediaStream) {
        const connection = this.connections.has(remoteSid) ? this.connections.get(remoteSid) : this.createP2pConnection(remoteSid);
        if (!connection) return;
        stream.getTracks().forEach(track => connection.pc.addTrack(track, stream));
    }

    private createP2pConnection(remoteSid: string): Connection | null {
        const pc = new RTCPeerConnection(config);
        const connection: Connection = { pc: pc, makingOffer: false, ignoreOffer: false, isAnswerPending: false };
        this.connections.set(remoteSid, connection);

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                this.signallingChannel.send(RtcMessage.RTC_ICE, event.candidate, remoteSid);
                }
            };

        pc.ontrack = (event: RTCTrackEvent) => {
            event.streams.forEach(stream => this.mediaStreamProvider.addMediaStream(remoteSid, uuidv4(), stream));
        };

        pc.onnegotiationneeded = async () => {
            try {
                connection.makingOffer = true;
                await (pc as any).setLocalDescription();
                this.signallingChannel.send(RtcMessage.RTC_DESCRIPTION, pc.localDescription, remoteSid);
            } catch (err) {
                console.error(err);
            } finally {
                connection.makingOffer = false;
            }
        }
        return connection;
    }



    connect(remoteSid: string) {
        this.createP2pConnection(remoteSid);
    }


    disconnect(remoteSid: string) {
        const connection = this.connections.get(remoteSid);
        if (!connection) return;
        connection.pc.close();
        this.connections.delete(remoteSid);

        
    }




    release() {
        // FIXME
    }


}
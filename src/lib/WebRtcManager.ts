import { RtcMessage } from "./RtcMessage";


const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};




export interface MediaStreamProvider {
    addMediaStream(bundleId: string, streamId: string, stream: MediaStream, trackId: string): void;
    //addMediaData(bundleId: string, dataId: string, data: any): void;
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


export class WebRtcManager {

    sid: string | null;
    signallingChannel: SignallingChannel;
    connections: Map<string, Connection> = new Map();
    mediaStreamProvider: MediaStreamProvider;
    logging: boolean;

    constructor(signallingChannel: SignallingChannel, mediaStreamProvider: MediaStreamProvider, sid: string, logging = true) {
        this.logging = logging;
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
        if (this.logging) console.log("ice", remoteSid);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        if (!connection) return;
        
        try {
            await connection.pc.addIceCandidate(new RTCIceCandidate(ice));
        } catch (err) {
            if (!connection.ignoreOffer) throw err; // Suppress ignored offer's candidates
        }

    }

    private async descriptionListener(remoteSid: string, description: RTCSessionDescriptionInit) {
        if (this.logging) console.log("description", remoteSid);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
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
        if (this.logging) console.log("adding stream", remoteSid, stream);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        if (!connection) return;
        stream.getTracks().forEach(track => connection.pc.addTrack(track, stream));
    }

    removeTracks(remoteSid: string, trackIds: Set<string>) {
        if (this.logging) console.log("removing stream", remoteSid, trackIds);
        if (!this.connections.has(remoteSid)) return;
        const connection = this.connections.get(remoteSid)!;
        connection.pc.getSenders().forEach(sender => {
            if (sender.track && trackIds.has(sender.track.id)) {
                connection.pc.removeTrack(sender);
            }
        });
    }

    private createP2pConnectionIfNecessary(remoteSid: string): Connection | null {
        if (this.connections.has(remoteSid)) return this.connections.get(remoteSid)!;

        if (this.logging) console.log("creating p2p connection", remoteSid, this.connections.has(remoteSid));

        const pc = new RTCPeerConnection(config);
        const connection: Connection = { pc: pc, makingOffer: false, ignoreOffer: false, isAnswerPending: false };
        this.connections.set(remoteSid, connection);

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                this.signallingChannel.send(RtcMessage.RTC_ICE, event.candidate, remoteSid);
                }
            };

        pc.ontrack = (event: RTCTrackEvent) => {
            if (this.logging) console.log("on track event", remoteSid, event);
            event.streams.forEach(stream => this.mediaStreamProvider.addMediaStream(remoteSid, stream.id, stream, event.track.id));
        };

        pc.onnegotiationneeded = async () => {
            if (this.logging) console.log("renogotiating", remoteSid);

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
        if (this.logging) console.log("connect", remoteSid, "isPolite", this.isPolite(remoteSid));

        this.createP2pConnectionIfNecessary(remoteSid);
    }


    disconnect(remoteSid: string) {
        if (this.logging) console.log("disconnect", remoteSid);

        const connection = this.connections.get(remoteSid);
        if (!connection) return;
        connection.pc.close();
        this.connections.delete(remoteSid);

        
    }




    release() {
        // FIXME
    }


}
import { RtcMessage } from "./RtcMessage";
import adapter from 'webrtc-adapter';
import { IdListeners, ListenerEvent, UnsubscribeCallback } from "react-use-listeners";
import { Sdp, SdpSection } from "./Sdp";
import { MediaDevicesManager } from "../Media/MediaDevicesManager";
import { SignallingChannel } from "../WebRtcManager";

adapter.extractVersion;


export enum ConnectionState {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    FAILED = "FAILED",
    CLOSED = "CLOSED",
}

export enum TransmissionState {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    FAILED = "FAILED",
}

interface InboundTransmissionAddedPayload {
    transmissionId: string,
    label: string,
    type: TransmissionType,
}

interface InboundTransmissionRemovedPayload {
    transmissionId: string,
}

interface OutboundTransmissionStateChangePayload {
    transmissionId: string,
    state: TransmissionState;
}

// interface ChangetransmissionPayload {
//     transmissionId: string,
//     label: string,
// }



export enum TransmissionType {
    STREAM,
    DATA,
}

export interface Transmission {
    type: TransmissionType,
    remoteSid: string,
    transmissionId: string,
    label: string | null,
    state: TransmissionState,
}

export interface StreamTransmission extends Transmission {
    stream: MediaStream,
}

interface Connection {
    pc: RTCPeerConnection;
    makingOffer: boolean;
    ignoreOffer: boolean;
    isAnswerPending: boolean;
    outboundtransmissions: Map<string, Transmission>;
    inboundtransmissions: Map<string, Transmission>;
}


export class TransmissionManager {

    sid: string | null;
    signallingChannel: SignallingChannel;
    mediaDevicesManager: MediaDevicesManager;
    connections: Map<string, Connection> = new Map();
    logging: boolean;
    configuration: RTCConfiguration;

    inboundTransmissionListeners: IdListeners = new IdListeners();

    //inboundTransmissionListeners: Listeners<(remoteSid: string, transmissionId: string, event: ListenerEvent) => void> = new Listeners();

    constructor(signallingChannel: SignallingChannel, mediaDevicesManager: MediaDevicesManager, sid: string, configuration: RTCConfiguration, logging = true) {
        this.configuration = configuration;
        this.logging = logging;
        this.sid = sid;
        this.signallingChannel = signallingChannel;
        this.mediaDevicesManager = mediaDevicesManager;
        this.signallingChannel.addListener(RtcMessage.RTC_ICE, (payload, fromSid) => this.iceListener(fromSid!, payload));
        this.signallingChannel.addListener(RtcMessage.RTC_DESCRIPTION, (payload, fromSid) => this.descriptionListener(fromSid!, payload));
        this.signallingChannel.addListener(RtcMessage.RTC_ADD_INBOUND_TRANSMISSION, (payload, fromSid) => this.inboundTransmissionAdded(fromSid!, payload));
        this.signallingChannel.addListener(RtcMessage.RTC_REMOVE_INBOUND_TRANSMISSION, (payload, fromSid) => this.inboundTransmissionRemoved(fromSid!, payload));
        //this.signallingChannel.addListener(RtcMessage.RTC_CHANGE_INBOUND__TRANSMISSION, (payload, fromSid) => this.inboundTransmissionChanged(fromSid!, payload));
        this.signallingChannel.addListener(RtcMessage.RTC_OUTBOUND_TRANSMISSION_STATE_CHANGE, (payload, fromSid) => this.outboundTransmissionStateChanged(fromSid!, payload));
    }


    sendAddInboundTransmission(remoteSid: string, payload: InboundTransmissionAddedPayload) {
        this.signallingChannel.send(RtcMessage.RTC_ADD_INBOUND_TRANSMISSION, payload, remoteSid);
    }

    sendRemoveInboundTransmission(remoteSid: string, payload: InboundTransmissionRemovedPayload) {
        this.signallingChannel.send(RtcMessage.RTC_REMOVE_INBOUND_TRANSMISSION, payload, remoteSid);
    }

    hasTransmission(remoteSid: string, transmissionId: string): boolean {
        if (!this.connections.has(remoteSid)) return false;
        const connection = this.connections.get(remoteSid)!;
        return connection.inboundtransmissions.has(transmissionId);
    }

    getTransmission(remoteSid: string, transmissionId: string): Transmission | undefined {
        if (!this.connections.has(remoteSid)) return undefined;
        const connection = this.connections.get(remoteSid)!;
        if (!connection.inboundtransmissions.has(transmissionId)) return undefined;
        return connection.inboundtransmissions.get(transmissionId)!;
    }


    isPolite(remoteSid: string) {
        return this.sid! > remoteSid;
    }


    private async iceListener(remoteSid: string, ice: RTCIceCandidate) {
        if (this.logging) console.log("ice", remoteSid);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        if (!connection) return;
        
        try {
            if (ice) {
                await connection.pc.addIceCandidate(new RTCIceCandidate(ice));
            } else {
                await connection.pc.addIceCandidate(null as any);
            }

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

    
    addStreamTransmission(remoteSid: string, stream: MediaStream, label: string): string {
        if (this.logging) console.log("adding stream", remoteSid, stream, label);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);

        const transmissionId = stream.id;

        connection.outboundtransmissions.set(stream.id, { type: TransmissionType.STREAM, remoteSid, transmissionId, label, state: TransmissionState.CONNECTING });

        stream.getTracks().forEach(track => connection.pc.addTrack(track, stream));

        this.sendAddInboundTransmission(remoteSid, { transmissionId, label, type: TransmissionType.STREAM });

        return transmissionId;
    }

    removeOutboundTransmission(remoteSid: string, transmissionId: string) {
        if (this.logging) console.log("removing outbound transmission", remoteSid, transmissionId);
        if (!this.connections.has(remoteSid)) return;
        const connection = this.connections.get(remoteSid)!;
        if (!connection.outboundtransmissions.has(transmissionId)) return;

        const transmission = connection.outboundtransmissions.get(transmissionId)!;

        if (transmission.type === TransmissionType.STREAM) {
            const streamtransmission = transmission as StreamTransmission;
            const trackIds = new Set();
            streamtransmission.stream.getTracks().forEach(track => trackIds.add(track.id));

            connection.pc.getSenders().forEach(sender => {
                if (sender.track && trackIds.has(sender.track.id)) {
                    connection.pc.removeTrack(sender);
                }
            });
        }

        connection.outboundtransmissions.delete(transmissionId);

        this.sendRemoveInboundTransmission(remoteSid, { transmissionId: transmissionId });
    }

    private inboundTransmissionAdded(remoteSid: string, payload: InboundTransmissionAddedPayload) {
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        if (!connection) return;
        if (connection.inboundtransmissions.has(payload.transmissionId)) {
            const transmission = connection.inboundtransmissions.get(payload.transmissionId)!;
            transmission.label = payload.label;
            this.inboundTransmissionListeners.modifyId(payload.transmissionId);
        } else {
            connection.inboundtransmissions.set(payload.transmissionId, { remoteSid, transmissionId: payload.transmissionId, label: payload.label, type: payload.type, state: TransmissionState.CONNECTING });
            this.inboundTransmissionListeners.addId(payload.transmissionId);
        }
    }

    private inboundTransmissionRemoved(remoteSid: string, payload: InboundTransmissionRemovedPayload) {
        if (!this.connections.has(remoteSid)) return;
        const connection = this.connections.get(remoteSid)!;
        connection.inboundtransmissions.delete(payload.transmissionId);
        this.inboundTransmissionListeners.removeId(payload.transmissionId);
    }

    private outboundTransmissionStateChanged(remoteSid: string, payload: OutboundTransmissionStateChangePayload) {
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        if (!connection) return;
        if (connection.outboundtransmissions.has(payload.transmissionId)) {
            const transmission = connection.inboundtransmissions.get(payload.transmissionId)!;
            transmission.state = payload.state;
        } else {
            // ignore this case. We have probably already deleted the transmission
            return;
        }
    }


    private createP2pConnectionIfNecessary(remoteSid: string): Connection {
        if (this.connections.has(remoteSid)) return this.connections.get(remoteSid)!;

        if (this.logging) console.log("creating p2p connection", remoteSid, this.connections.has(remoteSid));


        const pc = new RTCPeerConnection(this.configuration);
        const connection: Connection = { pc: pc, makingOffer: false, ignoreOffer: false, isAnswerPending: false, outboundtransmissions: new Map(), inboundtransmissions: new Map() };
        this.connections.set(remoteSid, connection);

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                this.signallingChannel.send(RtcMessage.RTC_ICE, event.candidate, remoteSid);
            }
            else {
                this.signallingChannel.send(RtcMessage.RTC_ICE, null, remoteSid);   
            }
        };

        pc.ontrack = (event: RTCTrackEvent) => {
            if (this.logging) console.log("on track event", remoteSid, event);

            const streams: Map<string, MediaStream> = new Map();
            event.streams.forEach((stream: MediaStream) => {
                streams.set(stream.id, stream);
            })

            if (!event || !event.target || !(event.target as any).remoteSdp) {
                // FIXME
                return;
            }

            let mid: string | null = event.transceiver.mid;
            if (!mid) {
                //FIXME
                return;
            }
            mid = mid.trim();

            const rawSdp = (event.target as any).remoteSdp as RTCSessionDescription;
            const sdp = new Sdp(rawSdp);
            const section: SdpSection | null = sdp.getSectionWithMid(mid);

            if (!section) {
                // FIXME
                return;
            }

            const transmissionIds = section.getTransmissionIds();

            transmissionIds.forEach(transmissionId => {

                if (!streams.has(transmissionId)) {
                    throw new Error("no stream with transmissionId " + transmissionId + " found");
                }

                const stream = streams.get(transmissionId)!
                this.mediaDevicesManager.addMediaStream(remoteSid, transmissionId, stream);

                if (connection.inboundtransmissions.has(transmissionId)) {
                    const transmission = connection.inboundtransmissions.get(transmissionId)! as StreamTransmission;
                    transmission.state = TransmissionState.CONNECTED;
                    transmission.stream = streams.get(transmissionId)!
                    this.inboundTransmissionListeners.modifyId(transmissionId);
                    this.signallingChannel.send(RtcMessage.RTC_OUTBOUND_TRANSMISSION_STATE_CHANGE,
                        { transmissionId, state: TransmissionState.CONNECTED } as OutboundTransmissionStateChangePayload, remoteSid); 
                } else {
                    const transmission: StreamTransmission = {
                        remoteSid,
                        transmissionId,
                        type: TransmissionType.STREAM,
                        state: TransmissionState.CONNECTED,
                        label: null,
                        stream: streams.get(transmissionId)!
                    };
                    connection.inboundtransmissions.set(transmissionId, transmission);
                    this.inboundTransmissionListeners.addId(transmissionId);
                    this.signallingChannel.send(RtcMessage.RTC_OUTBOUND_TRANSMISSION_STATE_CHANGE,
                        { transmissionId, state: TransmissionState.CONNECTED } as OutboundTransmissionStateChangePayload, remoteSid); 
                                
                }
            })


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
        };

        pc.oniceconnectionstatechange = (_ev: Event) => {
            // FIXME
        };

        pc.onconnectionstatechange = (_ev: Event) => {
            // FIXME
        };


        return connection;
    }



    translateConnectionState(state: string): ConnectionState {
        switch (state) {
            case "connected":
                return ConnectionState.CONNECTED;
            case "disconnected":
                return ConnectionState.DISCONNECTED;
            case "failed":
                return ConnectionState.FAILED;
            case "closed":
                return ConnectionState.CLOSED;
            default:
                //throw new Error("unsupported connection state " + state);
                return ConnectionState.CONNECTING;
            }
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

    listenForInboundTransmission(transmissionId: string, listener: (event: ListenerEvent) => void): UnsubscribeCallback {
        return this.inboundTransmissionListeners.addIdListener(transmissionId, listener);
    }



    // listenForInboundTransmissions(listener: (remoteSid: string, transmissionId: string, event: ListenerEvent) => void): UnsubscribeCallback {
    //     const unsubscribe = this.inboundTransmissionListeners.addListener(listener);

    //     // immediately send connections
    //     this.connections.forEach(connection => {
    //         connection.inboundtransmissions.forEach(transmission => {
    //             listener(transmission.remoteSid, transmission.transmissionId, ListenerEvent.ADDED);
    //         })
    //     })

    //     return unsubscribe;
    // }


    // notifyInboundTransmissionListeners(remoteSid: string, transmissionId: string, event: ListenerEvent) {
    //     this.inboundTransmissionListeners.forEach(listener => {
    //         listener(remoteSid, transmissionId, event);
    //     })
    // }

    getSignallingChannel(): SignallingChannel {
        return this.signallingChannel;
    }


    destroy() {
        // FIXME
    }




}
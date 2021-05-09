import { RtcMessage } from "./RtcMessage";
import adapter from "webrtc-adapter";
import { ObservedMap, ObservedMapImpl } from "react-use-listeners";
import { Sdp, SdpSection } from "./Sdp";
import { MediaDevicesManager, MediaStreamObject } from "../Media/MediaDevicesManager";
import { SignallingChannel } from "../WebRtcManager";

adapter.extractVersion;

export enum ConnectionState {
    CONNECTING = "CONNECTING",
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    FAILED = "FAILED",
    CLOSED = "CLOSED",
}

interface Connection {
    pc: RTCPeerConnection;
    makingOffer: boolean;
    ignoreOffer: boolean;
    isAnswerPending: boolean;
}

export class TransmissionManager {
    sid: string | null;
    signallingChannel: SignallingChannel;
    mediaDevicesManager: MediaDevicesManager;
    connections: ObservedMap<Connection> = new ObservedMapImpl();

    logging: boolean;
    configuration: RTCConfiguration;

    constructor(
        signallingChannel: SignallingChannel,
        mediaDevicesManager: MediaDevicesManager,
        sid: string,
        configuration: RTCConfiguration,
        logging = true
    ) {
        this.configuration = configuration;
        this.logging = logging;
        this.sid = sid;
        this.signallingChannel = signallingChannel;
        this.mediaDevicesManager = mediaDevicesManager;
        this.signallingChannel.addListener(RtcMessage.RTC_ICE, (payload, fromSid) =>
            this.iceListener(fromSid!, payload)
        );
        this.signallingChannel.addListener(RtcMessage.RTC_DESCRIPTION, (payload, fromSid) =>
            this.descriptionListener(fromSid!, payload)
        );
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

        const readyForOffer = !connection.makingOffer && (pc.signalingState === "stable" || connection.isAnswerPending);
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

    addOutboundStreamTransmission(remoteSid: string, stream: MediaStream): void {
        if (this.logging) console.log("adding stream transmission", remoteSid, stream);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);

        stream.getTracks().forEach((track) => {
            if (!connection.pc.getSenders().some((sender) => sender.track?.id === track.id)) {
                connection.pc.addTrack(track, stream);
            }
        });
    }

    removeOutboundStreamTransmission(remoteSid: string, mediaObjectId: string) {
        if (this.logging) console.log("removing outbound transmission", remoteSid, mediaObjectId);

        const connection = this.connections.get(remoteSid);
        if (!connection) return;

        const mediaStreamObject = this.mediaDevicesManager.mediaObjects.get(mediaObjectId) as MediaStreamObject;
        if (!mediaStreamObject || !mediaStreamObject.stream) return;
        const trackIds = new Set();
        mediaStreamObject.stream.getTracks().forEach((track) => trackIds.add(track.id));

        connection.pc.getSenders().forEach((sender) => {
            if (sender.track && trackIds.has(sender.track.id)) {
                connection.pc.removeTrack(sender);
            }
        });
    }

    private createP2pConnectionIfNecessary(remoteSid: string): Connection {
        if (this.connections.has(remoteSid)) return this.connections.get(remoteSid)!;

        if (this.logging) console.log("creating p2p connection", remoteSid, this.connections.has(remoteSid));

        const pc = new RTCPeerConnection(this.configuration);
        const connection: Connection = {
            pc: pc,
            makingOffer: false,
            ignoreOffer: false,
            isAnswerPending: false,
        };
        this.connections.set(remoteSid, connection);

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                this.signallingChannel.send(RtcMessage.RTC_ICE, event.candidate, remoteSid);
            } else {
                this.signallingChannel.send(RtcMessage.RTC_ICE, null, remoteSid);
            }
        };

        pc.ontrack = (event: RTCTrackEvent) => {
            if (this.logging) console.log("on track event", remoteSid, event);

            const streams: Map<string, MediaStream> = new Map();
            event.streams.forEach((stream: MediaStream) => {
                streams.set(stream.id, stream);
            });

            if (!event || !event.target || !(event.target as any).remoteDescription) {
                console.log("no event present", event);
                // FIXME
                return;
            }

            let mid: string | null = event.transceiver.mid;
            if (!mid) {
                console.log("no mid present", event);
                //FIXME
                return;
            }
            mid = mid.trim();

            const description = (event.target as any).remoteDescription as RTCSessionDescription;
            const sdp = new Sdp(description.sdp);
            const section: SdpSection | null = sdp.getSectionWithMid(mid);

            if (!section) {
                console.log("no section present", mid, event);
                // FIXME
                return;
            }

            const transmissionIds = section.getMediaObjectIds();

            console.log("present transmission ids:", transmissionIds);

            transmissionIds.forEach((mediaObjectId) => {
                if (!streams.has(mediaObjectId)) {
                    throw new Error("no stream with transmissionId " + mediaObjectId + " found");
                }

                const stream = streams.get(mediaObjectId)!;
                this.mediaDevicesManager.addRemoteMediaStream(remoteSid, mediaObjectId, stream);
            });
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

    getSignallingChannel(): SignallingChannel {
        return this.signallingChannel;
    }

    destroy() {
        this.connections.forEach((_connection, remoteSid) => {
            this.disconnect(remoteSid);
        });
    }
}

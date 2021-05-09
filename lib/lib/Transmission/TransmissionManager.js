"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransmissionManager = exports.ConnectionState = void 0;
const RtcMessage_1 = require("./RtcMessage");
const webrtc_adapter_1 = __importDefault(require("webrtc-adapter"));
const react_use_listeners_1 = require("react-use-listeners");
const Sdp_1 = require("./Sdp");
webrtc_adapter_1.default.extractVersion;
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["CONNECTING"] = "CONNECTING";
    ConnectionState["CONNECTED"] = "CONNECTED";
    ConnectionState["DISCONNECTED"] = "DISCONNECTED";
    ConnectionState["FAILED"] = "FAILED";
    ConnectionState["CLOSED"] = "CLOSED";
})(ConnectionState = exports.ConnectionState || (exports.ConnectionState = {}));
class TransmissionManager {
    constructor(signallingChannel, mediaDevicesManager, sid, configuration, logging = true) {
        this.connections = new react_use_listeners_1.ObservedMapImpl();
        this.configuration = configuration;
        this.logging = logging;
        this.sid = sid;
        this.signallingChannel = signallingChannel;
        this.mediaDevicesManager = mediaDevicesManager;
        this.signallingChannel.addListener(RtcMessage_1.RtcMessage.RTC_ICE, (payload, fromSid) => this.iceListener(fromSid, payload));
        this.signallingChannel.addListener(RtcMessage_1.RtcMessage.RTC_DESCRIPTION, (payload, fromSid) => this.descriptionListener(fromSid, payload));
    }
    isPolite(remoteSid) {
        return this.sid > remoteSid;
    }
    iceListener(remoteSid, ice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log("ice", remoteSid);
            const connection = this.createP2pConnectionIfNecessary(remoteSid);
            if (!connection)
                return;
            try {
                if (ice) {
                    yield connection.pc.addIceCandidate(new RTCIceCandidate(ice));
                }
                else {
                    yield connection.pc.addIceCandidate(null);
                }
            }
            catch (err) {
                if (!connection.ignoreOffer)
                    throw err; // Suppress ignored offer's candidates
            }
        });
    }
    descriptionListener(remoteSid, description) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log("description", remoteSid);
            const connection = this.createP2pConnectionIfNecessary(remoteSid);
            if (!connection)
                return;
            const pc = connection.pc;
            const readyForOffer = !connection.makingOffer && (pc.signalingState === "stable" || connection.isAnswerPending);
            const offerCollision = description.type == "offer" && !readyForOffer;
            connection.ignoreOffer = !this.isPolite(remoteSid) && offerCollision;
            if (connection.ignoreOffer) {
                return;
            }
            connection.isAnswerPending = description.type == "answer";
            yield pc.setRemoteDescription(description); // SRD rolls back as needed
            connection.isAnswerPending = false;
            if (description.type == "offer") {
                yield pc.setLocalDescription();
                this.signallingChannel.send(RtcMessage_1.RtcMessage.RTC_DESCRIPTION, pc.localDescription, remoteSid);
            }
        });
    }
    setSid(sid) {
        this.sid = sid;
    }
    addOutboundStreamTransmission(remoteSid, stream) {
        if (this.logging)
            console.log("adding stream transmission", remoteSid, stream);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        stream.getTracks().forEach((track) => {
            if (!connection.pc.getSenders().some((sender) => { var _a; return ((_a = sender.track) === null || _a === void 0 ? void 0 : _a.id) === track.id; })) {
                connection.pc.addTrack(track, stream);
            }
        });
    }
    removeOutboundStreamTransmission(remoteSid, mediaObjectId) {
        if (this.logging)
            console.log("removing outbound transmission", remoteSid, mediaObjectId);
        const connection = this.connections.get(remoteSid);
        if (!connection)
            return;
        const mediaStreamObject = this.mediaDevicesManager.mediaObjects.get(mediaObjectId);
        if (!mediaStreamObject || !mediaStreamObject.stream)
            return;
        const trackIds = new Set();
        mediaStreamObject.stream.getTracks().forEach((track) => trackIds.add(track.id));
        connection.pc.getSenders().forEach((sender) => {
            if (sender.track && trackIds.has(sender.track.id)) {
                connection.pc.removeTrack(sender);
            }
        });
    }
    createP2pConnectionIfNecessary(remoteSid) {
        if (this.connections.has(remoteSid))
            return this.connections.get(remoteSid);
        if (this.logging)
            console.log("creating p2p connection", remoteSid, this.connections.has(remoteSid));
        const pc = new RTCPeerConnection(this.configuration);
        const connection = {
            pc: pc,
            makingOffer: false,
            ignoreOffer: false,
            isAnswerPending: false,
        };
        this.connections.set(remoteSid, connection);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signallingChannel.send(RtcMessage_1.RtcMessage.RTC_ICE, event.candidate, remoteSid);
            }
            else {
                this.signallingChannel.send(RtcMessage_1.RtcMessage.RTC_ICE, null, remoteSid);
            }
        };
        pc.ontrack = (event) => {
            if (this.logging)
                console.log("on track event", remoteSid, event);
            const streams = new Map();
            event.streams.forEach((stream) => {
                streams.set(stream.id, stream);
            });
            if (!event || !event.target || !event.target.remoteDescription) {
                console.log("no event present", event);
                // FIXME
                return;
            }
            let mid = event.transceiver.mid;
            if (!mid) {
                console.log("no mid present", event);
                //FIXME
                return;
            }
            mid = mid.trim();
            const description = event.target.remoteDescription;
            const sdp = new Sdp_1.Sdp(description.sdp);
            const section = sdp.getSectionWithMid(mid);
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
                const stream = streams.get(mediaObjectId);
                this.mediaDevicesManager.addRemoteMediaStream(remoteSid, mediaObjectId, stream);
            });
        };
        pc.onnegotiationneeded = () => __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log("renogotiating", remoteSid);
            try {
                connection.makingOffer = true;
                yield pc.setLocalDescription();
                this.signallingChannel.send(RtcMessage_1.RtcMessage.RTC_DESCRIPTION, pc.localDescription, remoteSid);
            }
            catch (err) {
                console.error(err);
            }
            finally {
                connection.makingOffer = false;
            }
        });
        pc.oniceconnectionstatechange = (_ev) => {
            // FIXME
        };
        pc.onconnectionstatechange = (_ev) => {
            // FIXME
        };
        return connection;
    }
    translateConnectionState(state) {
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
    connect(remoteSid) {
        if (this.logging)
            console.log("connect", remoteSid, "isPolite", this.isPolite(remoteSid));
        this.createP2pConnectionIfNecessary(remoteSid);
    }
    disconnect(remoteSid) {
        if (this.logging)
            console.log("disconnect", remoteSid);
        const connection = this.connections.get(remoteSid);
        if (!connection)
            return;
        connection.pc.close();
        this.connections.delete(remoteSid);
    }
    getSignallingChannel() {
        return this.signallingChannel;
    }
    destroy() {
        this.connections.forEach((_connection, remoteSid) => {
            this.disconnect(remoteSid);
        });
    }
}
exports.TransmissionManager = TransmissionManager;
//# sourceMappingURL=TransmissionManager.js.map
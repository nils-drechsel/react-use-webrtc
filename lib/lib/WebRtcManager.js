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
Object.defineProperty(exports, "__esModule", { value: true });
const RtcMessage_1 = require("./RtcMessage");
const config = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};
class WebRtcManager {
    constructor(signallingChannel, mediaStreamProvider, sid, logging = true) {
        this.connections = new Map();
        this.logging = logging;
        this.sid = sid;
        this.signallingChannel = signallingChannel;
        this.mediaStreamProvider = mediaStreamProvider;
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
                yield connection.pc.addIceCandidate(new RTCIceCandidate(ice));
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
            const readyForOffer = !connection.makingOffer && (pc.signalingState == "stable" || connection.isAnswerPending);
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
    addStream(remoteSid, stream) {
        if (this.logging)
            console.log("adding stream", remoteSid, stream);
        const connection = this.createP2pConnectionIfNecessary(remoteSid);
        if (!connection)
            return;
        stream.getTracks().forEach(track => connection.pc.addTrack(track, stream));
    }
    removeTracks(remoteSid, trackIds) {
        if (this.logging)
            console.log("removing stream", remoteSid, trackIds);
        if (!this.connections.has(remoteSid))
            return;
        const connection = this.connections.get(remoteSid);
        connection.pc.getSenders().forEach(sender => {
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
        const pc = new RTCPeerConnection(config);
        const connection = { pc: pc, makingOffer: false, ignoreOffer: false, isAnswerPending: false };
        this.connections.set(remoteSid, connection);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signallingChannel.send(RtcMessage_1.RtcMessage.RTC_ICE, event.candidate, remoteSid);
            }
        };
        pc.ontrack = (event) => {
            if (this.logging)
                console.log("on track event", remoteSid, event);
            event.streams.forEach(stream => this.mediaStreamProvider.addMediaStream(remoteSid, stream.id, stream, event.track.id));
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
        return connection;
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
    release() {
        // FIXME
    }
}
exports.WebRtcManager = WebRtcManager;
//# sourceMappingURL=WebRtcManager.js.map
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
exports.MediaDevicesManager = exports.MediaPermissionsException = exports.MediaPermissions = exports.StreamSubType = exports.MediaType = exports.LocalMediaInput = void 0;
const react_use_listeners_1 = require("react-use-listeners");
var LocalMediaInput;
(function (LocalMediaInput) {
    LocalMediaInput["CAMERA"] = "CAMERA";
    LocalMediaInput["SCREEN"] = "SCREEN";
})(LocalMediaInput = exports.LocalMediaInput || (exports.LocalMediaInput = {}));
var MediaType;
(function (MediaType) {
    MediaType[MediaType["STREAM"] = 0] = "STREAM";
    MediaType[MediaType["DATA"] = 1] = "DATA";
})(MediaType = exports.MediaType || (exports.MediaType = {}));
var StreamSubType;
(function (StreamSubType) {
    StreamSubType[StreamSubType["LOCAL_CAMERA"] = 0] = "LOCAL_CAMERA";
    StreamSubType[StreamSubType["LOCAL_SCREEN"] = 1] = "LOCAL_SCREEN";
    StreamSubType[StreamSubType["REMOTE"] = 2] = "REMOTE";
})(StreamSubType = exports.StreamSubType || (exports.StreamSubType = {}));
var MediaPermissions;
(function (MediaPermissions) {
    MediaPermissions["SUCCESS"] = "SUCCESS";
    MediaPermissions["DISALLOWED"] = "DISALLOWED";
    MediaPermissions["FAIL"] = "FAIL";
})(MediaPermissions = exports.MediaPermissions || (exports.MediaPermissions = {}));
class MediaPermissionsException extends Error {
    constructor(permissions) {
        super();
        this.permissions = permissions;
    }
}
exports.MediaPermissionsException = MediaPermissionsException;
class MediaDevicesManager {
    constructor(logging = true) {
        this.videoOutputs = new Map();
        this.mediaObjects = new react_use_listeners_1.ObservedMapImpl();
        this.audioConnections = new Map();
        this.videoDevices = new react_use_listeners_1.ObservedMapImpl();
        this.audioInputDevices = new react_use_listeners_1.ObservedMapImpl();
        this.audioOutputDevices = new react_use_listeners_1.ObservedMapImpl();
        this.permissionListeners = new react_use_listeners_1.DataListeners();
        this.permissions = null;
        this.logging = logging;
        navigator.mediaDevices.ondevicechange = (_event) => this.refreshDevices();
    }
    listenForPermissions(callback) {
        const result = this.permissionListeners.addListener(callback);
        if (this.permissions) {
            callback(this.permissions);
        }
        return result;
    }
    registerVideoOutput(id, ref, objId) {
        if (this.logging)
            console.log('register video output', id, objId);
        this.videoOutputs.set(id, ref);
        if (objId) {
            this.connectStreamToOutput(objId, id);
        }
    }
    deregisterVideoOutput(id) {
        if (this.logging)
            console.log('deregister video output', id);
        //this.stopOutput(id);
        this.videoOutputs.delete(id);
    }
    addRemoteMediaStream(objId, remoteSid, stream) {
        if (this.logging)
            console.log('adding media stream', objId, stream, remoteSid);
        return this.addMediaStreamObject(objId, { objId, type: MediaType.STREAM, subType: StreamSubType.REMOTE, stream, remoteSid }, stream);
    }
    addLocalCameraStream(objId, stream) {
        if (this.logging)
            console.log('adding local camera stream', objId, stream);
        return this.addMediaStreamObject(objId, { objId, type: MediaType.STREAM, subType: StreamSubType.LOCAL_CAMERA, stream }, stream);
    }
    addLocalScreenStream(objId, stream) {
        if (this.logging)
            console.log('adding local screen stream', objId, stream);
        return this.addMediaStreamObject(objId, { objId, type: MediaType.STREAM, subType: StreamSubType.LOCAL_SCREEN, stream }, stream);
    }
    updateStreamDimensions(objId, width, height) {
        const mediaObj = this.mediaObjects.get(objId);
        if (!mediaObj || mediaObj.type !== MediaType.STREAM)
            return;
        const mediaStreamObject = mediaObj;
        mediaStreamObject.width = width;
        mediaStreamObject.height = height;
        this.mediaObjects.modify(objId);
    }
    getStreamDimensions(stream) {
        const videoTracks = stream.getVideoTracks();
        const width = videoTracks.length > 0 ? videoTracks[0].getSettings().width || null : null;
        const height = videoTracks.length > 0 ? videoTracks[0].getSettings().height || null : null;
        return [width, height];
    }
    addMediaStreamObject(objId, mediaStreamObject, stream) {
        if (this.mediaObjects.has(objId)) {
            const [width, height] = this.getStreamDimensions(stream);
            const streamObject = this.mediaObjects.get(objId);
            if (streamObject.stream) {
                this.stopMediaStream(streamObject.stream);
            }
            streamObject.stream = stream;
            this.addStreamListeners(objId, streamObject, stream);
            if (width)
                streamObject.width = width;
            if (height)
                streamObject.height = height;
            this.mediaObjects.modify(objId);
            return streamObject;
        }
        const [width, height] = this.getStreamDimensions(stream);
        mediaStreamObject.width = width;
        mediaStreamObject.height = height;
        mediaStreamObject.hasVideo = Array.from(stream.getVideoTracks()).length > 0;
        mediaStreamObject.hasAudio = Array.from(stream.getAudioTracks()).length > 0;
        this.addStreamListeners(objId, mediaStreamObject, stream);
        this.mediaObjects.set(objId, mediaStreamObject);
        return mediaStreamObject;
    }
    addStreamListeners(objId, mediaObject, stream) {
        // remove stream when one of the tracks has ended
        stream.getTracks().forEach(track => {
            track.onended = () => {
                if (this.logging)
                    console.log("track has ended", objId);
                this.mediaObjects.delete(objId);
            };
        });
        stream.onaddtrack = ((_e) => {
            if (this.logging)
                console.log('track was added', objId, stream);
            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }
            this.mediaObjects.modify(objId);
        });
        stream.onremovetrack = ((_e) => {
            if (this.logging)
                console.log('track was removed', objId, stream);
            if (stream.getTracks().length == 0)
                this.mediaObjects.delete(objId);
            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }
            this.mediaObjects.modify(objId);
        });
    }
    stopStream(objId) {
        if (!this.mediaObjects.has(objId))
            return;
        const obj = this.mediaObjects.get(objId);
        // stop stream in case it's of type STREAM
        if (obj.type !== MediaType.STREAM)
            return;
        const mediaObject = obj;
        if (this.logging)
            console.log('stopping stream', objId);
        if (mediaObject.stream)
            this.stopMediaStream(mediaObject.stream);
    }
    stopMediaStream(stream) {
        stream === null || stream === void 0 ? void 0 : stream.getTracks().forEach(track => track.stop());
    }
    removeMediaObject(objId) {
        this.stopStream(objId);
        this.mediaObjects.delete(objId);
    }
    connectStreamToOutput(objId, outputId) {
        if (this.logging)
            console.log('connecting stream to output', objId, outputId);
        if (!this.mediaObjects.has(objId))
            throw new Error("stream with id: " + objId + " is not available");
        if (!this.videoOutputs.has(outputId))
            throw new Error("output with id: " + outputId + " is not available");
        const mediaObject = this.mediaObjects.get(objId);
        if (mediaObject.type !== MediaType.STREAM)
            return;
        const mediaStreamObject = mediaObject;
        mediaStreamObject.videoOutput = outputId;
        if (mediaObject.type !== MediaType.STREAM)
            throw new Error("media object " + objId + " is not a stream");
        const stream = mediaObject.stream;
        const output = this.videoOutputs.get(outputId);
        //this.stopOutput(outputId);
        output.current.srcObject = stream;
    }
    connectAudioOutputToVideoOutput(audioId, outputId) {
        if (this.logging)
            console.log('connecting audio output to video output', audioId, outputId);
        if (!this.audioOutputDevices.has(audioId))
            throw new Error("audio output with id: " + audioId + " is not available");
        if (!this.videoOutputs.has(outputId))
            throw new Error("output with id: " + outputId + " is not available");
        const audio = this.audioOutputDevices.get(audioId).info;
        const output = this.videoOutputs.get(outputId);
        const videoElement = output.current;
        this.audioConnections.set(outputId, audioId);
        videoElement.setSinkId(audio.deviceId);
    }
    requestMediaPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const constraints = { video: true, audio: true };
            try {
                const feed = yield this.getVideoFeed(constraints);
                feed.getTracks().forEach(track => track.stop);
            }
            catch (e) {
                if (e instanceof DOMException) {
                    switch (e.name) {
                        case "NotAllowedError":
                            return MediaPermissions.DISALLOWED;
                        case "NotFoundError":
                        case "OverconstrainedError":
                            return MediaPermissions.SUCCESS;
                        default:
                            return MediaPermissions.FAIL;
                    }
                }
                else {
                    return MediaPermissions.FAIL;
                }
            }
            return MediaPermissions.SUCCESS;
        });
    }
    assertMediaPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.permissions !== MediaPermissions.SUCCESS) {
                this.permissions = yield this.requestMediaPermissions();
            }
            if (this.permissions !== MediaPermissions.SUCCESS) {
                throw new MediaPermissionsException(this.permissions);
            }
        });
    }
    getCameraStream(objId, cameraDeviceId, audioDeviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log('local camera stream', cameraDeviceId, audioDeviceId);
            yield this.assertMediaPermissions();
            const constraints = { video: true, audio: true };
            if (cameraDeviceId)
                Object.assign(constraints, { video: { deviceId: { exact: cameraDeviceId } } });
            if (audioDeviceId)
                Object.assign(constraints, { audio: { deviceId: { exact: audioDeviceId } } });
            return yield this.getStream(objId, false, constraints);
        });
    }
    getScreenStream(objId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertMediaPermissions();
            this.removeMediaObject(objId);
            return yield this.getStream(objId, true, undefined);
        });
    }
    getVideoFeed(constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            return navigator.mediaDevices.getUserMedia(constraints);
        });
    }
    getScreenFeed() {
        return __awaiter(this, void 0, void 0, function* () {
            return navigator.mediaDevices.getDisplayMedia();
        });
    }
    getStream(objId, screenshare, constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log('loading stream', objId);
            try {
                let stream;
                if (screenshare) {
                    stream = yield this.getScreenFeed();
                    return this.addLocalScreenStream(objId, stream);
                }
                else {
                    stream = yield this.getVideoFeed(constraints);
                    return this.addLocalCameraStream(objId, stream);
                }
            }
            catch (e) {
                if (this.logging)
                    console.log("error loading stream", e);
                throw new Error("stream is unavailable");
            }
        });
    }
    hasMediaObject(objId) {
        return this.mediaObjects.has(objId);
    }
    getMediaObject(objId) {
        return this.mediaObjects.get(objId);
    }
    createDeviceLabel(map, info) {
        if (info.label)
            return info.label.replace(/ *\([^)]*\) */g, "");
        if (info.kind === "videoinput")
            return "Camera " + (map.size + 1);
        if (info.kind === "audioinput")
            return "Microphone " + (map.size + 1);
        if (info.kind === "audiooutput")
            return "Speaker " + (map.size + 1);
        throw new Error("unknown device " + info);
    }
    refreshDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log("refreshing devices");
            try {
                const devices = yield navigator.mediaDevices.enumerateDevices();
                devices.forEach(device => {
                    if (device.kind === "videoinput")
                        this.videoDevices.set(device.deviceId, { id: device.deviceId, label: this.createDeviceLabel(this.videoDevices, device), info: device });
                    if (device.kind === "audioinput")
                        this.audioInputDevices.set(device.deviceId, { id: device.deviceId, label: this.createDeviceLabel(this.audioInputDevices, device), info: device });
                    if (device.kind === "audiooutput")
                        this.audioOutputDevices.set(device.deviceId, { id: device.deviceId, label: this.createDeviceLabel(this.audioOutputDevices, device), info: device });
                });
            }
            catch (e) {
                // FIXME
            }
        });
    }
    destroy() {
        Array.from(this.mediaObjects.keys()).forEach((objId) => {
            this.removeMediaObject(objId);
        });
    }
    getMediaConstraints() {
        return navigator.mediaDevices.getSupportedConstraints();
    }
    getVideoOutputs() {
        return this.videoOutputs;
    }
}
exports.MediaDevicesManager = MediaDevicesManager;
//# sourceMappingURL=MediaDevicesManager.js.map
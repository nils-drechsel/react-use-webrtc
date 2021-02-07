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
const react_use_listeners_1 = require("react-use-listeners");
var MediaIdent;
(function (MediaIdent) {
    MediaIdent["LOCAL"] = "LOCAL";
})(MediaIdent = exports.MediaIdent || (exports.MediaIdent = {}));
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
exports.makeMediaId = (bundleId, streamId) => {
    return bundleId + '/' + streamId;
};
class MediaDevicesManager {
    constructor(logging = true) {
        this.devices = null;
        this.videoOutputs = new Map();
        this.bundles = new Map();
        this.videoStreamConnections = new Map();
        this.audioConnections = new Map();
        this.deviceListeners = new react_use_listeners_1.DataListeners();
        this.anyBundleListeners = new react_use_listeners_1.IdListeners();
        this.bundleListeners = new react_use_listeners_1.IdListeners();
        this.permissionListeners = new react_use_listeners_1.DataListeners();
        this.permissions = null;
        this.logging = logging;
        navigator.mediaDevices.ondevicechange = (_event) => this.refreshDevices();
        this.initBundleIfNecessary(MediaIdent.LOCAL);
    }
    listenForPermissions(callback) {
        const result = this.permissionListeners.addListener(callback);
        if (this.permissions) {
            callback(this.permissions);
        }
        return result;
    }
    registerVideoOutput(id, ref, bundleId, objId) {
        if (this.logging)
            console.log('register video output', id, bundleId, objId);
        this.videoOutputs.set(id, ref);
        if (bundleId && objId) {
            this.connectStreamToOutput(bundleId, objId, id);
        }
    }
    deregisterVideoOutput(id) {
        if (this.logging)
            console.log('deregister video output', id);
        //this.stopOutput(id);
        this.videoOutputs.delete(id);
    }
    initBundleIfNecessary(bundleId) {
        if (!this.bundles.has(bundleId)) {
            this.bundles.set(bundleId, { bundleId, objs: new Map() });
            this.anyBundleListeners.addId(bundleId);
        }
    }
    addMediaStream(bundleId, objId, stream) {
        if (this.logging)
            console.log('adding media stream', bundleId, objId, stream);
        return this.addMediaStreamObject(bundleId, objId, MediaType.STREAM, StreamSubType.REMOTE, stream, null);
    }
    addLocalCameraStream(bundleId, objId, stream) {
        if (this.logging)
            console.log('adding local camera stream', bundleId, objId, stream);
        return this.addMediaStreamObject(bundleId, objId, MediaType.STREAM, StreamSubType.LOCAL_CAMERA, stream, null);
    }
    addLocalScreenStream(bundleId, objId, stream) {
        if (this.logging)
            console.log('adding local screen stream', bundleId, objId, stream);
        return this.addMediaStreamObject(bundleId, objId, MediaType.STREAM, StreamSubType.LOCAL_SCREEN, stream, null);
    }
    updateStreamDimensions(bundleId, objId, width, height) {
        if (!this.bundles.has(bundleId))
            return;
        const bundle = this.bundles.get(bundleId);
        if (!bundle.objs.has(objId))
            return;
        const obj = bundle.objs.get(objId);
        if (!(obj.type === MediaType.STREAM))
            return;
        const mediaStreamObject = obj;
        mediaStreamObject.width = width;
        mediaStreamObject.height = height;
        this.bundleListeners.modifyId(objId, bundleId);
    }
    getStreamDimensions(stream) {
        const videoTracks = stream.getVideoTracks();
        const width = videoTracks.length > 0 ? videoTracks[0].getSettings().width || null : null;
        const height = videoTracks.length > 0 ? videoTracks[0].getSettings().height || null : null;
        return [width, height];
    }
    addMediaStreamObject(bundleId, objId, type, subType, stream, videoOutput) {
        this.initBundleIfNecessary(bundleId);
        const bundle = this.bundles.get(bundleId);
        if (bundle.objs.has(objId)) {
            const [width, height] = this.getStreamDimensions(stream);
            const streamObject = bundle.objs.get(objId);
            streamObject.stream = stream;
            this.addStreamListeners(bundleId, objId, streamObject, stream);
            if (width)
                streamObject.width = width;
            if (height)
                streamObject.height = height;
            this.bundleListeners.modifyId(objId, bundleId);
            return streamObject;
        }
        const [width, height] = this.getStreamDimensions(stream);
        const hasVideo = Array.from(stream.getVideoTracks()).length > 0;
        const hasAudio = Array.from(stream.getAudioTracks()).length > 0;
        const mediaObject = {
            bundleId, objId, type, subType, stream, videoOutput, width, height, hasVideo, hasAudio
        };
        this.addStreamListeners(bundleId, objId, mediaObject, stream);
        bundle.objs.set(objId, mediaObject);
        this.bundleListeners.addId(objId, bundleId);
        return mediaObject;
    }
    addStreamListeners(bundleId, objId, mediaObject, stream) {
        // remove stream when one of the tracks has ended
        stream.getTracks().forEach(track => {
            track.onended = () => {
                if (this.logging)
                    console.log("track has ended", bundleId, objId);
                this.removeMediaObject(bundleId, objId);
            };
        });
        stream.onaddtrack = ((_e) => {
            if (this.logging)
                console.log('track was added', bundleId, objId, stream);
            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }
            this.bundleListeners.modifyId(objId, bundleId);
        });
        stream.onremovetrack = ((_e) => {
            if (this.logging)
                console.log('track was removed', bundleId, objId, stream);
            if (stream.getTracks().length == 0)
                this.removeMediaObject(bundleId, objId);
            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }
            this.bundleListeners.modifyId(objId, bundleId);
        });
    }
    addInvalidMediaObject() {
    }
    removeMediaObject(bundleId, objId) {
        if (this.logging)
            console.log('remove media object', bundleId, objId);
        if (!this.bundles.has(bundleId))
            return;
        const bundle = this.bundles.get(bundleId);
        if (!bundle.objs.has(objId))
            return;
        this.stopStream(bundleId, objId);
        bundle.objs.delete(objId);
        this.bundleListeners.removeId(objId, bundleId);
    }
    stopStream(bundleId, objId) {
        var _a;
        if (this.logging)
            console.log('stopping stream', bundleId, objId);
        if (!this.bundles.has(bundleId))
            return;
        const bundle = this.bundles.get(bundleId);
        if (!bundle.objs.has(objId))
            return;
        const obj = bundle.objs.get(objId);
        // stop stream in case it's of type STREAM
        if (obj.type !== MediaType.STREAM)
            return;
        const mediaObject = obj;
        (_a = mediaObject.stream) === null || _a === void 0 ? void 0 : _a.getTracks().forEach(track => track.stop());
    }
    destroyBundle(bundleId) {
        if (this.logging)
            console.log('destroying bundle', bundleId);
        const bundle = this.bundles.get(bundleId);
        bundle.objs.forEach((_obj, objId) => {
            this.removeMediaObject(bundleId, objId);
        });
        this.bundles.delete(bundleId);
        this.anyBundleListeners.removeId(bundleId);
    }
    connectStreamToOutput(bundleId, objId, outputId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log('connecting stream to output', bundleId, objId, outputId);
            if (!this.bundles.has(bundleId))
                throw new Error("bundle with id: " + bundleId + " is not available");
            if (!this.videoOutputs.has(outputId))
                throw new Error("output with id: " + outputId + " is not available");
            const bundle = this.bundles.get(bundleId);
            if (!bundle.objs.has(objId))
                throw new Error("stream with id: " + objId + " is not available");
            const mediaObject = bundle.objs.get(objId);
            if (mediaObject.type !== MediaType.STREAM)
                return;
            const mediaStreamObject = mediaObject;
            mediaStreamObject.videoOutput = outputId;
            if (mediaObject.type !== MediaType.STREAM)
                throw new Error("media object " + bundleId + " " + objId + " is not a stream");
            const stream = mediaObject.stream;
            const output = this.videoOutputs.get(outputId);
            //this.stopOutput(outputId);
            output.current.srcObject = stream;
        });
    }
    connectAudioOutputToVideoOutput(audioId, outputId) {
        if (this.logging)
            console.log('connecting audio output to video output', audioId, outputId);
        if (!this.devices.audioOutput.has(audioId))
            throw new Error("audio output with id: " + audioId + " is not available");
        if (!this.videoOutputs.has(outputId))
            throw new Error("output with id: " + outputId + " is not available");
        const audio = this.devices.audioOutput.get(audioId).info;
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
    createCameraId(cameraDeviceId, audioDeviceId) {
        if (!cameraDeviceId && !audioDeviceId)
            throw new Error("camera and audio devices are both null");
        const ids = [];
        if (cameraDeviceId)
            ids.push(cameraDeviceId);
        if (audioDeviceId)
            ids.push(audioDeviceId);
        return ids.join("/");
    }
    getCameraStream(objId, cameraDeviceId, audioDeviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log('local camera stream', cameraDeviceId, audioDeviceId);
            yield this.assertMediaPermissions();
            this.removeMediaObject(MediaIdent.LOCAL, objId);
            if (this.hasMediaObject(MediaIdent.LOCAL, objId)) {
                return this.getMediaObject(MediaIdent.LOCAL, objId);
            }
            const constraints = { video: true, audio: true };
            if (cameraDeviceId)
                Object.assign(constraints, { video: { deviceId: { exact: cameraDeviceId } } });
            if (audioDeviceId)
                Object.assign(constraints, { audio: { deviceId: { exact: audioDeviceId } } });
            return yield this.getStream(MediaIdent.LOCAL, this.createCameraId(cameraDeviceId, audioDeviceId), false, constraints);
        });
    }
    getScreenStream() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertMediaPermissions();
            this.removeMediaObject(MediaIdent.LOCAL, LocalMediaInput.SCREEN);
            return yield this.getStream(MediaIdent.LOCAL, LocalMediaInput.SCREEN, true, undefined);
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
    getStream(bundleId, objId, screenshare, constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log('loading stream', bundleId, objId);
            this.initBundleIfNecessary(bundleId);
            try {
                let stream;
                if (screenshare) {
                    stream = yield this.getScreenFeed();
                    return this.addLocalScreenStream(bundleId, objId, stream);
                }
                else {
                    stream = yield this.getVideoFeed(constraints);
                    return this.addLocalCameraStream(bundleId, objId, stream);
                }
            }
            catch (e) {
                if (this.logging)
                    console.log("error loading stream", e);
                throw new Error("stream is unavailable");
            }
        });
    }
    hasMediaObject(bundleId, objId) {
        if (!this.bundles.has(bundleId))
            return false;
        const bundle = this.bundles.get(bundleId);
        return bundle.objs.has(objId);
    }
    getMediaObject(bundleId, objId) {
        if (!this.bundles.has(bundleId))
            return null;
        const bundle = this.bundles.get(bundleId);
        if (!bundle.objs.has(objId))
            return null;
        return bundle.objs.get(objId);
    }
    getMediaBundle(bundleId) {
        if (!this.bundles.has(bundleId))
            return null;
        const bundle = this.bundles.get(bundleId);
        return bundle;
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
    listenForDevices(listener) {
        const unsubscribe = this.deviceListeners.addListener(listener);
        if (this.devices)
            listener(this.devices);
        return unsubscribe;
    }
    notifyDeviceListeners() {
        this.deviceListeners.forEach(listener => listener(this.devices));
    }
    listenForAnyBundle(listener) {
        return this.anyBundleListeners.addListener(listener);
    }
    listenForBundle(bundleId, listener) {
        return this.bundleListeners.addListener(listener, bundleId);
    }
    listenForObject(bundleId, objectId, listener) {
        return this.bundleListeners.addIdListener(objectId, listener, bundleId);
    }
    refreshDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.logging)
                console.log("refreshing devices");
            const devices = yield navigator.mediaDevices.enumerateDevices();
            const videoDevices = new Map();
            const audioInputDevices = new Map();
            const audioOutputDevices = new Map();
            devices.forEach(device => {
                if (device.kind === "videoinput")
                    videoDevices.set(device.deviceId, { label: this.createDeviceLabel(videoDevices, device), info: device });
                if (device.kind === "audioinput")
                    audioInputDevices.set(device.deviceId, { label: this.createDeviceLabel(videoDevices, device), info: device });
                if (device.kind === "audiooutput")
                    audioOutputDevices.set(device.deviceId, { label: this.createDeviceLabel(videoDevices, device), info: device });
            });
            this.devices = {
                video: videoDevices,
                audioOutput: audioOutputDevices,
                audioInput: audioInputDevices,
            };
            this.notifyDeviceListeners();
            return this.devices;
        });
    }
    destroy() {
        Array.from(this.bundles.keys()).forEach((bundleId) => {
            this.destroyBundle(bundleId);
        });
    }
    getMediaConstraints() {
        return navigator.mediaDevices.getSupportedConstraints();
    }
    removeMediaStreams(bundleId) {
        this.destroyBundle(bundleId);
    }
    getVideoOutputs() {
        return this.videoOutputs;
    }
}
exports.MediaDevicesManager = MediaDevicesManager;
//# sourceMappingURL=MediaDevicesManager.js.map
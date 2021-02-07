import { MutableRefObject } from "react";
import { DataListeners, ListenerEvent, IdListeners } from "react-use-listeners";
import { UnsubscribeCallback } from "react-use-listeners";
import { DataListenerCallback } from "react-use-listeners/lib/lib/Listeners";


export enum MediaIdent {
    LOCAL = 'LOCAL',
}

export enum LocalMediaInput {
    CAMERA = 'CAMERA',
    SCREEN = 'SCREEN',
}

export type MediaDevice = {
    label: string;
    info: MediaDeviceInfo;
}

export enum MediaType {
    STREAM,
    DATA
}

export enum StreamSubType {
    LOCAL_CAMERA,
    LOCAL_SCREEN,
    REMOTE
}

export interface MediaObject {
    type: MediaType;
    bundleId: string;
    objId: string;
}

export interface MediaStreamObject extends MediaObject {
    subType: StreamSubType;
    stream: MediaStream | null;
    width: number | null;
    height: number | null;
    hasVideo: boolean;
    hasAudio: boolean;
    videoOutput: string | null;
}

export interface MediaBundle {
    bundleId: string,
    objs: Map<string, MediaObject>;
}

export enum MediaPermissions {
    SUCCESS = "SUCCESS",
    DISALLOWED = "DISALLOWED",
    FAIL = "FAIL"
}

export class MediaPermissionsException extends Error {
    permissions: MediaPermissions;

    constructor(permissions: MediaPermissions) {
        super();
        this.permissions = permissions;
    }
}

export const makeMediaId = (bundleId: string, streamId: string): string => {
        return bundleId + '/' + streamId;
}


export interface Devices {
    video: Map<string, MediaDevice>;
    audioInput: Map<string, MediaDevice>;
    audioOutput: Map<string, MediaDevice>;
}

export class MediaDevicesManager {

    devices: Devices | null = null;
    videoOutputs: Map<string, MutableRefObject<HTMLVideoElement>> = new Map();

    bundles: Map<string, MediaBundle> = new Map();

    videoStreamConnections: Map<string, string> = new Map();
    audioConnections: Map<string, string> = new Map();

    deviceListeners: DataListeners<Devices> = new DataListeners();

    anyBundleListeners: IdListeners = new IdListeners();
    bundleListeners: IdListeners = new IdListeners();

    permissionListeners: DataListeners<MediaPermissions> = new DataListeners();

    logging: boolean;

    permissions: MediaPermissions  | null = null;

    constructor(logging = true) {
        this.logging = logging;
        navigator.mediaDevices.ondevicechange = (_event: Event) => this.refreshDevices();
        this.initBundleIfNecessary(MediaIdent.LOCAL);
    }


    listenForPermissions(callback: DataListenerCallback<MediaPermissions>): UnsubscribeCallback {
        const result = this.permissionListeners.addListener(callback);
        if (this.permissions) {
            callback(this.permissions);
        }
        return result;
    }

    registerVideoOutput(id: string, ref: MutableRefObject<HTMLVideoElement>, bundleId?: string, objId?: string) {
        if (this.logging) console.log('register video output', id, bundleId, objId);
        this.videoOutputs.set(id, ref);
        if (bundleId && objId) {
            this.connectStreamToOutput(bundleId, objId, id);
        }
    }

    deregisterVideoOutput(id: string) {
        if (this.logging) console.log('deregister video output', id);
        //this.stopOutput(id);
        this.videoOutputs.delete(id);
    }

    private initBundleIfNecessary(bundleId: string) {
        if (!this.bundles.has(bundleId)) {
            this.bundles.set(bundleId, { bundleId, objs: new Map() });
            this.anyBundleListeners.addId(bundleId);
        }
    }



    addMediaStream(bundleId: string, objId: string, stream: MediaStream): MediaStreamObject {
        if (this.logging) console.log('adding media stream', bundleId, objId, stream);

        return this.addMediaStreamObject(bundleId, objId, MediaType.STREAM, StreamSubType.REMOTE, stream, null);
    }

    addLocalCameraStream(bundleId: string, objId: string, stream: MediaStream): MediaStreamObject {
        if (this.logging) console.log('adding local camera stream', bundleId, objId, stream);

        return this.addMediaStreamObject(bundleId, objId, MediaType.STREAM, StreamSubType.LOCAL_CAMERA, stream, null);
    }

    addLocalScreenStream(bundleId: string, objId: string, stream: MediaStream): MediaStreamObject {
        if (this.logging) console.log('adding local screen stream', bundleId, objId, stream);

        return this.addMediaStreamObject(bundleId, objId, MediaType.STREAM, StreamSubType.LOCAL_SCREEN, stream, null);
    }

    updateStreamDimensions(bundleId: string, objId: string, width: number, height: number) {
        if (!this.bundles.has(bundleId)) return;
        const bundle = this.bundles.get(bundleId)!;
        if (!bundle.objs.has(objId)) return;
        const obj = bundle.objs.get(objId)!;
        if (!(obj.type === MediaType.STREAM)) return;
        const mediaStreamObject = obj as MediaStreamObject;
        mediaStreamObject.width = width;
        mediaStreamObject.height = height;

        this.bundleListeners.modifyId(objId, bundleId);

    }

    private getStreamDimensions(stream: MediaStream): [number | null, number | null] {
        const videoTracks = stream.getVideoTracks();

        const width = videoTracks.length > 0 ? videoTracks[0].getSettings().width || null: null;
        const height = videoTracks.length > 0 ? videoTracks[0].getSettings().height || null : null;
        
        return [width, height];
    }

    private addMediaStreamObject(bundleId: string, objId: string, type: MediaType, subType: StreamSubType, stream: MediaStream, videoOutput: string | null): MediaStreamObject {
        this.initBundleIfNecessary(bundleId);
        const bundle = this.bundles.get(bundleId)!;

        if (bundle.objs.has(objId)) {

            const [width, height] = this.getStreamDimensions(stream);

            const streamObject = (bundle.objs.get(objId) as MediaStreamObject);
            streamObject.stream = stream;
            this.addStreamListeners(bundleId, objId, streamObject, stream);
            if (width) streamObject.width = width;
            if (height) streamObject.height = height;


            this.bundleListeners.modifyId(objId, bundleId);

            return streamObject;
        }

        const [width, height] = this.getStreamDimensions(stream);

        const hasVideo: boolean = Array.from(stream.getVideoTracks()).length > 0;
        const hasAudio: boolean = Array.from(stream.getAudioTracks()).length > 0;

        const mediaObject: MediaStreamObject = {
            bundleId, objId, type, subType, stream, videoOutput, width, height, hasVideo, hasAudio
        }

        this.addStreamListeners(bundleId, objId, mediaObject, stream);        

        bundle.objs.set(objId, mediaObject);


        this.bundleListeners.addId(objId, bundleId);

        return mediaObject;
    }

    private addStreamListeners(bundleId: string, objId: string, mediaObject: MediaStreamObject, stream: MediaStream) {
        // remove stream when one of the tracks has ended
        stream.getTracks().forEach(track => {
            track.onended = () => {
                if (this.logging) console.log("track has ended", bundleId, objId)
                this.removeMediaObject(bundleId, objId);
            }
        });

        stream.onaddtrack = ((_e: MediaStreamTrackEvent) => {
            if (this.logging) console.log('track was added', bundleId, objId, stream);
            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }

            this.bundleListeners.modifyId(objId, bundleId);
        });
        
        stream.onremovetrack = ((_e: MediaStreamTrackEvent) => {
            if (this.logging) console.log('track was removed', bundleId, objId, stream);

            if (stream.getTracks().length == 0) this.removeMediaObject(bundleId, objId);

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


    removeMediaObject(bundleId: string, objId: string) {
        if (this.logging) console.log('remove media object', bundleId, objId);
        if (!this.bundles.has(bundleId)) return;
        const bundle = this.bundles.get(bundleId)!;

        if (!bundle.objs.has(objId)) return;

        this.stopStream(bundleId, objId);

        bundle.objs.delete(objId);

        this.bundleListeners.removeId(objId, bundleId);
    }

    stopStream(bundleId: string, objId: string) {
        if (this.logging) console.log('stopping stream', bundleId, objId);
        if (!this.bundles.has(bundleId)) return;
        const bundle = this.bundles.get(bundleId)!;
        if (!bundle.objs.has(objId)) return;
        const obj = bundle.objs.get(objId)!;

        // stop stream in case it's of type STREAM
        if (obj.type !== MediaType.STREAM) return;
        const mediaObject: MediaStreamObject = obj as MediaStreamObject;
        mediaObject.stream?.getTracks().forEach(track => track.stop());
    }

    destroyBundle(bundleId: string) {
        if (this.logging) console.log('destroying bundle', bundleId);
        const bundle = this.bundles.get(bundleId)!;
        bundle.objs.forEach((_obj, objId) => {
            this.removeMediaObject(bundleId, objId);
        });
        this.bundles.delete(bundleId);
        this.anyBundleListeners.removeId(bundleId);
    }    

    async connectStreamToOutput(bundleId: string, objId: string, outputId: string) {
        if (this.logging) console.log('connecting stream to output', bundleId, objId, outputId);

        if (!this.bundles.has(bundleId)) throw new Error("bundle with id: " + bundleId + " is not available");
        if (!this.videoOutputs.has(outputId)) throw new Error("output with id: " + outputId + " is not available");

        const bundle: MediaBundle = this.bundles.get(bundleId)!; 

        if (!bundle.objs.has(objId)) throw new Error("stream with id: " + objId + " is not available");

        const mediaObject = bundle.objs.get(objId)!;

        if (mediaObject.type !== MediaType.STREAM) return;

        const mediaStreamObject = mediaObject as MediaStreamObject;

        mediaStreamObject.videoOutput = outputId;

        if (mediaObject.type !== MediaType.STREAM) throw new Error("media object " + bundleId + " " + objId + " is not a stream");
        const stream = (mediaObject as MediaStreamObject).stream;        

        const output: MutableRefObject<HTMLVideoElement> = this.videoOutputs.get(outputId)!;

        //this.stopOutput(outputId);

        output.current.srcObject = stream;
    }

    connectAudioOutputToVideoOutput(audioId: string, outputId: string) {
        if (this.logging) console.log('connecting audio output to video output', audioId, outputId);

        if (!this.devices!.audioOutput.has(audioId)) throw new Error("audio output with id: " + audioId + " is not available");
        if (!this.videoOutputs.has(outputId)) throw new Error("output with id: " + outputId + " is not available");

        const audio: MediaDeviceInfo = this.devices!.audioOutput.get(audioId)!.info;
        const output: MutableRefObject<HTMLVideoElement> = this.videoOutputs.get(outputId)!;
        const videoElement: any = output.current;

        this.audioConnections.set(outputId, audioId);

        videoElement.setSinkId(audio.deviceId);

    }


    private async requestMediaPermissions(): Promise<MediaPermissions> {
        const constraints = { video: true, audio: true };
        try {
            const feed = await this.getVideoFeed(constraints);
            feed.getTracks().forEach(track => track.stop);
        } catch (e) {
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
            } else {
                return MediaPermissions.FAIL;
            }
        }
        return MediaPermissions.SUCCESS;
    }

    private async assertMediaPermissions() {
        if (this.permissions !== MediaPermissions.SUCCESS) {
            this.permissions = await this.requestMediaPermissions();
        }
        if (this.permissions !== MediaPermissions.SUCCESS) {
            throw new MediaPermissionsException(this.permissions);
        }
    }


    createCameraId(cameraDeviceId: string | null, audioDeviceId: string | null) {
        if (!cameraDeviceId && !audioDeviceId) throw new Error("camera and audio devices are both null");
        const ids: Array<string> = [];
        if (cameraDeviceId) ids.push(cameraDeviceId);
        if (audioDeviceId) ids.push(audioDeviceId);
        return ids.join("/");
    }


    async getCameraStream(objId: string, cameraDeviceId: string | null, audioDeviceId: string | null): Promise<MediaStreamObject> {
        if (this.logging) console.log('local camera stream', cameraDeviceId, audioDeviceId);

        await this.assertMediaPermissions();

        this.removeMediaObject(MediaIdent.LOCAL, objId);

        if (this.hasMediaObject(MediaIdent.LOCAL, objId)) {
            return this.getMediaObject(MediaIdent.LOCAL, objId) as MediaStreamObject;
        }
        
        const constraints = {video: true, audio: true};
        if (cameraDeviceId) Object.assign(constraints, { video: { deviceId: { exact: cameraDeviceId } } });
        if (audioDeviceId) Object.assign(constraints, { audio: { deviceId: { exact: audioDeviceId } } });

        
        return await this.getStream(MediaIdent.LOCAL, this.createCameraId(cameraDeviceId, audioDeviceId), false, constraints);
    }

    async getScreenStream(): Promise<MediaStreamObject> {
        await this.assertMediaPermissions();

        this.removeMediaObject(MediaIdent.LOCAL, LocalMediaInput.SCREEN);

        return await this.getStream(MediaIdent.LOCAL, LocalMediaInput.SCREEN, true, undefined);
    }    

    private async getVideoFeed(constraints?: MediaStreamConstraints): Promise<MediaStream> {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

    private async getScreenFeed(): Promise<MediaStream> {
        return (navigator.mediaDevices as any).getDisplayMedia();
    }


    private async getStream(bundleId: string, objId: string, screenshare: boolean, constraints?: MediaStreamConstraints | undefined): Promise<MediaStreamObject> {
        if (this.logging) console.log('loading stream', bundleId, objId);

        this.initBundleIfNecessary(bundleId);

        try {

            let stream: MediaStream;

            if (screenshare) {
                stream = await this.getScreenFeed();
                return this.addLocalScreenStream(bundleId, objId, stream);
            } else {
                stream = await this.getVideoFeed(constraints);
                return this.addLocalCameraStream(bundleId, objId, stream);
            }

        } catch (e) {
            if (this.logging) console.log("error loading stream", e);
            throw new Error("stream is unavailable");
        }
    }

    hasMediaObject(bundleId: string, objId: string) {
        if (!this.bundles.has(bundleId)) return false;
        const bundle = this.bundles.get(bundleId)!;
        return bundle.objs.has(objId);
    }

    getMediaObject(bundleId: string, objId: string): MediaObject | null {
        if (!this.bundles.has(bundleId)) return null;
        const bundle = this.bundles.get(bundleId)!;
        if (!bundle.objs.has(objId)) return null;
        return bundle.objs.get(objId)!;
    }

    getMediaBundle(bundleId: string): MediaBundle | null {
        if (!this.bundles.has(bundleId)) return null;
        const bundle = this.bundles.get(bundleId)!;
        return bundle;
    }



    private createDeviceLabel(map: Map<string, MediaDevice>, info: MediaDeviceInfo): string {
        if (info.label) return info.label.replace(/ *\([^)]*\) */g, "");
        if (info.kind === "videoinput") return "Camera " + (map.size + 1);
        if (info.kind === "audioinput") return "Microphone " + (map.size + 1);
        if (info.kind === "audiooutput") return "Speaker " + (map.size + 1);
        throw new Error("unknown device " + info);
    }

    listenForDevices(listener: (devices: Devices) => void): UnsubscribeCallback {
        const unsubscribe = this.deviceListeners.addListener(listener);
        if (this.devices) listener(this.devices);
        return unsubscribe;
    }

    notifyDeviceListeners() {
        this.deviceListeners.forEach(listener => listener(this.devices!));
    }    

    listenForAnyBundle(listener: (bundleId: string, event: ListenerEvent) => void): UnsubscribeCallback {
        return this.anyBundleListeners.addListener(listener);
    }

    listenForBundle(bundleId: string, listener: (objId: string, event: ListenerEvent) => void) {
        return this.bundleListeners.addListener(listener, bundleId);
    }

    listenForObject(bundleId: string, objectId:string, listener: (event: ListenerEvent) => void): UnsubscribeCallback {
        return this.bundleListeners.addIdListener(objectId, listener, bundleId);
    }

    async refreshDevices(): Promise<Devices> {
        if (this.logging) console.log("refreshing devices");

        const devices = await navigator.mediaDevices.enumerateDevices();

        const videoDevices: Map<string, MediaDevice> = new Map();
        const audioInputDevices: Map<string, MediaDevice> = new Map();
        const audioOutputDevices: Map<string, MediaDevice> = new Map();

        

        devices.forEach(device => {
            if (device.kind === "videoinput") videoDevices.set(device.deviceId, { label: this.createDeviceLabel(videoDevices, device), info: device });
            if (device.kind === "audioinput") audioInputDevices.set(device.deviceId, { label: this.createDeviceLabel(videoDevices, device), info: device });
            if (device.kind === "audiooutput") audioOutputDevices.set(device.deviceId, { label: this.createDeviceLabel(videoDevices, device), info: device });
        });

        this.devices = {
            video: videoDevices,
            audioOutput: audioOutputDevices,
            audioInput: audioInputDevices,
        }

        this.notifyDeviceListeners();

        return this.devices;

    }

    destroy() {
        Array.from(this.bundles.keys()).forEach((bundleId: string) => {
            this.destroyBundle(bundleId);
        });
    }

    getMediaConstraints() : MediaTrackSupportedConstraints {
        return navigator.mediaDevices.getSupportedConstraints();
    }

    removeMediaStreams(bundleId: string): void {
        this.destroyBundle(bundleId);
    }

    getVideoOutputs(): Map<string, MutableRefObject<HTMLVideoElement>> {
        return this.videoOutputs;
    }


}
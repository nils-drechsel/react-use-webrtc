import { MutableRefObject } from "react";
import { DataListeners, ObservedMapImpl } from "react-use-listeners";
import { UnsubscribeCallback } from "react-use-listeners";
import { DataListenerCallback, ObservedMap } from "react-use-listeners";

export enum LocalMediaInput {
    CAMERA = 'CAMERA',
    SCREEN = 'SCREEN',
}

export type MediaDevice = {
    id: string;
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

export interface RemoteMediaStreamObject extends MediaStreamObject {
    remoteSid: string;
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


export interface Devices {
    video: Map<string, MediaDevice>;
    audioInput: Map<string, MediaDevice>;
    audioOutput: Map<string, MediaDevice>;
}

export class MediaDevicesManager {

    videoOutputs: Map<string, MutableRefObject<HTMLVideoElement>> = new Map();

    mediaObjects: ObservedMap<MediaObject> = new ObservedMapImpl();

    audioConnections: Map<string, string> = new Map();

    videoDevices: ObservedMap<MediaDevice> = new ObservedMapImpl();
    audioInputDevices: ObservedMap<MediaDevice> = new ObservedMapImpl();
    audioOutputDevices: ObservedMap<MediaDevice> = new ObservedMapImpl();

    permissionListeners: DataListeners<MediaPermissions> = new DataListeners();

    logging: boolean;

    permissions: MediaPermissions  | null = null;

    constructor(logging = true) {
        this.logging = logging;
        navigator.mediaDevices.ondevicechange = (_event: Event) => this.refreshDevices();
    }


    listenForPermissions(callback: DataListenerCallback<MediaPermissions>): UnsubscribeCallback {
        const result = this.permissionListeners.addListener(callback);
        if (this.permissions) {
            callback(this.permissions);
        }
        return result;
    }

    registerVideoOutput(id: string, ref: MutableRefObject<HTMLVideoElement>, objId?: string) {
        if (this.logging) console.log('register video output', id, objId);
        this.videoOutputs.set(id, ref);
        if (objId) {
            this.connectStreamToOutput(objId, id);
        }
    }

    deregisterVideoOutput(id: string) {
        if (this.logging) console.log('deregister video output', id);
        //this.stopOutput(id);
        this.videoOutputs.delete(id);
    }


    addRemoteMediaStream(objId: string, remoteSid: string, stream: MediaStream): MediaStreamObject {
        if (this.logging) console.log('adding media stream', objId, stream, remoteSid);

        return this.addMediaStreamObject(objId, { objId, type: MediaType.STREAM, subType: StreamSubType.REMOTE, stream, remoteSid } as RemoteMediaStreamObject, stream);
    }

    addLocalCameraStream(objId: string, stream: MediaStream): MediaStreamObject {
        if (this.logging) console.log('adding local camera stream', objId, stream);

        return this.addMediaStreamObject(objId, { objId, type: MediaType.STREAM, subType: StreamSubType.LOCAL_CAMERA, stream } as MediaStreamObject, stream);
    }

    addLocalScreenStream(objId: string, stream: MediaStream): MediaStreamObject {
        if (this.logging) console.log('adding local screen stream', objId, stream);

        return this.addMediaStreamObject(objId, { objId, type: MediaType.STREAM, subType: StreamSubType.LOCAL_SCREEN, stream } as MediaStreamObject, stream);
    }

    updateStreamDimensions(objId: string, width: number, height: number) {
        const mediaObj = this.mediaObjects.get(objId);
        if (!mediaObj || mediaObj.type !== MediaType.STREAM) return;
        const mediaStreamObject = mediaObj as MediaStreamObject;
        mediaStreamObject.width = width;
        mediaStreamObject.height = height;

        this.mediaObjects.modify(objId);
    }

    private getStreamDimensions(stream: MediaStream): [number | null, number | null] {
        const videoTracks = stream.getVideoTracks();

        const width = videoTracks.length > 0 ? videoTracks[0].getSettings().width || null: null;
        const height = videoTracks.length > 0 ? videoTracks[0].getSettings().height || null : null;
        
        return [width, height];
    }

    private addMediaStreamObject(objId: string, mediaStreamObject: MediaStreamObject, stream: MediaStream): MediaStreamObject {


        if (this.mediaObjects.has(objId)) {

            const [width, height] = this.getStreamDimensions(stream);

            const streamObject = (this.mediaObjects.get(objId) as MediaStreamObject);

            if (streamObject.stream) {
                this.stopMediaStream(streamObject.stream);
            }

            streamObject.stream = stream;
            this.addStreamListeners(objId, streamObject, stream);
            if (width) streamObject.width = width;
            if (height) streamObject.height = height;

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

    private addStreamListeners(objId: string, mediaObject: MediaStreamObject, stream: MediaStream) {
        // remove stream when one of the tracks has ended
        stream.getTracks().forEach(track => {
            track.onended = () => {
                if (this.logging) console.log("track has ended", objId)
                this.mediaObjects.delete(objId);
            }
        });

        stream.onaddtrack = ((_e: MediaStreamTrackEvent) => {

            if (this.logging) console.log('track was added', objId, stream);
            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }

            this.mediaObjects.modify(objId);

            
        });
        
        stream.onremovetrack = ((_e: MediaStreamTrackEvent) => {
            if (this.logging) console.log('track was removed', objId, stream);

            if (stream.getTracks().length == 0) this.mediaObjects.delete(objId);

            const [newWidth, newHeight] = this.getStreamDimensions(stream);
            if (newWidth && newHeight) {
                mediaObject.width = newWidth;
                mediaObject.height = newHeight;
            }

            this.mediaObjects.modify(objId);

            
        });
    }

    stopStream(objId: string) {
        if (!this.mediaObjects.has(objId)) return;
        const obj = this.mediaObjects.get(objId)!;

        // stop stream in case it's of type STREAM
        if (obj.type !== MediaType.STREAM) return;
        const mediaObject: MediaStreamObject = obj as MediaStreamObject;
        if (this.logging) console.log('stopping stream', objId);
        if (mediaObject.stream) this.stopMediaStream(mediaObject.stream);
    }

    private stopMediaStream(stream: MediaStream): void {
        stream?.getTracks().forEach(track => track.stop());
    }

    removeMediaObject(objId: string) {
        this.stopStream(objId);
        this.mediaObjects.delete(objId);
    }


    connectStreamToOutput(objId: string, outputId: string) {
        if (this.logging) console.log('connecting stream to output', objId, outputId);

        if (!this.mediaObjects.has(objId)) throw new Error("stream with id: " + objId + " is not available");

        if (!this.videoOutputs.has(outputId)) throw new Error("output with id: " + outputId + " is not available");


        const mediaObject = this.mediaObjects.get(objId)!;

        if (mediaObject.type !== MediaType.STREAM) return;

        const mediaStreamObject = mediaObject as MediaStreamObject;

        mediaStreamObject.videoOutput = outputId;

        if (mediaObject.type !== MediaType.STREAM) throw new Error("media object " + objId + " is not a stream");
        const stream = (mediaObject as MediaStreamObject).stream;        

        const output: MutableRefObject<HTMLVideoElement> = this.videoOutputs.get(outputId)!;

        //this.stopOutput(outputId);

        output.current.srcObject = stream;
    }

    connectAudioOutputToVideoOutput(audioId: string, outputId: string) {
        if (this.logging) console.log('connecting audio output to video output', audioId, outputId);

        if (!this.audioOutputDevices.has(audioId)) throw new Error("audio output with id: " + audioId + " is not available");
        if (!this.videoOutputs.has(outputId)) throw new Error("output with id: " + outputId + " is not available");

        const audio: MediaDeviceInfo = this.audioOutputDevices.get(audioId)!.info;
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


    async getCameraStream(objId: string, cameraDeviceId?: string | null, audioDeviceId?: string | null): Promise<MediaStreamObject> {
        if (this.logging) console.log('local camera stream', cameraDeviceId, audioDeviceId);

        await this.assertMediaPermissions();
        
        const constraints = {video: true, audio: true};
        if (cameraDeviceId) Object.assign(constraints, { video: { deviceId: { exact: cameraDeviceId } } });
        if (audioDeviceId) Object.assign(constraints, { audio: { deviceId: { exact: audioDeviceId } } });
        
        return await this.getStream(objId, false, constraints);
    }

    async getScreenStream(objId: string): Promise<MediaStreamObject> {
        await this.assertMediaPermissions();

        this.removeMediaObject(objId);

        return await this.getStream(objId, true, undefined);
    }    

    private async getVideoFeed(constraints?: MediaStreamConstraints): Promise<MediaStream> {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

    private async getScreenFeed(): Promise<MediaStream> {
        return (navigator.mediaDevices as any).getDisplayMedia();
    }


    private async getStream(objId: string, screenshare: boolean, constraints?: MediaStreamConstraints | undefined): Promise<MediaStreamObject> {
        if (this.logging) console.log('loading stream', objId);

        try {

            let stream: MediaStream;

            if (screenshare) {
                stream = await this.getScreenFeed();
                return this.addLocalScreenStream(objId, stream);
            } else {
                stream = await this.getVideoFeed(constraints);
                return this.addLocalCameraStream(objId, stream);
            }

        } catch (e) {
            if (this.logging) console.log("error loading stream", e);
            throw new Error("stream is unavailable");
        }
    }

    hasMediaObject(objId: string) {
        return this.mediaObjects.has(objId);
    }

    getMediaObject(objId: string): MediaObject | null {
        return this.mediaObjects.get(objId)!;
    }

    private createDeviceLabel(map: Map<string, MediaDevice>, info: MediaDeviceInfo): string {
        if (info.label) return info.label.replace(/ *\([^)]*\) */g, "");
        if (info.kind === "videoinput") return "Camera " + (map.size + 1);
        if (info.kind === "audioinput") return "Microphone " + (map.size + 1);
        if (info.kind === "audiooutput") return "Speaker " + (map.size + 1);
        throw new Error("unknown device " + info);
    }


    async refreshDevices(): Promise<void> {
        if (this.logging) console.log("refreshing devices");

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            devices.forEach(device => {
                if (device.kind === "videoinput") this.videoDevices.set(device.deviceId, { id: device.deviceId, label: this.createDeviceLabel(this.videoDevices, device), info: device });
                if (device.kind === "audioinput") this.audioInputDevices.set(device.deviceId, { id: device.deviceId, label: this.createDeviceLabel(this.audioInputDevices, device), info: device });
                if (device.kind === "audiooutput") this.audioOutputDevices.set(device.deviceId, { id: device.deviceId, label: this.createDeviceLabel(this.audioOutputDevices, device), info: device });
            });
        } catch (e) {
            // FIXME
        }


    }

    destroy() {
        Array.from(this.mediaObjects.keys()).forEach((objId: string) => {
            this.removeMediaObject(objId);
        });
    }

    getMediaConstraints() : MediaTrackSupportedConstraints {
        return navigator.mediaDevices.getSupportedConstraints();
    }

    getVideoOutputs(): Map<string, MutableRefObject<HTMLVideoElement>> {
        return this.videoOutputs;
    }


}
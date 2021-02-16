import { MutableRefObject } from "react";
import { DataListeners, ObservedMapMap } from "react-use-listeners";
import { UnsubscribeCallback } from "react-use-listeners";
import { DataListenerCallback, ObservedMap } from "react-use-listeners";
export declare enum MediaIdent {
    LOCAL = "LOCAL"
}
export declare enum LocalMediaInput {
    CAMERA = "CAMERA",
    SCREEN = "SCREEN"
}
export declare type MediaDevice = {
    id: string;
    label: string;
    info: MediaDeviceInfo;
};
export declare enum MediaType {
    STREAM = 0,
    DATA = 1
}
export declare enum StreamSubType {
    LOCAL_CAMERA = 0,
    LOCAL_SCREEN = 1,
    REMOTE = 2
}
export interface MediaObject {
    type: MediaType;
    bundleId: string;
    objId: string;
}
export interface MediaStreamObject extends MediaObject {
    subType: StreamSubType;
    stream: MediaStream | null;
    width: number | null;
    height: number | null;
    hasVideo: boolean;
    hasAudio: boolean;
    videoOutput: string | null;
}
export declare enum MediaPermissions {
    SUCCESS = "SUCCESS",
    DISALLOWED = "DISALLOWED",
    FAIL = "FAIL"
}
export declare class MediaPermissionsException extends Error {
    permissions: MediaPermissions;
    constructor(permissions: MediaPermissions);
}
export declare const makeMediaId: (bundleId: string, streamId: string) => string;
export interface Devices {
    video: Map<string, MediaDevice>;
    audioInput: Map<string, MediaDevice>;
    audioOutput: Map<string, MediaDevice>;
}
export declare class MediaDevicesManager {
    videoOutputs: Map<string, MutableRefObject<HTMLVideoElement>>;
    bundles: ObservedMapMap<string, MediaObject>;
    audioConnections: Map<string, string>;
    videoDevices: ObservedMap<MediaDevice>;
    audioInputDevices: ObservedMap<MediaDevice>;
    audioOutputDevices: ObservedMap<MediaDevice>;
    permissionListeners: DataListeners<MediaPermissions>;
    logging: boolean;
    permissions: MediaPermissions | null;
    constructor(logging?: boolean);
    listenForPermissions(callback: DataListenerCallback<MediaPermissions>): UnsubscribeCallback;
    registerVideoOutput(id: string, ref: MutableRefObject<HTMLVideoElement>, bundleId?: string, objId?: string): void;
    deregisterVideoOutput(id: string): void;
    private initBundleIfNecessary;
    addMediaStream(bundleId: string, objId: string, stream: MediaStream): MediaStreamObject;
    addLocalCameraStream(bundleId: string, objId: string, stream: MediaStream): MediaStreamObject;
    addLocalScreenStream(bundleId: string, objId: string, stream: MediaStream): MediaStreamObject;
    updateStreamDimensions(bundleId: string, objId: string, width: number, height: number): void;
    private getStreamDimensions;
    private addMediaStreamObject;
    private addStreamListeners;
    removeMediaObject(bundleId: string, objId: string): void;
    stopStream(bundleId: string, objId: string): void;
    destroyBundle(bundleId: string): void;
    connectStreamToOutput(bundleId: string, objId: string, outputId: string): Promise<void>;
    connectAudioOutputToVideoOutput(audioId: string, outputId: string): void;
    private requestMediaPermissions;
    private assertMediaPermissions;
    getCameraStream(objId: string, cameraDeviceId?: string | null, audioDeviceId?: string | null): Promise<MediaStreamObject>;
    getScreenStream(objId: string): Promise<MediaStreamObject>;
    private getVideoFeed;
    private getScreenFeed;
    private getStream;
    hasMediaObject(bundleId: string, objId: string): boolean;
    getMediaObject(bundleId: string, objId: string): MediaObject | null;
    private createDeviceLabel;
    refreshDevices(): Promise<void>;
    destroy(): void;
    getMediaConstraints(): MediaTrackSupportedConstraints;
    removeMediaStreams(bundleId: string): void;
    getVideoOutputs(): Map<string, MutableRefObject<HTMLVideoElement>>;
}

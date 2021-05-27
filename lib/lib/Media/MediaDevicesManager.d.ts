import { MutableRefObject } from "react";
import { DataListenerCallback, DataListeners } from "react-use-listeners";
import { UnsubscribeCallback } from "react-use-listeners";
import { ObservedMap } from "react-use-listeners";
import { ControllerState } from "../Controller/Controller";
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
export interface MediaItem {
    type: MediaType;
    obj: MediaObject | null;
    label: string;
    state: ControllerState;
    remoteSid: string | null;
}
export interface StreamMediaItem extends MediaItem {
    subType: StreamSubType;
}
export interface MediaObject {
    type: MediaType;
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
export interface RemoteMediaStreamObject extends MediaStreamObject {
    remoteSid: string;
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
export interface Devices {
    video: Map<string, MediaDevice>;
    audioInput: Map<string, MediaDevice>;
    audioOutput: Map<string, MediaDevice>;
}
export declare class MediaDevicesManager {
    videoOutputs: Map<string, MutableRefObject<HTMLVideoElement>>;
    mediaObjects: ObservedMap<MediaObject>;
    audioConnections: Map<string, string>;
    videoDevices: ObservedMap<MediaDevice>;
    audioInputDevices: ObservedMap<MediaDevice>;
    audioOutputDevices: ObservedMap<MediaDevice>;
    permissionListeners: DataListeners<MediaPermissions>;
    logging: boolean;
    permissions: MediaPermissions | null;
    constructor(logging?: boolean);
    listenForPermissions(callback: DataListenerCallback<MediaPermissions>): UnsubscribeCallback;
    registerVideoOutput(id: string, ref: MutableRefObject<HTMLVideoElement>, objId?: string): void;
    deregisterVideoOutput(id: string): void;
    addRemoteMediaStream(remoteSid: string, objId: string, stream: MediaStream): MediaStreamObject;
    addLocalCameraStream(objId: string, stream: MediaStream): MediaStreamObject;
    addLocalScreenStream(objId: string, stream: MediaStream): MediaStreamObject;
    updateStreamDimensions(objId: string, width: number, height: number): void;
    private getStreamDimensions;
    private addMediaStreamObject;
    private addStreamListeners;
    stopStream(objId: string): void;
    private stopMediaStream;
    removeMediaObject(objId: string): void;
    connectStreamToOutput(objId: string, outputId: string): void;
    connectAudioOutputToVideoOutput(audioId: string, outputId: string): void;
    private requestMediaPermissions;
    private assertMediaPermissions;
    getCameraStream(cameraDeviceId?: string | null, audioDeviceId?: string | null): Promise<MediaStreamObject>;
    getScreenStream(): Promise<MediaStreamObject>;
    private getVideoFeed;
    private getScreenFeed;
    private getStream;
    hasMediaObject(objId: string): boolean;
    getMediaObject(objId: string): MediaObject | null;
    private createDeviceLabel;
    refreshDevices(): Promise<void>;
    destroy(): void;
    getMediaConstraints(): MediaTrackSupportedConstraints;
    getVideoOutputs(): Map<string, MutableRefObject<HTMLVideoElement>>;
}

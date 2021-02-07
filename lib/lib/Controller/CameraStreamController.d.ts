import { MediaDevicesManager } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../Rtc/WebRtcManager";
import { AbstractController, OutboundController } from "./Controller";
import { ControllerManager } from "./ControllerManager";
export declare class InboundController extends AbstractController {
    remoteSid: string;
    label: string;
    transmissionId: string;
    constructor(controllerId: string, controllerManager: ControllerManager, webRtcManager: WebRtcManager, mediaDevicesManager: MediaDevicesManager, label: string, remoteSid: string, transmissionId: string);
    start(): Promise<void>;
    stop(): void;
}
export declare class OutboundCameraStreamController extends AbstractController implements OutboundController {
    remoteSid: string;
    cameraDeviceId: string | null;
    audioDeviceId: string | null;
    label: string;
    transmissionId: string | null;
    constructor(controllerManager: ControllerManager, webRtcManager: WebRtcManager, mediaDevicesManager: MediaDevicesManager, label: string, remoteSid: string, cameraDeviceId: string | null, audioDeviceId: string | null);
    start(): Promise<void>;
    stop(): void;
}

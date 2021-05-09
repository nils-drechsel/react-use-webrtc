import { InboundControllerBuilder } from "./Controller/Controller";
import { ControllerManager } from "./Controller/ControllerManager";
import { MediaDevicesManager } from "./Media/MediaDevicesManager";
import { TransmissionManager } from "./Transmission/TransmissionManager";

export interface SignallingChannel {
    addListener(message: string, callback: (payload: any, fromSid?: string | null) => void): void;
    send(message: string, payload: any, toSid?: string | null): void;
}

export class WebRtcManager {
    controllerManager: ControllerManager;
    transmissionManager: TransmissionManager;
    mediaDevicesManager: MediaDevicesManager;
    signallingChannel: SignallingChannel;

    constructor(
        signallingChannel: SignallingChannel,
        sid: string,
        configuration: RTCConfiguration,
        inboundControllerBuilder: InboundControllerBuilder,
        logging = true
    ) {
        this.signallingChannel = signallingChannel;
        this.mediaDevicesManager = new MediaDevicesManager(logging);
        this.transmissionManager = new TransmissionManager(
            this.signallingChannel,
            this.mediaDevicesManager,
            sid,
            configuration,
            logging
        );
        this.controllerManager = new ControllerManager(this, inboundControllerBuilder, logging);
    }

    setSid(sid: string): void {
        this.transmissionManager.setSid(sid);
    }

    destroy() {
        this.controllerManager.destroy();
        this.transmissionManager.destroy();
        this.mediaDevicesManager.destroy();
    }
}

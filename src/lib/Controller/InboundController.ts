import { MediaObject } from "../Media/MediaDevicesManager";
import { Transmission, TransmissionState } from "../Transmission/TransmissionManager";
import { ControllerState, AbstractRemoteController, RemoteController } from "./Controller";
import { ListenerEvent, UnsubscribeCallback } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";





export interface InboundController<T extends MediaObject> extends RemoteController<T> {
    load(transmissionId: string | null): void;
}

export abstract class AbstractInboundController<T extends MediaObject> extends AbstractRemoteController<T> {

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, controllerId: string) {
        super(webRtcManager, remoteSid, label, controllerId);
    }

    abstract load(transmissionId: string | null): void;

    protected notifyModification() {
        this.webRtcManager.controllerManager.inboundControllers.modify(this.getControllerId());
    }

}


export class TransmissionInboundController<T extends MediaObject> extends AbstractInboundController<T> {

    unsubscribeListener: UnsubscribeCallback | null = null;

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, controllerId: string) {
        super(webRtcManager, remoteSid, label, controllerId);
    }

    load(transmissionId: string | null) {
        if (this.unsubscribeListener) this.unsubscribeListener();

        this.setTransmissionId(transmissionId);

        if (this.transmissionId) {

            this.unsubscribeListener = this.webRtcManager.transmissionManager.listenForInboundTransmission(this.transmissionId!, (event: ListenerEvent) => {
                switch (event) {
                    case ListenerEvent.ADDED:
                    case ListenerEvent.MODIFIED:
                        const transmission: Transmission = this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId!)!;
                        switch (transmission.state) {
                            case TransmissionState.CONNECTED:
                                this.controllerState = ControllerState.READY
                                break;
                            case TransmissionState.CONNECTING:
                                this.controllerState = ControllerState.STARTING
                                break;
                            case TransmissionState.FAILED:
                                this.controllerState = ControllerState.FAILED
                                this.removeStream();
                                break;
                        }
                        break;
                    case ListenerEvent.REMOVED:
                        this.controllerState = ControllerState.CLOSED;
                        this.removeStream();
                        break;
                }

                this.notifyModification();
            });
        }

        this.notifyModification();

    }


    private removeStream() {
        if (this.transmissionId) this.webRtcManager.mediaDevicesManager.removeMediaObject(this.remoteSid, this.transmissionId);
    }
    

    stop() {
        this.controllerState = ControllerState.CLOSED;
        this.removeStream();
    }
}


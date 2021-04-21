import { ListenerEvent } from "react-use-listeners";
import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from "../WebRtcManager";
import { ControllerState, RemoteController, AbstractRemoteController } from "./Controller";
import { LocalController } from "./LocalController";



export interface OutboundController<T extends MediaObject = MediaObject> extends RemoteController<T> {
    load(mediaObject: T): void;
}

export abstract class AbstractOutboundController<T extends MediaObject = MediaObject> extends AbstractRemoteController<T> implements OutboundController<T> {

    localController: LocalController<T>;
    transmissionId: string | null = null;
    

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, localController: LocalController<T>) {
        super(webRtcManager, remoteSid, label, null);
        this.remoteSid = remoteSid;
        this.localController = localController;

        webRtcManager.controllerManager.outboundControllers.addSubIdListener(remoteSid, localController.getControllerId(), (event) => {
            switch (event) {
                case ListenerEvent.ADDED:
                case ListenerEvent.MODIFIED:

                    switch (localController.getState()) {
                        case ControllerState.STARTING:
                            if (this.getState() !== ControllerState.STARTING)
                                this.start();
                            break;
                        case ControllerState.READY:
                            if (this.getState() !== ControllerState.READY)
                                this.load();
                            break;
                        case ControllerState.FAILED:
                            if (this.getState() !== ControllerState.FAILED)
                                this.fail();
                            break;
                        case ControllerState.STOPPED:
                            if (this.getState() !== ControllerState.STOPPED)
                                this.fail();
                            break;
                        case ControllerState.CLOSED:
                            if (this.getState() !== ControllerState.FAILED)
                                this.close();
                            break;
                        default: throw new Error("unknown state");
                    }

                    break;

                case ListenerEvent.REMOVED:
                    this.stop();
                    break;
                default: throw new Error("unknown event " + event);

            }
        })


    }

    abstract load(): void;

    protected notify() {
        this.webRtcManager.controllerManager.outboundControllers.modify(this.getControllerId());
    }

}

export class OutboundStreamController extends AbstractOutboundController<MediaStreamObject> {


    load(): void {

        const mediaObject = this.localController.getMediaObject();

        if (mediaObject.stream) this.transmissionId = this.webRtcManager.transmissionManager.addStreamTransmission(this.remoteSid, mediaObject.stream, this.label!);

        this.setState(ControllerState.READY);

        this.webRtcManager.controllerManager.sendAddInboundController(this.remoteSid, { controllerId: this.controllerId, label: this.label, transmissionId: this.transmissionId, state: this.getState() });


    }

    start() {
        super.start();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    fail() {
        super.fail();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    restart() {
        super.restart();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    close() {
        this.setState(ControllerState.CLOSED);
        this.transmissionId = null;
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    stop() {
        this.webRtcManager.controllerManager.sendRemoveInboundController(this.remoteSid, { controllerId: this.controllerId});
        this.controllerState = ControllerState.CLOSED;
    }

    getTransmission(): Transmission | undefined {
        if (this.controllerState !== ControllerState.READY || !this.transmissionId) return undefined;
        return this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
    }

}

import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from "../WebRtcManager";
import { ControllerState, RemoteController, AbstractRemoteController } from "./Controller";
import { LocalStreamController } from "./LocalController";



export interface OutboundController<T extends MediaObject> extends RemoteController<T> {
    load(mediaObject: MediaObject): void;
}

export class OutboundStreamController extends AbstractRemoteController<MediaStreamObject> implements OutboundController<MediaStreamObject> {

    localController: LocalStreamController;
    transmissionId: string | null = null;
    

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, localController: LocalStreamController) {
        super(webRtcManager, remoteSid, label, null);
        this.remoteSid = remoteSid;
        this.localController = localController;
        this.localController.registerOutboundController(this);
        
    }

    load(mediaObject: MediaStreamObject): void {

        if (mediaObject.stream) this.transmissionId = this.webRtcManager.transmissionManager.addStreamTransmission(this.remoteSid, mediaObject.stream, this.label!);

        this.setState(ControllerState.READY);

        this.webRtcManager.controllerManager.sendAddInboundController(this.remoteSid, { controllerId: this.controllerId, label: this.label, transmissionId: this.transmissionId, state: this.getState() });


    }

    fail() {
        super.fail();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    restart() {
        super.restart();
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    unload() {
        this.setState(ControllerState.CLOSED);
        this.transmissionId = null;
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, { controllerId: this.controllerId, transmissionId: null, state: this.getState() });
    }

    async start(): Promise<void> {

    }

    stop() {
        this.webRtcManager.controllerManager.sendRemoveInboundController(this.remoteSid, { controllerId: this.controllerId});
        this.controllerState = ControllerState.CLOSED;
        if (this.localController) this.localController.deregisterOutboundController(this.controllerId);
    }

    getTransmission(): Transmission | undefined {
        if (this.controllerState !== ControllerState.READY || !this.transmissionId) return undefined;
        return this.webRtcManager.transmissionManager.getTransmission(this.remoteSid, this.transmissionId);
    }

}

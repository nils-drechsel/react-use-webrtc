import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { Transmission } from "../Transmission/TransmissionManager";
import { WebRtcManager } from "../WebRtcManager";
import { ControllerState, RemoteController, AbstractRemoteController } from "./Controller";
import { LocalController } from "./LocalController";



export interface OutboundController<T extends MediaObject> extends RemoteController<T> {
    load(mediaObject: T): void;
}

export abstract class AbstractOutboundController<T extends MediaObject> extends AbstractRemoteController<T> implements OutboundController<T> {

    localController: LocalController<T>;
    transmissionId: string | null = null;
    

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, localController: LocalController<T>) {
        super(webRtcManager, remoteSid, label, null);
        this.remoteSid = remoteSid;
        this.localController = localController;
        this.localController.registerOutboundController(this);
        
    }

    abstract load(mediaObject: T): void;

    protected notifyModification() {
        this.webRtcManager.controllerManager.outboundControllers.modify(this.getControllerId());
    }

}

export class OutboundStreamController extends AbstractOutboundController<MediaStreamObject> {


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

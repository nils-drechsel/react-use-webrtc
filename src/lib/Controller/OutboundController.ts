import { ListenerEvent, UnsubscribeCallback } from "react-use-listeners";
import { MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { ControllerState } from "./Controller";
import { LocalStreamController } from "./LocalController";
import { AbstractRemoteController, RemoteController } from "./RemoteController";

export interface OutboundController<T extends MediaObject = MediaObject> extends RemoteController<T> {}

export abstract class AbstractOutboundController<T extends MediaObject = MediaObject>
    extends AbstractRemoteController<T>
    implements OutboundController<T> {
    unsubscribeMediaObject: UnsubscribeCallback | null = null;
    unsubscribeLocalController: UnsubscribeCallback;
    localControllerId: string;

    constructor(
        webRtcManager: WebRtcManager,
        remoteSid: string,
        label: string,
        type: string,
        localControllerId: string
    ) {
        super(webRtcManager, remoteSid, label, type, localControllerId);
        this.remoteSid = remoteSid;
        this.localControllerId = localControllerId;

        this.unsubscribeLocalController = this.webRtcManager.controllerManager.localControllers.addIdListener(
            this.localControllerId,
            (_id, event) => {
                switch (event) {
                    case ListenerEvent.ADDED:
                    case ListenerEvent.MODIFIED:
                        const localController = this.webRtcManager.controllerManager.localControllers.get(
                            this.localControllerId
                        );
                        if (!localController) {
                            this.destroy();
                            return;
                        }

                        switch (localController.getState()) {
                            case ControllerState.STARTING:
                                if (this.getState() !== ControllerState.STARTING) this.start();
                                break;
                            case ControllerState.READY:
                                if (this.getState() !== ControllerState.READY && this.getMediaObject())
                                    this.load(localController.getMediaObjectId()!);
                                break;
                            case ControllerState.FAILED:
                                if (this.getState() !== ControllerState.FAILED) this.fail();
                                break;
                            case ControllerState.STOPPED:
                                if (this.getState() !== ControllerState.STOPPED) this.stop();
                                break;
                            default:
                                throw new Error("unknown state");
                        }

                        break;

                    case ListenerEvent.REMOVED:
                        this.destroy();
                        break;
                    default:
                        throw new Error("unknown event " + event);
                }
            }
        );
    }

    load(mediaObjectId: string) {
        if (mediaObjectId === this.mediaObjectId && this.getState() === ControllerState.READY) return;

        this.setMediaObjectId(mediaObjectId);

        if (this.unsubscribeMediaObject) this.unsubscribeMediaObject();
        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(
            mediaObjectId,
            (_id, event) => {
                const localController = this.webRtcManager.controllerManager.localControllers.get(
                    this.localControllerId
                );
                if (!localController) {
                    this.destroy();
                    return;
                }
                switch (event) {
                    case ListenerEvent.ADDED:
                    case ListenerEvent.MODIFIED:
                        if (this.getState() !== ControllerState.READY && this.getMediaObject()) this.ready();
                        break;
                    case ListenerEvent.REMOVED:
                        this.stop();
                }
            }
        );
    }

    start() {
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: null,
            state: ControllerState.STARTING,
        });
        super.start();
    }

    ready() {
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: this.mediaObjectId,
            state: ControllerState.READY,
        });
        super.ready();
    }

    fail() {
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: null,
            state: ControllerState.FAILED,
        });
        super.fail();
    }

    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        this.webRtcManager.controllerManager.sendModifyInboundController(this.remoteSid, {
            controllerId: this.controllerId,
            mediaObjectId: null,
            state: ControllerState.STOPPED,
        });
        super.stop();
    }

    protected notify() {
        this.webRtcManager.controllerManager.outboundControllers.modifySub(this.remoteSid, this.getControllerId());
    }

    destroy(): void {
        this.unsubscribeLocalController();
        this.stop();
        this.webRtcManager.controllerManager.removeOutboundController(this.remoteSid, this.controllerId);
    }
}

export abstract class AbstractOutboundStreamController extends AbstractOutboundController<MediaStreamObject> {
    ready(): void {
        const localController = this.webRtcManager.controllerManager.localControllers.get(
            this.localControllerId
        ) as LocalStreamController;

        if (!localController)
            throw new Error("local controller cannot be found: " + this.remoteSid + " " + this.getControllerId());

        const mediaObject = localController.getMediaObject();

        if (!mediaObject || !mediaObject.stream || !this.mediaObjectId) {
            this.fail();
            return;
        }

        this.webRtcManager.transmissionManager.addOutboundStreamTransmission(this.remoteSid, mediaObject.stream);

        super.ready();
    }
}

import { MediaItem, MediaObject } from "../Media/MediaDevicesManager";
import { ControllerState } from "./Controller";
import { ListenerEvent, UnsubscribeCallback } from "react-use-listeners";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractRemoteController, RemoteController } from "./RemoteController";

export interface InboundController<T extends MediaObject = MediaObject> extends RemoteController<T> {
    load(transmissionId: string): void;
    getMediaItem(): MediaItem;
}

export abstract class AbstractInboundController<T extends MediaObject = MediaObject>
    extends AbstractRemoteController<T>
    implements InboundController<T> {
    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, type: string, controllerId: string) {
        super(webRtcManager, remoteSid, label, type, controllerId);
    }

    abstract load(transmissionId: string): void;

    abstract getMediaItem(): MediaItem;

    protected notify() {
        this.webRtcManager.controllerManager.inboundControllers.modifySub(this.remoteSid, this.getControllerId());
    }

    destroy() {
        this.stop();
    }

    start() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: ControllerState.STARTING,
        });
        super.start();
    }

    ready() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: ControllerState.READY,
        });
        super.ready();
    }

    fail() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: ControllerState.FAILED,
        });
        super.fail();
    }

    stop() {
        this.webRtcManager.controllerManager.sendModifyOutboundController(this.remoteSid, {
            controllerId: this.controllerId,
            state: ControllerState.STOPPED,
        });
        super.stop();
    }

    setRemoteState(state: ControllerState) {
        super.setRemoteState(state);
        switch (state) {
            case ControllerState.STARTING:
                this.start();
                break;
            case ControllerState.READY:
                break;
            case ControllerState.FAILED:
                this.fail();
                break;
            case ControllerState.STOPPED:
                this.stop();
                break;
        }
    }
}

export abstract class AbstractTransmissionInboundController<
    T extends MediaObject = MediaObject
> extends AbstractInboundController<T> {
    unsubscribeMediaObject: UnsubscribeCallback | null = null;

    constructor(webRtcManager: WebRtcManager, remoteSid: string, label: string, type: string, controllerId: string) {
        super(webRtcManager, remoteSid, label, type, controllerId);
    }

    load(mediaObjectId: string) {
        if (mediaObjectId === this.mediaObjectId && this.getState() === ControllerState.READY) return;

        this.setMediaObjectId(mediaObjectId);
        console.log("inbound controller loaded with transmission", this.mediaObjectId);

        if (this.unsubscribeMediaObject) this.unsubscribeMediaObject();
        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(
            mediaObjectId,
            (_id, event) => {
                switch (event) {
                    case ListenerEvent.ADDED:
                    case ListenerEvent.MODIFIED:
                        if (this.getState() !== ControllerState.READY && this.getMediaObject()) this.ready();
                        else this.notify();
                        break;
                    case ListenerEvent.REMOVED:
                        this.stop();
                }
            }
        );
    }

    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        super.stop();
    }
}

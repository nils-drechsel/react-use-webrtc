import { ListenerEvent, UnsubscribeCallback } from "react-use-listeners";
import { MediaItem, MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractController, Controller, ControllerState } from "./Controller";
import { OutboundController } from "./OutboundController";

/**
 * A local controller is related to a local resource. It can be a camera, a screencapture, picture galleries, etc..
 * Such controller can have corresponding outbout controllers which are in charge of delivering the local data to remote destinations.
 * The controllers have a controller state. When a controller is first created, it is in its STOPPED state.
 * When the controller gets started, it will switch to the STARTING state. Once it has finished, or failed, loading the resource,
 * it will switch to either the READY, or the FAIL state. If it is then stopped, if will once again adopt the STOPPED state. If the
 * local controller is removed, it will temporarily adopt the CLOSED state.
 */
export interface LocalController<T extends MediaObject = MediaObject> extends Controller<T> {
    createOutboundController(remoteSid: string): OutboundController<T>;
    getMediaItem(): MediaItem;
}

export abstract class AbstractLocalController<T extends MediaObject>
    extends AbstractController<T>
    implements LocalController<T> {
    unsubscribeMediaObject: UnsubscribeCallback | null = null;

    constructor(webRtcManager: WebRtcManager, label: string, type: string, controllerId?: string) {
        super(webRtcManager, label, type, controllerId);
    }

    abstract createOutboundController(remoteSid: string): OutboundController<T>;

    abstract getMediaItem(): MediaItem;

    destroy(): void {
        this.stop();
    }

    protected notify() {
        console.log("notifying local controller", this.getControllerId());
        this.webRtcManager.controllerManager.localControllers.modify(this.getControllerId());
    }

    stop() {
        if (this.unsubscribeMediaObject) {
            this.unsubscribeMediaObject();
            this.unsubscribeMediaObject = null;
        }
        if (this.mediaObjectId) this.webRtcManager.mediaDevicesManager.removeMediaObject(this.mediaObjectId);
        this.mediaObjectId = null;
        super.stop();
    }

    load(mediaObjectId: string) {
        console.log("loading mediaObject", this.getControllerId(), "objId:", mediaObjectId);
        if (this.unsubscribeMediaObject) this.unsubscribeMediaObject();
        this.setMediaObjectId(mediaObjectId);

        this.unsubscribeMediaObject = this.webRtcManager.mediaDevicesManager.mediaObjects.addIdListener(
            mediaObjectId,
            (_id, event) => {
                console.log("media object changed: ", mediaObjectId, event, this.getState());
                switch (event) {
                    case ListenerEvent.ADDED:
                        if (this.getState() !== ControllerState.READY) this.ready();
                        break;
                    case ListenerEvent.REMOVED:
                        if (this.getState() !== ControllerState.STOPPED) this.stop();
                        break;
                    case ListenerEvent.ADDED:
                        this.notify();
                        break;
                }
            }
        );
    }
}

export interface LocalStreamController extends LocalController<MediaStreamObject> {}

export abstract class AbstractLocalStreamController
    extends AbstractLocalController<MediaStreamObject>
    implements LocalStreamController {
    constructor(webRtcManager: WebRtcManager, label: string, type: string, controllerId?: string) {
        super(webRtcManager, label, type, controllerId);
    }

    stop() {
        console.log("stopping local stream controller", this.getControllerId(), this.mediaObjectId);
        if (this.mediaObjectId) this.webRtcManager.mediaDevicesManager.stopStream(this.mediaObjectId);
        super.stop();
    }
}

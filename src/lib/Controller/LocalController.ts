import { ListenerEvent } from "react-use-listeners";
import { MediaIdent, MediaObject, MediaStreamObject, MediaType } from "../Media/MediaDevicesManager";
import { WebRtcManager } from "../WebRtcManager";
import { AbstractController, Controller, ControllerState } from "./Controller";
import { OutboundController, OutboundStreamController } from "./OutboundController";




export interface LocalController<T extends MediaObject> extends Controller<T> {

    deregisterOutboundController(controllerId: string): void;
    registerOutboundController(controller: OutboundController<MediaObject>): void;
    getResourceId(): string;
}

export interface LocalStreamController extends LocalController<MediaStreamObject> {
    deregisterOutboundController(controllerId: string): void;
    registerOutboundController(controller: OutboundStreamController): void; 
}

export abstract class AbstractLocalStreamController extends AbstractController<MediaStreamObject> implements LocalStreamController {

    outboundControllers: Map<string, OutboundStreamController> = new Map();

    constructor(webRtcManager: WebRtcManager, label: string, controllerId?: string) {
        super(webRtcManager, label, controllerId);
    }

    registerOutboundController(controller: OutboundStreamController) {
        this.outboundControllers.set(controller.getControllerId(), controller);
    }

    deregisterOutboundController(controllerId: string) {
        this.outboundControllers.delete(controllerId);
    }

    getResourceId(): string {
        return this.controllerId;
    }

    fail(): void {
        super.fail();
        this.outboundControllers.forEach((controller: OutboundStreamController) => {
            controller.fail();
        })
    }

    stop() {
        // FIXME questionable
        const controllers = Array.from(this.outboundControllers.values());
        controllers.forEach((controller: OutboundStreamController) => {
            this.webRtcManager.controllerManager.removeOutboundController(controller.getControllerId())
        });
        this.controllerState = ControllerState.CLOSED;

        const obj: MediaStreamObject | null = this.mediaObject;
        obj?.stream?.getTracks().forEach(track => track.stop());

        this.notifyModification();
    }

}


export class LocalCameraStreamController extends AbstractLocalStreamController {

    constructor(webRtcManager: WebRtcManager, label: string, controllerId: string) {
        super(webRtcManager, label, controllerId);

        this.webRtcManager.mediaDevicesManager.listenForObject(MediaIdent.LOCAL, this.controllerId, (event: ListenerEvent) => {
            switch (event) {
                case ListenerEvent.ADDED:
                case ListenerEvent.MODIFIED:
                    const mediaObject: MediaObject | null = this.webRtcManager.mediaDevicesManager.getMediaObject(MediaIdent.LOCAL, this.controllerId);
                    if (!mediaObject || mediaObject.type !== MediaType.STREAM) {
                        this.setState(ControllerState.FAILED);
                        this.notifyModification();
                    }
                    const mediaStreamObject: MediaStreamObject = mediaObject as MediaStreamObject;
                    this.load(mediaStreamObject);
                    this.loadOutboundControllers(mediaStreamObject);
            }
        });
    }

    load(mediaObject: MediaStreamObject) {

        this.mediaObject = mediaObject;
        this.controllerState = ControllerState.READY;
        this.notifyModification();        
    }

    private loadOutboundControllers(mediaObject: MediaStreamObject) {
        this.outboundControllers.forEach(controller => {
            controller.load(mediaObject);
        })
    }


    stop() {
        super.stop();
        this.webRtcManager.mediaDevicesManager.removeMediaObject(MediaIdent.LOCAL, this.controllerId);
    }


}
import { MediaIdent, MediaObject, MediaStreamObject } from "../Media/MediaDevicesManager";
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

        switch (this.getState()) {
            case ControllerState.READY:
                const mediaObject = this.getMediaObject();
                if (!mediaObject) break;
                controller.load(mediaObject);
                break;
            case ControllerState.FAILED:
                controller.fail();
                break;
        }
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

    restart(): void {
        super.restart();
        this.outboundControllers.forEach((controller: OutboundStreamController) => {
            controller.restart();
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
        
    }

    load(mediaObject: MediaStreamObject) {
        this.mediaObject = mediaObject;
        this.controllerState = ControllerState.READY;
        this.loadOutboundControllers(mediaObject);
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
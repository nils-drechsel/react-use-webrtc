"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractRemoteController = void 0;
const Controller_1 = require("./Controller");
class AbstractRemoteController extends Controller_1.AbstractController {
    constructor(webRtcManager, remoteSid, label, type, controllerId) {
        super(webRtcManager, label, type, controllerId);
        this.remoteState = Controller_1.ControllerState.STARTING;
        this.remoteSid = remoteSid;
    }
    getState() {
        return this.controllerState;
    }
    setRemoteState(state) {
        this.remoteState = state;
    }
    getRemoteState() {
        return this.remoteState;
    }
    getRemoteSid() {
        return this.remoteSid;
    }
}
exports.AbstractRemoteController = AbstractRemoteController;
//# sourceMappingURL=RemoteController.js.map
import { useContext } from "react";
import WebRtcContext from "./WebRtcContext";
import adapter from "webrtc-adapter";
import { WebRtcManager } from "./WebRtcManager";


export const useWebRtcManager = (): WebRtcManager => {
    adapter.browserDetails.browser;
    return useContext(WebRtcContext) as WebRtcManager;
}


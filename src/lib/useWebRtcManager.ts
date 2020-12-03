import { useContext } from "react";
import WebRtcContext from "./WebRtcContext";
import { WebRtcManager } from "./WebRtcManager";
import adapter from "webrtc-adapter";


export const useWebRtcManager = (): WebRtcManager => {
    adapter.browserDetails.browser;
    return useContext(WebRtcContext) as WebRtcManager;
}


import { useContext } from "react";
import WebRtcContext from "./WebRtcContext";
import { WebRtcManager } from "./WebRtcManager";


export const useWebRtcManager = (): WebRtcManager => {
    return useContext(WebRtcContext) as WebRtcManager;
}


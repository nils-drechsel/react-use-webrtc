import { createContext } from "react";
import { WebRtcManager } from "./WebRtcManager";

export const WebRtcContext = createContext<WebRtcManager>((null as unknown) as WebRtcManager);

export default WebRtcContext;

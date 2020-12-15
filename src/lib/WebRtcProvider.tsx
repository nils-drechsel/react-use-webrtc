import React, { FunctionComponent, useRef, useEffect } from "react";
import WebRtcContext from "./WebRtcContext";
import { MediaStreamProvider, SignallingChannel, WebRtcManager } from "./WebRtcManager";

type Props = {
    signallingChannel: SignallingChannel;
    mediaStreamProvider: MediaStreamProvider;
    sid: string;
    config: RTCConfiguration;
    logging?: boolean;
}


export const WebRtcProvider: FunctionComponent<Props> = ({ mediaStreamProvider, signallingChannel, sid, children, config, logging }) => {

    const managerRef = useRef<WebRtcManager>();

    if (!managerRef.current) {
        managerRef.current = new WebRtcManager(signallingChannel, mediaStreamProvider, sid, config, logging);
    } 

    useEffect(() => {

        managerRef.current!.setSid(sid);

    }, [sid]);

    return (
        <WebRtcContext.Provider value={managerRef.current}>
            {children}
        </WebRtcContext.Provider>
    )
}
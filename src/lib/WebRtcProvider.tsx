import React, { FunctionComponent, useRef, useContext, useEffect, useState } from "react";
import WebRtcContext from "./WebRtcContext";
import { MediaStreamProvider, SignallingChannel, WebRtcManager } from "./WebRtcManager";

type Props = {
    signallingChannel: SignallingChannel;
    mediaStreamProvider: MediaStreamProvider;
    sid: string;
}


export const WebRtcProvider: FunctionComponent<Props> = ({ mediaStreamProvider, signallingChannel, sid, children }) => {

    const managerRef = useRef<WebRtcManager>();

    if (!managerRef.current) {
        managerRef.current = new WebRtcManager(signallingChannel, mediaStreamProvider, sid);
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
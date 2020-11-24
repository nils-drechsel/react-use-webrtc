import React, { FunctionComponent, useRef, useContext, useEffect, useState } from "react";
import WebRtcContext from "./WebRtcContext";
import { MediaStreamProvider, SignallingChannel, WebRtcManager } from "./WebRtcManager";

type Props = {
    signallingChannel: SignallingChannel;
    mediaStreamProvider: MediaStreamProvider;
}


export const WebRtcProvider: FunctionComponent<Props> = ({ mediaStreamProvider, signallingChannel, children }) => {

    const managerRef = useRef<WebRtcManager>();

    if (!managerRef.current) {
        managerRef.current = new WebRtcManager(signallingChannel, mediaStreamProvider);
    }

    return (
        <WebRtcContext.Provider value={managerRef.current}>
            {children}
        </WebRtcContext.Provider>
    )
}
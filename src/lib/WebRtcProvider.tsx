import React, { FunctionComponent, useRef, useEffect } from "react";
import { InboundControllerBuilder } from "./Controller/Controller";
import WebRtcContext from "./WebRtcContext";
import { SignallingChannel, WebRtcManager } from "./WebRtcManager";

type Props = {
    signallingChannel: SignallingChannel;
    sid: string;
    config: RTCConfiguration;
    logging?: boolean;
    inboundControllerBuilder: InboundControllerBuilder;
}


export const WebRtcProvider: FunctionComponent<Props> = ({ signallingChannel, sid, children, config, inboundControllerBuilder, logging }) => {

    const managerRef = useRef<WebRtcManager>();

    if (!managerRef.current) {
        managerRef.current = new WebRtcManager(signallingChannel, sid, config, inboundControllerBuilder, logging);
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
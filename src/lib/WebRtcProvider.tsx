import React, { FunctionComponent, useEffect, useState } from "react";
import { InboundControllerBuilder } from "./Controller/Controller";
import WebRtcContext from "./WebRtcContext";
import { SignallingChannel, WebRtcManager } from "./WebRtcManager";

type Props = {
    signallingChannel: SignallingChannel;
    sid: string;
    config: RTCConfiguration;
    logging?: boolean;
    inboundControllerBuilder: InboundControllerBuilder;
};

export const WebRtcProvider: FunctionComponent<Props> = ({
    signallingChannel,
    sid,
    children,
    config,
    inboundControllerBuilder,
    logging,
}) => {
    const [manager] = useState<WebRtcManager>(
        new WebRtcManager(signallingChannel, sid, config, inboundControllerBuilder, logging)
    );

    useEffect(() => {
        return () => {
            manager.destroy();
        };
    });

    useEffect(() => {
        manager.setSid(sid);
    }, [manager, sid]);

    if (!manager) return null;

    return <WebRtcContext.Provider value={manager}>{children}</WebRtcContext.Provider>;
};

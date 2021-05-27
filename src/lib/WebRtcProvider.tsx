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
    const [manager, setManager] = useState<WebRtcManager | null>();

    useEffect(() => {
        const manager = new WebRtcManager(signallingChannel, sid, config, inboundControllerBuilder, logging);
        setManager(manager);

        return () => {
            manager.destroy();
        };
    }, []);

    useEffect(() => {
        if (manager) manager.setSid(sid);
    }, [manager, sid]);

    if (!manager) return null;

    return <WebRtcContext.Provider value={manager}>{children}</WebRtcContext.Provider>;
};

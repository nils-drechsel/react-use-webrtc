import { FunctionComponent } from "react";
import { InboundControllerBuilder } from "./Controller/Controller";
import { SignallingChannel } from "./WebRtcManager";
declare type Props = {
    signallingChannel: SignallingChannel;
    sid: string;
    config: RTCConfiguration;
    logging?: boolean;
    inboundControllerBuilder: InboundControllerBuilder;
};
export declare const WebRtcProvider: FunctionComponent<Props>;
export {};

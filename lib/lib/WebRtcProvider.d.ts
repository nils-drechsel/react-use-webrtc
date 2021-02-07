import { FunctionComponent } from "react";
import { SignallingChannel } from "./WebRtcManager";
declare type Props = {
    signallingChannel: SignallingChannel;
    sid: string;
    config: RTCConfiguration;
    logging?: boolean;
};
export declare const WebRtcProvider: FunctionComponent<Props>;
export {};

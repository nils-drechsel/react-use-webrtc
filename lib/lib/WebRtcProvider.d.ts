import { FunctionComponent } from "react";
import { MediaStreamProvider, SignallingChannel } from "./WebRtcManager";
declare type Props = {
    signallingChannel: SignallingChannel;
    mediaStreamProvider: MediaStreamProvider;
    sid: string;
};
export declare const WebRtcProvider: FunctionComponent<Props>;
export {};

import { FunctionComponent } from "react";
import { MediaStreamProvider, SignallingChannel } from "./WebRtcManager";
declare type Props = {
    signallingChannel: SignallingChannel;
    mediaStreamProvider: MediaStreamProvider;
};
export declare const WebRtcProvider: FunctionComponent<Props>;
export {};

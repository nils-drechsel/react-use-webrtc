import React, { FunctionComponent, useRef, MutableRefObject, useEffect } from "react";
import { ListenerEvent } from "react-use-listeners";
import { useWebRtcManager } from "../useWebRtcManager";
import { MediaStreamObject } from "./MediaDevicesManager";

interface Props {
    cssClassName?: string;
    deviceId: string;
    streamId: string;
    width?: number | null;
    height?: number | null;
    fullscreen?: boolean;
    muted?: boolean;
}

export const VideoElement: FunctionComponent<Props> = ({
    streamId,
    cssClassName,
    width,
    height,
    fullscreen,
    muted,
}) => {
    const ref = useRef() as MutableRefObject<HTMLVideoElement>;

    const manager = useWebRtcManager();

    useEffect(() => {
        if (ref.current) {
            ref.current.onloadedmetadata = () => {
                if (ref.current)
                    manager.mediaDevicesManager.updateStreamDimensions(
                        streamId,
                        ref.current.videoWidth,
                        ref.current.videoHeight
                    );
            };

            ref.current.onloadeddata = () => {
                if (ref.current)
                    manager.mediaDevicesManager.updateStreamDimensions(
                        streamId,
                        ref.current.videoWidth,
                        ref.current.videoHeight
                    );
            };
        }

        console.log("videoelement is going to listen for stream", streamId);
        const unsubscribe = manager.mediaDevicesManager.mediaObjects.addIdListener(streamId, (_id, event) => {
            switch (event) {
                case ListenerEvent.ADDED:
                case ListenerEvent.MODIFIED:
                    const obj = manager.mediaDevicesManager.mediaObjects.get(streamId) as MediaStreamObject;

                    console.log(
                        "video element stream changed",
                        streamId,
                        event,
                        !!ref.current,
                        !!obj.stream,
                        ref.current.srcObject !== obj.stream,
                        ref.current.srcObject,
                        obj
                    );

                    if (ref.current && obj.stream && ref.current.srcObject !== obj.stream) {
                        console.log("updating stream", streamId);
                        ref.current.srcObject = obj.stream;
                        ref.current.play();
                    }
                    break;

                case ListenerEvent.REMOVED:
                    console.log("video element stream removed", streamId, event);
                    if (ref.current) ref.current.srcObject = null;
                    break;

                default:
                    throw new Error("unknown event " + event);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [ref.current, streamId]);

    let pxWidth = width ? width + "px" : undefined;
    let pxHeight = height ? height + "px" : undefined;

    if (fullscreen) {
        pxWidth = "100%";
        pxHeight = "100%";
    }

    return <video width={pxWidth} height={pxHeight} className={cssClassName} ref={ref} muted={muted} autoPlay />;
};

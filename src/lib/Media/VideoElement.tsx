import React, { FunctionComponent, useRef, MutableRefObject, useEffect } from 'react';
import { ListenerEvent } from 'react-use-listeners';
import { useWebRtcManager } from '../useWebRtcManager';
import { MediaStreamObject } from './MediaDevicesManager';

interface Props {
    cssClassName?: string;
    deviceId: string;
    streamId: string;
    width?: number | null;
    height?: number | null;
    fullscreen?: boolean;
    muted?: boolean;
}


export const VideoElement: FunctionComponent<Props> = ({ deviceId, streamId, cssClassName, width, height, fullscreen, muted}) => {

    const ref = useRef() as MutableRefObject<HTMLVideoElement>;
    const mediaStreamIdRef = useRef<string | null>(null);

    const manager = useWebRtcManager();

    useEffect(() => {

        manager.mediaDevicesManager.registerVideoOutput(deviceId, ref, streamId);

            if (ref.current) {
                ref.current.onloadedmetadata = () => {
                    if (ref.current) manager.mediaDevicesManager.updateStreamDimensions(streamId, ref.current.videoWidth, ref.current.videoHeight);
                };

                ref.current.onloadeddata = () => {
                    if (ref.current) manager.mediaDevicesManager.updateStreamDimensions(streamId, ref.current.videoWidth, ref.current.videoHeight);
                };
            }

        const unsubscribe = manager.mediaDevicesManager.mediaObjects.addIdListener(streamId, (event) => {
            switch (event) {
                case ListenerEvent.ADDED:
                case ListenerEvent.MODIFIED:
                    
                    const obj = manager.mediaDevicesManager.mediaObjects.get(streamId) as MediaStreamObject;

                    if (!obj || !obj.stream) {
                        mediaStreamIdRef.current = null;
                        return;
                    }

                    if (mediaStreamIdRef.current !== obj.stream.id) {
                        console.log("reconnecting", streamId, event);
                        mediaStreamIdRef.current = obj.stream.id;
                        manager.mediaDevicesManager.connectStreamToOutput(streamId, deviceId);
                    }
            }
        });


        return () => {
            unsubscribe();
            manager.mediaDevicesManager.deregisterVideoOutput(deviceId);
        }

    }, [ref.current, streamId])

    let pxWidth = width ? width + 'px' : undefined;
    let pxHeight = height ? height + 'px' : undefined;

    if (fullscreen) {
        pxWidth = "100%";
        pxHeight = "100%";
    }

    return <video width={pxWidth} height={pxHeight} className={cssClassName} ref={ref} muted={muted} autoPlay />;    

}
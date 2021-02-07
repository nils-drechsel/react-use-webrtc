import { createContext } from 'react';
import { WebRtcManager } from './WebRtcManager';

export const WebRtcContext = createContext<WebRtcManager | null>(null);

export default WebRtcContext;


"use strict";
//import { Sdp, SdpSection } from "./Sdp";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdpModifier = void 0;
class SdpModifier {
    constructor() {
        this.labels = new Map();
        // modify(rawSdp: RTCSessionDescriptionInit | RTCSessionDescription) {
        //     const sdp = new Sdp(rawSdp);
        //     const sdpSections: Map<string, SdpSection> = sdp.getSections();
        //     this.labels.forEach((labels: Array<string>, bundleId: string) => {
        //         if (sdpSections.has(bundleId)) {
        //             const section = sdpSections.get(bundleId)!;
        //             //section.setExtMapInfo(labels);
        //         }
        //     })
        // }
    }
    addLabels(bundleId, labels) {
        this.labels.set(bundleId, labels);
    }
    removeLabels(bundleId) {
        this.labels.delete(bundleId);
    }
}
exports.SdpModifier = SdpModifier;
//# sourceMappingURL=SdpModifier.js.map
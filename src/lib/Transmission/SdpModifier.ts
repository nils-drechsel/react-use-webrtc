//import { Sdp, SdpSection } from "./Sdp";







export class SdpModifier {

    labels: Map<string, Array<string>> = new Map();

    addLabels(bundleId: string, labels: Array<string>) {
        this.labels.set(bundleId, labels);
    }

    removeLabels(bundleId: string) {
        this.labels.delete(bundleId);
    }

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
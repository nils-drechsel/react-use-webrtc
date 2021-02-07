export declare enum SdpSectionType {
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    TEXT = "TEXT",
    APPLICATION = "APPLICATION",
    MESSAGE = "MESSAGE",
    UNKNOWN = "UNKNOWN"
}
export declare class SdpBase {
    extMapPattern: RegExp;
    isNewSection(line: string): boolean;
    getSectionType(line: string): SdpSectionType;
    identifySectionType(type: string): SdpSectionType;
    isTransmissionInformation(line: string): boolean;
    getTransmissionInformation(line: string): [string, string | null];
    isExtMapUrl(line: string): boolean;
    isMid(line: string): boolean;
    getMid(line: string): string;
}
export declare class SdpAccumulator extends SdpBase {
    lines: Array<string>;
    constructor();
    addLine(line: string): void;
    getLines(): string[];
}
export declare class SdpSection extends SdpAccumulator {
    url: string;
    lines: Array<string>;
    type: SdpSectionType;
    transmissionIds: Array<string>;
    trackId: string | null;
    mid: string | null;
    constructor();
    getType(): SdpSectionType;
    getTransmissionIds(): Array<string>;
    addLine(line: string): void;
}
export declare class Sdp extends SdpBase {
    header: SdpAccumulator;
    sections: Array<SdpSection>;
    constructor(sdp: RTCSessionDescriptionInit | RTCSessionDescription);
    getSections(): Map<string, SdpSection>;
    getSectionWithMid(mid: string): SdpSection | null;
    get(): RTCSessionDescriptionInit;
}

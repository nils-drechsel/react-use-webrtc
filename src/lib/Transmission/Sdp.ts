
export enum SdpSectionType {
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    TEXT = "TEXT",
    APPLICATION = "APPLICATION",
    MESSAGE = "MESSAGE",
    UNKNOWN = "UNKNOWN",
}


export class SdpBase {

    extMapPattern = /^a=extmap:\d+ http/;


    isNewSection(line: string) {
        return line.startsWith("m=");
    }

    getSectionType(line: string) {
        // a=video
        const type: string = line.substring(2);
        return this.identifySectionType(type);
    }

    identifySectionType(type: string): SdpSectionType {
        switch (type) {
            case "audio": return SdpSectionType.AUDIO;
            case "video": return SdpSectionType.VIDEO;
            case "text": return SdpSectionType.TEXT;
            case "application": return SdpSectionType.APPLICATION;
            case "message": return SdpSectionType.MESSAGE;
            default: return SdpSectionType.UNKNOWN; // there might be more types in the future.. don't break the app if we're not up to date
        }
    }

    isTransmissionInformation(line: string) {
        return line.startsWith("a=msid:");
    }

    getTransmissionInformation(line: string): [string, string | null] {
        const info: string = line.substring(7);
        const ids: Array<string> = info.trim().split(" ");
        if (ids.length === 0) throw new Error("invalid transmission information " + line);
        if (ids.length === 1) return [ids[0], null];
        return [ids[0], ids[1]];
    }

    isExtMapUrl(line: string) {
        return this.extMapPattern.test(line);
    }

    isMid(line: string) {
        return line.startsWith("a=mid:");
    }

    getMid(line: string): string {
        return line.substring(6).trim();
    }

}


export class SdpAccumulator extends SdpBase {

    lines: Array<string> = [];

    constructor() {
        super();
    }

    addLine(line: string) {
        this.lines.push(line);
    }

    getLines() {
        return this.lines;
    }

}




export class SdpSection extends SdpAccumulator {

    url = "http://variational.io/";
    
    lines: Array<string> = [];
    type: SdpSectionType = SdpSectionType.UNKNOWN;
    transmissionIds: Array<string> = [];
    trackId: string | null = null;
    mid: string | null = null;

    //extMapLines: Array<number> = [];

    constructor() {
        super();
    }

    getType(): SdpSectionType {
        return this.type;
    }

    getTransmissionIds(): Array<string> {
        return this.transmissionIds;
    }

    addLine(line: string) {
        if (this.isNewSection(line)) {

            this.type = this.getSectionType(line);

        } else if (this.isTransmissionInformation(line)) {

            const [transmissionId, trackId] = this.getTransmissionInformation(line);
            this.trackId = trackId;
            this.transmissionIds.push(transmissionId);

        } else if (this.isMid(line)) {
            this.mid = this.getMid(line);
        }

        this.lines.push(line);
    }

    // setExtMapInfo(info: Array<string>) {
    //     const repl = this.url + info.join("/");
    //     this.extMapLines.forEach((n: number) => {
    //         let line = this.lines[n];
    //         line = line.replace(/(a=extmap:\d+) [^ \n]+/gi, "$1 " + repl);
    //         this.lines[n] = line;
    //     });
    // }

    // private escapeRegExp = (s: string) => {
    //     return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // }

    // getExtMapInfo(): Array<string> | null {
        
    //     const escUrl = this.escapeRegExp(this.url);
    //     const pattern = new RegExp("^a=extmap:[0-9]+ " + escUrl + "([^ \\n]+)");

    //     for (let n of this.extMapLines) {
    //         const line = this.lines[n];
    //         if (pattern.test(line)) {
    //             const m = line.match(pattern);
    //             if (m && m.length == 2) {
    //                 return m[1].split("/");
    //             }
    //         }
    //     }
    //     return null;
    // }

}






export class Sdp extends SdpBase {

    header: SdpAccumulator = new SdpAccumulator();
    sections: Array<SdpSection> = [];

    constructor(sdp: RTCSessionDescriptionInit | RTCSessionDescription) {
        super();

        let acc: SdpSection = this.header as SdpSection;

        let lines = (sdp as string).split("\n");

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (this.isNewSection(line)) {
                acc = new SdpSection();
                this.sections.push(acc);
            } 
                
            acc.addLine(line);

        }
    }

    getSections(): Map<string, SdpSection> {
        const result = new Map();
        this.sections.forEach(section => {
            section.transmissionIds.forEach(transmissionId => {
                result.set(transmissionId, section);
            });
        });
        return result;
    }

    getSectionWithMid(mid: string): SdpSection | null {
        for (let section of this.sections) {
            if (section.mid === mid) {
                return section;
            }
        }
        return null;
    }

    get(): RTCSessionDescriptionInit {
        let lines = [];
        lines.push(...this.header.getLines());
        for (let section of this.sections) {
            lines.push(...section.getLines());
        }
        return lines.join("\n") as RTCSessionDescriptionInit;
    }

}
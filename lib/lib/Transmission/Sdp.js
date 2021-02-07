"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SdpSectionType;
(function (SdpSectionType) {
    SdpSectionType["AUDIO"] = "AUDIO";
    SdpSectionType["VIDEO"] = "VIDEO";
    SdpSectionType["TEXT"] = "TEXT";
    SdpSectionType["APPLICATION"] = "APPLICATION";
    SdpSectionType["MESSAGE"] = "MESSAGE";
    SdpSectionType["UNKNOWN"] = "UNKNOWN";
})(SdpSectionType = exports.SdpSectionType || (exports.SdpSectionType = {}));
class SdpBase {
    constructor() {
        this.extMapPattern = /^a=extmap:\d+ http/;
    }
    isNewSection(line) {
        return line.startsWith("m=");
    }
    getSectionType(line) {
        // a=video
        const type = line.substring(2);
        return this.identifySectionType(type);
    }
    identifySectionType(type) {
        switch (type) {
            case "audio": return SdpSectionType.AUDIO;
            case "video": return SdpSectionType.VIDEO;
            case "text": return SdpSectionType.TEXT;
            case "application": return SdpSectionType.APPLICATION;
            case "message": return SdpSectionType.MESSAGE;
            default: return SdpSectionType.UNKNOWN; // there might be more types in the future.. don't break the app if we're not up to date
        }
    }
    isTransmissionInformation(line) {
        return line.startsWith("a=msid:");
    }
    getTransmissionInformation(line) {
        const info = line.substring(7);
        const ids = info.trim().split(" ");
        if (ids.length === 0)
            throw new Error("invalid transmission information " + line);
        if (ids.length === 1)
            return [ids[0], null];
        return [ids[0], ids[1]];
    }
    isExtMapUrl(line) {
        return this.extMapPattern.test(line);
    }
    isMid(line) {
        return line.startsWith("a=mid:");
    }
    getMid(line) {
        return line.substring(6).trim();
    }
}
exports.SdpBase = SdpBase;
class SdpAccumulator extends SdpBase {
    constructor() {
        super();
        this.lines = [];
    }
    addLine(line) {
        this.lines.push(line);
    }
    getLines() {
        return this.lines;
    }
}
exports.SdpAccumulator = SdpAccumulator;
class SdpSection extends SdpAccumulator {
    //extMapLines: Array<number> = [];
    constructor() {
        super();
        this.url = "http://variational.io/";
        this.lines = [];
        this.type = SdpSectionType.UNKNOWN;
        this.transmissionIds = [];
        this.trackId = null;
        this.mid = null;
    }
    getType() {
        return this.type;
    }
    getTransmissionIds() {
        return this.transmissionIds;
    }
    addLine(line) {
        if (this.isNewSection(line)) {
            this.type = this.getSectionType(line);
        }
        else if (this.isTransmissionInformation(line)) {
            const [transmissionId, trackId] = this.getTransmissionInformation(line);
            this.trackId = trackId;
            this.transmissionIds.push(transmissionId);
        }
        else if (this.isMid(line)) {
            this.mid = this.getMid(line);
        }
        this.lines.push(line);
    }
}
exports.SdpSection = SdpSection;
class Sdp extends SdpBase {
    constructor(sdp) {
        super();
        this.header = new SdpAccumulator();
        this.sections = [];
        let acc = this.header;
        let lines = sdp.split("\n");
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (this.isNewSection(line)) {
                acc = new SdpSection();
                this.sections.push(acc);
            }
            acc.addLine(line);
        }
    }
    getSections() {
        const result = new Map();
        this.sections.forEach(section => {
            section.transmissionIds.forEach(transmissionId => {
                result.set(transmissionId, section);
            });
        });
        return result;
    }
    getSectionWithMid(mid) {
        for (let section of this.sections) {
            if (section.mid === mid) {
                return section;
            }
        }
        return null;
    }
    get() {
        let lines = [];
        lines.push(...this.header.getLines());
        for (let section of this.sections) {
            lines.push(...section.getLines());
        }
        return lines.join("\n");
    }
}
exports.Sdp = Sdp;
//# sourceMappingURL=Sdp.js.map
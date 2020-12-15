"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const URL = "https://www.url.com/";
exports.addLabels = (sdp, labels) => {
    let label = URL;
    if (!(labels instanceof Array)) {
        labels = [labels];
    }
    label += labels.join("/");
    let lines = sdp.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (/^a=extmap:[0-9]+/.test(line)) {
            line = line.replace(/(a=extmap:[0-9]+) [^ \n]+/gi, "$1 " + label);
            lines[i] = line;
            break;
        }
    }
    return lines.join("\n");
};
const escapeRegExp = (s) => {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
exports.extractLables = (sdp) => {
    const url = escapeRegExp(URL);
    const pattern = "^a=extmap:[0-9]+ " + url + "([^ \\n]+)";
    let lines = sdp.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (/^a=extmap:[0-9]+/.test(line)) {
            const m = line.match(pattern);
            if (m && m.length == 2) {
                return m[1].split("/");
            }
        }
    }
    return [];
};
//# sourceMappingURL=SdpModificator.js.map
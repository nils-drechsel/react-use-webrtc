
const URL = "https://www.url.com/";


export const addLabels = (sdp: RTCSessionDescriptionInit, labels: string | Array<string>): RTCSessionDescriptionInit => {

    let label = URL;
    if (!(labels instanceof Array)) {
        labels = [labels];
    }

    label += labels.join("/");


	let lines = (sdp as string).split("\n");

	for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (/^a=extmap:[0-9]+/.test(line)) {
            line = line.replace(/(a=extmap:[0-9]+) [^ \n]+/gi, "$1 " + label);
    		lines[i] = line;
            break;
        }
	}

	return lines.join("\n") as RTCSessionDescriptionInit;
}

const escapeRegExp = (s: string) => {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const extractLables = (sdp: RTCSessionDescriptionInit): Array<string> => {
    const url = escapeRegExp(URL);
    const pattern = "^a=extmap:[0-9]+ " + url + "([^ \\n]+)";

   let lines = (sdp as string).split("\n");

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
}
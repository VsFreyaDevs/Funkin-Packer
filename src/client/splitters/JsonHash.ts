import { Rect } from 'types';
import Splitter from './Splitter';

class JsonHash extends Splitter {
	doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			let json = JSON.parse(data);
			cb(json && json.frames && !Array.isArray(json.frames));
		}
		catch(e) {
			cb(false);
		}
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		let res = [];

		try {
			let json = JSON.parse(data);

			let names = Object.keys(json.frames);

			for(let name of names) {
				let item = json.frames[name];

				item.name = Splitter.fixFileName(name);
				res.push(item);
			}

			cb(res);
		}
		catch(e) {
			cb(false);
		}
	}

	get splitterName() {
		return 'JSON (hash)';
	}
}

export default JsonHash;
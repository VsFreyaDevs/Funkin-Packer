import { Rect } from 'types';
import Splitter from './Splitter';

class JsonArray extends Splitter {
	doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			const json = JSON.parse(data);
			cb(json && json.frames && Array.isArray(json.frames));
		}
		catch(e) {
			cb(false);
		}
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		try {
			const res = [];
			const json = JSON.parse(data);

			for(const item of json.frames) {
				item.name = Splitter.fixFileName(item.filename);
				res.push(item);
			}

		cb(res);
		}
		catch(e) {
			cb(false);
		}
	}

	get splitterName() {
		return 'JSON (array)';
	}
}

export default JsonArray;
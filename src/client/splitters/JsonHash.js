import Splitter from './Splitter';

class JsonHash extends Splitter {
	static doCheck(data, cb) {
		try {
			let json = JSON.parse(data);
			cb(json && json.frames && !Array.isArray(json.frames));
		}
		catch(e) {
			cb(false);
		}
	}

	static doSplit(data, options, cb) {
		let res = [];

		try {
			let json = JSON.parse(data);

			let names = Object.keys(json.frames);

			for(let name of names) {
				let item = json.frames[name];

				item.name = Splitter.fixFileName(name);
				res.push(item);
			}
		}
		catch(e) {
			// continue regardless of error
		}

		cb(res);
	}

	static get name() {
		return 'JSON (hash)';
	}
}

export default JsonHash;
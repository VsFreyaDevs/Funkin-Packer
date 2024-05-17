import { cleanPrefix } from '../utils/common';

class Splitter {
	static doCheck(_data) {
		throw new Error('doCheck not implemented');
	}

	static doSplit(_data, _options) {
		throw new Error('doSplit not implemented');
	}

	static get name() {
		return 'Default';
	}

	static cleanPrefix(str) {
		return cleanPrefix(str);
	}

	static fixFileName(name) {
		let validExts = ['png', 'jpg', 'jpeg'];
		let ext = name.split('.').pop().toLowerCase();

		if(validExts.indexOf(ext) < 0) name += '.png';

		return name;
	}

	static get inverseRotation() {
		return false;
	}
}

export default Splitter;
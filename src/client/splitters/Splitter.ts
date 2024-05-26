import { Rect } from 'types';
import { cleanPrefix as _cleanPrefix } from '../utils/common';

export type SplitterOptions = {
	textureWidth: number,
	textureHeight: number,
	width: number,
	height: number,
	padding: number
}

class Splitter {
	public options: SplitterOptions;

	doCheck(_data: string, cb: (checked: boolean) => void) {
		throw new Error('doCheck not implemented');
	}

	doSplit(_data: string, cb: (res: Rect[] | false) => void) {
		throw new Error('doSplit not implemented');
	}

	cleanData(_data: string) {
		return _data;
	}

	get splitterName() {
		return 'Default';
	}

	cleanPrefix(str: string) {
		return _cleanPrefix(str);
	}

	static fixFileName(name: string) {
		let validExts = ['png', 'jpg', 'jpeg'];
		let ext = name.split('.').pop().toLowerCase();

		if(validExts.indexOf(ext) < 0) name += '.png';

		return name;
	}

	get inverseRotation() {
		return false;
	}
}

export default Splitter;
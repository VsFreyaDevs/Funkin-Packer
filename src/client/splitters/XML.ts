import { Rect } from 'types';
import Splitter from './Splitter';

import * as xmlParser from 'xml2js';
import { isNullOrUndefined } from '../utils/common';

class XML extends Splitter {
	doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			xmlParser.parseString(data, (err, atlas) => {
				if(err) {
					cb(false);
					return;
				}

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.sprite));
			});
		}
		catch(e) {
			cb(false);
		}
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		if(isNullOrUndefined(data)) {
			cb(false);
			return;
		}

		try {
			xmlParser.parseString(data, (err, atlas) => {
				if(err) {
					cb(false);
					return;
				}

				let res = [];

				let list = atlas.TextureAtlas.sprite;

				for(let item of list) {
					item = item.$;

					item.x *= 1;
					item.y *= 1;
					item.w *= 1;
					item.h *= 1;
					item.oX *= 1;
					item.oY *= 1;
					item.oW *= 1;
					item.oH *= 1;

					let trimmed = item.w < item.oW || item.h < item.oH;

					res.push({
						name: Splitter.fixFileName(item.n),
						frame: {
							x: item.x,
							y: item.y,
							w: item.w,
							h: item.h
						},
						spriteSourceSize: {
							x: item.oX,
							y: item.oY,
							w: item.w,
							h: item.h
						},
						sourceSize: {
							w: item.oW,
							h: item.oH,
							frameWidth: item.oW,
							frameHeight: item.oH
						},
						rotated: item.r === 'y',
						trimmed
					});
				}

				cb(res);
			});
		}
		catch(e) {
			cb(false);
		}
	}

	get splitterName() {
		return 'XML';
	}
}

export default XML;
import { Rect, SplitterRect } from 'types';
import { isNullOrUndefined } from '../utils/common';
import Splitter from './Splitter';

import * as xmlParser from 'xml2js';

class Sparrow extends Splitter {
	cleanData(data: string): string {
		if(isNullOrUndefined(data)) {
			return data;
		}
		return (data.startsWith("ï»¿")) ? data.slice(3) : data;
	}

	doCheck(data: string, cb: (checked: boolean) => void) {
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

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.SubTexture));
			});
		}
		catch(e) {
			console.error(e);
			cb(false);
		}
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		if(isNullOrUndefined(data)) {
			cb(false);
			return;
		}

		let res: SplitterRect[] = [];

		try {
			xmlParser.parseString(data, (err, atlas) => {
				if(err) {
					cb(res);
					return;
				}

				let list = atlas.TextureAtlas.SubTexture;

				for(let item of list) {
					item = item.$;

					let name = Splitter.fixFileName(item.name);

					let rotated = item.rotated === 'true';
					if(rotated) {
						// Unsure if i should swap the offsets too?
						let temp = item.width;
						item.width = item.height;
						item.height = temp;
					}

					item.x = parseInt(item.x, 10);
					item.y = parseInt(item.y, 10);
					item.width = parseInt(item.width, 10);
					item.height = parseInt(item.height, 10);
					if(!isNullOrUndefined(item.frameX)) {
						item.frameX = -parseInt(item.frameX, 10);
						item.frameY = -parseInt(item.frameY, 10);
						item.frameWidth = parseInt(item.frameWidth, 10);
						item.frameHeight = parseInt(item.frameHeight, 10);
					} else {
						item.frameX = 0;
						item.frameY = 0;
						item.frameWidth = item.width;
						item.frameHeight = item.height;
					}

					let trimmed = item.width < item.frameWidth || item.height < item.frameHeight;

					// TODO: make this only happen visually, since users have reported issues with this
					//item.frameWidth = Math.max(item.frameWidth, item.width + item.frameX);
					//item.frameHeight = Math.max(item.frameHeight, item.height + item.frameY);

					res.push({
						name,
						frame: {
							x: item.x,
							y: item.y,
							w: item.width,
							h: item.height
						},
						spriteSourceSize: {
							x: item.frameX,
							y: item.frameY,
							w: item.width,
							h: item.height
						},
						sourceSize: {
							w: item.frameWidth,
							h: item.frameHeight,
							frameWidth: item.frameWidth,
							frameHeight: item.frameHeight
						},
						rotated,
						trimmed
					});
				}

				cb(res);
			});
		}
		catch(e) {
			console.error(e);
		}

		cb(res);
	}

	get splitterName() {
		return 'Sparrow';
	}
}

export default Sparrow;
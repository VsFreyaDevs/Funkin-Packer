import { Rect, SplitterRect } from 'types';
import { isNullOrUndefined } from '../utils/common';
import Splitter from './Splitter';

import * as xmlParser from 'xml2js';

type SparrowFrame = {
	x: number,
	y: number,
	width: number,
	height: number,
	frameX?: number,
	frameY?: number,
	frameWidth?: number,
	frameHeight?: number,
	rotated?: boolean
}

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

				for(let li of list) {
					let attribs = li.$;

					let name = Splitter.fixFileName(attribs.name);

					let rotated = attribs.rotated === 'true';
					if(rotated) {
						// Unsure if i should swap the offsets too?
						let temp = attribs.width;
						attribs.width = attribs.height;
						attribs.height = temp;
					}

					let item: SparrowFrame = {
						x: parseInt(attribs.x, 10),
						y: parseInt(attribs.y, 10),
						width: parseInt(attribs.width, 10),
						height: parseInt(attribs.height, 10),
						rotated: rotated
					};

					if(!isNullOrUndefined(attribs.frameX)) {
						item.frameX = -parseInt(attribs.frameX, 10);
						item.frameY = -parseInt(attribs.frameY, 10);
						item.frameWidth = parseInt(attribs.frameWidth, 10);
						item.frameHeight = parseInt(attribs.frameHeight, 10);
					} else {
						item.frameX = 0;
						item.frameY = 0;
						item.frameWidth = item.width;
						item.frameHeight = item.height;
					}

					//console.log(name, item);

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
							h: item.frameHeight
						},
						frameSize: {
							x: item.frameX,
							y: item.frameY,
							w: item.frameWidth,
							h: item.frameHeight
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
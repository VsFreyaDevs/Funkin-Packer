import { isNullOrUndefined } from '../utils/common';
import Splitter from './Splitter';

import xmlParser from 'xml2js';

class Sparrow extends Splitter {
	static doCheck(data, cb) {
		if(isNullOrUndefined(data)) {
			cb(false);
			return;
		}

		try {
			if(data.startsWith("ï»¿")) data = data.slice(3);

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

	static doSplit(data, options, cb) {
		let res = [];

		if(isNullOrUndefined(data)) {
			cb(false);
			return;
		}

		try {
			if(data.startsWith("ï»¿")) data = data.slice(3);

			xmlParser.parseString(data, (err, atlas) => {
				if(err) {
					cb(res);
					return;
				}

				let list = atlas.TextureAtlas.SubTexture;

				//var firstName = null;

				for(let item of list) {
					item = item.$;

					let name = Splitter.fixFileName(item.name);

					//if(firstName === null) firstName = name;

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

					item.frameWidth = Math.max(item.frameWidth, item.width + item.frameX);
					item.frameHeight = Math.max(item.frameHeight, item.height + item.frameY);

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

	static get name() {
		return 'Sparrow';
	}
}

export default Sparrow;
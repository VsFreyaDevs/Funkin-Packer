import { cleanPrefix } from '../utils/common';
import Splitter from './Splitter';

import xmlParser from 'xml2js';

class Sparrow extends Splitter {
	static check(data, cb) {
		if(data == null) {
			cb(false);
			return;
		}

		try {
			if(data.startsWith("ï»¿")) data = data.slice(3);

			xmlParser.parseString(data, (err, atlas) => {
				window.atlas = atlas;

				if(err) {
					cb(false);
					return;
				}
				window.atlas = atlas;

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.SubTexture));
			});
		}
		catch(e) {
			console.error(e);
			cb(false);
		}
	}

	static split(data, options, cb) {
		let res = [];

		if(data == null) {
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

				window.atlas = atlas;
				//window.sparrowOrigMap = {};

				let list = atlas.TextureAtlas.SubTexture;

				//var firstName = null;
				var order = [];

				for(let item of list) {
					item = item['$'];

					var name = Splitter.fixFileName(item.name);

					//if(firstName === null) firstName = name;
					order.push(name);

					/*var orig = {};
					orig.x = item.x;
					orig.y = item.y;
					orig.width = item.width;
					orig.height = item.height;
					orig.frameX = item.frameX;
					orig.frameY = item.frameY;
					orig.frameWidth = item.frameWidth;
					orig.frameHeight = item.frameHeight;
					orig.rotated = item.rotated;

					window.sparrowOrigMap[item.name] = orig;*/

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
					if(item.frameX != null) {
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
						name: name,
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
						//orig: orig,
						rotated: rotated,
						trimmed: trimmed
					});

					//if(item.name.startsWith("up0")) {
					//    console.log(res[res.length-1]);
					//}
				}

				var maxSizes = {};

				for(let item of res) {
					var prefix = cleanPrefix(item.name);

					if(maxSizes[prefix] == null) {
						maxSizes[prefix] = {
							mw: -Infinity,
							mh: -Infinity,
						};
					}

					maxSizes[prefix].mw = Math.max(item.sourceSize.w, maxSizes[prefix].mw);
					maxSizes[prefix].mh = Math.max(item.sourceSize.h, maxSizes[prefix].mh);
					//maxSizes[prefix].mw = Math.max(item.orig.width, maxSizes[prefix].mw);
					//maxSizes[prefix].mh = Math.max(item.orig.height, maxSizes[prefix].mh);
				}

				for(let item of res) {
					var prefix = cleanPrefix(item.name);

					item.sourceSize.mw = maxSizes[prefix].mw;
					item.sourceSize.mh = maxSizes[prefix].mh;
				}

				window.sparrowMaxMap = maxSizes;

				//console.log(maxSizes);

				//window.__sparrow_firstName = firstName;
				window.__sparrow_order = order;

				cb(res);
			});
		}
		catch(e) {
			console.error(e);
		}

		cb(res);
	}

	static get type() {
		return 'Sparrow';
	}
}

export default Sparrow;
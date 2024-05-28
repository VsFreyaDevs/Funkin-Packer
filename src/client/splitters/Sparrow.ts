import { Rect, SplitterRect } from 'types';
import { isNullOrUndefined } from '../utils/common';
import Splitter from './Splitter';

import * as xmlParser from 'xml2js';
import { HaxeXmlParser } from './tools/HaxeXmlParser';

type SparrowFrame = {
	x: number,
	y: number,
	name: string,
	width: number,
	height: number,
	frameX?: number,
	frameY?: number,
	frameWidth?: number,
	frameHeight?: number,
	rotated?: boolean
}

type RawSparrowFrame = {
	x: string,
	y: string,
	name: string,
	width: string,
	height: string,
	frameX?: string,
	frameY?: string,
	frameWidth?: string,
	frameHeight?: string,
	rotated?: string
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
					throw err;
				}

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.SubTexture));
			});
		}
		catch(e) {
			try {
				console.log("Trying to parse as Haxe Xml");
				var atlas = HaxeXmlParser.parse(data, false);
				console.log("Parsed as Haxe Xml");
				console.log(atlas);
				if(atlas.hasElement("TextureAtlas")) {
					var list = atlas.firstElement();
					var arr = list.elementsNamed("SubTexture");
					cb(arr.length > 0);
				} else {
					cb(false);
				}
			} catch(e) {
				console.error(e);
				cb(false);
			}
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
					throw err;
				}

				let list = atlas.TextureAtlas.SubTexture;

				for(let li of list) {
					let attribs = li.$;

					res.push(this.convertToRect({
						name: attribs.name,
						x: attribs.x,
						y: attribs.y,
						width: attribs.width,
						height: attribs.height,
						frameX: attribs.frameX,
						frameY: attribs.frameY,
						frameWidth: attribs.frameWidth,
						frameHeight: attribs.frameHeight,
						rotated: attribs.rotated
					}));
				}

				cb(res);
			});
		}
		catch(e) {
			try {
				var atlas = HaxeXmlParser.parse(data, false).firstElement();
				var rects = atlas.elementsNamed("SubTexture");
				for(const rect of rects) {
					res.push(this.convertToRect({
						name: rect.get("name"),
						x: rect.get("x"),
						y: rect.get("y"),
						width: rect.get("width"),
						height: rect.get("height"),
						frameX: rect.get("frameX"),
						frameY: rect.get("frameY"),
						frameWidth: rect.get("frameWidth"),
						frameHeight: rect.get("frameHeight"),
						rotated: rect.get("rotated")
					}));
				}
				cb(res);
				return;
			} catch(e) {
				console.error(e);
			}
		}

		cb(res);
	}

	convertToRect(attribs:RawSparrowFrame): Rect {
		let name = Splitter.fixFileName(attribs.name);

		let rotated = attribs.rotated === 'true';
		if(rotated) {
			// Unsure if i should swap the offsets too?
			let temp = attribs.width;
			attribs.width = attribs.height;
			attribs.height = temp;
		}

		let item: SparrowFrame = {
			name: name,
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

		return {
			name: item.name,
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
		};
	}

	get splitterName() {
		return 'Sparrow';
	}
}

export default Sparrow;
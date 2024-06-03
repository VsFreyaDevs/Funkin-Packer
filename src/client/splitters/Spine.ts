import { Rect, SplitterRect } from 'types';
import Splitter from './Splitter';

/*class Point {
	x: number;
	y: number;
}*/

class Spine extends Splitter {
	doCheck(data: string, cb: (checked: boolean) => void) {
		let lines = data.split('\n');
		if(lines.length < 2) return cb(false);
		if(lines[0].trim() !== '') return cb(false);

		if(lines[lines.length-1].trim() !== '') return cb(false);

		cb(lines[2] && lines[2].trim().indexOf('size:') === 0);
	}

	static finalizeItem(item:SplitterRect):Rect {
		/*if(item.offset) {
			item.spriteSourceSize = {
				x: item.offset.x,
				y: item.offset.y,
				w: item.frame.w,
				h: item.frame.h
			}
		}
		else {
			item.spriteSourceSize = {x: 0, y: 0, w: item.frame.w, h: item.frame.h};
		}*/

		item.trimmed = item.frame.w !== item.sourceSize.w || item.frame.h !== item.sourceSize.h;

		return item as Rect;
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		let res:Rect[] = [];

		let lines = data.split('\n');

		let currentItem:SplitterRect = null;

		for(let i=6; i<lines.length; i++) {
			let line = lines[i];

			if(!line) continue;

			if(line[0].trim()) {
				if(currentItem) {
					res.push(Spine.finalizeItem(currentItem));
				}

				currentItem = {
					name: Splitter.fixFileName(line.trim()),
					spriteSourceSize: {
						x: 0,
						y: 0,
						w: -1,
						h: -1
					},
					frame: {
						x: -1,
						y: -1,
						w: -1,
						h: -1
					},
					sourceSize: {
						w: -1,
						h: -1
					},
					frameSize: {
						x: -1,
						y: -1,
						w: -1,
						h: -1
					},
					trimmed: false,
					rotated: false
				};
			}
			else {
				line = line.trim();
				let parts = line.split(':');
				let name = parts[0].trim();
				let val = parts[1].trim();

				let valParts = val.split(',');
				valParts[0] = valParts[0].trim();

				if(valParts[1]) valParts[1] = valParts[1].trim();

				switch (name) {
					case "rotate":
						currentItem.rotated = val === 'true';
						break;
					case "xy":
						currentItem.frame.x = parseInt(valParts[0], 10);
						currentItem.frame.y = parseInt(valParts[1], 10);
						break;
					case "size":
						currentItem.frame.w = parseInt(valParts[0], 10);
						currentItem.frame.h = parseInt(valParts[1], 10);
						currentItem.spriteSourceSize.w = currentItem.frame.w;
						currentItem.spriteSourceSize.h = currentItem.frame.h;
						break;
					case "orig":
						currentItem.sourceSize.w = parseInt(valParts[0], 10);
						currentItem.sourceSize.h = parseInt(valParts[1], 10);
						currentItem.frameSize.w = currentItem.sourceSize.w;
						currentItem.frameSize.h = currentItem.sourceSize.h;
						break;
					case "offset":
						currentItem.spriteSourceSize.x = parseInt(valParts[0], 10);
						currentItem.spriteSourceSize.y = parseInt(valParts[1], 10);
						currentItem.frameSize.x = currentItem.spriteSourceSize.x;
						currentItem.frameSize.y = currentItem.spriteSourceSize.y;
						break;
					default:
						break;
				}
			}
		}

		if(currentItem) {
			res.push(Spine.finalizeItem(currentItem));
		}

		cb(res);
	}

	get splitterName() {
		return 'Spine';
	}

	get inverseRotation() {
		return true;
	}
}

export default Spine;
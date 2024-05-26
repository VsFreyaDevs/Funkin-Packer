import { Rect } from 'types';
import Splitter from './Splitter';

import * as plist from 'plist';

class UIKit extends Splitter {
	doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			let atlas = plist.parse(data);
			if(!atlas) return cb(false);

			var frames = (atlas as plist.PlistObject).frames as plist.PlistObject;
			if(!frames) return cb(false);

			if(atlas && frames) {
				let names = Object.keys(frames);
				let frame = frames[names[0]] as plist.PlistObject;

				if(!frame) return cb(false);

				cb(frame.x !== undefined &&
					frame.y !== undefined &&
					frame.w !== undefined &&
					frame.h !== undefined &&
					frame.oX !== undefined &&
					frame.oY !== undefined &&
					frame.oW !== undefined &&
					frame.oH !== undefined);
			}

			cb(false);
		}
		catch(e) {
			cb(false);
		}
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		try {
			let res:Rect[] = [];

			let atlas = plist.parse(data);
			var frames = (atlas as plist.PlistObject).frames as plist.PlistObject;

			let names = Object.keys(frames);

			for(let name of names) {
				let item = frames[name] as plist.PlistObject;

				let trimmed = item.w < item.oW || item.h < item.oH;

				res.push({
					name: Splitter.fixFileName(name),
					frame: {
						x: item.x as number,
						y: item.y as number,
						w: item.w as number,
						h: item.h as number
					},
					spriteSourceSize: {
						x: item.oX as number,
						y: item.oY as number,
						w: item.w as number,
						h: item.h as number
					},
					sourceSize: {
						w: item.oW as number,
						h: item.oH as number
					},
					frameSize: {
						x: item.oX as number,
						y: item.oY as number,
						w: item.oW as number,
						h: item.oH as number
					},
					trimmed,
					rotated: false
				});
			}

			cb(res);
		}
		catch(e) {
			// continue regardless of error
		}
	}

	get splitterName() {
		return 'UIKit';
	}
}

export default UIKit;
import { Rect } from 'types';
import Splitter from './Splitter';

class Grid extends Splitter {
	doCheck(data: string, cb: (checked: boolean) => void) {
		cb(false);
	}

	doSplit(data: string, cb: (res: Rect[] | false) => void) {
		let res = [];

		let fw = (this.options.width + this.options.padding * 2);
		let fh = (this.options.height + this.options.padding * 2);

		let cols = Math.floor(this.options.textureWidth / fw);
		let rows = Math.floor(this.options.textureHeight / fh);

		let nc = (cols * rows) + '';

		let ix = 0;
		for(let y=0; y<rows; y++) {
			for(let x=0; x<cols; x++) {
				let name = ix + '';
				while(name.length < nc.length) name = '0' + name;

				res.push({
					name: Splitter.fixFileName(name),
					frame: {
						x: x * fw + this.options.padding,
						y: y * fh + this.options.padding,
						w: this.options.width,
						h: this.options.height
					},
					spriteSourceSize: {
						x: 0,
						y: 0,
						w: this.options.width,
						h: this.options.height
					},
					sourceSize: {
						w: this.options.width,
						h: this.options.height,
						frameWidth: this.options.width,
						frameHeight: this.options.height
					},
					trimmed: false,
					rotated: false
				});

				ix++;
			}
		}

		cb(res);
	}

	get splitterName() {
		return 'Grid';
	}
}

export default Grid;
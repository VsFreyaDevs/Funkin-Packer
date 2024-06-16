import type { PackOptions, Rect } from "api/types";

export function getSheetSize(data:Rect[], options:PackOptions={}) {
	let width = options.width || 0;
	let height = options.height || 0;

	//let padding = options.padding || 0;
	const borderPadding = options.borderPadding || 0;

	if(!options.fixedSize) {
		width = 0;
		height = 0;

		for (let item of data) {
			let w = item.frame.x;
			let h = item.frame.y;

			if(item.rotated) {
				w += item.frame.h;
				h += item.frame.w;
			} else {
				w += item.frame.w;
				h += item.frame.h;
			}

			if (w > width) {
				width = w;
			}
			if (h > height) {
				height = h;
			}
		}

		width += borderPadding;
		height += borderPadding;
	}

	if (options.powerOfTwo) {
		let sw = Math.round(Math.log2(width));
		let sh = Math.round(Math.log2(height));

		let pw = 2 ** sw;
		let ph = 2 ** sh;

		if(pw < width) pw = 2 ** (sw + 1);
		if(ph < height) ph = 2 ** (sh + 1);

		width = pw;
		height = ph;
	}

	return {width, height} as const;
}
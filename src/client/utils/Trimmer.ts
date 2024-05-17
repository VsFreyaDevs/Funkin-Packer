import { Rect } from "types";

let cns = document.createElement("canvas");
let ctx = cns.getContext("2d", {willReadFrequently: true});

/*#__PURE__*/
function getAlpha(data: Uint8ClampedArray, width: number, x: number, y: number) {
	return data[((y * (width * 4)) + (x * 4)) + 3];
}

class Trimmer {
	static getLeftSpace(data: Uint8ClampedArray, width: number, height: number, threshold: number) {
		for(let x=0; x<width; x++) {
			for(let y=0; y<height; y++) {
				if(getAlpha(data, width, x, y) > threshold) {
					return x;
				}
			}
		}

		return width;
	}

	static getRightSpace(data: Uint8ClampedArray, width: number, height: number, threshold: number) {
		for(let x=width-1; x>=0; x--) {
			for(let y=0; y<height; y++) {
				if(getAlpha(data, width, x, y) > threshold) {
					return width-x-1;
				}
			}
		}

		return width;
	}

	static getTopSpace(data: Uint8ClampedArray, width: number, height: number, threshold: number) {
		for(let y=0; y<height; y++) {
			for(let x=0; x<width; x++) {
				if(getAlpha(data, width, x, y) > threshold) {
					return y;
				}
			}
		}

		return height;
	}

	static getBottomSpace(data: Uint8ClampedArray, width: number, height: number, threshold: number) {
		for(let y=height-1; y>=0; y--) {
			for(let x=0; x<width; x++) {
				if(getAlpha(data, width, x, y) > threshold) {
					return height-y-1;
				}
			}
		}

		return height;
	}

	static trim(rects:Rect[], threshold:number=0) {
		if(rects.length === 0) return;

		if(PROFILER)
			console.time("trim");
		for(let item of rects) {
			let img = item.image;

			let spaces = {left: 0, right: 0, top: 0, bottom: 0};

			let cached = img.cachedTrim !== undefined && img.cachedTrim === threshold;

			if(cached) {
				spaces = img.cachedSpaces;
			} else {
				cns.width = img.width;
				cns.height = img.height;

				ctx.clearRect(0, 0, img.width, img.height);

				ctx.drawImage(img.image, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

				let {data} = ctx.getImageData(0, 0, img.width, img.height);

				spaces.left = this.getLeftSpace(data, img.width, img.height, threshold);

				if(spaces.left !== img.width) { // was able to trim it
					spaces.right = this.getRightSpace(data, img.width, img.height, threshold);
					spaces.top = this.getTopSpace(data, img.width, img.height, threshold);
					spaces.bottom = this.getBottomSpace(data, img.width, img.height, threshold);
				}
			}

			//console.log(spaces);

			if(spaces.left !== img.width) { // was able to trim it
				if(spaces.left > 0 || spaces.right > 0 || spaces.top > 0 || spaces.bottom > 0) {
					item.trimmed = true;
					item.spriteSourceSize.x = spaces.left;
					item.spriteSourceSize.y = spaces.top;
					//item.spriteSourceSize.w = img.width-spaces.right;
					//item.spriteSourceSize.h = img.height-spaces.bottom;
					item.spriteSourceSize.w = img.width-spaces.left-spaces.right;
					item.spriteSourceSize.h = img.height-spaces.top-spaces.bottom;
					//console.log(item.name, spaces);
				}
			} else { // wasn't able to trim it empty image
				item.trimmed = true;
				item.spriteSourceSize.x = 0;
				item.spriteSourceSize.y = 0;
				item.spriteSourceSize.w = 1;
				item.spriteSourceSize.h = 1;
			}

			item.trimmedImage = cached ? img.cachedTrimmedImage : ctx.getImageData(
				item.spriteSourceSize.x,
				item.spriteSourceSize.y,
				item.spriteSourceSize.w,
				item.spriteSourceSize.h
			).data;

			if(item.trimmed) {
				item.frame.w = item.spriteSourceSize.w;
				item.frame.h = item.spriteSourceSize.h;
			}

			img.cachedTrimmedImage = item.trimmedImage;
			img.cachedSpaces = spaces;
			img.cachedTrim = threshold;
		}
		if(PROFILER)
			console.timeEnd("trim");
	}
}

export default Trimmer;
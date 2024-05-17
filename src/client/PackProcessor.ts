import MaxRectsBinPack from './packers/MaxRectsBin';
import OptimalPacker from './packers/OptimalPacker';
import allPackers, { getPackerByType } from './packers';
import Trimmer from './utils/Trimmer';
import TextureRenderer from './utils/TextureRenderer';

import I18 from './utils/I18';
import { LoadedImages, PackOptions, Rect } from 'types';
import { TreeListItem, TreeListItems } from 'ui/ItemTree';

class PackProcessor {
	static detectIdentical(rects: Rect[], didTrim: boolean) {
		let identical = [];

		const len = rects.length;

		for (let i = 0; i < len; i++) {
			let rect1 = rects[i];
			for (let n = i + 1; n < len; n++) {
				let rect2 = rects[n];
				if (identical.indexOf(rect2) === -1 && PackProcessor.compareImages(rect1, rect2, didTrim)) {
					rect2.identical = rect1;
					identical.push(rect2);
				}
			}
		}

		for (let rect of identical) {
			rects.splice(rects.indexOf(rect), 1);
		}

		return {
			rects,
			identical
		}
	}

	static compareImages(rect1:Rect, rect2:Rect, didTrim:boolean) {
		if(!didTrim) {
			if(rect1.image.base64 === rect2.image.base64) {
				return true;
			}
			return rect1.image.src === rect2.image.src;
		}

		const i1 = rect1.trimmedImage;
		const i2 = rect2.trimmedImage;

		//return i1 === i2;

		if(i1.length !== i2.length) return false;

		let length = i1.length;

		while(length--) {
			if(i1[length] !== i2[length]) return false;
		}
		return true;
	}

	static applyIdentical(rects:Rect[], identical:Rect[]) {
		let clones:Rect[] = [];
		let removeIdentical:Rect[] = [];

		for (let item of identical) {
			let ix = rects.indexOf(item.identical);
			if (ix >= 0) {
				let rect = rects[ix];

				let clone = { ...rect};

				clone.name = item.name;
				clone.image = item.image;
				clone.originalFile = item.file;
				clone.frame = { ...item.frame};
				clone.frame.x = rect.frame.x;
				clone.frame.y = rect.frame.y;
				clone.sourceSize = { ...item.sourceSize};
				clone.spriteSourceSize = { ...item.spriteSourceSize};
				clone.skipRender = true;

				removeIdentical.push(item);
				clones.push(clone);
			}
		}

		for (let item of removeIdentical) {
			identical.splice(identical.indexOf(item), 1);
		}

		for (let item of clones) {
			item.cloned = true;
			rects.push(item);
		}

		return rects;
	}

	static pack(images:LoadedImages, options: PackOptions = {}, onComplete:Function = null, onError:Function = null, onProgress:Function = null) {
		//debugger;
		if(PROFILER)
			console.time("pack");
		console.log(images);
		let rects:Rect[] = [];

		let spritePadding = options.spritePadding || 0;
		let borderPadding = options.borderPadding || 0;

		let maxWidth = 0, maxHeight = 0;
		let minWidth = 0, minHeight = 0;

		let alphaThreshold = options.alphaThreshold || 0;
		if (alphaThreshold > 255) alphaThreshold = 255;

		let names = Object.keys(images).sort();

		for (let key of names) {
			let img = images[key];

			let name = key.split(".")[0];

			maxWidth += img.width;
			maxHeight += img.height;

			// This is probably wrong
			if (img.width > minWidth) minWidth = img.width + spritePadding * 2;// + borderPadding * 2;
			if (img.height > minHeight) minHeight = img.height + spritePadding * 2;// + borderPadding * 2;

			rects.push({
				frame: { x: 0, y: 0, w: img.width, h: img.height },
				rotated: false,
				trimmed: false,
				spriteSourceSize: { x: 0, y: 0, w: img.width, h: img.height },
				sourceSize: {
					w: img.width,
					h: img.height,
					frameWidth: img.width,
					frameHeight: img.height,
					mw: img.width,
					mh: img.height
				},
				name,
				file: key,
				image: img
			});
		}

		minWidth += borderPadding * 2;
		minHeight += borderPadding * 2;

		let width = options.width || 0;
		let height = options.height || 0;

		if (!width) width = maxWidth; // this can probably be placed in the || 0 part
		if (!height) height = maxHeight;

		if (options.powerOfTwo) {
			let sw = Math.round(Math.log2(width));
			let sh = Math.round(Math.log2(height));

			let pw = 2 ** sw;
			let ph = 2 ** sh;

			if (pw < width) pw = 2 ** (sw + 1);
			if (ph < height) ph = 2 ** (sh + 1);

			width = pw;
			height = ph;
		}

		if (width < minWidth || height < minHeight) {
			if (onError) onError({
				description: I18.f("INVALID_SIZE_ERROR", minWidth, minHeight)
			});
			if(PROFILER)
				console.timeEnd("pack");
			return;
		}

		if (options.allowTrim) {
			Trimmer.trim(rects, alphaThreshold);
		}

		let identical:Rect[] = [];

		if (options.detectIdentical) {
			let res = PackProcessor.detectIdentical(rects, options.allowTrim);

			rects = res.rects;
			identical = res.identical;
		}

		let getAllPackers = () => {
			let methods = [];
			for (let packerClass of allPackers) {
				if (packerClass !== OptimalPacker) {
					for (let method in packerClass.methods) {
						if(!Object.hasOwn(packerClass.methods, method)) continue;

						methods.push({ packerClass, packerMethod: packerClass.methods[method], allowRotation: false });
						if (options.allowRotation) {
							methods.push({ packerClass, packerMethod: packerClass.methods[method], allowRotation: true });
						}
					}
				}
			}
			return methods;
		};

		let packerClass = getPackerByType(options.packer) || MaxRectsBinPack;
		let packerMethod = options.packerMethod || MaxRectsBinPack.methods.BestShortSideFit;
		let packerCombos = (packerClass === OptimalPacker) ? getAllPackers() : [{ packerClass, packerMethod, allowRotation: options.allowRotation }];

		let optimalRes;
		let optimalSheets = Infinity;
		let optimalEfficiency = 0;

		let sourceArea = 0;
		for (let rect of rects) {
			sourceArea += rect.sourceSize.w * rect.sourceSize.h;
		}

		for (let combo of packerCombos) {
			let res = [];
			let sheetArea = 0;

			// duplicate rects if more than 1 combo since the array is mutated in pack()
			let _rects = packerCombos.length > 1 ? rects.map(rect => (
				{
					...rect,
					frame: { ...rect.frame},
					spriteSourceSize: { ...rect.spriteSourceSize},
					sourceSize: { ...rect.sourceSize}
				}
			)) : rects;

			// duplicate identical if more than 1 combo and fix references to point to the
			//  cloned rects since the array is mutated in applyIdentical()
			// Optimize?
			let _identical = packerCombos.length > 1 ? identical.map(rect => {
				for (let rect2 of _rects) {
					if (rect.identical.image.base64 === rect2.image.base64) {
						return { ...rect, identical: rect2};
					}
				}
				return {...rect};
			}) : identical;

			while (_rects.length) {
				// eslint-disable-next-line new-cap
				let packer = new combo.packerClass(width, height, combo.allowRotation, spritePadding);
				let result = packer.pack(_rects, combo.packerMethod);

				if (options.detectIdentical) {
					result = PackProcessor.applyIdentical(result, _identical);
				}

				res.push(result);

				for (let item of result) {
					this.removeRect(_rects, item.name);
				}

				let { width: sheetWidth, height: sheetHeight } = TextureRenderer.getSize(result, options);
				sheetArea += sheetWidth * sheetHeight;
			}

			let sheets = res.length;
			let efficiency = sourceArea / sheetArea;
			// TODO: calculate ram usage instead

			if (sheets < optimalSheets || (sheets === optimalSheets && efficiency > optimalEfficiency)) {
				optimalRes = res;
				optimalSheets = sheets;
				optimalEfficiency = efficiency;
			}
		}

		for (let sheet of optimalRes) {
			for(let item of sheet) {
				item.frame.x += borderPadding;
				item.frame.y += borderPadding;
			}
		}

		if(PROFILER)
			console.timeEnd("pack");

		if (onComplete) {
			onComplete(optimalRes);
		}
	}

	static removeRect(rects:Rect[], name:string) {
		for (let i = 0; i < rects.length; i++) {
			if (rects[i].name === name) {
				rects.splice(i, 1);
				return;
			}
		}
	}
}

export default PackProcessor;
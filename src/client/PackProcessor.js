import MaxRectsBinPack from './packers/MaxRectsBin';
import OptimalPacker from './packers/OptimalPacker';
import allPackers from './packers';
import Trimmer from './utils/Trimmer';
import TextureRenderer from './utils/TextureRenderer';

import I18 from './utils/I18';

class PackProcessor {

	static detectIdentical(rects, didTrim) {
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
			rects: rects,
			identical: identical
		}
	}

	static compareImages(rect1, rect2, didTrim) {
		//return rect1.image._base64 == rect2.image._base64;
		if(!didTrim) {
			if(rect1.image._base64 === rect2.image._base64) {
				return true;
			}
			return rect1.image.src === rect2.image.src;
		}

		/*if(rect1.image.cachedDetection !== undefined) {
			if(rect1.image.cachedDetection[rect2.image]) {
				return true;
			}
		} else {
			rect1.image.cachedDetection = [];
		}
		if(rect2.image.cachedDetection !== undefined) {
			if(rect2.image.cachedDetection[rect1.image]) {
				return true;
			}
		} else {
			rect2.image.cachedDetection = [];
		}*/

		var i1 = rect1.trimmedImage;
		var i2 = rect2.trimmedImage;

		//return i1 === i2;

		if(i1.length !== i2.length) return false;

		var length = i1.length;

		while(length--) {
			if(i1[length] !== i2[length]) return false;
		}
		//rect1.image.cachedDetection.push(rect2.image);
		//rect2.image.cachedDetection.push(rect1.image);
		return true;
	}

	static applyIdentical(rects, identical) {
		let clones = [];
		let removeIdentical = [];

		for (let item of identical) {
			let ix = rects.indexOf(item.identical);
			if (ix >= 0) {
				let rect = rects[ix];

				let clone = Object.assign({}, rect);

				clone.name = item.name;
				clone.image = item.image;
				clone.originalFile = item.file;
				clone.frame = Object.assign({}, item.frame);
				clone.frame.x = rect.frame.x;
				clone.frame.y = rect.frame.y;
				clone.sourceSize = Object.assign({}, item.sourceSize);
				clone.spriteSourceSize = Object.assign({}, item.spriteSourceSize);
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

	static pack(images = {}, options = {}, onComplete = null, onError = null) {
		//debugger;
		let rects = [];

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
				sourceSize: { w: img.width, h: img.height },
				name: name,
				file: key,
				image: img
			});
		}

		minWidth += borderPadding * 2;
		minHeight += borderPadding * 2;

		let width = options.width || 0;
		let height = options.height || 0;

		if (!width) width = maxWidth;
		if (!height) height = maxHeight;

		if (options.powerOfTwo) {
			let sw = Math.round(Math.log(width) / Math.log(2));
			let sh = Math.round(Math.log(height) / Math.log(2));

			let pw = Math.pow(2, sw);
			let ph = Math.pow(2, sh);

			if (pw < width) pw = Math.pow(2, sw + 1);
			if (ph < height) ph = Math.pow(2, sh + 1);

			width = pw;
			height = ph;
		}

		if (width < minWidth || height < minHeight) {
			if (onError) onError({
				description: I18.f("INVALID_SIZE_ERROR", minWidth, minHeight)
			});
			return;
		}

		if (options.allowTrim) {
			Trimmer.trim(rects, alphaThreshold);
		}

		let identical = [];

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
						methods.push({ packerClass, packerMethod: packerClass.methods[method], allowRotation: false });
						if (options.allowRotation) {
							methods.push({ packerClass, packerMethod: packerClass.methods[method], allowRotation: true });
						}
					}
				}
			}
			return methods;
		};

		let packerClass = options.packer || MaxRectsBinPack;
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
			let _rects = packerCombos.length > 1 ? rects.map(rect => {
				return Object.assign({}, rect, {
					frame: Object.assign({}, rect.frame),
					spriteSourceSize: Object.assign({}, rect.spriteSourceSize),
					sourceSize: Object.assign({}, rect.sourceSize)
				});
			}) : rects;

			// duplicate identical if more than 1 combo and fix references to point to the
			//  cloned rects since the array is mutated in applyIdentical()
			// Optimize?
			let _identical = packerCombos.length > 1 ? identical.map(rect => {
				for (let rect2 of _rects) {
					if (rect.identical.image._base64 === rect2.image._base64) {
						return Object.assign({}, rect, { identical: rect2 });
					}
				}
			}) : identical;

			while (_rects.length) {
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

		if (onComplete) {
			onComplete(optimalRes);
		}
	}

	static removeRect(rects, name) {
		for (let i = 0; i < rects.length; i++) {
			if (rects[i].name === name) {
				rects.splice(i, 1);
				return;
			}
		}
	}
}

export default PackProcessor;
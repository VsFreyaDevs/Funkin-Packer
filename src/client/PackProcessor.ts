import MaxRectsBinPack from './packers/MaxRectsBin';
import OptimalPacker from './packers/OptimalPacker';
import allPackers, { getPackerByType } from './packers';
import Trimmer from './utils/Trimmer';
import TextureRenderer from './utils/TextureRenderer';

import I18 from './utils/I18';
import type { LoadedImages, MessageBoxData, PackOptions, Rect } from 'types';
import type { PackerClass, PackerCombo } from './packers/Packer';

class PackProcessor {
	private static detectIdentical(rects: Rect[], didTrim: boolean) {
		const identical:Rect[] = [];

		const len = rects.length;

		for (let i = 0; i < len; i++) {
			const rect1 = rects[i] as Rect;
			for (let n = i + 1; n < len; n++) {
				const rect2 = rects[n] as Rect;
				if (identical.indexOf(rect2) === -1 && PackProcessor.compareImages(rect1, rect2, didTrim)) {
					rect2.identical = rect1;
					identical.push(rect2);
				}
			}
		}

		for (const rect of identical) {
			rects.splice(rects.indexOf(rect), 1);
		}

		return {
			rects,
			identical
		} as const;
	}

	private static compareImages(rect1:Rect, rect2:Rect, didTrim:boolean) {
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

	private static applyIdentical(rects:Rect[], identical:Rect[]) {
		const clones:Rect[] = [];
		const removeIdentical:Rect[] = [];

		for (const item of identical) {
			const ix = rects.indexOf(item.identical);
			if (ix >= 0) {
				const rect = rects[ix];

				const clone = { ...rect};

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

		for (const item of removeIdentical) {
			identical.splice(identical.indexOf(item), 1);
		}

		for (const item of clones) {
			item.cloned = true;
			rects.push(item);
		}

		return rects;
	}

	static pack(images:LoadedImages, options: PackOptions = {}, onComplete:(data:Rect[][], usedPacker:PackerCombo) => void = null, onError:(data:MessageBoxData) => void = null, onProgress:(data:any) => void = null) {
		//debugger;
		if(PROFILER)
			console.time("pack");
		console.log(images);
		let rects:Rect[] = [];

		const spritePadding = options.spritePadding || 0;
		const borderPadding = options.borderPadding || 0;

		let maxWidth = 0, maxHeight = 0;
		let minWidth = 0, minHeight = 0;

		let alphaThreshold = options.alphaThreshold || 0;
		if (alphaThreshold > 255) alphaThreshold = 255;

		const names = Object.keys(images).sort();

		for (const key of names) {
			const img = images[key];
			if(!img) continue;

			const name = key.split(".")[0];

			maxWidth += img.width;
			maxHeight += img.height;

			// This is probably wrong
			minWidth = Math.max(minWidth, img.width + spritePadding * 2);// + borderPadding * 2;
			minHeight = Math.max(minHeight, img.height + spritePadding * 2);// + borderPadding * 2;

			rects.push({
				frame: { x: 0, y: 0, w: img.width, h: img.height },
				rotated: false,
				trimmed: false,
				spriteSourceSize: { x: 0, y: 0, w: img.width, h: img.height },
				sourceSize: {
					w: img.width,
					h: img.height,
					mw: img.rect.sourceSize.mw,
					mh: img.rect.sourceSize.mh
				},
				frameSize: img.rect.frameSize,
				manualOffset: img.rect.manualOffset,
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
			const sw = Math.round(Math.log2(width));
			const sh = Math.round(Math.log2(height));

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
			const res = PackProcessor.detectIdentical(rects, options.allowTrim);

			rects = res.rects;
			identical = res.identical;
		}

		const getAllPackers = () => {
			const methods:PackerCombo[] = [];
			for (const packerClass of allPackers) {
				if (packerClass !== OptimalPacker) {
					for (const method in packerClass.methods) {
						if(!Object.hasOwn(packerClass.methods, method)) continue;

						if(options.allowRotation && packerClass.needsNonRotation() || !options.allowRotation) {
							methods.push({ packerClass, packerMethod: packerClass.methods[method], allowRotation: false });
						}

						if (options.allowRotation) {
							methods.push({ packerClass, packerMethod: packerClass.methods[method], allowRotation: true });
						}
					}
				}
			}
			return methods;
		};

		const packerClass:PackerClass = getPackerByType(options.packer) || MaxRectsBinPack;
		const packerMethod = options.packerMethod || MaxRectsBinPack.methods.BestShortSideFit;
		const packerCombos:PackerCombo[] = (packerClass === OptimalPacker) ? getAllPackers() : [{ packerClass, packerMethod, allowRotation: options.allowRotation }];

		let optimalRes:Rect[][];
		let optimalSheets = Infinity;
		let optimalEfficiency = 0;
		let usedPacker:PackerCombo;

		let sourceArea = 0;
		for (let rect of rects) {
			sourceArea += rect.sourceSize.w * rect.sourceSize.h;
		}

		for (let combo of packerCombos) {
			const res = [];
			let sheetArea = 0;

			// duplicate rects if more than 1 combo since the array is mutated in pack()
			const _rects = packerCombos.length > 1 ? rects.map(rect => (
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
			const _identical = packerCombos.length > 1 ? identical.map(rect => {
				for (let rect2 of _rects) {
					if (rect.identical.image.base64 === rect2.image.base64) {
						return { ...rect, identical: rect2};
					}
				}
				return {...rect};
			}) : identical;

			let lastLoop = -1;

			while (_rects.length && lastLoop !== _rects.length) {
				lastLoop = _rects.length;
				// eslint-disable-next-line new-cap
				const packer = new combo.packerClass(width, height, combo.allowRotation, spritePadding);
				let result = packer.pack(_rects, combo.packerMethod);

				if (options.detectIdentical) {
					result = PackProcessor.applyIdentical(result, _identical);
				}

				res.push(result);

				for (let item of result) {
					this.removeRect(_rects, item.name);
				}

				const { width: sheetWidth, height: sheetHeight } = TextureRenderer.getSize(result, options);
				sheetArea += sheetWidth * sheetHeight;
			}

			if(_rects.length) {
				if(packerCombos.length > 1) {
					continue;
				}
				console.warn("PackProcessor: Not all images were packed. Some images may be missing.");
			}

			const sheets = res.length;
			const efficiency = sourceArea / sheetArea;
			// TODO: calculate ram usage instead

			if (sheets < optimalSheets || (sheets === optimalSheets && efficiency > optimalEfficiency)) {
				optimalRes = res;
				optimalSheets = sheets;
				optimalEfficiency = efficiency;
				usedPacker = combo;
			}
		}

		for (const sheet of optimalRes) {
			for(const item of sheet) {
				item.frame.x += borderPadding;
				item.frame.y += borderPadding;
			}
		}

		if(PROFILER)
			console.timeEnd("pack");

		if (onComplete) {
			onComplete(optimalRes, usedPacker);
		}
	}

	private static removeRect(rects:Rect[], name:string) {
		for (let i = 0; i < rects.length; i++) {
			if (rects[i].name === name) {
				rects.splice(i, 1);
				return;
			}
		}
	}
}

export default PackProcessor;
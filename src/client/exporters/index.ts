/* eslint-disable no-use-before-define */
import * as list from './list.json';
import * as appInfo from '../../../package.json';
import { sendGet } from '../utils/ajax';
import { smartSortImages, removeFromArray, isNullOrUndefined } from '../utils/common';
import Globals from '../utils/Globals';
import finishExporter from './render';

import { Rect } from 'types';

export type Exporter = {
	type: string;
	description: string;
	allowTrim: boolean;
	allowRotation: boolean;
	template: string;
	fileExt: string;
	predefined?: boolean;
	content?: string;
};

declare type TemplateSettings = {
	rects: ExporterRect[],
	config: RenderSettings,
	appInfo: typeof appInfo
};

type ExporterRect = {
	name: string;
	origName: string;
	frame: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
	spriteSourceSize: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
	sourceSize: {
		w: number;
		h: number;
		mw: number;
		mh: number;
	};
	rotated: boolean;
	trimmed: boolean;

	first: boolean;
	last: boolean;
}

export type RenderSettings = {
	imageName: string,
	imageFile: string,
	imageData: any,
	spritePadding: number,
	borderPadding: number,
	format: "RGBA8888" | "RGB888",
	textureFormat: string,
	imageWidth: number,
	imageHeight: number,
	removeFileExtension: boolean,
	prependFolderName: boolean,
	base64Export: boolean,
	scale: number,
	changedScale: boolean,
	trimMode: string,

	sortExportedRows: boolean,

	base64Prefix?: string,
}

function getExporterByType(type:string):Exporter {
	for(const item of list) {
		if(item.type === type) {
			return item;
		}
	}
	return null;
}

function prepareData(data: Rect[], options: RenderSettings): {
	rects: ExporterRect[],
	config: RenderSettings
} {

	const opt = { ...options };

	opt.imageName ||= "texture";
	opt.imageFile ||= (opt.imageName + "." + options.textureFormat);
	opt.format ||= "RGBA8888";
	opt.scale ||= 1;
	opt.base64Prefix = options.textureFormat === "png" ? "data:image/png;base64," : "data:image/jpeg;base64,";

	const ret:ExporterRect[] = [];

	for(const item of data) {
		let name = item.originalFile || item.file;
		const origName = name;

		if(opt.removeFileExtension) {
			const parts = name.split(".");
			if(parts.length > 1) parts.pop();
			name = parts.join(".");
		}

		if(!opt.prependFolderName) {
			name = name.split("/").pop();
		}

		const frame = {
			x: item.frame.x,
			y: item.frame.y,
			w: item.frame.w,
			h: item.frame.h,
			hw: item.frame.w/2,
			hh: item.frame.h/2
		};
		const spriteSourceSize = {
			x: item.spriteSourceSize.x,
			y: item.spriteSourceSize.y,
			w: item.spriteSourceSize.w,
			h: item.spriteSourceSize.h
		};
		const sourceSize = {
			w: item.sourceSize.w,
			h: item.sourceSize.h,
			mw: item.sourceSize.mw,
			mh: item.sourceSize.mh
		};

		let trimmed = item.trimmed;

		if(item.trimmed && opt.trimMode === 'crop') {
			trimmed = false;
			spriteSourceSize.x = 0;
			spriteSourceSize.y = 0;
			sourceSize.w = spriteSourceSize.w;
			sourceSize.h = spriteSourceSize.h;
		}

		/*if(opt.scale !== 1) { // Maybe round if sparrow?
			frame.x *= opt.scale;
			frame.y *= opt.scale;
			frame.w *= opt.scale;
			frame.h *= opt.scale;
			frame.hw *= opt.scale;
			frame.hh *= opt.scale;

			spriteSourceSize.x *= opt.scale;
			spriteSourceSize.y *= opt.scale;
			spriteSourceSize.w *= opt.scale;
			spriteSourceSize.h *= opt.scale;

			sourceSize.w *= opt.scale;
			sourceSize.h *= opt.scale;
		}*/

		ret.push({
			name,
			origName,
			frame,
			spriteSourceSize,
			sourceSize,
			rotated: item.rotated,
			trimmed,
			first: false,
			last: false
		} as const);

	}

	if(ret.length) {
		ret[0].first = true;
		ret[ret.length-1].last = true;
	}

	return {rects: ret, config: opt};
}

function startExporter(exporter: Exporter, data: Rect[], options: RenderSettings): Promise<string> {
	return new Promise((resolve, reject) => {
		let {rects, config} = prepareData(data, options);
		const renderOptions = {
			rects,
			config,
			appInfo
		};

		// Sort the exported rows
		if(config.sortExportedRows) {
			rects = rects.sort((a, b) => smartSortImages(a.name, b.name));
		}

		let sparrowOrder = Globals.sparrowOrder;//window.__sparrow_order;

		// Make order the same as before
		if(sparrowOrder !== null) {
			sparrowOrder = [...sparrowOrder];
			/* if(config.removeFileExtension) {
				for(let i = 0; i < sparrowOrder.length; i++) {
					let name = sparrowOrder[i];
					let parts = name.split(".");
					if(parts.length > 1) parts.pop();
					sparrowOrder[i] = parts.join(".");
				}
			} */

			let oldRects:ExporterRect[] = [...rects];
			let nameMap:Record<string, ExporterRect> = {};
			for (const v of rects) {
				nameMap[v.origName] = v;
			}

			// filter for frames which exist
			let array = sparrowOrder.filter((v) => !isNullOrUndefined(nameMap[v])).map(name => {
				const item = nameMap[name];
				removeFromArray(oldRects, item);
				return item;
			});
			rects = array.concat(oldRects);
		}

		// Fix sourceSize
		/*if(sparrowOrigMap != null) {
			for(var i = 0; i < rects.length; i++) {
				if(!sparrowOrigMap.hasOwnProperty(rects[i].name)) {
					continue;
				}
				var orig = sparrowOrigMap[rects[i].name];
				if(orig != null) {
					// sorry for this horrendus code
					rects[i] = JSON.parse(JSON.stringify(rects[i]));

					//console.log(orig);

					rects[i].sourceSize.w = orig.frameWidth;
					rects[i].sourceSize.h = orig.frameHeight;
				}
			}
		}*/

		//console.log(rects.map((v)=>v.name));

		//data = rects;
		renderOptions.rects = rects;

		if(exporter.content) {
			finishExporter(exporter, renderOptions, resolve, reject);
			return;
		}

		sendGet("static/exporters/" + exporter.template, null, (template) => {
			exporter.content = template;
			finishExporter(exporter, renderOptions, resolve, reject);
		}, () => reject(new Error(exporter.template + " not found")));
	});
}

export {getExporterByType, startExporter};
export default list;
import { PackerClass } from "packers/Packer";

declare var PLATFORM: string;
declare var PROFILER: boolean;

declare type Options = {
	width?: number;
	height?: number;
	allowRotation?: boolean;
	allowTrim?: boolean;
	detectIdentical?: boolean;
	spritePadding?: number;
	borderPadding?: number;
	alphaThreshold?: number;
	scale?: number;
	textureFormat?: string;
	trimMode?: string;
	sortExportedRows?: boolean;
	exporter?: string;
	fileName?: string;
	powerOfTwo?: boolean;
	fixedSize?: boolean;

	packer?: PackerClass;
	packerMethod?: string;
}

declare type SplitterRect = {
	name: string;
	trimmed: boolean;
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
		frameWidth: number;
		frameHeight: number;
		mw?: number;
		mh?: number;
	};
	rotated: boolean;
}

declare type Rect = SplitterRect & {
	file?: string;
	originalFile?: string;
	cloned?: boolean;
	image?: HTMLImageElement;
	path?: string;
	folder?: string;
	trimmedImage?: Uint8ClampedArray;
	identical?: Rect;
	skipRender?: boolean;
}

declare type LoadedImage = HTMLImageElement;
declare type LoadedImages = { [key: string]: LoadedImage };

declare type PackResultsData = {
	renderer: {
		width: number;
		height: number;
	};
};

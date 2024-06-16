import CustomImage from "data/CustomImage";
import { PackerClass } from "api/packers/Packer";
import { Exporter } from "api/exporters";

declare type PackOptions = {
	repackUpdateFileName?: boolean;
	width?: number;
	height?: number;
	allowRotation?: boolean;
	allowTrim?: boolean;
	detectIdentical?: boolean;
	spritePadding?: number;
	borderPadding?: number;
	alphaThreshold?: number;
	scale?: number;
	textureFormat?: "png" | "jpg";
	trimMode?: "trim" | "crop";
	sortExportedRows?: boolean;
	fileName?: string;
	powerOfTwo?: boolean;
	fixedSize?: boolean;
	filter?: string;
	removeFileExtension?: boolean;
	prependFolderName?: boolean;
	base64Export?: boolean;
	savePath?: string;

	packerCls?: PackerClass;
	packer?: string;
	packerMethod?: string;
	exporterCls?: Exporter;
	exporter?: string;

	statsSI?: number;
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
		mw?: number;
		mh?: number;
	};
	frameSize: { // frameX frameY frameWidth frameHeight
		x: number;
		y: number;
		w: number;
		h: number;
	};
	rotated: boolean;
	manualOffset?: boolean;
}

declare type Rect = SplitterRect & {
	file?: string;
	originalFile?: string;
	cloned?: boolean;
	image?: CustomImage;
	path?: string;
	folder?: string;
	trimmedImage?: Uint8ClampedArray;
	identical?: Rect;
	skipRender?: boolean;
}

declare type LoadedImage = CustomImage;
declare type LoadedImages = Record<string, LoadedImage>;
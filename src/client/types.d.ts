import CustomImage from "data/CustomImage";
import { PackerClass } from "./packers/Packer";
import TextureRenderer from "./utils/TextureRenderer";

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
	textureFormat?: string;
	trimMode?: string;
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
	exporter?: any; // TODO: type this

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
declare type LoadedImages = { [key: string]: LoadedImage };

declare type PackResultsData = {
	data: Rect[];
	buffer: HTMLCanvasElement;
	renderer: TextureRenderer;
};

declare type MessageBoxData = {
	description: string;
};

declare type SelectedEvent = {
	isFolder: boolean,
	path: string,
	ctrlKey: boolean,
	shiftKey: boolean
};
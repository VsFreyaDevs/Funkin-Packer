import CustomImage from "data/CustomImage";
import { PackerClass } from "./packers/Packer";
import TextureRenderer from "./utils/TextureRenderer";

//declare var PLATFORM: string;
//declare var PROFILER: boolean;

declare type PackOptions = {
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

	packer?: PackerClass;
	packerMethod?: string;
	exporter?: any; // TODO: type this
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

export type FileSystemPath = {
	name: string;
	path: string;
	folder: string;
}

class CustomImage {
	//name: string;
	//path: string;
	//folder: string;
	base64: string;
	cachedTrim?: number;
	cachedTrimmedImage?: Uint8ClampedArray;
	cachedSpaces?: {
		left: number;
		right: number;
		top: number;
		bottom: number;
	};
	image: HTMLImageElement;
	selected: boolean;
	current: boolean;

	fsPath: FileSystemPath;

	constructor(image: HTMLImageElement, name?: string, path?: string, folder?: string) {
		this.image = image;
		if(name && path && folder) {
			this.fsPath = { name, path, folder };
		}
		//this.name = name;
		//this.path = path;
		//this.folder = folder;
	}

	get width() {
		return this.image.width;
	}

	get height() {
		return this.image.height;
	}

	set width(value) {
		this.image.width = value;
	}

	set height(value) {
		this.image.height = value;
	}

	get src() {
		return this.image.src;
	}

	get srcset() {
		return this.image.srcset;
	}

	get sizes() {
		return this.image.sizes;
	}

	get naturalWidth() {
		return this.image.naturalWidth;
	}

	get naturalHeight() {
		return this.image.naturalHeight;
	}

	get complete() {
		return this.image.complete;
	}

	set src(value) {
		this.image.src = value;
	}

	set srcset(value) {
		this.image.srcset = value;
	}

	set sizes(value) {
		this.image.sizes = value;
	}
}

export default CustomImage;
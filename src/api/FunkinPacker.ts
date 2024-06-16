import type { LoadedImages, PackOptions } from "api/types";

export default class FunkinPacker {
	private images: LoadedImages[];
	private options: PackOptions;
	private onComplete: (res:unknown) => void;
	private onError: (err:string) => void;

	constructor() {
	}

	loadImages(images:LoadedImages[]) {
		this.images = images;
	}

	setOptions(options:PackOptions) {
		this.options = options;
	}

	setOnComplete(onComplete:(res:unknown) => void) {
		this.onComplete = onComplete;
	}

	setOnError(onError:(err:string) => void) {
		this.onError = onError;
	}

	pack() {
		throw new Error("Method not implemented.");
	}
}
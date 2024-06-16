import type CustomImage from "data/CustomImage";
import type { PackOptions } from "api/types";

export default class FunkinPacker {
	private images: CustomImage[];
	private options: PackOptions;
	private onComplete: (res:unknown) => void;
	private onError: (err:string) => void;

	constructor() {
	}

	loadImages(images:CustomImage[]) {
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
import CustomImage from "data/CustomImage";
import { LoadedImages } from "types";

class Base64ImagesLoader {
	data: any[];
	loaded: LoadedImages;
	loadedCnt: number;
	onProgress: (loaded: number) => void;
	onEnd: (data: LoadedImages) => void;

	constructor() {
		this.loaded = {};

		this.onProgress = null;
		this.onEnd = null;
	}

	load = (data: any[], onProgress:(loaded: number) => void = null, onEnd:(data: LoadedImages) => void = null) => {
		this.data = data.slice();

		this.onProgress = onProgress;
		this.onEnd = onEnd;

		for(let item of data) {
			let img = new CustomImage(new Image(), item.fsPath.name, item.fsPath.path, item.fsPath.folder);
			img.src = item.url;
			img.base64 = item.url;
			img.fsPath = item.fsPath;

			this.loaded[item.name] = img;
		}

		this.waitImages();
	}

	private waitImages = () => {
		let ready = true;
		let loaded = 0;
		let keys = Object.keys(this.loaded);

		for(let key of keys) {
			if(!this.loaded[key].complete) {
				ready = false;
			}
			else {
				loaded++;
			}
		}

		if(ready) {
			if(this.onEnd) this.onEnd(this.loaded);
		}
		else {
			if(this.onProgress) this.onProgress(loaded / keys.length);
			setTimeout(this.waitImages, 50);
		}
	}
}

export default Base64ImagesLoader;
import CustomImage from "../data/CustomImage";
import { LoadedImages } from "types";

class LocalImagesLoader {
	data: File[];
	loaded: LoadedImages;
	loadedCnt: number;
	onProgress: (loaded: number) => void;
	onEnd: (data: LoadedImages) => void;

	constructor() {
		this.data = null;
		this.loaded = {};
		this.loadedCnt = 0;

		this.onProgress = null;
		this.onEnd = null;
	}

	load = (data: FileList, onProgress:(loaded: number) => void = null, onEnd:(data: LoadedImages) => void = null) => {
		this.data = [];

		for (let i = 0; i < data.length; i++) {
			this.data.push(data[i]);
		}

		this.onProgress = onProgress;
		this.onEnd = onEnd;

		this.loadNext();
	}

	loadNext = () => {
		if (!this.data.length) {
			this.waitImages();
			return;
		}

		let types = ["image/png", "image/jpg", "image/jpeg", "image/gif"];
		let item = this.data.shift();

		if (types.indexOf(item.type) >= 0) {
			let path = item.name;
			let name = item.name;

			if (item.path) {
				path = item.path.split("\\").join("/");
				name = path.split("/").pop();
			}

			let img = new CustomImage(new Image(), name, path, "");

			let reader = new FileReader();
			reader.onload = e => {
				img.src = e.target.result as string;
				img.base64 = e.target.result as string;

				this.loaded[item.name] = img;
				this.loadedCnt++;

				if (this.onProgress) {
					this.onProgress(this.loadedCnt / (this.loadedCnt + this.data.length));
				}

				this.loadNext();
			};

			reader.readAsDataURL(item);
		}
		else {
			this.loadNext();
		}
	}

	waitImages = () => {
		let ready = true;

		for (let key of Object.keys(this.loaded)) {
			if (!this.loaded[key].complete) {
				ready = false;
				break;
			}
		}

		if (ready) {
			if (this.onEnd) this.onEnd(this.loaded);
		}
		else {
			setTimeout(this.waitImages, 50);
		}
	}
}

export default LocalImagesLoader;
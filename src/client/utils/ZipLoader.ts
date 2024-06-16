import * as JSZip from 'jszip';

import I18 from '../locale/I18';
import type { LoadedImages } from 'api/types';
import CustomImage from '../data/CustomImage';
import TypedObserver from 'TypedObserver';

class ZipLoader {
	data: File[];
	loaded: LoadedImages;
	loadedCnt: number;
	onProgress: ((loaded: number) => void) | null;
	onEnd: ((data: LoadedImages) => void) | null;
	zip: JSZip;
	filesList: string[];

	constructor() {
		this.data = [];
		this.onProgress = null;
		this.onEnd = null;
		this.zip = null;
		this.filesList = [];
		this.loaded = {};
		this.loadedCnt = 0;
	}

	load = (file: File, onProgress: (loaded: number) => void, onEnd: (data: LoadedImages) => void) => {
		this.onProgress = onProgress;
		this.onEnd = onEnd;

		this.zip = new JSZip();
		this.zip.loadAsync(file).then(
			() => {
				this.parseZip();
			},
			() => {
				TypedObserver.showMessage.emit(I18.f("INVALID_ZIP_ERROR"));
				if (this.onEnd) this.onEnd({});
			}
		);
	}

	private parseZip = () => {
		const files = Object.keys(this.zip.files);
		const extensions = ["png", "jpg", "jpeg", "gif"];

		this.filesList = [];
		for(const name of files) {
			const file = this.zip.files[name] as JSZip.JSZipObject;

			if(!file.dir) {
				const ext = name.split(".").pop()?.toLowerCase() || "png";
				if(extensions.indexOf(ext) >= 0 && name.toUpperCase().indexOf("__MACOSX") < 0) {
					this.filesList.push(name);
				}
			}
		}

		this.loadedCnt = 0;

		this.loadNext();
	}

	private loadNext = () => {
		if(!this.filesList.length) {
			this.waitImages();
			return;
		}

		const name = this.filesList.shift();
		if(!name) {
			this.waitImages();
			return;
		}

		this.zip.file(name)?.async("base64").then((d: string) => {
			const ext = name.split(".").pop()?.toLowerCase() || "png";
			const content = "data:image/"+ext+";base64," + d;

			const img = new CustomImage(new Image());

			img.src = content;
			img.base64 = content;

			this.loaded[name] = img;
			this.loadedCnt++;

			if(this.onProgress) {
				this.onProgress(this.loadedCnt / (this.loadedCnt + this.filesList.length));
			}

			this.loadNext();
		});
	}

	private waitImages = () => {
		let ready = true;

		for(const key of Object.keys(this.loaded)) {
			if(!this.loaded[key]?.complete) {
				ready = false;
				break;
			}
		}

		if(ready) {
			if(this.onEnd) this.onEnd(this.loaded);
		}
		else {
			setTimeout(this.waitImages, 50);
		}
	}
}

export default ZipLoader;
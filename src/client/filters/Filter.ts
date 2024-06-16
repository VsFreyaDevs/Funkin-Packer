class Filter {
	constructor() {
		// nothing to do
	}

	apply(buffer: HTMLCanvasElement) {
		if(!this.shouldApply(buffer)) return buffer;

		let retCanvas = document.createElement("canvas");
		let retCtx = retCanvas.getContext("2d");

		retCanvas.width = buffer.width;
		retCanvas.height = buffer.height;

		let bufferCtx = buffer.getContext("2d");

		if(!bufferCtx || !retCtx) {
			throw new Error("No canvas context");
		}

		let imageData = bufferCtx.getImageData(0, 0, buffer.width, buffer.height);

		retCtx.putImageData(this.applyImageData(imageData), 0, 0);

		return retCanvas;
	}

	applyImageData(imageData: ImageData) {
		return imageData;
	}

	shouldApply(buffer: HTMLCanvasElement) {
		return false;
	}

	static get type() {
		return "none";
	}
}

export default Filter;
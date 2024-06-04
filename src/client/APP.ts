import { Observer, GLOBAL_EVENT } from './Observer';
import PackProcessor from './PackProcessor';
import TextureRenderer from './utils/TextureRenderer';
import { getFilterByType } from './filters';
import I18 from './utils/I18';
import type { RenderSettings } from './exporters';
import { startExporter } from './exporters';
import Downloader from 'platform/Downloader';
import type { LoadedImages, MessageBoxData, PackOptions, PackResultsData, Rect } from 'types';
import TypedObserver from 'TypedObserver';
import type { PackerCombo } from './packers/Packer';

let INSTANCE:APP;

class APP {
	images: LoadedImages;
	packOptions: PackOptions;
	packResult: PackResultsData[] | null;

	constructor() {
		INSTANCE = this;

		this.images = {};
		this.packOptions = {};
		this.packResult = null;

		TypedObserver.imagesListChanged.on(this.onImagesListChanged, this);
		TypedObserver.packOptionsChanged.on(this.onPackOptionsChanged, this);
		TypedObserver.packExporterChanged.on(this.onPackExporterOptionsChanged, this);
		Observer.on(GLOBAL_EVENT.START_EXPORT, this.startExport, this);
	}

	static get i() {
		return INSTANCE;
	}

	private onImagesListChanged = (data: LoadedImages) => {
		this.images = data;
		//console.log(this.images);
		this.pack();
	}

	private onPackOptionsChanged = (data: PackOptions) => {
		this.packOptions = data;
		this.pack();
	}

	private onPackExporterOptionsChanged = (data: PackOptions) => {
		this.packOptions = data;
	}

	private pack() {
		const keys = Object.keys(this.images);

		if (keys.length > 0) {
			Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);
			setTimeout(() => this.doPack(), 0);
		}
		else {
			this.doPack();
		}
	}

	private doPack() {
		PackProcessor.pack(this.images, this.packOptions, this.onPackComplete, this.onPackError);
	}

	private onPackComplete = (res:Rect[][], usedPacker:PackerCombo) => {
		this.packResult = [];

		for (const data of res) {
			const renderer = new TextureRenderer(data, this.packOptions);

			this.packResult.push({
				data,
				buffer: renderer.buffer,
				renderer
			});
		}

		TypedObserver.packComplete.emit({
			packResults: this.packResult,
			usedPacker: usedPacker
		});
		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
	}

	private onPackError = (err: MessageBoxData) => {
		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
		TypedObserver.showMessage.emit(err.description);
	}

	private startExport() {
		if (!this.packResult || !this.packResult.length) {
			TypedObserver.showMessage.emit(I18.f("NO_IMAGES_ERROR"));
			return;
		}

		Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);
		setTimeout(() => this.doExport(), 0);
	}

	private async doExport() {
		const exporter = this.packOptions.exporterCls;
		const fileName = this.packOptions.fileName;
		const filterClass = getFilterByType(this.packOptions.filter);
		// eslint-disable-next-line new-cap
		const filter = new filterClass();

		const files = [];

		let ix = 0;
		for (const item of this.packResult) {

			const fName = fileName + (this.packResult.length > 1 ? "-" + ix : "");

			//const buffer = item.renderer.scale(this.packOptions.scale);

			const buffer = item.renderer.getBuffer();

			let imageData = filter.apply(buffer).toDataURL(this.packOptions.textureFormat === "png" ? "image/png" : "image/jpeg");
			const parts = imageData.split(",");
			parts.shift();
			imageData = parts.join(",");


			files.push({
				name: `${fName}.${this.packOptions.textureFormat}`,
				content: imageData,
				base64: true
			});

			//TODO: move to options
			const pixelFormat = this.packOptions.textureFormat === "png" ? "RGBA8888" : "RGB888";

			const options:RenderSettings = {
				imageName: `${fName}`,
				imageFile: `${fName}.${this.packOptions.textureFormat}`,
				imageData,
				spritePadding: this.packOptions.spritePadding,
				borderPadding: this.packOptions.borderPadding,
				format: pixelFormat,
				textureFormat: this.packOptions.textureFormat,
				imageWidth: buffer.width,
				imageHeight: buffer.height,
				removeFileExtension: this.packOptions.removeFileExtension,
				prependFolderName: this.packOptions.prependFolderName,
				base64Export: this.packOptions.base64Export,
				scale: this.packOptions.scale,
				changedScale: this.packOptions.scale !== 1,
				trimMode: this.packOptions.trimMode,

				sortExportedRows: this.packOptions.sortExportedRows,
			};

			try {
				files.push({
					name: fName + "." + exporter.fileExt,
					content: await startExporter(exporter, item.data, options)
				});
			}
			catch (e) {
				Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
				TypedObserver.showMessage.emit(I18.f("EXPORTER_ERROR", e));
				return;
			}

			ix++;
		}

		Downloader.run(files, this.packOptions.fileName, this.packOptions.savePath);
		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
	}
}

export default APP;
import * as React from 'react';
import APP from '../APP';

import { Observer, GLOBAL_EVENT } from '../Observer';
import I18 from '../utils/I18';

import { SplitterMaster } from '../splitters';
import LocalImagesLoader from "../utils/LocalImagesLoader";
import Downloader from "platform/Downloader";
import ImagesList from "./ImagesList";
import PackProperties from '../ui/PackProperties';
import { LoadedImages, Rect } from 'types';
import Splitter from 'splitters/Splitter';
import TypedObserver from 'TypedObserver';
import CustomImage from '../data/CustomImage';

/**
 * @type {SplitterMaster}
 */
var splitterMaster = new SplitterMaster();

interface Props {
}

interface State {
	splitter: Splitter;
	textureBack: string;
	scale: number;
	updateFileName: boolean;
}

class SheetSplitter extends React.Component<Props, State> {
	disableUntrimRef: React.RefObject<HTMLInputElement>;
	updateFileNameRef: React.RefObject<HTMLInputElement>;
	dataFormatRef: React.RefObject<HTMLSelectElement>;
	selectTextureInputRef: React.RefObject<HTMLInputElement>;
	dataFileNameRef: React.RefObject<HTMLInputElement>;
	fileNameRef: React.RefObject<HTMLInputElement>;
	viewRef: React.RefObject<HTMLCanvasElement>;
	paddingRef: React.RefObject<HTMLInputElement>;
	widthRef: React.RefObject<HTMLInputElement>;
	heightRef: React.RefObject<HTMLInputElement>;
	textureBackColors: string[];
	step: number;
	rangeRef: React.RefObject<HTMLInputElement>;
	wheelRef: React.RefObject<HTMLInputElement>;
	texture: CustomImage;
	data: string;
	frames: Rect[];
	fileName: string;
	dataName: string;
	buffer: HTMLCanvasElement;

	constructor(props: Props) {
		super(props);

		this.disableUntrimRef = React.createRef();
		this.updateFileNameRef = React.createRef();
		this.dataFormatRef = React.createRef();
		this.selectTextureInputRef = React.createRef();
		this.dataFileNameRef = React.createRef();
		this.fileNameRef = React.createRef();
		this.viewRef = React.createRef();
		this.paddingRef = React.createRef();
		this.widthRef = React.createRef();
		this.heightRef = React.createRef();

		this.textureBackColors = ["grid-back", "white-back", "pink-back", "black-back"];
		this.step = 0.01;

		this.state = {
			splitter: null,
			textureBack: this.textureBackColors[0],
			scale: 1,
			updateFileName: APP.i.packOptions.repackUpdateFileName === undefined ? true : APP.i.packOptions.repackUpdateFileName
		};

		this.rangeRef = React.createRef();
		this.wheelRef = React.createRef();

		this.texture = null;
		this.data = null;
		this.frames = null;

		this.fileName = '';
		this.dataName = '';

		this.buffer = document.createElement('canvas');
	}

	componentDidMount = () => {
		this.updateTexture();
		this.wheelRef.current.addEventListener('wheel', this.handleWheel, { passive: false });
	}

	componentWillUnmount = () => {
		this.wheelRef.current.removeEventListener('wheel', this.handleWheel);
	}

	handleWheel = (event: WheelEvent) => {
		if(!event.ctrlKey) return;

		let value = this.state.scale;
		if (event.deltaY >= 0) {
			if (this.state.scale > 0.1) {
				value = Number((this.state.scale - this.step).toPrecision(2));
				this.setState({scale: value});
				this.updateTextureScale(value);
			}
		} else {
			if (this.state.scale < 2.0) {
				value = Number((this.state.scale + this.step).toPrecision(2));
				this.setState({scale: value});
				this.updateTextureScale(value);
			}
		}

		// update range component
		this.rangeRef.current.value = value.toString(10);

		event.preventDefault();
		event.stopPropagation();
		return false;
	}

	doRepack = () => {
		Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);

		if(!this.frames || !this.frames.length) {
			Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
			Observer.emit(GLOBAL_EVENT.SHOW_MESSAGE, I18.f('SPLITTER_ERROR_NO_FRAMES'));

			return;
		}

		splitterMaster.finishSplit();

		let ctx = this.buffer.getContext('2d');
		let files = [];

		let disableUntrim = this.disableUntrimRef.current.checked;

		if(this.state.updateFileName) {
			var filename = this.fileName;
			let parts = filename.split(".");
			if(parts.length > 1) parts.pop();
			filename = parts.join(".");
			PackProperties.i.packOptions.fileName = filename;
			Observer.emit(GLOBAL_EVENT.PACK_EXPORTER_CHANGED, PackProperties.i.getPackOptions());
			PackProperties.i.refreshPackOptions();
		}

		for(let item of this.frames) {
			let trimmed = item.trimmed ? disableUntrim : false;

			//var prefix = cleanPrefix(item.originalFile || item.file || item.name);

			var ssw = item.sourceSize.mw;
			var ssh = item.sourceSize.mh;

			this.buffer.width = (disableUntrim && trimmed) ? item.spriteSourceSize.w : ssw;
			this.buffer.height = (disableUntrim && trimmed) ? item.spriteSourceSize.h : ssh;

			var isEmpty = this.buffer.width === 0 || this.buffer.height === 0;

			if(isEmpty) {
				this.buffer.width = 1;
				this.buffer.height = 1;
			}

			ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);

			if(!isEmpty) {
				if(item.rotated) {
					ctx.save();

					ctx.translate(item.spriteSourceSize.x + item.spriteSourceSize.w/2, item.spriteSourceSize.y + item.spriteSourceSize.h/2);
					ctx.rotate(this.state.splitter.inverseRotation ? Math.PI/2 : -Math.PI/2);

					let dx = trimmed ? item.spriteSourceSize.y - item.spriteSourceSize.h/2 : -item.spriteSourceSize.h/2;
					let dy = trimmed ? -(item.spriteSourceSize.x + item.spriteSourceSize.w/2) : -item.spriteSourceSize.w/2;

					ctx.drawImage(this.texture.image,
						item.frame.x, item.frame.y,
						item.frame.h, item.frame.w,
						dx, dy,
						item.spriteSourceSize.h, item.spriteSourceSize.w);

					ctx.restore();
				} else {
					let dx = trimmed ? 0 : item.spriteSourceSize.x;
					let dy = trimmed ? 0 : item.spriteSourceSize.y;

					ctx.drawImage(this.texture.image,
						item.frame.x, item.frame.y,
						item.frame.w, item.frame.h,
						dx, dy,
						item.spriteSourceSize.w, item.spriteSourceSize.h);
				}
			}

			let ext = item.name.split('.').pop().toLowerCase();
			if(!ext) {
				ext = 'png';
				item.name += '.' + ext;
			}

			let base64 = this.buffer.toDataURL(ext === 'png' ? 'image/png' : 'image/jpeg');
			//base64 = base64.split(',').pop();

			files.push({
				name: item.name,
				content: base64,
				base64: base64
			});
		}

		//console.log(ImagesList.i);
		var images: LoadedImages = {};

		for(let file of files) {
			var image = new CustomImage(new Image());
			image.src = file.base64;
			image.base64 = file.base64;

			images[file.name] = image;

			//ImagesList.i.state.images[file.name] = image;
		}

		ImagesList.i.loadImagesComplete(images);

		//Downloader.run(files, this.fileName + '.zip');

		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
		Observer.emit(GLOBAL_EVENT.HIDE_SHEET_SPLITTER); // Close the spritesheet splitter
		TypedObserver.imagesListChanged.emit(ImagesList.i.state.images);
	}

	doExport = () => {
		Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);

		if(!this.frames || !this.frames.length) {
			Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
			Observer.emit(GLOBAL_EVENT.SHOW_MESSAGE, I18.f('SPLITTER_ERROR_NO_FRAMES'));

			return;
		}

		let ctx = this.buffer.getContext('2d');
		let files = [];

		let disableUntrim = this.disableUntrimRef.current.checked;

		for(let item of this.frames) {
			let trimmed = item.trimmed ? disableUntrim : false;

			//var prefix = cleanPrefix(item.originalFile || item.file || item.name);

			var ssw = item.sourceSize.mw;
			var ssh = item.sourceSize.mh;

			this.buffer.width = (disableUntrim && trimmed) ? item.spriteSourceSize.w : ssw;
			this.buffer.height = (disableUntrim && trimmed) ? item.spriteSourceSize.h : ssh;

			ctx.clearRect(0, 0, this.buffer.width, this.buffer.height);

			if(item.rotated) {
				ctx.save();

				ctx.translate(item.spriteSourceSize.x + item.spriteSourceSize.w/2, item.spriteSourceSize.y + item.spriteSourceSize.h/2);
				ctx.rotate(this.state.splitter.inverseRotation ? Math.PI/2 : -Math.PI/2);

				let dx = trimmed ? item.spriteSourceSize.y - item.spriteSourceSize.h/2 : -item.spriteSourceSize.h/2;
				let dy = trimmed ? -(item.spriteSourceSize.x + item.spriteSourceSize.w/2) : -item.spriteSourceSize.w/2;

				ctx.drawImage(this.texture.image,
					item.frame.x, item.frame.y,
					item.frame.h, item.frame.w,
					dx, dy,
					item.spriteSourceSize.h, item.spriteSourceSize.w);

				ctx.restore();
			}
			else {

				let dx = trimmed ? 0 : item.spriteSourceSize.x;
				let dy = trimmed ? 0 : item.spriteSourceSize.y;

				ctx.drawImage(this.texture.image,
					item.frame.x, item.frame.y,
					item.frame.w, item.frame.h,
					dx, dy,
					item.spriteSourceSize.w, item.spriteSourceSize.h);
			}

			let ext = item.name.split('.').pop().toLowerCase();
			if(!ext) {
				ext = 'png';
				item.name += '.' + ext;
			}

			let base64 = this.buffer.toDataURL(ext === 'png' ? 'image/png' : 'image/jpeg');
			base64 = base64.split(',').pop();

			files.push({
				name: item.name,
				content: base64,
				base64: base64
			});
		}

		Downloader.run(files, this.fileName + '.zip', "");

		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
	}

	selectTexture = (e: React.ChangeEvent<HTMLInputElement>) => {
		if(e.target.files.length) {
			Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);

			let loader = new LocalImagesLoader();
			loader.load(e.target.files, null, data => {
				let keys = Object.keys(data);

				if(keys.length === 0) {
					Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
					Observer.emit(GLOBAL_EVENT.SHOW_MESSAGE, I18.f('SPLITTER_ERROR_NO_TEXTURE'));
					return;
				}

				this.fileName = keys[0];

				this.texture = data[this.fileName];
				this.fileNameRef.current.textContent = this.fileName;

				this.updateView();

				Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
			});
		}
	}

	updateTexture = () => {
		let canvas = this.viewRef.current;

		if(this.texture) {
			canvas.width = this.texture.width;
			canvas.height = this.texture.height;
			canvas.style.display = '';

			let ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(this.texture.image, 0, 0);

			canvas.className = this.state.textureBack;
			this.updateTextureScale();
		}
		else {
			canvas.style.display = 'none';
		}
	}

	selectDataFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		if(e.target.files.length) {
			let item = e.target.files[0];

			let reader = new FileReader();
			reader.onload = e => {
				let content = e.target.result as string;
				// this code here doesnt look like it would work
				// data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==
				// into SGVsbG8sIFdvcmxkIQ==
				let splitContent = content.split(',');
				splitContent.shift();
				if(splitContent.length == 1)
					content = atob(splitContent.join(','));

				this.data = content;

				this.dataName = item.name;
				this.dataFileNameRef.current.textContent = this.dataName;

				this.setState({
					splitter: splitterMaster.findSplitter(this.data)
				});
				this.updateView();
			};

			reader.readAsDataURL(item);
		}
	}

	updateFrames = () => {
		if(!this.texture) return;
		if(this.data === null) return;

		splitterMaster.loadSplitter(this.state.splitter);
		splitterMaster.splitData(this.data, {
			textureWidth: this.texture.width,
			textureHeight: this.texture.height,
			width: +this.widthRef.current.value * 1 || 32,
			height: +this.heightRef.current.value * 1 || 32,
			padding: +this.paddingRef.current.value * 1 || 0
		}, frames => {
			if(frames) {
				this.frames = frames;

				let canvas = this.viewRef.current;
				let ctx = canvas.getContext('2d');

				for(let item of this.frames) {
					let frame = item.frame;

					let w = frame.w, h = frame.h;
					if(item.rotated) {
						w = frame.h;
						h = frame.w;
					}

					ctx.strokeStyle = "#00F";
					ctx.fillStyle = "rgba(0,0,255,0.25)";
					ctx.lineWidth = 1;

					ctx.beginPath();
					ctx.fillRect(frame.x, frame.y, w, h);
					ctx.rect(frame.x, frame.y, w, h);
					ctx.moveTo(frame.x, frame.y);
					ctx.lineTo(frame.x + w, frame.y + h);
					ctx.stroke();

				}

			}
		});
	}

	updateView = () => {
		this.updateTexture();
		this.updateFrames();
	}

	changeSplitter = (e: React.ChangeEvent<HTMLSelectElement>) => {
		let splitter = splitterMaster.getSplitterFromName(e.target.value);

		this.setState({splitter: splitter});
		this.updateView();
	}

	setBack = (e: React.MouseEvent<HTMLDivElement>) => {
		let classNames = (e.target as HTMLDivElement).className.split(" ");
		for(let name of classNames) {
			if(this.textureBackColors.indexOf(name) >= 0) {
				this.setState({textureBack: name});

				let canvas = this.viewRef.current;
				canvas.className = name;

				return;
			}
		}
	}

	updateTextureScale = (val=this.state.scale) => {
		if(this.texture) {
			let w = Math.floor(this.texture.width * val);
			let h = Math.floor(this.texture.height * val);

			let canvas = this.viewRef.current;
			canvas.style.width = w + 'px';
			canvas.style.height = h + 'px';
		}
	}

	changeScale = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = Number(e.target.value);
		this.setState({scale: val});
		this.updateTextureScale(val);
	}

	onUpdateFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = e.target.checked;
		this.setState({updateFileName: val});
		PackProperties.i.packOptions.repackUpdateFileName = val;
		PackProperties.i.saveOptions();
		Observer.emit(GLOBAL_EVENT.PACK_EXPORTER_CHANGED, PackProperties.i.getPackOptions());
	}

	close = () => {
		Observer.emit(GLOBAL_EVENT.HIDE_SHEET_SPLITTER);
	}

	render() {
		let currentSplitterName = splitterMaster.getCurrentSplitter().splitterName;

		let displayGridProperties = 'none';

		switch (currentSplitterName) {
			case "Grid": {
				displayGridProperties = '';
				break;
			}
		}

		return (
			<div className="sheet-splitter-cover">
				<div className="sheet-splitter-content">
					<div className="sheet-splitter-top">
						<table>
							<tbody>
								<tr>
									<td>
										<div className="btn back-800 border-color-gray color-white file-upload">
											{I18.f("SELECT_TEXTURE")}
											<input type="file" ref={this.selectTextureInputRef} accept="image/png,image/jpg,image/jpeg,image/gif" onChange={this.selectTexture} />
										</div>
									</td>
									<td>
										<div className="back-400 border-color-gray color-black sheet-splitter-info-text" ref={this.fileNameRef}>&nbsp;</div>
									</td>
									<td>
										<div className="btn back-800 border-color-gray color-white file-upload">
											{I18.f("SELECT_DATA_FILE")}
											<input type="file" ref={this.selectTextureInputRef} onChange={this.selectDataFile} />
										</div>
									</td>
									<td>
										<div className="back-400 border-color-gray color-black sheet-splitter-info-text" ref={this.dataFileNameRef}>&nbsp;</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div ref={this.wheelRef} className="sheet-splitter-view">
						<canvas ref={this.viewRef}/>
					</div>

					<div className="sheet-splitter-controls">
						<table>
							<tbody>
								<tr>
									<td>{I18.f('FORMAT')}</td>
									<td>
										<select ref={this.dataFormatRef} className="border-color-gray" value={currentSplitterName} onChange={this.changeSplitter}>
											{splitterMaster.getListOfSplittersNames().map(name => {
												return (<option key={"data-format-" + name} defaultValue={name}>{name}</option>)
											})}
										</select>
									</td>
								</tr>
								<tr>
									<td>{I18.f('UPDATE_FILENAME')}</td>
									<td>
										<input ref={this.updateFileNameRef} type="checkbox" className="border-color-gray" defaultChecked={this.state.updateFileName} onChange={this.onUpdateFileNameChange}/>
									</td>
								</tr>
								<tr>
									<td>{I18.f('DISABLE_UNTRIM')}</td>
									<td>
										<input ref={this.disableUntrimRef} type="checkbox" className="border-color-gray"/>
									</td>
								</tr>
								<tr style={{display: displayGridProperties}}>
									<td>{I18.f('WIDTH')}</td>
									<td>
										<input type="number" ref={this.widthRef} defaultValue='64' onChange={this.updateView}/>
									</td>
								</tr>
								<tr style={{display: displayGridProperties}}>
									<td>{I18.f('HEIGHT')}</td>
									<td>
										<input type="number" ref={this.heightRef} defaultValue='64' onChange={this.updateView}/>
									</td>
								</tr>
								<tr style={{display: displayGridProperties}}>
									<td>{I18.f('PADDING')}</td>
									<td>
										<input type="number" ref={this.paddingRef} defaultValue='0' onChange={this.updateView}/>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="sheet-splitter-bottom">
						<table>
							<tbody>
								<tr>
									{this.textureBackColors.map(name => {
										return (
											<td key={"back-color-btn-" + name}>
												<div className={"btn-back-color " + name + (this.state.textureBack === name ? " selected" : "")} onClick={this.setBack}>&nbsp;</div>
											</td>
										)
									})}

									<td>
										{I18.f("SCALE")}
									</td>
									<td style={{width: "65%"}}>
										<input ref={this.rangeRef} style={{width: "100%"}} type="range" min="0.1" max="2" step={this.step} defaultValue="1" onChange={this.changeScale}/>
									</td>
								</tr>
							</tbody>
						</table>

						<div>
							<div className="btn back-800 border-color-gray color-white" onClick={this.doRepack}>{I18.f("REPACK")}</div>
							<div className="btn back-800 border-color-gray color-white" onClick={this.doExport}>{I18.f("EXPORT")}</div>
							<div className="btn back-800 border-color-gray color-white" onClick={this.close}>{I18.f("CLOSE")}</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default SheetSplitter;
import * as React from 'react';

import LocalImagesLoader from '../utils/LocalImagesLoader';
import ZipLoader from '../utils/ZipLoader';
import I18 from '../utils/I18';

import { Observer, GLOBAL_EVENT } from '../Observer';
import ItemTreePart, { TreeListItem } from './ItemTree';

//import * as FileSystem from './platform/FileSystem';

import Globals from '../utils/Globals';
import {smartSortImages} from '../utils/common';
import { LoadedImages, SelectedEvent } from 'types';
import TypedObserver from 'TypedObserver';
import CustomImage from 'data/CustomImage';
import { ButtonData } from './MessageBox';

// TODO: make this not use CustomImage.selected + CustomImage.current

let INSTANCE:ImagesList = null;

interface Props {
}

interface State {
	images: LoadedImages
};

class ImagesList extends React.Component<Props, State> {
	imagesTreeRef: React.RefObject<HTMLDivElement>;
	imagesTreePartRef: React.RefObject<ItemTreePart>;
	dropHelpRef: React.RefObject<HTMLDivElement>;
	addImagesInputRef: React.RefObject<HTMLInputElement>;
	addZipInputRef: React.RefObject<HTMLInputElement>;

	state:State = {
		images: {},
	};

	constructor(props: Props) {
		super(props);

		INSTANCE = this;

		this.imagesTreeRef = React.createRef();
		this.imagesTreePartRef = React.createRef();
		this.dropHelpRef = React.createRef();
		this.addImagesInputRef = React.createRef();
		this.addZipInputRef = React.createRef();

		this.state = {images: {}};
	}

	static get i() {
		return INSTANCE;
	}

	componentDidMount = () => {
		TypedObserver.imageSelected.on(this.handleImageSelected, this);
		Observer.on(GLOBAL_EVENT.IMAGE_CLEAR_SELECTION, this.handleImageClearSelection, this);
		//Observer.on(GLOBAL_EVENT.FS_CHANGES, this.handleFsChanges, this);

		globalThis.addEventListener("keydown", this.handleKeys, false);

		let dropZone = this.imagesTreeRef.current;
		if(dropZone) {
			dropZone.ondrop = this.onFilesDrop;

			dropZone.addEventListener("dragover", e => {
				let help = this.dropHelpRef.current;
				if(help) help.className = "image-drop-help selected";
				return e.preventDefault();
			});

			dropZone.addEventListener("dragleave", e => {
				let help = this.dropHelpRef.current;
				if(help) help.className = "image-drop-help";
				return e.preventDefault();
			});
		}
	}

	componentWillUnmount = () => {
		TypedObserver.imageSelected.off(this.handleImageSelected, this);
		Observer.off(GLOBAL_EVENT.IMAGE_CLEAR_SELECTION, this.handleImageClearSelection, this);
		//Observer.off(GLOBAL_EVENT.FS_CHANGES, this.handleFsChanges, this);

		globalThis.removeEventListener("keydown", this.handleKeys, false);
	}

	handleKeys = (e:KeyboardEvent) => {
		if(e) {
			// e.key
			if((e.code === "KeyA") && e.ctrlKey) {
				this.selectAllImages();
				e.preventDefault();
				return;
			}

			// deprecated backwards compatibility
			let key = e.keyCode || e.which;
			if(key === 65 && e.ctrlKey) {
				this.selectAllImages();
				e.preventDefault();
				return;
			}
		}
	}

	setImages = (images: LoadedImages) => {
		this.setState({images: images});
		TypedObserver.imagesListChanged.emit(images);
	}

	onFilesDrop = (e: DragEvent) => {
		e.preventDefault();

		if(e.dataTransfer.files.length) {
			let loader = new LocalImagesLoader();
			loader.load(e.dataTransfer.files, null, data => {
				return this.loadImagesComplete(data);
			});
		}

		return false;
	}

	addImages = (e:React.ChangeEvent<HTMLInputElement>) => {
		if(e.target.files.length) {
			Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);

			let loader = new LocalImagesLoader();
			loader.load(e.target.files, null, data => {
				return this.loadImagesComplete(data);
			});
		}
	}

	addZip = (e: React.ChangeEvent<HTMLInputElement>) => {
		let file = e.target.files[0];
		if(file) {
			Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);

			let loader = new ZipLoader();
			loader.load(file, null, data => this.loadImagesComplete(data));
		}
	}

	/*addImagesFs = () => {
		Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);
		FileSystem.addImages(this.loadImagesComplete);
	}

	addFolderFs = () => {
		Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);
		FileSystem.addFolder(this.loadImagesComplete);
	}

	handleFsChanges = (data) => {
		let image = null;
		let images = this.state.images;
		let imageKey = "";

		let keys = Object.keys(images);
		for(let key of keys) {
			let item = images[key];
			if(item.fsPath.path === data.path) {
				image = item;
				imageKey = key;
				break;
			}
		}

		if(data.event === "unlink" && image) {
			delete images[imageKey];
			this.setState({images: images});
			TypedObserver.imagesListChanged.emit(images);
		}

		if(data.event === "add" || data.event === "change") {
			let folder = "";
			let addPath = "";

			for(let key of keys) {
				let item = images[key];

				if(item.fsPath.folder && data.path.substr(0, item.fsPath.folder.length) === item.fsPath.folder) {
					folder = item.fsPath.folder;
					addPath = folder.split("/").pop();
				}
			}

			let name = "";
			if(folder) {
				name = addPath + data.path.substr(folder.length);
			}
			else {
				name = data.path.split("/").pop();
			}

			FileSystem.loadImages([{name: name, path: data.path, folder: folder}], this.loadImagesComplete);
		}
	}*/

	loadImagesComplete = (data:LoadedImages={}) => {

		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);

		if(PLATFORM === "web") {
			this.addImagesInputRef.current.value = "";
			this.addZipInputRef.current.value = "";
		}

		let names = Object.keys(data);

		if(names.length) {
			let images = this.state.images;

			for (let name of names) {
				images[name] = data[name];
				/*images[name] = {
					image: data[name],
					name: name,
					path: name,
					isFolder: false,
					selected: false,
					current: false,
				}*/
			}

			images = this.sortImages(images);

			this.setState({images: images});
			TypedObserver.imagesListChanged.emit(images);
		}
	}

	sortImages = (images:LoadedImages) => {
		let names = Object.keys(images);
		names.sort(smartSortImages);

		let sorted:LoadedImages = {};

		for(let name of names) {
			sorted[name] = images[name];
		}

		return sorted;
	}

	clear = () => {
		let keys = Object.keys(this.state.images);
		if(keys.length) {
			let buttons:ButtonData[] = [
				{name: "yes", caption: I18.f("YES"), callback: this.doClear},
				{name: "no", caption: I18.f("NO")}
			];

			TypedObserver.showMessage.emit(I18.f("CLEAR_WARNING"), buttons);
		}
	}

	doClear = () => {
		TypedObserver.imagesListChanged.emit({});
		TypedObserver.imagesListSelectedChanged.emit([]);
		Globals.didClearImageList();
		this.setState({images: {}});
	}

	selectAllImages = () => {
		let images = this.state.images;
		for(let key in images) {
			images[key].selected = true;
		}

		this.setState({images: this.state.images});
		this.emitSelectedChanges();
	}

	removeImagesSelect = () => {
		let images = this.state.images;
		for(let key in images) {
			images[key].selected = false;
		}
	}

	getCurrentImage = () => {
		let images = this.state.images;
		for(let key in images) {
			if(images[key].current) return images[key];
		}

		return null;
	}

	getImageIdx = (image:CustomImage) => {
		let idx = 0;

		let images = this.state.images;
		for(let key in images) {
			if(images[key] === image) return idx;
			idx++;
		}

		return -1;
	}

	bulkSelectImages = (to:CustomImage) => {
		let current = this.getCurrentImage();
		if(!current) {
			to.selected = true;
			return;
		}

		let fromIx = this.getImageIdx(current);
		let toIx = this.getImageIdx(to);

		let images = this.state.images;
		let ix = 0;
		for(let key in images) {
			if(fromIx < toIx && ix >= fromIx && ix <= toIx) images[key].selected = true;
			if(fromIx > toIx && ix <= fromIx && ix >= toIx) images[key].selected = true;
			ix++;
		}
		this.emitSelectedChanges();
	}

	selectImagesFolder = (path: string, selected: boolean) => {
		let images = this.state.images;

		let first = false;
		for(let key in images) {
			if(key.substr(0, path.length + 1) === path + "/") {
				if(!first) {
					first = true;
					this.clearCurrentImage();
					images[key].current = true;
				}
				images[key].selected = selected;
			}
		}
		this.emitSelectedChanges();
	}

	clearCurrentImage = () => {
		let images = this.state.images;
		for(let key in images) {
			images[key].current = false;
		}
	}

	getFirstImageInFolder = (path: string) => {
		let images = this.state.images;

		for(let key in images) {
			if (key.substr(0, path.length + 1) === path + "/") return images[key];
		}

		return null;
	}

	getLastImageInFolder = (path: string) => {
		let images = this.state.images;

		let ret = null;
		for(let key in images) {
			if (key.substr(0, path.length + 1) === path + "/") ret = images[key];
		}

		return ret;
	}

	handleImageSelected = (e: SelectedEvent) => {
		let path = e.path;
		let images = this.state.images;

		if(e.isFolder) {
			if(e.ctrlKey) {
				this.selectImagesFolder(path, true);
			}
			else if(e.shiftKey) {
				let to = this.getLastImageInFolder(path);
				if(to) this.bulkSelectImages(to);

				to = this.getFirstImageInFolder(path);
				if(to) {
					this.bulkSelectImages(to);
					this.clearCurrentImage();
					to.current = true;
				}
			}
			else {
				this.removeImagesSelect();
				this.selectImagesFolder(path, true);
			}
		}
		else {
			let image = images[path];
			if(image) {
				if(e.ctrlKey) {
					image.selected = !image.selected;
				}
				else if(e.shiftKey) {
					this.bulkSelectImages(image);
				}
				else {
					this.removeImagesSelect();
					image.selected = true;
				}

				this.clearCurrentImage();
				image.current = true;
			}
		}

		this.setState({images: images});
		this.emitSelectedChanges();
	}

	handleImageClearSelection = () => {
		this.removeImagesSelect();
		this.clearCurrentImage();
		this.setState({images: this.state.images});
		this.emitSelectedChanges();
	}

	emitSelectedChanges = () => {
		let selected = [];

		let images = this.state.images;

		for(let key in images) {
			if(images[key].selected) selected.push(key);
		}

		TypedObserver.imagesListSelectedChanged.emit(selected);
		//this.imagesTreePartRef.current.setState({selected: selected});
	}

	createImagesFolder(name="", path=""):TreeListItem {
		return {
			img: null,
			isFolder: true,
			selected: false,
			current: false,
			name: name,
			path: path,
			items: []
		};
	}

	getImageSubFolder = (root:TreeListItem, parts:string[]) => {
		parts = parts.slice();

		let folder = null;

		while(parts.length) {
			let name = parts.shift();

			folder = null;

			for (let item of root.items) {
				if (item.isFolder && item.name === name) {
					folder = item;
					break;
				}
			}

			if (!folder) {
				let p = [];
				if(root.path) p.unshift(root.path);
				p.push(name);

				folder = this.createImagesFolder(name, p.join("/"));
				root.items.push(folder);
			}

			root = folder;
		}

		return folder || root;
	}

	getImagesTree = () => {
		let res = this.createImagesFolder();

		let keys = Object.keys(this.state.images);

		for(let key of keys) {
			let parts = key.split("/");
			let name = parts.pop();
			let folder = this.getImageSubFolder(res, parts);

			let img = this.state.images[key];

			folder.items.push({
				img: img,
				path: key,
				name: name,
				isFolder: false,
				selected: img.selected,
				current: img.current
			});

			if(this.state.images[key].selected) folder.selected = true;
		}

		return res;
	}

	deleteSelectedImages = () => {
		let images = this.state.images;

		let deletedCount = 0;

		let keys = Object.keys(images);
		for(let key of keys) {
			if(images[key].selected) {
				deletedCount++;
				delete images[key];
			}
		}

		if(deletedCount > 0) {
			images = this.sortImages(images);

			this.setState({images: images});
			TypedObserver.imagesListChanged.emit(images);
			this.emitSelectedChanges();
		}
	}

	renderWebButtons() {
		return (
			<span>
				<div className="btn back-800 border-color-gray color-white file-upload" title={I18.f("ADD_IMAGES_TITLE")}>
					{I18.f("ADD_IMAGES")}
					<input type="file" ref={this.addImagesInputRef} multiple accept="image/png,image/jpg,image/jpeg,image/gif" onChange={this.addImages} />
				</div>

				<div className="btn back-800 border-color-gray color-white file-upload" title={I18.f("ADD_ZIP_TITLE")}>
					{I18.f("ADD_ZIP")}
					<input type="file" ref={this.addZipInputRef} accept=".zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed" onChange={this.addZip} />
				</div>
			</span>
		);
	}

	/*renderElectronButtons() {
		return (
			<span>
				<div className="btn back-800 border-color-gray color-white" onClick={this.addImagesFs} title={I18.f("ADD_IMAGES_TITLE")}>
					{I18.f("ADD_IMAGES")}
				</div>

				<div className="btn back-800 border-color-gray color-white" onClick={this.addFolderFs} title={I18.f("ADD_FOLDER_TITLE")}>
					{I18.f("ADD_FOLDER")}
				</div>
			</span>
		);
	}*/

	render() {
		let data = this.getImagesTree();

		console.log(data, this.state.images);

		let dropHelp = Object.keys(this.state.images).length > 0 ? null : (<div ref={this.dropHelpRef} className="image-drop-help">{I18.f("IMAGE_DROP_HELP")}</div>);

		return (
			<div className="images-list border-color-gray back-white">

				<div className="images-controllers border-color-gray">

					{
						PLATFORM === "web" ? (this.renderWebButtons()) : (<>{/* this.renderElectronButtons() */}</>)
					}

					<div className="btn back-800 border-color-gray color-white" onClick={this.deleteSelectedImages} title={I18.f("DELETE_TITLE")}>
						{I18.f("DELETE")}
					</div>
					<div className="btn back-800 border-color-gray color-white" onClick={this.clear} title={I18.f("CLEAR_TITLE")}>
						{I18.f("CLEAR")}
					</div>

					<hr />

				</div>

				<div ref={this.imagesTreeRef} className="images-tree">
					<ItemTreePart ref={this.imagesTreePartRef} {...data} />
					{dropHelp}
				</div>

			</div>
		);
	}
}

export default ImagesList;
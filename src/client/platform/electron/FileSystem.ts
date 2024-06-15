import * as fs from 'fs';
import * as chokidar from 'chokidar';
import { dialog } from '@electron/remote';


import Controller from './Controller';
import I18 from '../../utils/I18';
import Base64ImagesLoader from '../../utils/Base64ImagesLoader';
import { Observer, GLOBAL_EVENT } from '../../Observer';
import type { LoadedImages } from 'types';
import type { FileSystemPath } from 'data/CustomImage';
import type { FileFilter, SaveDialogOptions } from 'electron';

const filters:FileFilter[] = [
	{ name: "Funkin Packer", extensions: ['fnfp'] },
	{ name: "Free texture packer", extensions: ['ftpp'] }
];

const IMAGES_EXT = ['jpg', 'png', 'gif'];

type FilePromiseData = { path: string, data: any };

let watcher: chokidar.FSWatcher = null;

function processPath(path: string): Promise<FilePromiseData> {
	return new Promise((resolve, reject) => {
		if (path) {
			try {
				let data = fs.readFileSync(path).toString('utf8');
				data = JSON.parse(data);
				Controller.updateProject(path);
				resolve({ path, data });
			} catch (e) {
				resolve({ path: null, data: null });
			}
		} else {
			resolve({ path: null, data: null });
		}
	});
}

class FileSystem {
	static fixPath(path: string) {
		return path.split("\\").join("/");
	}

	static getExtFromPath(path: string) {
		return path.split(".").pop().toLowerCase();
	}

	static selectFolder() {
		let dir = dialog.showOpenDialog({
			properties: ['openDirectory']
		});
		return dir;
	}

	static getFolderFilesList(dir: string, base = "", list: FileSystemPath[] = []) {
		let files = fs.readdirSync(dir);
		for (let file of files) {
			if (fs.statSync(dir + file).isDirectory() && (dir + file).toUpperCase().indexOf("__MACOSX") < 0) {
				list = FileSystem.getFolderFilesList(dir + file + '/', base + file + "/", list);
			}
			else {
				list.push({
					name: file, // (base ? base : "") +
					path: dir + file,
					folder: base
				});
			}
		}

		return list;
	}

	static addImages(cb: () => void) {
		let list = dialog.showOpenDialog({
			filters: [{ name: I18.f("IMAGES"), extensions: IMAGES_EXT }],
			properties: ['openFile', 'multiSelections']
		}).then((res) => {
			if (res && res.filePaths && res.filePaths.length) {
				let files = [];
				for (let path of res.filePaths) {
					path = FileSystem.fixPath(path);
					let name = path.split("/").pop();

					files.push({
						name,
						path,
						folder: ""
					});
				}

				FileSystem.loadImages(files, cb);
			}
			else {
				cb();
			}
		});
	}

	static addFolder(cb: () => void) {
		let dir = dialog.showOpenDialog({
			properties: ['openDirectory']
		}).then((res) => {
			if (res && res.filePaths && res.filePaths.length) {
				let path = FileSystem.fixPath(res.filePaths[0]);
				FileSystem.loadFolder(path, cb);
			}
			else {
				cb();
			}
		});
	}

	static startWatch(path: string) {
		try {
			if (!watcher) {
				watcher = chokidar.watch(path, { ignoreInitial: true });
				watcher.on('all', FileSystem.onWatchEvent);
			}
			else {
				watcher.add(path);
			}
		}
		catch (e) {
			// continue regardless of error
		}
	}

	static stopWatch(path: string) {
		if (watcher) {
			watcher.unwatch(path);
		}
	}

	static terminateWatch() {
		if (watcher) {
			watcher.close();
			watcher = null;
		}
	}

	static onWatchEvent(event: string, path: string) {
		Observer.emit(GLOBAL_EVENT.FS_CHANGES, {
			event,
			path: FileSystem.fixPath(path)
		});
	}

	static loadImages(list: FileSystemPath[], cb: (res: LoadedImages) => void) {
		let files = [];

		for (let item of list) {
			let path = item.path;
			let ext = FileSystem.getExtFromPath(path);

			if (IMAGES_EXT.indexOf(ext) >= 0) {
				if (!item.folder) FileSystem.startWatch(path);

				try {
					let content = fs.readFileSync(path, 'base64');
					content = "data:image/" + ext + ";base64," + content;
					files.push({ name: item.name, url: content, fsPath: item });
				}
				catch (e) {
					// continue regardless of error
				}
			}
		}

		let loader = new Base64ImagesLoader();
		loader.load(files, null, (res) => {
			if (cb) cb(res);
		});
	}

	static loadFolder(path: string, cb: (res: LoadedImages) => void) {
		if (fs.existsSync(path)) {
			FileSystem.startWatch(path);

			let parts = path.split("/");
			let name = "";
			while (parts.length && !name) name = parts.pop();

			let list = FileSystem.getFolderFilesList(path + "/", name + "/");

			for (let item of list) {
				item.folder = path;
			}

			FileSystem.loadImages(list, cb);
		}
		else {
			cb({});
		}
	}

	static saveProject(data: any, path = ""): Promise<string | void> {
		let options: SaveDialogOptions = {
			filters: filters
		};

		const saveFile = (path: string) => {
			path = FileSystem.fixPath(path);

			try {
				fs.writeFileSync(path, JSON.stringify(data, null, 2));
				Controller.updateProject(path);
			} catch (e) {
				// continue regardless of error
			}

			return path;
		};

		if (!path) {
			return dialog.showSaveDialog(options).then((result) => {
				if (result.filePath) {
					return saveFile(result.filePath);
				}
				return null;
			});
		} else {
			return Promise.resolve(saveFile(path));
		}
	}

	static loadProject(pathToLoad = ""): Promise<FilePromiseData> {
		return new Promise((resolve, reject) => {
			let path;

			if (pathToLoad) {
				path = FileSystem.fixPath(pathToLoad);
				processPath(path).then(resolve).catch(reject);
			} else {
				dialog.showOpenDialog({
					filters: filters,
					properties: ['openFile']
				}).then(result => {
					if (result && result.filePaths && result.filePaths[0]) {
						path = FileSystem.fixPath(result.filePaths[0]);
						processPath(path).then(resolve).catch(reject);
					} else {
						resolve({ path: null, data: null });
					}
				}).catch(err => {
					reject(err);
				});
			}
		});
	}
}

export default FileSystem;
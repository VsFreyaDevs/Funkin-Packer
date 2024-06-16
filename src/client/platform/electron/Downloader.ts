import * as fs from 'fs';
import * as path from 'path';
import { dialog } from '@electron/remote';

import type { FileData } from 'types';
import I18 from 'client/locale/I18';

class Downloader {

	static run(files:FileData[], fileName:string, savePath?:string) {

		let dir = savePath;

		const getDir = () => {
			if (!dir) {
				return dialog.showOpenDialog({
					properties: ['openDirectory']
				}).then(result => {
					if (result.canceled) {
						throw new Error('No directory selected');
					}
					return result.filePaths[0];
				});
			}
			return Promise.resolve(dir);
		};

		const checkExists = (files:FileData[], dir:string) => {
			return files.some(file => fs.existsSync(path.normalize(dir + "/" + file.name)));
		};

		const complete = (files:FileData[], dir:string) => {
			for (let file of files) {
				let content = file.content;
				if (file.base64) content = Buffer.from(content, 'base64').toString('utf8');

				let savePath = path.normalize(dir + "/" + file.name);
				savePath = savePath.split("\\").join("/");

				let saveDirParts = savePath.split("/");
				saveDirParts.pop();
				let currentPath = '';
				while (saveDirParts.length) {
					currentPath = currentPath + saveDirParts.shift() + '/';
					if (!fs.existsSync(currentPath)) {
						fs.mkdirSync(currentPath);
					}
				}

				fs.writeFileSync(savePath, content);
			}
		};

		getDir().then(async selectedDir => {
			dir = String(selectedDir);

			if (checkExists(files, dir)) {
				const result = await dialog.showMessageBox({
					buttons: ["Yes", "No", "Cancel"],
					message: I18.f('REPLACE_FILES_PROMPT')
				});
				if (result.response === 0) {
					complete(files, dir);
				}
			} else {
				complete(files, dir);
			}
		}).catch(err => {
			console.error(err);
		});

	}
}

export default Downloader;
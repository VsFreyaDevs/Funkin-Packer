import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import type { FileData } from 'types';

class Downloader {

	static run(files: FileData[], fileName: string, _savePath: string) {

		let zip = new JSZip();

		// Fix timezone issue
		const currDate = new Date();
		const dateWithOffset = new Date(currDate.getTime() - currDate.getTimezoneOffset() * 60000);
		// replace the default date with dateWithOffset
		JSZip.defaults.date = dateWithOffset;

		for(let file of files) {
			zip.file(file.name, file.content, {base64: !!file.base64});
		}

		let ext = fileName.split(".").pop();
		if(ext !== "zip") fileName += ".zip";

		zip.generateAsync({type:"blob"}).then((content) => {
			FileSaver.saveAs(content, fileName);
		});
	}

}

export default Downloader;
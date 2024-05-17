const {ipcRenderer} = require('electron');

import I18 from "../../utils/I18";

class Tinifyer {
	static start(imageData, packOptions) {
		return new Promise((resolve, reject) => {
			if(packOptions.tinify) {
				let uid = Date.now() + "_" + Math.random();
				let data = {
					imageData,
					key: packOptions.tinifyKey,
					uid
				};

				let handler = (e, tinyData) => {
					if(tinyData.uid === uid) {
						ipcRenderer.removeListener('tinify-complete', handler);

						if(tinyData.success) {
							resolve(tinyData.data);
						}
						else if(tinyData.error)
							reject(I18.f("TINIFY_ERROR", tinyData.error));
						else
						reject(I18.f("TINIFY_ERROR_COMMON"));
					}
				};

				ipcRenderer.on('tinify-complete', handler);
				ipcRenderer.send('tinify', data);
			}
			else {
				resolve(imageData);
			}
		});
	}
}

export default Tinifyer;
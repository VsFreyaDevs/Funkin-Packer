import { ipcRenderer } from 'electron';

import { Observer, GLOBAL_EVENT } from "client/Observer";
import I18 from 'client/utils/I18';
import * as appInfo from '../../../../package.json';
import { languages} from '../../resources/static/localization/languages';

import Project from './Project';

import PackProperties from 'client/ui/PackProperties';
import ImagesList from "client/ui/ImagesList";
import TypedObserver from "TypedObserver";

class Controller {
	static init() {
		ipcRenderer.on("change-locale", (_e, payload) => {
			TypedObserver.changeLanguage.emit(payload.data);
		});

		ipcRenderer.on("show-about", (_e, _payload) => {
			Observer.emit(GLOBAL_EVENT.SHOW_ABOUT);
		});

		ipcRenderer.on("project-load", (_e, payload) => {
			let path = "";
			if(payload) path = payload.data;

			Project.load(path);
		});

		ipcRenderer.on("project-save", (_e, _payload) => {
			Project.save();
		});

		ipcRenderer.on("project-save-as", (_e, _payload) => {
			Project.saveAs();
		});

		ipcRenderer.on("project-new", (_e, _payload) => {
			Project.create();
		});

		ipcRenderer.on("preferences-save", (_e, _payload) => {
			PackProperties.i.saveOptions(true);
		});

		ipcRenderer.on("quit", (_e, _payload) => {
			Controller.quit();
		});

		ipcRenderer.on("action-add-images", (_e, _payload) => {
			//ImagesList.i.addImagesFs();
		});

		ipcRenderer.on("action-add-folder", (_e, _payload) => {
			//ImagesList.i.addFolderFs();
		});

		ipcRenderer.on("action-delete", (_e, _payload) => {
			ImagesList.i.deleteSelectedImages();
		});

		ipcRenderer.on("action-select-all", (_e, _payload) => {
			ImagesList.i.selectAllImages();
		});

		ipcRenderer.on("action-clear", (_e, _payload) => {
			ImagesList.i.clear();
		});

		ipcRenderer.on("action-export", (_e, _payload) => {
			Observer.emit(GLOBAL_EVENT.START_EXPORT);
		});

		ipcRenderer.on("action-show-splitter", (_e, _payload) => {
			Observer.emit(GLOBAL_EVENT.SHOW_SHEET_SPLITTER);
		});

		//ipcRenderer.on("update-available", (e, payload) => {
		//	Observer.emit(GLOBAL_EVENT.UPDATE_AVAILABLE, payload);
		//});

		ipcRenderer.on("download-progress", (_e, payload) => {
			Observer.emit(GLOBAL_EVENT.DOWNLOAD_PROGRESS_CHANGED, payload);
		});

		Observer.on(GLOBAL_EVENT.INSTALL_UPDATE, () => {
			ipcRenderer.send('install-update');
		});

		ipcRenderer.send('update-app-info', appInfo);
		ipcRenderer.send('update-languages', languages);

		Controller.updateRecentProjects();

		setTimeout(Project.startObserv, 1000);
	}

	static updateProject(path="") {
		ipcRenderer.send('project-update', {path});
	}

	static updateProjectModified(val: unknown) {
		ipcRenderer.send('project-modified', {val});
	}

	static updateRecentProjects() {
		ipcRenderer.send('project-recent-update', {projects: Project.getRecentProjects()});
	}

	static updateLocale() {
		ipcRenderer.send('update-locale', {
			currentLocale: I18.currentLocale,
			strings: I18.strings
		});
	}

	static quit() {
		Project.saveChanges(() => {
			ipcRenderer.send('quit');
		});
	}
}

export default Controller;
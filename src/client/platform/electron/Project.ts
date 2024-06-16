import APP from '../../APP';
import PackProperties from '../../ui/PackProperties';
import ImagesList from '../../ui/ImagesList';
import FileSystem from './FileSystem';
import Controller from './Controller';
import * as appInfo from '../../../../package.json';
import I18 from '../../locale/I18';
import TypedObserver from 'TypedObserver';
import type { LoadedImages } from 'api/types';

const RECENT_PROJECTS_KEY = "recent-projects";

let CURRENT_PROJECT_PATH = "";
let CURRENT_PROJECT_MODIFIED = false;

class Project {
	static startObserv() {
		Project.stopObserv();

		//TypedObserver.imagesListChanged.on(Project.onImagesListChanged);
		TypedObserver.packOptionsChanged.on(Project.onProjectChanged);
		TypedObserver.packExporterChanged.on(Project.onProjectChanged);
	}

	static stopObserv() {
		//TypedObserver.imagesListChanged.off(Project.onImagesListChanged);
		TypedObserver.packOptionsChanged.off(Project.onProjectChanged);
		TypedObserver.packExporterChanged.off(Project.onProjectChanged);
	}

	static onProjectChanged() {
		Project.setProjectChanged(true);
	}

	static setProjectChanged(val: boolean) {
		CURRENT_PROJECT_MODIFIED = !!val;
		Controller.updateProjectModified(CURRENT_PROJECT_MODIFIED);
	}

	static getData() {
		let keys = Object.keys(APP.i.images);
		let images = [];
		let folders = [];

		for (let key of keys) {
			let image = APP.i.images[key].fsPath;
			let folder = image.folder;

			if (folder) {
				if (folders.indexOf(folder) < 0) folders.push(folder);
			}
			else {
				images.push(image);
			}
		}

		let packOptions = {...APP.i.packOptions};
		packOptions.packer = APP.i.packOptions.packerCls.packerName;
		packOptions.exporter = APP.i.packOptions.exporterCls.exporterName;

		let meta = {
			version: appInfo.version
		};

		return {
			meta,
			savePath: APP.i.packOptions.savePath || '',
			images,
			folders,
			packOptions
		}
	}

	static getRecentProjects() {
		let recentProjectsRaw = localStorage.getItem(RECENT_PROJECTS_KEY);
		let recentProjects: string[] = [];
		if (recentProjectsRaw) {
			try { recentProjects = JSON.parse(recentProjectsRaw) }
			catch (e) { recentProjects = [] }
		}
		else {
			recentProjects = [];
		}

		return recentProjects;
	}

	static updateRecentProjects(path: string) {
		let recentProjects = Project.getRecentProjects();

		let res = [];

		for (let i = 0; i < recentProjects.length; i++) {
			if (recentProjects[i] !== path) res.push(recentProjects[i]);
		}

		if (path) res.unshift(path);

		if (res.length > 10) res = res.slice(0, 10);

		localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(res));

		Controller.updateRecentProjects();
	}

	static save() {
		if (!CURRENT_PROJECT_PATH) {
			Project.saveAs();
			return;
		}

		let path = FileSystem.saveProject(Project.getData(), CURRENT_PROJECT_PATH).then((result) => {
			if (result) {
				CURRENT_PROJECT_PATH = result;
				Project.setProjectChanged(false);
				Project.updateRecentProjects(result);
			}
		});
	}

	static saveAs() {
		let path = FileSystem.saveProject(Project.getData()).then((result) => {
			if (result) {
				CURRENT_PROJECT_PATH = result;
				Project.setProjectChanged(false);
				Project.updateRecentProjects(result);
			}
		});
	}

	static saveChanges(cb: () => void = null) {
		if (CURRENT_PROJECT_MODIFIED) {
			let buttons = [
				{ name: "yes", caption: I18.f("YES"), callback: () => { Project.save(); if (cb) cb(); } },
				{ name: "no", caption: I18.f("NO"), callback: () => { if (cb) cb(); } },
				{ name: "cancel", caption: I18.f("CANCEL") }
			];

			TypedObserver.showMessage.emit(I18.f("SAVE_CHANGES_CONFIRM"), buttons);
		}
		else if (cb) {
			cb();
		}
	}

	static load(pathToLoad = "") {
		Project.saveChanges(async () => {
			let { path, data } = await FileSystem.loadProject(pathToLoad);

			if (data) {
				Project.stopObserv();

				FileSystem.terminateWatch();

				Project.updateRecentProjects(path);

				PackProperties.i.setOptions(data.packOptions);

				let images: LoadedImages;

				FileSystem.loadImages(data.images, res => {
					images = res;

					let cf = 0;

					let loadNextFolder = () => {
						if (cf >= data.folders.length) {
							ImagesList.i.setImages(images);
							Project.startObserv();
							return;
						}

						let path = data.folders[cf];
						FileSystem.startWatch(path);

						FileSystem.loadFolder(path, (res) => {
							let keys = Object.keys(res);
							for (let key of keys) {
								images[key] = res[key];
							}
							cf++;
							loadNextFolder();
						});
					};

					loadNextFolder();
				});

				CURRENT_PROJECT_PATH = path;
				Project.setProjectChanged(false);
			}
		});
	}

	static create() {
		Project.saveChanges(() => {
			FileSystem.terminateWatch();

			PackProperties.i.setOptions(PackProperties.i.loadOptions());
			ImagesList.i.setImages({});
			CURRENT_PROJECT_PATH = "";
			Project.setProjectChanged(false);

			Controller.updateProject();
		});
	}
}

export default Project;
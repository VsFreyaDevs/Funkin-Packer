import * as React from 'react';
import { createRoot } from 'react-dom/client';

import I18 from './locale/I18';
import APP from './APP';
import MainLayout from './ui/MainLayout';

import Storage from './utils/Storage';

import {getLanguageByCode, languages, type Language} from './locale/languages';

import Controller from 'platform/Controller';
import TypedObserver from 'TypedObserver';

let app:APP;
let layoutRef: React.RefObject<MainLayout>;

const STORAGE_LANGUAGE_KEY = "language";

function run() {
	Object.defineProperty(HTMLImageElement.prototype, 'toDataURL', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (this: HTMLImageElement, m?: string, q?: any): string {
			const canvas = document.createElement('canvas');
			canvas.width = this.naturalWidth;
			canvas.height = this.naturalHeight;
			const context = canvas.getContext('2d');
			if (context) {
				context.drawImage(this, 0, 0);
				return canvas.toDataURL(m, q);
			}
			throw new Error("Unable to get canvas context");
		}
	});

	Controller.init();
	if(PLATFORM === "electron") {
		injectCss("static/css/index-electron.css");
	}
	loadLocalization();
}

function loadLocalization() {
	I18.supportedLanguages = [];
	for(let i = 0; i < languages.length; i++) {
		I18.supportedLanguages.push(languages[i].lang);
	}
	I18.path = "static/localization";
	I18.currentLanguage = getLanguageByCode(Storage.load(STORAGE_LANGUAGE_KEY, false));

	app = new APP();

	I18.load(renderLayout);

	TypedObserver.changeLanguage.on(setLocale);
}

function renderLayout() {
	Controller.updateLocale();
	const root = createRoot(document.getElementById("root"));
	if(!layoutRef)
		layoutRef = React.createRef();
	root.render(
		<React.StrictMode>
			<MainLayout ref={layoutRef}></MainLayout>
		</React.StrictMode>
	);
}

function injectCss(path: string) {
	let el = document.createElement("link");
	el.rel = "stylesheet";
	el.type = "text/css";
	el.href = path;
	document.head.appendChild(el);
}

function setLocale(locale: Language) {
	if(!layoutRef) return;

	I18.currentLanguage = locale;
	//I18.init(locale);
	I18.load(() => {
		Storage.save(STORAGE_LANGUAGE_KEY, I18.currentLanguage.lang);
		Controller.updateLocale();
		layoutRef.current.forceUpdate();
	});
}

window.addEventListener("load", run, false);
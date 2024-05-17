/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
import React from 'react';
import { createRoot } from 'react-dom/client';
import Globals from './utils/Globals';

import I18 from './utils/I18';
import APP from './APP';
import MainLayout from './ui/MainLayout';

import Storage from './utils/Storage';
import { Observer, GLOBAL_EVENT } from './Observer';

import languages from './resources/static/localization/languages.json';

import Controller from 'platform/Controller';

let app = null;
let layoutRef = null;

const STORAGE_LANGUAGE_KEY = "language";

function run() {
	Object.defineProperty(
		HTMLImageElement.prototype,'toDataURL',
		{enumerable:false,configurable:false,writable:false,value:(m,q) => {
			let c=document.createElement('canvas');
			c.width=this.naturalWidth; c.height=this.naturalHeight;
			c.getContext('2d').drawImage(this,0,0); return c.toDataURL(m,q);
		}}
	);

	Controller.init();
	if(PLATFORM === "electron") {
		injectCss("static/css/index-electron.css");
	}
	loadLocalization();
}

function loadLocalization() {
	for(let i = 1; i < languages.length; i++) {
		I18.supportedLanguages.push(languages[i].lang);
	}
	I18.path = "static/localization";
	I18.init(Storage.load(STORAGE_LANGUAGE_KEY, false));

	app = new APP();

	I18.load(renderLayout);

	Observer.on(GLOBAL_EVENT.CHANGE_LANG, setLocale);
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

function injectCss(path) {
	let el = document.createElement("link");
	el.rel = "stylesheet";
	el.type = "text/css";
	el.href = path;
	document.head.appendChild(el);
}

function setLocale(locale) {
	if(!layoutRef) return;

	I18.init(locale);
	I18.load(() => {
		Storage.save(STORAGE_LANGUAGE_KEY, I18.currentLocale);
		Controller.updateLocale();
		layoutRef.current.forceUpdate();
	});
}

window.addEventListener("load", run, false);
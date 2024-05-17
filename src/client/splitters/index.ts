import Grid from './Grid';
import JsonHash from './JsonHash';
import JsonArray from './JsonArray';
//import XML from './XML';
import UIKit from './UIKit';
import Spine from './Spine';
import Sparrow from './Sparrow';
import { isNullOrUndefined } from '../utils/common';
import { GLOBAL_EVENT, Observer } from '../Observer';
import Splitter, { SplitterOptions } from './Splitter';
import { PackOptions, Rect } from 'types';

const GridSplitter = new Grid();

const list: Splitter[] = [
	new Sparrow(),
	GridSplitter,
	new JsonHash(),
	new JsonArray(),
	//XML,
	new UIKit(),
	new Spine()
];

function getDefaultSplitter():Splitter {
	return new Sparrow();
}

export class SplitterMaster {
	currentSplitter: Splitter;
	_storedSplitterOrder: string[];

	constructor() {
		this.currentSplitter = null;
		this._storedSplitterOrder = null;
	}

	getListOfSplitters() {
		return list;
	}

	getListOfSplittersNames = () => {
		let names = [];
		for(let item of list) {
			names.push(item.splitterName);
		}
		return names;
	}

	getCurrentSplitter = () => {
		if(this.currentSplitter === null)
			return getDefaultSplitter();
		return this.currentSplitter;
	}

	getSplitterFromName = (name: string) => {
		for(let item of list) {
			if(item.splitterName === name) {
				return item;
			}
		}
		return getDefaultSplitter();
	}

	findSplitter = (data: string) => {
		for(let item of list) {
			if(item.splitterName === GridSplitter.splitterName) continue;

			let isValid = false;
			item.doCheck(data, (checked) => {
				if(checked) {
					isValid = true;
				}
			});
			if(isValid) {
				return item;
			}
		}

		return getDefaultSplitter();
	}

	loadSplitter = (splitter: Splitter) => {
		if(splitter === null)
			this.currentSplitter = getDefaultSplitter();
		else
			this.currentSplitter = splitter;
	}

	finishSplit = () => {
		Observer.emit(GLOBAL_EVENT.STORED_ORDER_CHANGED, this._storedSplitterOrder);
		this._storedSplitterOrder = null;
	}

	splitData = (data:string, options:SplitterOptions, cb: (res: Rect[]) => void) => {
		if(this.currentSplitter === null) {
			throw new Error("No splitter found");
		}

		//console.log(this.currentSplitter.name, "is parsing data", data, options);

		this.currentSplitter.options = options;
		this.currentSplitter.doSplit(data, (res) => {
			if(res === false)
				return cb([]);

			let maxSizes:{
				[key: string]: {
					mw: number,
					mh: number,
				}
			} = {};
			const order = [];

			for(let item of res) {
				let prefix = this.currentSplitter.cleanPrefix(item.name);
				order.push(item.name);

				if(isNullOrUndefined(maxSizes[prefix])) {
					maxSizes[prefix] = {
						mw: -Infinity,
						mh: -Infinity,
					};
				}

				maxSizes[prefix].mw = Math.max(item.sourceSize.w, maxSizes[prefix].mw);
				maxSizes[prefix].mh = Math.max(item.sourceSize.h, maxSizes[prefix].mh);
				//maxSizes[prefix].mw = Math.max(item.orig.width, maxSizes[prefix].mw);
				//maxSizes[prefix].mh = Math.max(item.orig.height, maxSizes[prefix].mh);
			}

			for(let item of res) {
				let prefix = this.currentSplitter.cleanPrefix(item.name);

				item.sourceSize.mw = maxSizes[prefix].mw;
				item.sourceSize.mh = maxSizes[prefix].mh;
			}

			this._storedSplitterOrder = order;

			cb(res);
		});
	}
}
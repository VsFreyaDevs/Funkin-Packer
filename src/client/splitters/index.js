import Grid from './Grid';
import JsonHash from './JsonHash';
import JsonArray from './JsonArray';
//import XML from './XML';
import UIKit from './UIKit';
import Spine from './Spine';
import Sparrow from './Sparrow';
import { isNullOrUndefined } from '../utils/common';
import { GLOBAL_EVENT, Observer } from '../Observer';

/**
 * @type {Splitter[]}
 */
const list = [
	Sparrow,
	Grid,
	JsonHash,
	JsonArray,
	//XML,
	UIKit,
	Spine
];

function getDefaultSplitter() {
	return Sparrow;
}

export class SplitterMaster {
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
			names.push(item.name);
		}
		return names;
	}

	getCurrentSplitter = () => {
		if(this.currentSplitter === null)
			return getDefaultSplitter();
		return this.currentSplitter;
	}

	getSplitterFromName = (name) => {
		for(let item of list) {
			if(item.name === name) {
				return item;
			}
		}
		return getDefaultSplitter();
	}

	findSplitter = (data) => {
		for(let item of list) {
			if(item.type === Grid.type) continue;

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

	loadSplitter = (splitter) => {
		if(splitter === null)
			splitter = getDefaultSplitter();
		this.currentSplitter = splitter;
	}

	finishSplit = () => {
		Observer.emit(GLOBAL_EVENT.STORED_ORDER_CHANGED, this._storedSplitterOrder);
		this._storedSplitterOrder = null;
	}

	splitData = (data, options, cb) => {
		if(this.currentSplitter === null) {
			throw new Error("No splitter found");
		}

		//console.log(this.currentSplitter.name, "is parsing data", data, options);

		this.currentSplitter.doSplit(data, options, (res) => {
			let maxSizes = {};
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
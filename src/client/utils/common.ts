import { Rect } from "types";

export function smartSortImages(f1: string, f2: string) {
	let t1 = f1.split('/');
	let t2 = f2.split('/');

	let n1 = t1.pop();
	let n2 = t2.pop();

	let p1 = t1.join('/');
	let p2 = t2.join('/');

	if(p1 === p2) {
		t1 = n1.split('.');
		t2 = n2.split('.');

		if(t1.length > 1) t1.pop();
		if(t2.length > 1) t2.pop();

		let nn1 = parseInt(t1.join('.'), 10);
		let nn2 = parseInt(t2.join('.'), 10);

		if(!isNaN(nn1) && !isNaN(nn2)) {
			if(nn1 === nn2) return 0;
			return nn1 > nn2 ? 1 : -1;
		}
	}

	if(f1 === f2) return 0;
	return f1 > f2 ? 1 : -1;
}

export function cleanPrefix(str: string) {
	let parts = str.split(".");
	if(parts.length > 1) parts.pop();
	str = parts.join(".");

	let lastDigit = "";
	let c = "";
	do {
		c = str[str.length-1];
		if(c >= '0' && c <= '9') {
			str = str.slice(0, str.length - 1);
			lastDigit = c;
		}
	} while(c >= '0' && c <= '9');

	return str + lastDigit;
}

export function removeFromArray<T>(arr: T[], item: T) {
	const idx = arr.indexOf(item);

	if (idx !== -1) {
		arr.splice(idx, 1);
	}
}

export function deepClone(obj:any):any {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	if (Array.isArray(obj)) {
		const newArray = [];
		for (let i = 0; i < obj.length; i++) {
			newArray[i] = deepClone(obj[i]);
		}
		return newArray;
	}

	const newObj:any = {};
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			newObj[key] = deepClone(obj[key]);
		}
	}

	return newObj;
}

export function isNullOrUndefined(val: any) {
	return val === null || val === undefined;
}

export function dataURItoBlob(dataURI: string) {
	var split = dataURI.split(',');
	var byteString = atob(split[1]);
	var mimeString = split[0].split(':')[1].split(';')[0]
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);

	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	var blob = new Blob([ab], {type: mimeString});
	return blob;
}

export function formatBytes(bytes: number, decimals: number = 2, si: number = 1024) {
	if (bytes === 0) return '0 B';

	const k = si;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / k**i).toFixed(dm)) + ' ' + sizes[i];
}

export function getDummyRect(name:string, width: number, height: number):Rect {
	return {
		name: name,
		frame: {
			x: 0,
			y: 0,
			w: width,
			h: height
		},
		spriteSourceSize: {
			x: 0,
			y: 0,
			w: width,
			h: height
		},
		sourceSize: {
			w: width,
			h: height
		},
		frameSize: {
			x: 0,
			y: 0,
			w: width,
			h: height
		},
		rotated: false,
		trimmed: false
	}
}

export function setMaxSizes(rects:Rect[]) {
	let maxSizes:{
		[key: string]: {
			mw: number,
			mh: number,
		}
	} = {};
	for(let item of rects) {
		let prefix = cleanPrefix(item.name);
		if(isNullOrUndefined(maxSizes[prefix])) {
			maxSizes[prefix] = {
				mw: -Infinity,
				mh: -Infinity,
			};
		}

		maxSizes[prefix].mw = Math.max(item.sourceSize.w, maxSizes[prefix].mw);
		maxSizes[prefix].mh = Math.max(item.sourceSize.h, maxSizes[prefix].mh);
	}

	for(let item of rects) {
		let prefix = cleanPrefix(item.name);

		item.sourceSize.mw = maxSizes[prefix].mw;
		item.sourceSize.mh = maxSizes[prefix].mh;
	}
}
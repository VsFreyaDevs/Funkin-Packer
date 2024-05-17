import { LoadedImages } from "types";

type Callback<T> = (...args: T[]) => void;

class TypedObserver<T> {
	private _callbacks: Array<{callback: Callback<T>, context?: any}> = [];

	constructor() {}

	on(callback: Callback<T>, context?: any) {
		this._callbacks.push({callback, context});
	}

	off(callback: Callback<T>, context?: any) {
		let index = this._callbacks.findIndex(item => item.callback === callback && item.context === context);
		if (index >= 0) {
			this._callbacks.splice(index, 1);
		}
	}

	emit(...args: T[]) {
		for (let callback of this._callbacks) {
			Function.prototype.apply.call(callback.callback, callback.context, args);
		}
	}
}

export default {
	imagesListChanged: new TypedObserver<LoadedImages>(),
};
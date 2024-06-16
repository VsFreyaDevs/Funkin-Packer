type Callback<T> = (...args: T[]) => void;

class TypedObserver<T, FUNC extends Function = Callback<T>> {
	private _callbacks: Array<{callback: FUNC, context?: ThisType<FUNC>}> = [];

	constructor() {}

	on(callback: FUNC, context?: ThisType<FUNC>) {
		this._callbacks.push({callback, context});
	}

	off(callback: FUNC, context?: ThisType<FUNC>) {
		const index = this._callbacks.findIndex(item => item.callback === callback && item.context === context);
		if (index >= 0) {
			this._callbacks.splice(index, 1);
		}
	}

	emit(...args: T[]) {
		for (const callback of this._callbacks) {
			Function.prototype.apply.call(callback.callback, callback.context, args);
		}
	}
}

export default TypedObserver;
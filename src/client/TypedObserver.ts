import type { SelectedEvent } from "types";
import type { ButtonData } from "./ui/MessageBox";
import type { RepackInfoEvent, StatsInfoEvent } from "./ui/StatsInfo";
import type { LoadedImages, PackOptions } from "api/types";

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

export default {
	imagesListChanged: new TypedObserver<Readonly<LoadedImages>>(),
	imagesListSelectedChanged: new TypedObserver<Readonly<string>[]>(),
	siUnitsChanged: new TypedObserver<Readonly<number>>(),
	statsInfoUpdated: new TypedObserver<Readonly<StatsInfoEvent>>(),
	packComplete: new TypedObserver<Readonly<StatsInfoEvent>>(),
	packOptionsChanged: new TypedObserver<Readonly<PackOptions>>(),
	packExporterChanged: new TypedObserver<Readonly<PackOptions>>(),
	showMessage: new TypedObserver<Readonly<string | ButtonData[]>, (content: string, buttons?: ButtonData[]) => void>(),
	imageSelected: new TypedObserver<Readonly<SelectedEvent>>(),
	changeLanguage: new TypedObserver<Readonly<string>>(),
	storedOrderChanged: new TypedObserver<Readonly<string>[]>(),
	repackInfo: new TypedObserver<Readonly<RepackInfoEvent> | null>(),
};
import { LoadedImages, PackOptions, PackResultsData, SelectedEvent } from "types";
import { ButtonData } from "./ui/MessageBox";
import { RepackInfoEvent } from "./ui/StatsInfo";

type Callback<T> = (...args: T[]) => void;

class TypedObserver<T, FUNC = Callback<T>> {
	private _callbacks: Array<{callback: FUNC, context?: any}> = [];

	constructor() {}

	on(callback: FUNC, context?: any) {
		this._callbacks.push({callback, context});
	}

	off(callback: FUNC, context?: any) {
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
	imagesListChanged: new TypedObserver<LoadedImages>(),
	imagesListSelectedChanged: new TypedObserver<string[]>(),
	siUnitsChanged: new TypedObserver<number>(),
	statsInfoUpdated: new TypedObserver<{
		packResults: PackResultsData[]
	}>(),
	packComplete: new TypedObserver<PackResultsData[]>(),
	packOptionsChanged: new TypedObserver<PackOptions>(),
	packExporterChanged: new TypedObserver<PackOptions>(),
	showMessage: new TypedObserver<string | ButtonData[], (content: string, buttons?: ButtonData[]) => void>(),
	imageSelected: new TypedObserver<SelectedEvent>(),
	changeLanguage: new TypedObserver<string>(),
	storedOrderChanged: new TypedObserver<string[]>(),
	repackInfo: new TypedObserver<RepackInfoEvent>(),
};
import type { SelectedEvent } from "types";
import type { ButtonData } from "./ui/MessageBox";
import type { RepackInfoEvent, StatsInfoEvent } from "./ui/StatsInfo";
import type { LoadedImages, PackOptions } from "api/types";

import TypedObserver from "api/TypedObserver";
import type { Language } from "./locale/languages";

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
	changeLanguage: new TypedObserver<Readonly<Language>>(),
	storedOrderChanged: new TypedObserver<Readonly<string>[]>(),
	repackInfo: new TypedObserver<Readonly<RepackInfoEvent> | null>(),
};
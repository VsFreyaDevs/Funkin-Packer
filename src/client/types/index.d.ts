import type { Rect } from "api/types";
import TextureRenderer from "client/utils/TextureRenderer";


declare type PackResultsData = {
	data: Rect[];
	buffer: HTMLCanvasElement;
	renderer: TextureRenderer;
};

declare type MessageBoxData = {
	description: string;
};

declare type SelectedEvent = {
	isFolder: boolean,
	path: string,
	ctrlKey: boolean,
	shiftKey: boolean
};

declare type FileData = {
	name: string;
	content: string;
	base64: boolean;
};
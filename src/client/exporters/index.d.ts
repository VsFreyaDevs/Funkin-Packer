import { PackOptions, Rect } from 'types';
import * as list from './list.json';

declare type Exporter = {
	type: string;
	description: string;
	allowTrim: boolean;
	allowRotation: boolean;
	template: string;
	fileExt: string;
	predefined?: boolean;
	content?: string;
};

declare function getExporterByType(type: string): Exporter;

declare function startExporter(exporter: Exporter, data: Rect[], options: PackOptions): Promise<string>;

export {getExporterByType, startExporter};
export default list;
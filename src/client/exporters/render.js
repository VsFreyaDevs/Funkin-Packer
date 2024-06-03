import mustache from 'mustache';
import wax from '@jvitela/mustache-wax';

wax(mustache);

mustache.Formatters = {
	add: (v1, v2) => v1 + v2,
	subtract: (v1, v2) => v1 - v2,
	multiply: (v1, v2) => v1 * v2,
	divide: (v1, v2) => v1 / v2,
	offsetLeft: (start, size1, size2) => {
		let x1 = start + size1 / 2;
		let x2 = size2 / 2;
		return x1 - x2;
	},
	offsetRight: (start, size1, size2) => {
		let x1 = start + size1 / 2;
		let x2 = size2 / 2;
		return x2 - x1;
	},
	negate: (v1) => -v1,
	mirror: (start, size1, size2) => size2 - start - size1,
	escapeName: (name) => name.replace(/%/g, "%25").replace(/#/g, "%23").replace(/:/g, "%3A").replace(/;/g, "%3B").replace(/\\/g, "-").replace(/\//g, "-")
};

/**
 * @param {Exporter} exporter
 * @param {TemplateSettings} renderOptions
 * @param {(value: string | PromiseLike<string>) => void} resolve
 * @param {(value: string | PromiseLike<string>) => void} reject
 */
export default function finishExporter(exporter, renderOptions, resolve, reject) {
	try {
		let ret = mustache.render(exporter.content, renderOptions);
		resolve(ret);
	}
	catch(e) {
		reject(e.message);
	}
}
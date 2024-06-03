import { sendGet } from './ajax';
import { isNullOrUndefined } from './common';

type ParserFunction = (data: string) => Record<string, string>;

interface I18Config {
	currentLocale: string;
	supportedLanguages: string[];
	strings: Record<string, string>;
	path: string;
	iniPrefix: string;
	iniExt: string;
	iniSeparator: string;
	parser: ParserFunction | null;
}

class I18 {
	private static config: I18Config = {
		currentLocale: "en",
		supportedLanguages: ["en"],
		strings: {},
		path: "localization",
		iniPrefix: "",
		iniExt: "csv",
		iniSeparator: ";",
		parser: null,
	};

	static get currentLocale(): string {
		return this.config.currentLocale;
	}

	static set currentLocale(val: string) {
		this.config.currentLocale = val;
	}

	static get supportedLanguages(): string[] {
		return this.config.supportedLanguages;
	}

	static set supportedLanguages(val: string[]) {
		this.config.supportedLanguages = val;
	}

	static get strings(): Record<string, string> {
		return this.config.strings;
	}

	static set strings(val: Record<string, string>) {
		this.config.strings = val;
	}

	static get path(): string {
		return this.config.path;
	}

	static set path(val: string) {
		this.config.path = val;
	}

	static get iniPrefix(): string {
		return this.config.iniPrefix;
	}

	static set iniPrefix(val: string) {
		this.config.iniPrefix = val;
	}

	static get iniExt(): string {
		return this.config.iniExt;
	}

	static set iniExt(val: string) {
		this.config.iniExt = val;
	}

	static get iniSeparator(): string {
		return this.config.iniSeparator;
	}

	static set iniSeparator(val: string) {
		this.config.iniSeparator = val;
	}

	static get parser(): ParserFunction | null {
		return this.config.parser;
	}

	static set parser(val: ParserFunction | null) {
		this.config.parser = val;
	}

	static init(locale: string | null = null): void {
		const lang = navigator.language || "";
		if (!locale) locale = lang.substr(0, 2);
		if (this.config.supportedLanguages.indexOf(locale) < 0) {
			locale = this.config.supportedLanguages[0];
		}
		this.currentLocale = locale;
	}

	static parse(data: string): Record<string, string> {
		const strings: Record<string, string> = {};

		if (this.config.parser) {
			return this.config.parser(data);
		} else {
			const parts = data.split("\n");
			for (const part of parts) {
				const keyVal = part.split(this.config.iniSeparator);
				if (keyVal[0].trim()) {
					strings[keyVal[0].trim()] = keyVal[1].trim().replace(/\\n/g, "\n");
				}
			}
		}

		return strings;
	}

	static load(callback: () => void): void {
		const url = `${this.config.path}/${this.config.iniPrefix}${this.currentLocale}.${this.config.iniExt}?v=${Date.now()}`;
		sendGet(url, null, data => {
			this.setup(this.parse(data));
			if (callback) callback();
		});
	}

	static setup(data: Record<string, string>): void {
		this.strings = data;
	}

	static arrayAntidot(values: any): any {
		if (!values)
			return null;
		if (values.length > 0 && Array.isArray(values[0]))
			return values[0];
		return values;
	}

	static getString(key: string, values?: any): string {
		if (typeof values === "undefined") values = null;

		const str = this.getStringOrNull(key, values);
		if (str === null) return `{${key}}`;

		return str;
	}

	static getStringOrNull(key: string, args: any): string | null {
		if (isNullOrUndefined(args)) return null;

		let value = this.config.strings[key];
		if (isNullOrUndefined(value)) return null;

		args = [value].concat(this.arrayAntidot(args));
		return this.sprintf(...args);
	}

	static f(key: string, ...values: any[]): string {
		return this.getString(key, values);
	}

	static s(prefix: string, key: string, values: any): string {
		if (!Array.isArray(values)) values = [values];
		return this.getString(`${prefix}_${key}`, this.arrayAntidot(values));
	}

	static sf(key: string, suffix: string, values: any): string {
		return this.getString(`${key}_${suffix}`, this.arrayAntidot(values));
	}

	static psf(prefix: string, key: string, suffix: string, values: any): string {
		return this.getString(`${prefix}_${key}_${suffix}`, this.arrayAntidot(values));
	}

	static sprintf(...values: any[]): string {
		const regex = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
		let i = 0;
		const format = values[i++];

		const pad = (str: string, len: number, chr: string = ' ', leftJustify: boolean): string => {
			const padding = str.length >= len ? '' : new Array(1 + len - str.length >>> 0).join(chr);
			return leftJustify ? str + padding : padding + str;
		};

		const justify = (value: string, prefix: string, leftJustify: boolean, minWidth: number, zeroPad: boolean, customPadChar: string): string => {
			const diff = minWidth - value.length;
			if (diff > 0) {
				if (leftJustify || !zeroPad) value = pad(value, minWidth, customPadChar, leftJustify);
				else value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
			}
			return value;
		};

		const formatBaseX = (num: number, base: number, prefix: boolean, leftJustify: boolean, minWidth: number, precision: number, zeroPad: boolean, customPadChar: string): string => {
			const prefixStr = prefix && num && { '2': '0b', '8': '0', '16': '0x' }[base] || '';
			const formattedValue = prefixStr + pad(num.toString(base), precision || 0, '0', false);
			return justify(formattedValue, prefixStr, leftJustify, minWidth, zeroPad, customPadChar);
		};

		const formatString = (value: string, leftJustify: boolean, minWidth: number, precision: number, zeroPad: boolean, customPadChar: string): string => {
			if (precision != null)
				value = value.slice(0, precision);
			return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
		};

		const doFormat = (substring: string, valueIndex: string, flags: string, minWidth: string, _: string, prec: string, type: string): string => {
			if (substring === '%%') return '%';

			let leftJustify = false;
			let positivePrefix = '';
			let zeroPad = false;
			let prefixBaseX = false;
			let customPadChar = ' ';
			for (const flag of flags) {
				switch (flag) {
					case ' ':
						positivePrefix = ' ';
						break;
					case '+':
						positivePrefix = '+';
						break;
					case '-':
						leftJustify = true;
						break;
					case "'":
						customPadChar = flag;
						break;
					case '0':
						zeroPad = true;
						customPadChar = '0';
						break;
					case '#':
						prefixBaseX = true;
						break;
				}
			}

			let minimumWidth = 0;

			if (!minWidth) minimumWidth = 0;
			else if (minWidth === '*') minimumWidth = +values[i++];
			else if (minWidth.charAt(0) === '*') minimumWidth = +values[+minWidth.slice(1, -1)];
			else minimumWidth = +minWidth;

			if (minimumWidth < 0) {
				minimumWidth = -minimumWidth;
				leftJustify = true;
			}

			if (!isFinite(minimumWidth)) {
				throw new Error('sprintf: (minimum-)width must be finite');
			}

			let precision = 0;

			if (!prec) precision = 'fFeE'.includes(type) ? 6 : type === 'd' ? 0 : undefined;
			else if (prec === '*') precision = +values[i++];
			else if (prec.charAt(0) === '*') precision = +values[+prec.slice(1, -1)];
			else precision = +prec;

			let value = valueIndex ? values[+valueIndex.slice(0, -1) - 1] : values[i++];
			let number = +value || 0;

			const prefix = number < 0 ? '-' : positivePrefix;

			switch (type) {
				case 's':
					return formatString(String(value), leftJustify, minimumWidth, precision, zeroPad, customPadChar);
				case 'c':
					return formatString(String.fromCharCode(+value), leftJustify, minimumWidth, precision, zeroPad, customPadChar);
				case 'b':
					return formatBaseX(value, 2, prefixBaseX, leftJustify, minimumWidth, precision, zeroPad, customPadChar);
				case 'o':
					return formatBaseX(value, 8, prefixBaseX, leftJustify, minimumWidth, precision, zeroPad, customPadChar);
				case 'x':
					return formatBaseX(value, 16, prefixBaseX, leftJustify, minimumWidth, precision, zeroPad, customPadChar);
				case 'X':
					return formatBaseX(value, 16, prefixBaseX, leftJustify, minimumWidth, precision, zeroPad, customPadChar).toUpperCase();
				case 'u':
					return formatBaseX(value, 10, prefixBaseX, leftJustify, minimumWidth, precision, zeroPad, customPadChar);
				case 'i':
				case 'd':
					number = Math.round(number - number % 1);
					const absValue = Math.abs(number).toString();
					value = prefix + pad(absValue, precision, '0', false);
					return justify(value, prefix, leftJustify, minimumWidth, zeroPad, customPadChar);
				case 'e':
				case 'E':
				case 'f':
				case 'F':
				case 'g':
				case 'G':
					type Method = 'toExponential' | 'toFixed' | 'toPrecision';
					type Transform = 'toString' | 'toUpperCase';
					let method = (['toExponential', 'toFixed', 'toPrecision'] as Method[])['efg'.indexOf(type.toLowerCase())];
					let textTransform = (['toString', 'toUpperCase'] as Transform[])['eEfFgG'.indexOf(type) % 2];
					value = prefix + Math.abs(number)[method](precision);
					return justify(value, prefix, leftJustify, minimumWidth, zeroPad, customPadChar)[textTransform]();
				default:
					return substring;
			}
		};

		return format.replace(regex, doFormat);
	}
}

export default I18;

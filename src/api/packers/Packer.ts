import type { Rect } from "api/types";

export type MethodList = Readonly<Record<string, string>>;

export type PackerClass = {
	readonly packerName: string,
	readonly methods: MethodList,
	readonly defaultMethod: string,
	getMethodProps(name:string): {name: string, description: string},
	needsNonRotation(): boolean,
	new(width: number, height: number, allowRotate?: boolean, padding?: number):Packer
};

export type PackerCombo = Readonly<{
	packerClass: PackerClass,
	packerMethod: string,
	allowRotation: boolean
}>;

const METHODS = {
	Default: "Default"
} as const;

class Packer {
	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		// nothing to do
	}

	pack(_data:Rect[], _method:string):Rect[] {
		throw Error("Abstract method. Override it.");
	}

	static get packerName() {
		return "Default";
	}

	static get defaultMethod():string {
		return METHODS.Default;
	}

	static get methods():MethodList {
		return METHODS;
	}

	static needsNonRotation(): boolean {
		return true;
	}

	static getMethodProps(id:string) {
		return {name: "Default", description: "Default placement"};
	}
}

export default Packer;
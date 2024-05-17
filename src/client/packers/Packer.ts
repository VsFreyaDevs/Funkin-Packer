import { Rect } from "types";

export type MethodList = {
	[key:string]: string
};

export type PackerClass = {
	packerName: string,
	methods: MethodList,
	getMethodProps(): {name: string, description: string},
	new(width: number, height: number, allowRotate?: boolean, padding?: number):Packer
};

const METHOD:MethodList = {
	Default: "Default"
};

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

	static get methods():MethodList {
		return METHOD;
	}

	static getMethodProps(id:string='') {
		return {name: "Default", description: "Default placement"};
	}
}

export default Packer;
import { Rect } from "types";
import Packer, { MethodList } from "./Packer";

const METHODS = {
	Automatic: "Automatic"
} as const;

class OptimalPacker extends Packer {
	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		super(width, height, allowRotate, padding);
	}

	pack(_data:Rect[], _method:string):Rect[] {
		throw new Error('OptimalPacker is a dummy and cannot be used directly');
	}

	static get packerName() {
		return "OptimalPacker";
	}

	static get defaultMethod():string {
		return METHODS.Automatic;
	}

	static get methods():MethodList {
		return METHODS;
	}

	static getMethodProps(id:string='') {
		switch(id) {
			case METHODS.Automatic:
				return {name: "Automatic", description: ""};
			default:
				throw Error("Unknown method " + id);
		}
	}
}

export default OptimalPacker;
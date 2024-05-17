import { Rect } from "types";
import Packer, { MethodList } from "./Packer";

const METHOD = {
	Automatic: "Automatic"
};

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

	static get methods():MethodList {
		return METHOD;
	}

	static getMethodProps(id:string='') {
		switch(id) {
			case METHOD.Automatic:
				return {name: "Automatic", description: ""};
			default:
				throw Error("Unknown method " + id);
		}
	}
}

export default OptimalPacker;
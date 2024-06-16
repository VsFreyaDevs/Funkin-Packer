import type { Rect } from "api/types";
import Packer, { type MethodList } from "./Packer";

const METHODS = {
	Automatic: "Automatic"
} as const;

type MethodType = typeof METHODS[keyof typeof METHODS];

class OptimalPacker extends Packer {
	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		super(width, height, allowRotate, padding);
	}

	override pack(_data:Rect[], _method:MethodType):Rect[] {
		throw new Error('OptimalPacker is a dummy and cannot be used directly');
	}

	static override get packerName() {
		return "OptimalPacker";
	}

	static override get defaultMethod():MethodType {
		return METHODS.Automatic;
	}

	static override get methods():MethodList {
		return METHODS;
	}

	static override needsNonRotation(): boolean {
		return true;
	}

	static override getMethodProps(id:MethodType) {
		switch(id) {
			case METHODS.Automatic:
				return {name: "Automatic", description: ""};
			default:
				throw Error("Unknown method " + id);
		}
	}
}

export default OptimalPacker;
import { MaxRectsPacker as MaxRectsPackerEngine, PACKING_LOGIC, type IRectangle } from "maxrects-packer";
import type { Rect } from "types";
import Packer, { type MethodList } from "./Packer";

const METHODS = {
	Smart: "Smart",
	SmartArea: "SmartArea",
	Square: "Square",
	SquareArea: "SquareArea",
	SmartSquare: "SmartSquare",
	SmartSquareArea: "SmartSquareArea"
} as const;

type MethodType = typeof METHODS[keyof typeof METHODS];

interface Rectangle extends IRectangle {
	data: Rect;
	rot: boolean;
}

class MaxRectsPacker extends Packer {
	binWidth: number;
	binHeight: number;
	allowRotate: boolean;
	padding: number;

	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		super(width, height, allowRotate, padding);

		this.binWidth = width;
		this.binHeight = height;
		this.allowRotate = allowRotate;
		this.padding = padding;
	}

	override pack(data: Rect[], method: MethodType) {
		const options = {
			smart: (method === METHODS.Smart || method === METHODS.SmartArea || method === METHODS.SmartSquare || method === METHODS.SmartSquareArea),
			pot: false,
			square: (method === METHODS.Square || method === METHODS.SquareArea || method === METHODS.SmartSquare || method === METHODS.SmartSquareArea),
			allowRotation: this.allowRotate,
			logic: (method === METHODS.Smart || method === METHODS.Square || method === METHODS.SmartSquare) ? PACKING_LOGIC.MAX_EDGE : PACKING_LOGIC.MAX_AREA
		} as const;

		const packer = new MaxRectsPackerEngine<Rectangle>(this.binWidth, this.binHeight, this.padding, options);

		const input:Rectangle[] = [];

		for (const item of data) {
			input.push({ x: 0, y: 0, width: item.frame.w, height: item.frame.h, data: item, rot: false });
		}

		packer.addArray(input);

		const bin = packer.bins[0];
		if(!bin) {
			return [];
		}
		const rects = bin.rects;

		const res = [];

		for (const item of rects) {
			if(!item) {
				continue;
			}
			item.data.frame.x = item.x;
			item.data.frame.y = item.y;
			if (item.rot) {
				item.data.rotated = true;
			}
			res.push(item.data);
		}

		return res;
	}

	static override get packerName() {
		return "MaxRectsPacker";
	}

	static override get defaultMethod():MethodType {
		return METHODS.Smart;
	}

	static override get methods():MethodList {
		return METHODS;
	}

	static override needsNonRotation(): boolean {
		return true;
	}

	static override getMethodProps(id:MethodType) {
		switch (id) {
			case METHODS.Smart:
				return { name: "Smart edge logic", description: "" };
			case METHODS.SmartArea:
				return { name: "Smart area logic", description: "" };
			case METHODS.Square:
				return { name: "Square edge logic", description: "" };
			case METHODS.SquareArea:
				return { name: "Square area logic", description: "" };
			case METHODS.SmartSquare:
				return { name: "Smart square edge logic", description: "" };
			case METHODS.SmartSquareArea:
				return { name: "Smart square area logic", description: "" };
			default:
				throw Error("Unknown method " + id);
		}
	}
}

export default MaxRectsPacker;
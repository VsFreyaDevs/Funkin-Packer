let MaxRectsPackerEngine = require("maxrects-packer").MaxRectsPacker;
let PACKING_LOGIC = require("maxrects-packer").PACKING_LOGIC;

import { Rect } from "types";
import Packer, { MethodList } from "./Packer";

const METHODS = {
	Smart: "Smart",
	SmartArea: "SmartArea",
	Square: "Square",
	SquareArea: "SquareArea",
	SmartSquare: "SmartSquare",
	SmartSquareArea: "SmartSquareArea"
};

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

	pack(data: Rect[], method: string) {
		let options = {
			smart: (method === METHODS.Smart || method === METHODS.SmartArea || method === METHODS.SmartSquare || method === METHODS.SmartSquareArea),
			pot: false,
			square: (method === METHODS.Square || method === METHODS.SquareArea || method === METHODS.SmartSquare || method === METHODS.SmartSquareArea),
			allowRotation: this.allowRotate,
			logic: (method === METHODS.Smart || method === METHODS.Square || method === METHODS.SmartSquare) ? PACKING_LOGIC.MAX_EDGE : PACKING_LOGIC.MAX_AREA
		};

		let packer = new MaxRectsPackerEngine(this.binWidth, this.binHeight, this.padding, options);

		let input = [];

		for (let item of data) {
			input.push({ width: item.frame.w, height: item.frame.h, data: item });
		}

		packer.addArray(input);

		let bin = packer.bins[0];
		let rects = bin.rects;

		let res = [];

		for (let item of rects) {
			item.data.frame.x = item.x;
			item.data.frame.y = item.y;
			if (item.rot) {
				item.data.rotated = true;
			}
			res.push(item.data);
		}

		return res;
	}

	static get packerName() {
		return "MaxRectsPacker";
	}

	static get defaultMethod():string {
		return METHODS.Smart;
	}

	static get methods():MethodList {
		return METHODS;
	}

	static getMethodProps(id:string = '') {
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
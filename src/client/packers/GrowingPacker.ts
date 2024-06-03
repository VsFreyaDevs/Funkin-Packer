import { Rect } from "types";
import Packer, { MethodList } from "./Packer";

// Based of https://github.com/jakesgordon/bin-packing/blob/master/js/packer.growing.js

const METHODS = {
	Sorted: "Sorted",
	SortedHeight: "SortedHeight",
	SortedWidth: "SortedWidth",
	SortedArea: "SortedArea",
	Unsorted: "Unsorted"
} as const;

type Block = {
	w: number,
	h: number,
	rect: Rect,
	fit?: Node
}

type Node = {
	x: number,
	y: number,
	w: number,
	h: number,
	used?: boolean,
	down?: Node,
	right?: Node
}

// TODO: add rotation
class GrowingPacker extends Packer {
	root: Node;

	allowRotate: boolean;
	padding: number;
	width: number;
	height: number;

	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		// nothing to do
		super(width, height, allowRotate, padding);

		this.allowRotate = allowRotate;
		this.padding = padding;
		this.width = width;
		this.height = height;
	}

	static get defaultMethod():string {
		return METHODS.Sorted;
	}

	pack(_data:Rect[], _method:string):Rect[] {
		const blocks:Block[] = [];
		for (let i = 0; i < _data.length; i++) {
			const block:Block = {
				w: _data[i].frame.w,
				h: _data[i].frame.h,
				rect: _data[i]
			};
			blocks.push(block);
		}

		if(_method == METHODS.Sorted)
			blocks.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
		if(_method == METHODS.SortedHeight)
			blocks.sort((a, b) => b.h - a.h);
		if(_method == METHODS.SortedWidth)
			blocks.sort((a, b) => b.w - a.w);
		if(_method == METHODS.SortedArea)
			blocks.sort((a, b) => (b.w * b.h) - (a.w * a.h));
		//blocks.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));

		//blocks.sort((a, b) => (a.rect.frame.w * a.rect.frame.h) - (b.rect.frame.w * b.rect.frame.h));
		//console.log("GrowingPacker: blocks", blocks);

		const len = blocks.length;
		let padding = this.padding;
		const w = len > 0 ? blocks[0].w + padding : 0;
		const h = len > 0 ? blocks[0].h + padding : 0;
		this.root = { x: 0, y: 0, w: w, h: h };
		for(let block of blocks) {
			let node = this.findNode(this.root, block.w + padding, block.h + padding);
			if (node !== null)
				block.fit = this.splitNode(node, block.w + padding, block.h + padding);
			else
				block.fit = this.growNode(block.w + padding, block.h + padding);
		}

		const rects:Rect[] = [];

		for(let block of blocks) {
			if(block.fit === null) continue;
			block.rect.frame.x = block.fit.x;
			block.rect.frame.y = block.fit.y;
			block.fit.w -= padding;
			block.fit.h -= padding;
			//if(block.rect.frame.w !== block.fit.w || block.rect.frame.h !== block.fit.h)
			//	console.log("GrowingPacker: rect.frame.w !== fit.w || rect.frame.h !== fit.h", block.rect.frame, block.fit);
			rects.push(block.rect);
		}

		return rects;
	}

	findNode = (root:Node, w:number, h:number):Node => {
		if (root.used)
			return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
		if ((w <= root.w) && (h <= root.h))
			return root;
		return null;
	}

	splitNode = (node:Node, w:number, h:number) => {
		node.used = true;
		node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
		node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
		return node;
	}

	growNode = (w:number, h:number) => {
		const canGrowDown  = (w <= this.root.w);
		const canGrowRight = (h <= this.root.h);

		const shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
		const shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height

		if (shouldGrowRight)
			return this.growRight(w, h);
		if (shouldGrowDown)
			return this.growDown(w, h);
		if (canGrowRight)
			return this.growRight(w, h);
		if (canGrowDown)
			return this.growDown(w, h);
		return null;

		//return null; // need to ensure sensible root starting size to avoid this happening
	}

	growRight = (w:number, h:number) => {
		this.root = {
			used: true,
			x: 0,
			y: 0,
			w: this.root.w + w,
			h: this.root.h,
			down: this.root,
			right: { x: this.root.w, y: 0, w: w, h: this.root.h }
		};
		let node = this.findNode(this.root, w, h)
		if (node !== null)
			return this.splitNode(node, w, h);
		return null;
	}

	growDown = (w:number, h:number) => {
		this.root = {
			used: true,
			x: 0,
			y: 0,
			w: this.root.w,
			h: this.root.h + h,
			down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
			right: this.root
		};
		let node = this.findNode(this.root, w, h);
		if (node !== null)
			return this.splitNode(node, w, h);
		return null;
	}

	static get packerName() {
		return "GrowingPacker";
	}

	static get methods():MethodList {
		return METHODS;
	}

	static needsNonRotation(): boolean {
		return true;
	}

	static getMethodProps(id:string='') {
		return {name: "Default", description: "Default placement"};
	}
}

export default GrowingPacker;
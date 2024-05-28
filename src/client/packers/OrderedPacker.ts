import { Rect } from "types";
import Packer, { MethodList } from "./Packer";

const METHODS = {
	SortedAreaDsc: "SortedAreaDsc",
	SortedAreaAsc: "SortedAreaAsc",
	Unsorted: "Unsorted",
} as const;

type Block = {
	x?: number,
	y?: number,
	w: number,
	h: number,
	rect: Rect,
	rotated?: boolean,
}

function calculateArea(blocks:Block[]) {
	var rightBound = 0;
	var bottomBound = 0;
	for(let block of blocks) {
		rightBound = Math.max(rightBound, block.x + block.w);
		bottomBound = Math.max(bottomBound, block.y + block.h);
	}
	return (rightBound) * (bottomBound);
}

class OrderedPacker extends Packer {
	allowRotate: boolean;
	padding: number;

	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		// nothing to do
		super(width, height, allowRotate, padding);

		this.allowRotate = allowRotate;
		this.padding = padding;
	}

	pack(_data:Rect[], _method:string):Rect[] {
		let blocks = this._pack(_data, _method, false);
		if(this.allowRotate) {
			let new_blocks = this._pack(_data, _method, true);
			if(calculateArea(new_blocks) < calculateArea(blocks)) {
				blocks = new_blocks;
			}
		}

		let rects:Rect[] = [];

		for(let block of blocks) {
			block.rect.frame.x = block.x;
			block.rect.frame.y = block.y;
			//block.fit.w -= this.padding;
			//block.fit.h -= this.padding;
			block.rect.rotated = block.rotated ?? false;
			rects.push(block.rect);
		}

		return rects;
	}

	_pack(_data:Rect[], _method:String, rotated:boolean):Block[] {
		let blocks:Block[] = [];
		for (var i = 0; i < _data.length; i++) {
			let block:Block = {
				w: _data[i].frame.w,
				h: _data[i].frame.h,
				rect: _data[i]
			};
			blocks.push(block);
		}

		if(_method == METHODS.SortedAreaDsc)
			blocks.sort((a, b) => (b.rect.frame.w * b.rect.frame.h) - (a.rect.frame.w * a.rect.frame.h));
		if(_method == METHODS.SortedAreaAsc)
			blocks.sort((a, b) => (a.rect.frame.w * a.rect.frame.h) - (b.rect.frame.w * b.rect.frame.h));

		let tot_area = blocks.reduce((a, b) => a + b.w * b.h, 0);
		let estimated_sidelen = Math.pow(tot_area, 0.5);
		let avg_width = this._get_total_width(blocks) / blocks.length;

		let blocks_per_row = Math.floor(estimated_sidelen / avg_width);
		let width_per_row = blocks_per_row * avg_width;

		let curr_x = 0;
		let curr_y = 0;
		let current_max_height = 0;

		for (let i = 0; i < blocks.length; i++) {
			let bl = blocks[i];
			bl.x = curr_x;
			bl.y = curr_y;

			let shouldRotate = rotated && bl.w > bl.h && bl.w <= current_max_height;

			if(shouldRotate) {
				bl.rotated = true;
				var temp = bl.w;
				bl.w = bl.h;
				bl.h = temp;
			}

			curr_x += bl.w + this.padding;
			current_max_height = Math.max(current_max_height, bl.h);
			if(curr_x > width_per_row) {
				curr_x = 0;
				curr_y += current_max_height + this.padding;
				current_max_height = 0;
			}
		}
		return blocks;
	}

	_get_total_width(blocks: Block[]): number {
		let sum = 0;
		for(let block of blocks) {
			sum += block.w + this.padding;
		}
		return sum;
	}

	_get_total_height(blocks: Block[]): number {
		let sum = 0;
		for(let block of blocks) {
			sum += block.h;
		}
		return sum;
	}

	static get packerName() {
		return "OrderedPacker";
	}

	static get defaultMethod():string {
		return METHODS.SortedAreaDsc;
	}

	static get methods():MethodList {
		return METHODS;
	}

	static getMethodProps(id:string='') {
		switch(id) {
			case METHODS.SortedAreaAsc:
				return {name: "SortedAreaAsc", description: "Sorted placement"};
			case METHODS.Unsorted:
				return {name: "Unsorted", description: "Unsorted placement"};
			default:
				throw Error("Unknown method " + id);
		}
	}
}

export default OrderedPacker;
import type { Rect } from "api/types";
import Packer, { type MethodList } from "./Packer";

const METHODS = {
	SortedAreaDsc: "SortedAreaDsc",
	SortedAreaAsc: "SortedAreaAsc",
	Unsorted: "Unsorted",
} as const;

type MethodType = typeof METHODS[keyof typeof METHODS];

type Block = {
	x: number,
	y: number,
	w: number,
	h: number,
	rect: Rect,
	rotated?: boolean,
}

function calculateArea(blocks:Block[] | null) {
	if(!blocks) return 0;
	if(blocks.length === 0) return 0;
	let rightBound = 0;
	let bottomBound = 0;
	for(const block of blocks) {
		rightBound = Math.max(rightBound, block.x + block.w);
		bottomBound = Math.max(bottomBound, block.y + block.h);
	}
	return rightBound * bottomBound;
}

class OrderedPacker extends Packer {
	allowRotate: boolean;
	padding: number;
	width: number;
	height: number;

	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		// nothing to do
		super(width, height, allowRotate, padding);

		this.width = width;
		this.height = height;
		this.allowRotate = allowRotate;
		this.padding = padding;
	}

	override pack(_data:Rect[], _method:MethodType):Rect[] {
		let blocks:Block[] | null = null;
		let currentBest:number = -1;
		let currentLength = Number.NEGATIVE_INFINITY;
		function setBest(bb:Block[] | null) {
			if(bb != null) {
				blocks = bb;
				currentBest = calculateArea(bb);
				currentLength = bb.length;
				//console.log("setBest", calculateWidth(bb), calculateHeight(bb), currentBest);
			}
		}

		let new_blocks = this._pack(_data, _method, false);
		if(blocks == null || new_blocks != null && calculateArea(new_blocks) < currentBest) {
			setBest(new_blocks);
		}
		if(this.allowRotate) {
			let new_blocks = this._pack(_data, _method, true);
			if(blocks == null || new_blocks != null && calculateArea(new_blocks) < currentBest) {
				setBest(new_blocks);
			}
		}
		if(blocks == null) {
			let new_blocks = this._pack(_data, _method, false, true);
			setBest(new_blocks);
			if(this.allowRotate) {
				let new_blocks = this._pack(_data, _method, true, true);
				if(new_blocks != null && calculateArea(new_blocks) <= currentBest && new_blocks.length > currentLength) {
					// fits more blocks in the same or less size
					blocks = new_blocks;
				}
			}
			if(blocks == null) {
				throw new Error("No blocks found");
			}
		}
		//let blocks = this._pack(_data, _method, this.allowRotate);

		const rects:Rect[] = [];

		for(const block of blocks) {
			block.rect.frame.x = block.x;
			block.rect.frame.y = block.y;
			//block.fit.w -= this.padding;
			//block.fit.h -= this.padding;
			block.rect.rotated = block.rotated ?? false;
			rects.push(block.rect);
		}

		return rects;
	}

	private _pack(_data:Rect[], _method:MethodType, rotated:boolean, stopWhenFull:boolean = false):Block[] | null {
		const blocks:Block[] = [];
		for(const rect of _data) {
			blocks.push({
				x: 0,
				y: 0,
				w: rect.frame.w,
				h: rect.frame.h,
				rect: rect
			});
		}

		if(_method == METHODS.SortedAreaDsc)
			blocks.sort((a, b) => (b.rect.frame.w * b.rect.frame.h) - (a.rect.frame.w * a.rect.frame.h));
		if(_method == METHODS.SortedAreaAsc)
			blocks.sort((a, b) => (a.rect.frame.w * a.rect.frame.h) - (b.rect.frame.w * b.rect.frame.h));

		const tot_area = blocks.reduce((a, b) => a + b.w * b.h, 0);
		const estimated_sidelen = Math.pow(tot_area, 0.5);
		const avg_width = this._get_total_width(blocks) / blocks.length;

		const blocks_per_row = Math.floor(estimated_sidelen / avg_width);
		const width_per_row = blocks_per_row * avg_width;

		let curr_x = 0;
		let curr_y = 0;
		let current_max_height = 0;

		const packed_blocks:Block[] = [];

		for(const bl of blocks) {
			bl.x = curr_x;
			bl.y = curr_y;

			const shouldRotate = rotated && bl.w > bl.h && bl.w <= current_max_height;

			if(shouldRotate) {
				bl.rotated = true;
				const temp = bl.w;
				bl.w = bl.h;
				bl.h = temp;
			}

			let old_x = curr_x + bl.w;

			if(bl.x + bl.w > this.width || bl.y + bl.h > this.height) {
				return stopWhenFull ? packed_blocks : null;
			}

			curr_x += bl.w + this.padding;
			if(bl.h > current_max_height) {
				current_max_height = bl.h;
			}
			if(old_x > width_per_row || old_x > this.width) {
				curr_x = 0;
				curr_y += current_max_height + this.padding;
				current_max_height = 0;
			}

			packed_blocks.push(bl);
		}
		return packed_blocks;
	}

	private _get_total_width(blocks: Block[]): number {
		let sum = 0;
		for(const block of blocks) {
			sum += block.w + this.padding;
		}
		return sum;
	}

	private _get_total_height(blocks: Block[]): number {
		let sum = 0;
		for(const block of blocks) {
			sum += block.h;
		}
		return sum;
	}

	static override get packerName() {
		return "OrderedPacker";
	}

	static override get defaultMethod():MethodType {
		return METHODS.SortedAreaDsc;
	}

	static override get methods():MethodList {
		return METHODS;
	}

	static override needsNonRotation(): boolean {
		return false;
	}

	static override getMethodProps(id:MethodType) {
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
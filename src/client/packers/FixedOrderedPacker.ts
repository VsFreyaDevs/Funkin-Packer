import { Rect } from "types";
import Packer, { MethodList } from "./Packer";

const METHODS = {
	SortedAreaDsc: "SortedAreaDsc",
	SortedAreaAsc: "SortedAreaAsc",
	Unsorted: "Unsorted",
	AltSortedAreaDsc: "AltSortedAreaDsc",
	AltSortedAreaAsc: "AltSortedAreaAsc",
	AltUnsorted: "AltUnsorted",
	//SmartSortedAreaDsc: "SmartSortedAreaDsc",
	//SmartSortedAreaAsc: "SmartSortedAreaAsc",
	//SmartUnsorted: "SmartUnsorted",
} as const;

type Block = {
	x?: number,
	y?: number,
	w: number,
	h: number,
	rect: Rect,
	rotated?: boolean,
}

function calculateWidth(blocks: Block[]): number {
	let rightBound = 0;
	for(const block of blocks) {
		rightBound = Math.max(rightBound, block.x + block.w);
	}
	return rightBound;
}

function calculateHeight(blocks: Block[]): number {
	let bottomBound = 0;
	for (const block of blocks) {
		bottomBound = Math.max(bottomBound, block.y + block.h);
	}
	return bottomBound;
}

function calculateArea(blocks:Block[]) {
	let rightBound = 0;
	let bottomBound = 0;
	for(const block of blocks) {
		rightBound = Math.max(rightBound, block.x + block.w);
		bottomBound = Math.max(bottomBound, block.y + block.h);
	}
	return (rightBound) * (bottomBound);
}

function rotateBlock(block:Block) {
	block.rotated = !block.rotated;
	const temp = block.w;
	block.w = block.h;
	block.h = temp;
}

class FixedOrderedPacker extends Packer {
	allowRotate: boolean;
	padding: number;
	width: number;
	height: number;
	isSmart: boolean;
	isAlt: boolean;

	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		// nothing to do
		super(width, height, allowRotate, padding);

		this.width = width;
		this.height = height;
		this.allowRotate = allowRotate;
		this.padding = padding;
		this.isSmart = false;
		this.isAlt = false;
	}

	pack(_data:Rect[], _method:string):Rect[] {
		let method = _method;
		this.isSmart = false;
		this.isAlt = false;
		switch(method) {
			/*case METHODS.SmartSortedAreaDsc:
				this.isSmart = true;
				method = METHODS.SortedAreaDsc;
				break;
			case METHODS.SmartSortedAreaAsc:
				this.isSmart = true;
				method = METHODS.SortedAreaAsc;
				break;
			case METHODS.SmartUnsorted:
				this.isSmart = true;
				method = METHODS.Unsorted;
				break;*/
			case METHODS.AltSortedAreaDsc:
				this.isAlt = true;
				method = METHODS.SortedAreaDsc;
				break;
			case METHODS.AltSortedAreaAsc:
				this.isAlt = true;
				method = METHODS.SortedAreaAsc;
				break;
			case METHODS.AltUnsorted:
				this.isAlt = true;
				method = METHODS.Unsorted;
				break;
		}
		const originalWidth = this.width;
		const originalHeight = this.height;
		let blocks:Block[] = null;
		let currentBest:number = -1;
		function setBest(bb:Block[]) {
			if(bb == null) {
				return;
			}
			blocks = bb;
			currentBest = calculateArea(bb);
		}

		let alternate = false;
		let cw = 2;
		let ch = 2;
		while(!(cw < originalWidth && ch < originalHeight)) {
			if(alternate) {
				cw *= 1.5;
				cw = Math.floor(cw);
			} else {
				ch *= 1.5;
				ch = Math.floor(ch);
			}
			alternate = !alternate;

			this.width = Math.min(cw, originalWidth);
			this.height = Math.min(ch, originalHeight);

			let newBlocks = this._pack(_data, method, false);
			if(blocks == null || newBlocks != null && calculateArea(newBlocks) < currentBest) {
				setBest(newBlocks);
			}
			if(this.allowRotate) {
				let newBlocks = this._pack(_data, method, true);
				if(blocks == null || newBlocks != null && calculateArea(newBlocks) < currentBest) {
					setBest(newBlocks);
				}
			}
		}
		this.width = originalWidth;
		this.height = originalHeight;
		if(blocks == null) {
			setBest(this._pack(_data, method, false));
			if(this.allowRotate) {
				let newBlocks = this._pack(_data, method, true);
				if(blocks == null || newBlocks != null && calculateArea(newBlocks) < currentBest) {
					setBest(newBlocks);
				}
			}
		}
		if(blocks == null) {
			return [];
		}
		//let blocks = this._pack(_data, _method, this.allowRotate);

		const rects:Rect[] = [];

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

	_pack(_data:Rect[], _method:String, allowRotation:boolean):Block[] {
		const blocks:Block[] = [];
		for(const data of _data) {
			const block:Block = {
				w: data.frame.w,
				h: data.frame.h,
				rect: data
			};
			blocks.push(block);
		}

		if(_method == METHODS.SortedAreaDsc)
			blocks.sort((a, b) => (b.rect.frame.w * b.rect.frame.h) - (a.rect.frame.w * a.rect.frame.h));
		if(_method == METHODS.SortedAreaAsc)
			blocks.sort((a, b) => (a.rect.frame.w * a.rect.frame.h) - (b.rect.frame.w * b.rect.frame.h));

		let packedBlocks:Block[] = null;
		if(this.isAlt) {
			packedBlocks = this.packAlt(blocks, allowRotation);
		} else {
			packedBlocks = this.packNormal(blocks, allowRotation);
		}
		return packedBlocks;
	}

	packNormal(blocks: Block[], allowRotation: boolean): Block[] {
		let xPos = 0;
		let yPos = 0;
		let maxRowHeight = 0;

		let currentWidth = 0;
		let currentHeight = 0;

		let firstOfRow = true;

		const packedBlocks:Block[] = [];

		for(const bl of blocks) {
			const shouldRotate = allowRotation && bl.w > bl.h && bl.w <= maxRowHeight && !firstOfRow;
			firstOfRow = false;

			//const needsToGrow = (xPos + bl.w > currentWidth) || (yPos + bl.h > currentHeight);
			//if(this.isSmart && needsToGrow) {
			//	let result = this.findFree(bl, packedBlocks, currentWidth, currentHeight, allowRotation);
			//	if(result != null) {
			//		bl.x = result.x;
			//		bl.y = result.y;
			//		if(shouldRotate) {
			//			rotateBlock(bl);
			//		}
			//		continue;
			//	}
			//}

			if(shouldRotate) {
				rotateBlock(bl);
			}

			if(xPos + bl.w > this.width) {
				xPos = 0;
				yPos += maxRowHeight + this.padding;
				if(yPos + bl.h > this.height) {
					return null;
				}
				maxRowHeight = 0;
				firstOfRow = true;

				if(bl.rotated) {
					rotateBlock(bl);
				}
			}

			bl.x = xPos;
			bl.y = yPos;

			xPos += bl.w + this.padding;
			if(bl.h > maxRowHeight) {
				maxRowHeight = bl.h;
			}

			if(bl.x + bl.w > currentWidth) {
				currentWidth = bl.x + bl.w;
			}
			if(bl.y + bl.h > currentHeight) {
				currentHeight = bl.y + bl.h;
			}
			packedBlocks.push(bl);
		}
		return packedBlocks;
	}

	packAlt(blocks: Block[], allowRotation: boolean) {
		let xPos = 0;
		let yPos = 0;
		let maxRowHeight = 0;

		let firstOfRow = true;
		const packedBlocks:Block[] = [];
		for(const bl of blocks) {
			firstOfRow = false;
			let fitsNormally = (xPos + bl.w <= this.width) && (yPos + bl.h <= this.height);
			let fitsRotated = allowRotation && (xPos + bl.h <= this.width) && (yPos + bl.w <= this.height);

			if (!fitsNormally && !fitsRotated) {
				xPos = 0;
				yPos += maxRowHeight + this.padding;
				maxRowHeight = 0;
				firstOfRow = true;
			}

			fitsNormally = (xPos + bl.w <= this.width) && (yPos + bl.h <= this.height);
			fitsRotated = allowRotation && (xPos + bl.h <= this.width) && (yPos + bl.w <= this.height);

			if(fitsNormally && (!fitsRotated || bl.w <= bl.h)) {
				bl.rotated = false;
			} else if(fitsRotated) {
				bl.rotated = true;
				const temp = bl.w;
				bl.w = bl.h;
				bl.h = temp;
			}

			if(firstOfRow) {
				if(yPos + bl.h > this.height) {
					return null;
				}
			}

			bl.x = xPos;
			bl.y = yPos;
			xPos += bl.w + this.padding;
			if (bl.h > maxRowHeight) {
				maxRowHeight = bl.h;
			}
			packedBlocks.push(bl);
		}
		return packedBlocks;
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
		return "FixedOrderedPacker";
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

export default FixedOrderedPacker;
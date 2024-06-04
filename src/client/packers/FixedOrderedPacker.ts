import { type Rect } from "types";
import Packer, { type MethodList } from "./Packer";

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

type MethodType = typeof METHODS[keyof typeof METHODS];

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

function getMinimumSize(blocks: Rect[]) {
	let width = Number.POSITIVE_INFINITY;
	let height = Number.POSITIVE_INFINITY;
	for(const block of blocks) {
		if(block.frame.w < width) {
			width = block.frame.w;
		}
		if(block.frame.h < height) {
			height = block.frame.h;
		}
	}
	return {w: width, h: height};
}

function rotateBlock(block:Block) {
	block.rotated = !block.rotated;
	const temp = block.w;
	block.w = block.h;
	block.h = temp;
}

class FixedOrderedPacker extends Packer {
	readonly allowRotate: boolean;
	readonly padding: number;
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

	override pack(_data:Rect[], _method:MethodType):Rect[] {
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

		let sortedData = [..._data];
		if(method == METHODS.SortedAreaDsc)
			sortedData.sort((a, b) => (b.frame.w * b.frame.h) - (a.frame.w * a.frame.h));
		if(method == METHODS.SortedAreaAsc)
			sortedData.sort((a, b) => (a.frame.w * a.frame.h) - (b.frame.w * b.frame.h));

		const originalWidth = this.width;
		const originalHeight = this.height;
		let blocks:Block[] = null;
		let currentBest:number = -1;
		function setBest(bb:Block[]) {
			if(bb != null) {
				blocks = bb;
				currentBest = calculateArea(bb);
				//console.log("setBest", calculateWidth(bb), calculateHeight(bb), currentBest);
			}
		}

		const minSize = getMinimumSize(_data);

		const incW = 128;
		const incH = 128;

		for(let xx = minSize.w; xx < originalWidth; xx += incW) {
			for(let yy = minSize.h; yy < originalHeight; yy += incH) {
				this.width = xx;
				this.height = yy;
				let newBlocks = this._pack(sortedData, false);
				//console.log("width", this.width, "height", this.height, newBlocks != null ? newBlocks.length : 0, newBlocks != null ? calculateArea(newBlocks) : 0);
				//console.log("width", this.width, "height", this.height, newBlocks != null ? newBlocks.length : 0, newBlocks != null ? calculateArea(newBlocks) : 0);
				if(blocks == null || newBlocks != null && calculateArea(newBlocks) < currentBest) {
					setBest(newBlocks);
				}
				if(this.allowRotate) {
					let newBlocks = this._pack(sortedData, true);
					if(blocks == null || newBlocks != null && calculateArea(newBlocks) < currentBest) {
						setBest(newBlocks);
					}
				}
			}
		}

		this.width = originalWidth;
		this.height = originalHeight;

		/*
		let alternate = false;
		let cw = 2;
		let ch = 2;
		while(!(cw < originalWidth && ch < originalHeight)) {
			if(alternate) {
				cw++;
				cw *= 1.5;
				cw = Math.floor(cw);
			} else {
				ch++;
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
		}*/
		/*this.width = originalWidth;
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
		}*/
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

	private _pack(_data:Rect[], allowRotation:boolean):Block[] {
		const blocks:Block[] = [];
		for(const data of _data) {
			const block:Block = {
				w: data.frame.w,
				h: data.frame.h,
				rect: data
			};
			blocks.push(block);
		}

		let packedBlocks:Block[] = null;
		if(this.isAlt) {
			packedBlocks = this.packAlt(blocks, allowRotation);
		} else {
			packedBlocks = this.packNormal(blocks, allowRotation);
		}
		return packedBlocks;
	}

	private packNormal(blocks: Block[], allowRotation: boolean): Block[] {
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

	private packAlt(blocks: Block[], allowRotation: boolean) {
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
		return "FixedOrderedPacker";
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

export default FixedOrderedPacker;
import Packer, { type MethodList } from "./Packer";
import type { Rect } from "api/types";

class Rectangle {
	public x: number;
	public y: number;
	public width: number;
	public height: number;

	constructor(x=0, y=0, width=0, height=0) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	clone() {
		return new Rectangle(this.x, this.y, this.width, this.height);
	}

	hitTest(other: Rectangle) {
		return Rectangle.hitTest(this, other);
	}

	static hitTest(a: Rectangle, b: Rectangle) {
		return a.x >= b.x && a.y >= b.y && a.x+a.width <= b.x+b.width && a.y+a.height <= b.y+b.height;
	}
}

const METHODS = {
	BestShortSideFit: "BestShortSideFit",
	BestLongSideFit: "BestLongSideFit",
	BestAreaFit: "BestAreaFit",
	BottomLeftRule: "BottomLeftRule",
	//ContactPointRule: "ContactPointRule" // broken
} as const;

type MethodType = typeof METHODS[keyof typeof METHODS];

class MutatableNumber {
	value: number;
	constructor(value:number = 0) {
		this.value = value;
	}
}

class MaxRectsBin extends Packer {
	usedRectangles: Rectangle[];
	freeRectangles: Rectangle[];
	binWidth: number;
	binHeight: number;
	allowRotate: boolean;
	padding: number;

	constructor(width: number, height: number, allowRotate: boolean = false, padding: number = 0) {
		super(width, height, allowRotate, padding);

		this.usedRectangles = [];
		this.freeRectangles = [];

		this.binWidth = width;
		this.binHeight = height;
		this.allowRotate = allowRotate;
		this.padding = padding;

		this.freeRectangles.push(new Rectangle(
			0,
			0,
			width,
			height
		));
	}

	override pack(data:Rect[], method:MethodType) {
		let res = this.insert2(data, method);
		return res;
	}

	private insert(width:number, height:number, method:MethodType=METHODS.BestShortSideFit) {
		let newNode = new Rectangle();
		let score1 = new MutatableNumber();
		let score2 = new MutatableNumber();

		switch(method) {
			case METHODS.BestShortSideFit:
				newNode = this._findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
				break;
			case METHODS.BottomLeftRule:
				newNode = this._findPositionForNewNodeBottomLeft(width, height, score1, score2);
				break;
			//case METHODS.ContactPointRule:
			//	newNode = this._findPositionForNewNodeContactPoint(width, height, score1);
			//	break;
			case METHODS.BestLongSideFit:
				newNode = this._findPositionForNewNodeBestLongSideFit(width, height, score2, score1);
				break;
			case METHODS.BestAreaFit:
				newNode = this._findPositionForNewNodeBestAreaFit(width, height, score1, score2);
				break;
			default:
				throw Error("Unknown method " + method);
		}

		if (newNode.height === 0){
			return newNode;
		}

		this._placeRectangle(newNode);
		return newNode;
	}

	private insert2(rectangles:Rect[], method:MethodType) {
		let res = [];

		while(rectangles.length > 0) {
			let bestScore1 = Infinity;
			let bestScore2 = Infinity;
			let bestRectangleIndex = -1;
			let bestNode = new Rectangle();

			let i = 0;
			for(const rect of rectangles) {
				let score1 = new MutatableNumber();
				let score2 = new MutatableNumber();
				let newNode = this._scoreRectangle(rect.frame.w + this.padding, rect.frame.h + this.padding, method, score1, score2);

				if (score1.value < bestScore1 || (score1.value === bestScore1 && score2.value < bestScore2)) {
					bestScore1 = score1.value;
					bestScore2 = score2.value;
					bestNode = newNode;
					bestRectangleIndex = i;
				}
				i++;
			}

			if (bestRectangleIndex === -1) {
				return res;
			}

			this._placeRectangle(bestNode);
			let rect = rectangles.splice(bestRectangleIndex, 1)[0];
			if(rect) {
				rect.frame.x = bestNode.x;
				rect.frame.y = bestNode.y;

				bestNode.width -= this.padding;
				bestNode.height -= this.padding;

				if(rect.frame.w !== bestNode.width || rect.frame.h !== bestNode.height) {
					rect.rotated = true;
				}
			}

			res.push(rect);
		}
		return res;
	}

	private _placeRectangle(node:Rectangle) {
		let numRectanglesToProcess = this.freeRectangles.length;
		for(let i= 0; i < numRectanglesToProcess; i++) {
			if (this._splitFreeNode(this.freeRectangles[i] as Rectangle, node)) {
				this.freeRectangles.splice(i,1);
				i--;
				numRectanglesToProcess--;
			}
		}

		this._pruneFreeList();
		this.usedRectangles.push(node);
	}

	private _scoreRectangle(width:number, height:number, method:MethodType, score1:MutatableNumber, score2:MutatableNumber) {
		let newNode = new Rectangle();
		score1.value = Infinity;
		score2.value = Infinity;

		switch(method) {
			case METHODS.BestShortSideFit:
				newNode = this._findPositionForNewNodeBestShortSideFit(width, height, score1, score2);
				break;
			case METHODS.BottomLeftRule:
				newNode = this._findPositionForNewNodeBottomLeft(width, height, score1, score2);
				break;
			//case METHODS.ContactPointRule:
			//	newNode = this._findPositionForNewNodeContactPoint(width, height, score1);
			//	score1.value = -score1.value;
			//	break;
			case METHODS.BestLongSideFit:
				newNode = this._findPositionForNewNodeBestLongSideFit(width, height, score2, score1);
				break;
			case METHODS.BestAreaFit:
				newNode = this._findPositionForNewNodeBestAreaFit(width, height, score1, score2);
				break;
			default:
				throw Error("Unknown method " + method);
		}

		if (newNode.height === 0) {
			score1.value = Infinity;
			score2.value = Infinity;
		}

		return newNode;
	}

	private _occupancy() {
		let usedRectangles = this.usedRectangles;
		let usedSurfaceArea = 0;
		for(const rect of usedRectangles) {
			usedSurfaceArea += rect.width * rect.height;
		}

		return usedSurfaceArea/(this.binWidth * this.binHeight);
	}

	private _findPositionForNewNodeBottomLeft(width:number, height:number, bestY:MutatableNumber, bestX:MutatableNumber) {
		let freeRectangles = this.freeRectangles;
		let bestNode = new Rectangle();

		bestY.value = Infinity;
		for(const rect of freeRectangles) {
			if (rect.width >= width && rect.height >= height) {
				const topSideY = rect.y + height;
				if (topSideY < bestY.value || (topSideY === bestY.value && rect.x < bestX.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = width;
					bestNode.height = height;
					bestY.value = topSideY;
					bestX.value = rect.x;
				}
			}
			if (this.allowRotate && rect.width >= height && rect.height >= width) {
				const topSideY = rect.y + width;
				if (topSideY < bestY.value || (topSideY === bestY.value && rect.x < bestX.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = height;
					bestNode.height = width;
					bestY.value = topSideY;
					bestX.value = rect.x;
				}
			}
		}
		return bestNode;
	}

	private _findPositionForNewNodeBestShortSideFit(width:number, height:number, bestShortSideFit:MutatableNumber, bestLongSideFit:MutatableNumber){
		let freeRectangles = this.freeRectangles;
		let bestNode = new Rectangle();

		bestShortSideFit.value = Infinity;

		for(const rect of freeRectangles) {
			if (rect.width >= width && rect.height >= height) {
				const leftoverHoriz = Math.abs(rect.width - width);
				const leftoverVert = Math.abs(rect.height - height);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
				const longSideFit = Math.max(leftoverHoriz, leftoverVert);

				if (shortSideFit < bestShortSideFit.value || (shortSideFit === bestShortSideFit.value && longSideFit < bestLongSideFit.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = width;
					bestNode.height = height;
					bestShortSideFit.value = shortSideFit;
					bestLongSideFit.value = longSideFit;
				}
			}

			if (this.allowRotate && rect.width >= height && rect.height >= width) {
				const flippedLeftoverHoriz = Math.abs(rect.width - height);
				const flippedLeftoverVert = Math.abs(rect.height - width);
				const flippedShortSideFit = Math.min(flippedLeftoverHoriz, flippedLeftoverVert);
				const flippedLongSideFit = Math.max(flippedLeftoverHoriz, flippedLeftoverVert);

				if (flippedShortSideFit < bestShortSideFit.value || (flippedShortSideFit === bestShortSideFit.value && flippedLongSideFit < bestLongSideFit.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = height;
					bestNode.height = width;
					bestShortSideFit.value = flippedShortSideFit;
					bestLongSideFit.value = flippedLongSideFit;
				}
			}
		}

		return bestNode;
	}

	private _findPositionForNewNodeBestLongSideFit(width:number, height:number, bestShortSideFit:MutatableNumber, bestLongSideFit:MutatableNumber) {
		let freeRectangles = this.freeRectangles;
		let bestNode = new Rectangle();
		bestLongSideFit.value = Infinity;

		for(const rect of freeRectangles) {
			if (rect.width >= width && rect.height >= height) {
				const leftoverHoriz = Math.abs(rect.width - width);
				const leftoverVert = Math.abs(rect.height - height);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
				const longSideFit = Math.max(leftoverHoriz, leftoverVert);

				if (longSideFit < bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit < bestShortSideFit.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = width;
					bestNode.height = height;
					bestShortSideFit.value = shortSideFit;
					bestLongSideFit.value = longSideFit;
				}
			}

			if (this.allowRotate && rect.width >= height && rect.height >= width) {
				const leftoverHoriz = Math.abs(rect.width - height);
				const leftoverVert = Math.abs(rect.height - width);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
				const longSideFit = Math.max(leftoverHoriz, leftoverVert);

				if (longSideFit < bestLongSideFit.value || (longSideFit === bestLongSideFit.value && shortSideFit < bestShortSideFit.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = height;
					bestNode.height = width;
					bestShortSideFit.value = shortSideFit;
					bestLongSideFit.value = longSideFit;
				}
			}
		}
		return bestNode;
	}

	private _findPositionForNewNodeBestAreaFit(width:number, height:number, bestAreaFit:MutatableNumber, bestShortSideFit:MutatableNumber) {
		let freeRectangles = this.freeRectangles;
		let bestNode = new Rectangle();

		bestAreaFit.value = Infinity;

		for(const rect of freeRectangles) {
			const areaFit = rect.width * rect.height - width * height;

			if (rect.width >= width && rect.height >= height) {
				const leftoverHoriz = Math.abs(rect.width - width);
				const leftoverVert = Math.abs(rect.height - height);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);

				if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = width;
					bestNode.height = height;
					bestShortSideFit.value = shortSideFit;
					bestAreaFit.value = areaFit;
				}
			}

			if (this.allowRotate && rect.width >= height && rect.height >= width) {
				const leftoverHoriz = Math.abs(rect.width - height);
				const leftoverVert = Math.abs(rect.height - width);
				const shortSideFit = Math.min(leftoverHoriz, leftoverVert);

				if (areaFit < bestAreaFit.value || (areaFit === bestAreaFit.value && shortSideFit < bestShortSideFit.value)) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = height;
					bestNode.height = width;
					bestShortSideFit.value = shortSideFit;
					bestAreaFit.value = areaFit;
				}
			}
		}
		return bestNode;
	}

	private static _commonIntervalLength(i1start: number, i1end: number, i2start: number, i2end: number): number {
		if (i1end <= i2start || i2end <= i1start) {
			return 0;
		}
		return Math.min(i1end, i2end) - Math.max(i1start, i2start);
	}

	private _contactPointScoreNode(x: number, y: number, width: number, height: number): number {
		const usedRectangles = this.usedRectangles;
		let score = 0;

		const xEnd = x + width;
		const yEnd = y + height;

		if (x === 0 || xEnd === this.binWidth) {
			score += height;
		}
		if (y === 0 || yEnd === this.binHeight) {
			score += width;
		}

		for (const { x: rectX, y: rectY, width: rectWidth, height: rectHeight } of usedRectangles) {
			const rectXEnd = rectX + rectWidth;
			const rectYEnd = rectY + rectHeight;

			if (rectX === xEnd || rectXEnd === x) {
				score += MaxRectsBin._commonIntervalLength(rectY, rectYEnd, y, yEnd);
			}
			if (rectY === yEnd || rectYEnd === y) {
				score += MaxRectsBin._commonIntervalLength(rectX, rectXEnd, x, xEnd);
			}
		}

		return score;
	}

	private _findPositionForNewNodeContactPoint(width:number, height:number, bestContactScore:MutatableNumber) {
		let freeRectangles = this.freeRectangles;
		let bestNode = new Rectangle();

		bestContactScore.value = -1;

		for(const rect of freeRectangles) {
			if (rect.width >= width && rect.height >= height) {
				const score = this._contactPointScoreNode(rect.x, rect.y, width, height);
				if (score > bestContactScore.value) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = width;
					bestNode.height = height;
					bestContactScore.value = score;
				}
			}
			if (this.allowRotate && rect.width >= height && rect.height >= width) {
				const score = this._contactPointScoreNode(rect.x, rect.y, height, width);
				if (score > bestContactScore.value) {
					bestNode.x = rect.x;
					bestNode.y = rect.y;
					bestNode.width = height;
					bestNode.height = width;
					bestContactScore.value = score;
				}
			}
		}
		return bestNode;
	}

	private _splitFreeNode(freeNode:Rectangle, usedNode:Rectangle) {
		let freeRectangles = this.freeRectangles;
		if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x ||
			usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y)
			return false;
		let newNode;
		if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
			if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
				newNode = freeNode.clone();
				newNode.height = usedNode.y - newNode.y;
				freeRectangles.push(newNode);
			}

			if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
				newNode = freeNode.clone();
				newNode.y = usedNode.y + usedNode.height;
				newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
				freeRectangles.push(newNode);
			}
		}

		if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
			if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
				newNode = freeNode.clone();
				newNode.width = usedNode.x - newNode.x;
				freeRectangles.push(newNode);
			}

			if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
				newNode = freeNode.clone();
				newNode.x = usedNode.x + usedNode.width;
				newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
				freeRectangles.push(newNode);
			}
		}

		return true;
	}

	/*_pruneFreeList() {
		let freeRectangles = this.freeRectangles;
		for(let i = 0;i < freeRectangles.length; i++)
			for(let j= i+1; j < freeRectangles.length; j++) {
				if (Rectangle.hitTest(freeRectangles[i], freeRectangles[j])) {
					freeRectangles.splice(i,1);
					break;
				}
				if (Rectangle.hitTest(freeRectangles[j], freeRectangles[i])) {
					freeRectangles.splice(j,1);
				}
			}
	}*/
	/*_pruneFreeList() {
		let freeRectangles = this.freeRectangles;
		let i = 0;

		while (i < freeRectangles.length) {
			let hasMerged = false;
			for (let j = i + 1; j < freeRectangles.length; j++) {
				if (Rectangle.hitTest(freeRectangles[i], freeRectangles[j])) {
					freeRectangles.splice(i, 1);
					hasMerged = true;
					break;
				} else if (Rectangle.hitTest(freeRectangles[j], freeRectangles[i])) {
					freeRectangles.splice(j, 1);
					hasMerged = true;
					break;
				}
			}
			if (!hasMerged) {
				i++;
			}
		}
	}*/
	private _pruneFreeList() {
        // Go through each pair of freeRects and remove any rects that is redundant
        let i = 0;
        let j = 0;
		let freeRectangles = this.freeRectangles;
        let len = freeRectangles.length;
        while (i < len) {
            j = i + 1;
            let tmpRect1 = freeRectangles[i];
			if(!tmpRect1) {
				i++;
				continue;
			}
            while (j < len) {
                let tmpRect2 = freeRectangles[j];
				if(!tmpRect2) {
					j++;
					continue;
				}
				if (Rectangle.hitTest(tmpRect1, tmpRect2)) {
					freeRectangles.splice(i, 1);
					i--;
					len--;
					break;
				}
				if (Rectangle.hitTest(tmpRect2, tmpRect1)) {
                    freeRectangles.splice(j, 1);
                    j--;
                    len--;
                }
                j++;
            }
            i++;
        }
    }

	static override get packerName() {
		return "MaxRectsBin";
	}

	static override get defaultMethod():MethodType {
		return METHODS.BestShortSideFit;
	}

	static override get methods():MethodList {
		return METHODS;
	}

	static override needsNonRotation(): boolean {
		return true;
	}

	static override getMethodProps(id:MethodType) {
		switch(id) {
			case METHODS.BestShortSideFit:
				return {name: "Best short side fit", description: "Positions the Rectangle against the short side of a free Rectangle into which it fits the best."};
			case METHODS.BestLongSideFit:
				return {name: "Best long side fit", description: "Positions the Rectangle against the long side of a free Rectangle into which it fits the best."};
			case METHODS.BestAreaFit:
				return {name: "Best area fit", description: "Positions the Rectangle into the smallest free Rectangle into which it fits."};
			case METHODS.BottomLeftRule:
				return {name: "Bottom left rule", description: "Does the Tetris placement."};
			//case METHODS.ContactPointRule:
			//	return {name: "Contact point rule", description: "Chooses the placement where the Rectangle touches other Rectangles as much as possible."};
			default:
				throw Error("Unknown method " + id);
		}
	}
}

export default MaxRectsBin;
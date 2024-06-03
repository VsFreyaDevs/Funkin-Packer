import MaxRectsPacker from "./MaxRectsPacker";
import MaxRectsBin from "./MaxRectsBin";
import OptimalPacker from "./OptimalPacker";
import GrowingPacker from "./GrowingPacker";
import OrderedPacker from "./OrderedPacker";
import FixedOrderedPacker from "./FixedOrderedPacker";
import { PackerClass } from "./Packer";

const list:PackerClass[] = [
	MaxRectsBin,
	MaxRectsPacker,
	GrowingPacker,
	OrderedPacker,
	FixedOrderedPacker,
	OptimalPacker
] as const;

function getPackerByType(name:string) {
	for(const item of list) {
		if(item.name === name) {
			return item;
		}
	}
	return null;
}

export { getPackerByType };
export default list;
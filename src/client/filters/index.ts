import Filter from './Filter';
import Mask from './Mask';
import Grayscale from './Grayscale';

export type FilterClass = {
	readonly type: string,
	new():Filter
};

const list: FilterClass[] = [
	Filter,
	Mask,
	Grayscale
] as const;

function getFilterByType(type:string) {
	for(let item of list) {
		if(item.type === type) {
			return item;
		}
	}
	return null;
}

export { getFilterByType };
export default list;
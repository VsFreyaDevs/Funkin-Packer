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

export function getFilterByType(type:string | undefined | null):FilterClass {
	if(!type) return Filter;

	for(let item of list) {
		if(item.type === type) {
			return item;
		}
	}
	return Filter;
}

export default list;
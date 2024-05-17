import { Observer, GLOBAL_EVENT } from "../Observer";

let INSTANCE:Globals = null;

class Globals {
	storedOrder: string[];
	constructor() {
		INSTANCE = this;

		//this.atlas = null;
		this.storedOrder = null;
		//this.sparrowOrigMap = null;
		//this.sparrowMaxMap = null;

		(globalThis as any).Globals = this;

		Observer.on(GLOBAL_EVENT.STORED_ORDER_CHANGED, this.onStoredOrderChanged, this);
	}

	onStoredOrderChanged = (data:string[]) => {
		this.storedOrder = data;
	}

	static get sparrowOrder() {
		return INSTANCE.storedOrder;
	}

	static hasStoredOrder() {
		if(INSTANCE === null) return false;
		return INSTANCE.storedOrder !== null && INSTANCE.storedOrder.length > 0;
	}

	static didClearImageList() {
		Globals.clearOrder();
	}

	static clearOrder() {
		Observer.emit(GLOBAL_EVENT.STORED_ORDER_CHANGED, null);
	}

	/*static get sparrowOrigMap() {
		return INSTANCE.sparrowOrigMap;
	}

	static get sparrowMaxMap() {
		return INSTANCE.sparrowMaxMap;
	}*/

	static get i() {
		return INSTANCE;
	}
}

INSTANCE = new Globals();

export default Globals;
import TypedObserver from "TypedObserver";

let INSTANCE:Globals;

class Globals {
	storedOrder: string[] | null;
	constructor() {
		INSTANCE = this;

		//this.atlas = null;
		this.storedOrder = null;
		//this.sparrowOrigMap = null;
		//this.sparrowMaxMap = null;

		(globalThis as any).Globals = this;

		TypedObserver.storedOrderChanged.on(this.onStoredOrderChanged, this);
	}

	private onStoredOrderChanged = (data:string[]) => {
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
		TypedObserver.storedOrderChanged.emit(null);
		TypedObserver.repackInfo.emit(null);
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
const PREFIX = "t-packer-";

class Storage {
	static save(key:string, value:unknown) {
		key = PREFIX + key;

		let valueStr:string;
		if(typeof value === "string") {
			valueStr = value;
		} else {
			valueStr = JSON.stringify(value);
		}

		localStorage.setItem(key, valueStr);
	}

	static load(key:string, isJson:boolean = true):any {
		key = PREFIX + key;

		let value = localStorage.getItem(key);

		if(value && isJson) {
			try {
				value = JSON.parse(value);
			}
			catch (e) {
				value = null;
			}
		}

		return value;
	}
}

export default Storage;
const METHOD = {
	Default: "Default"
};

class Packer {

	constructor() {
	}

	pack() {
		throw Error("Abstract method. Override it.");
	}


	static get type() {
		return "Default";
	}

	static get methods() {
		return METHOD;
	}

	static getMethodProps() {
		return {name: "Default", description: "Default placement"};
	}
}

export default Packer;
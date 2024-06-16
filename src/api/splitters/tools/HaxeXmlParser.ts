const enum XmlType {
	/**
		Represents an XML element type.
	**/
	Element,

	/**
		Represents XML parsed character data type.
	**/
	PCData,

	/**
		Represents XML character data type.
	**/
	CData,

	/**
		Represents an XML comment type.
	**/
	Comment,

	/**
		Represents an XML doctype element type.
	**/
	DocType,

	/**
		Represents an XML processing instruction type.
	**/
	ProcessingInstruction,

	/**
		Represents an XML document type.
	**/
	Document
}

/*function xmlTypeToString(type: XmlType): string {
	switch (type) {
		case XmlType.Element:
			return 'Element';
		case XmlType.PCData:
			return 'PCData';
		case XmlType.CData:
			return 'CData';
		case XmlType.Comment:
			return 'Comment';
		case XmlType.DocType:
			return 'DocType';
		case XmlType.ProcessingInstruction:
			return 'ProcessingInstruction';
		case XmlType.Document:
			return 'Document';
	}
}*/

class ArrayWrapper<T> {
	public readonly array: T[];
	constructor(array:T[]) {
		this.array = array;
	}

	public get(index:number):T {
		return this.array[index];
	}

	public set(index:number, value:T):void {
		this.array[index] = value;
	}

	public push(value:T):void {
		this.array.push(value);
	}

	public pop():T {
		return this.array.pop();
	}

	public insert(index:number, value:T):void {
		this.array.splice(index, 0, value);
	}

	public remove(value:T):boolean {
		return this.array.splice(this.array.indexOf(value), 1).length > 0;
	}
}

const escapes:Map<string, string> = new Map();
escapes.set('lt', '<');
escapes.set('gt', '>');
escapes.set('amp', '&');
escapes.set('quot', '"');
escapes.set('apos', "'");

class Xml {
	public nodeType: XmlType;
	public nodeName: string;
	public nodeValue: string;
	public parent: Xml;
	private readonly children: ArrayWrapper<Xml>;
	private readonly attributeMap: Map<string, string>;

	constructor(type: XmlType) {
		this.nodeType = type;
		this.nodeName = null;
		this.nodeValue = null;
		this.parent = null;
		this.children = new ArrayWrapper([]);
		this.attributeMap = new Map();
	}

	ensureElementType() {
		if (this.nodeType !== XmlType.Document && this.nodeType !== XmlType.Element) {
			throw `Bad node type, expected Element or Document but found ${this.nodeType}`;
		}
	}

	public get(att:string):string {
		if (this.nodeType !== XmlType.Element) {
			throw `Bad node type, expected Element but found ${this.nodeType}`;
		}
		return this.attributeMap.get(att);
	}

	public set(att:string, value:string) {
		if (this.nodeType !== XmlType.Element) {
			throw `Bad node type, expected Element but found ${this.nodeType}`;
		}
		this.attributeMap.set(att, value);
	}

	public remove(att:string) {
		if (this.nodeType !== XmlType.Element) {
			throw `Bad node type, expected Element but found ${this.nodeType}`;
		}
		this.attributeMap.delete(att);
	}

	public exists(att:string):boolean {
		if (this.nodeType !== XmlType.Element) {
			throw `Bad node type, expected Element but found ${this.nodeType}`;
		}
		return this.attributeMap.has(att);
	}

	public firstElement():Xml {
		this.ensureElementType();
		for (const child of this.children.array) {
			if (child.nodeType == XmlType.Element) {
				return child;
			}
		}
		return null;
	}

	public attributes():string[] {
		if (this.nodeType !== XmlType.Element) {
			throw `Bad node type, expected Element but found ${this.nodeType}`;
		}
		let res:string[] = [];
		let it = this.attributeMap.keys();
		let val;
		while((val = it.next()) && !val.done) {
			res.push(val.value);
		}
		return res;
	}

	/**
		Returns an iterator of all child nodes.
		Only works if the current node is an Element or a Document.
	**/
	public iterator():Xml[] {
		this.ensureElementType();
		return this.children.array;
	}

	/**
		Returns an iterator of all child nodes which are Elements.
		Only works if the current node is an Element or a Document.
	**/
	public elements():Xml[] {
		this.ensureElementType();
		const ret = [];
		for (const child of this.children.array) {
			if (child.nodeType == XmlType.Element) {
				ret.push(child);
			}
		}
		return ret;
	}

	public hasElement(name:string):boolean {
		this.ensureElementType();
		for (const child of this.children.array) {
			if (child.nodeType == XmlType.Element && child.nodeName == name) {
				return true;
			}
		}
		return false;
	}

	/**
		Returns an iterator of all child nodes which are Elements with the given nodeName.
		Only works if the current node is an Element or a Document.
	**/
	public elementsNamed(name:string):Xml[] {
		this.ensureElementType();
		const ret = [];
		for (const child of this.children.array) {
			if (child.nodeType == XmlType.Element && child.nodeName == name) {
				ret.push(child);
			}
		}
		return ret;
	}

	public firstChild():Xml {
		this.ensureElementType();
		return this.children.array[0];
	}

	public addChild(x:Xml) {
		this.ensureElementType();
		if (x.parent !== null) {
			x.parent.removeChild(x);
		}
		this.children.push(x);
		x.parent = this;
	}

	public removeChild(x:Xml):boolean {
		this.ensureElementType();
		if (this.children.remove(x)) {
			x.parent = null;
			return true;
		}
		return false;
	}

	public insertChild(x:Xml, pos:number) {
		this.ensureElementType();
		if (x.parent !== null) {
			x.parent.children.remove(x);
		}
		this.children.insert(pos, x);
		x.parent = this;
	}

	/**
		Creates a node of the given type.
	**/
	public static createElement(name:string):Xml {
		const xml = new Xml(XmlType.Element);
		xml.nodeName = name;
		return xml;
	}

	/**
		Creates a node of the given type.
	**/
	public static createPCData(data:string):Xml {
		const xml = new Xml(XmlType.PCData);
		xml.nodeValue = data;
		return xml;
	}

	/**
		Creates a node of the given type.
	**/
	public static createCData(data:string):Xml {
		const xml = new Xml(XmlType.CData);
		xml.nodeValue = data;
		return xml;
	}

	/**
		Creates a node of the given type.
	**/
	public static createComment(data:string):Xml {
		const xml = new Xml(XmlType.Comment);
		xml.nodeValue = data;
		return xml;
	}

	/**
		Creates a node of the given type.
	**/
	public static createDocType(data:string):Xml {
		const xml = new Xml(XmlType.DocType);
		xml.nodeValue = data;
		return xml;
	}

	/**
		Creates a node of the given type.
	**/
	public static createProcessingInstruction(data:string):Xml {
		const xml = new Xml(XmlType.ProcessingInstruction);
		xml.nodeValue = data;
		return xml;
	}

	/**
		Creates a node of the given type.
	**/
	public static createDocument():Xml {
		return new Xml(XmlType.Document);
	}
}

function substr(s:string, pos:number, len?:number):string {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
}

class XmlParserException extends Error {
	constructor(message:string, public str:string, public pos:number) {
		super(message + " at position " + pos + " current buffer: " + str + "\n" + substr(str, pos - 10, 10));
	}
}

class StringBuf {
	constructor(public string:string = "") {
		this._string = [];
		if(string !== "") {
			this._string.push(string);
		}
	}

	get length():number {
		let length = 0;
		for(const s of this._string) {
			length += s.length;
		}
		return length;
	}

	public add(s:string) {
		this._string.push(s);
	}

	public addChar(c:number) {
		this._string.push(String.fromCharCode(c));
	}

	public addSub(s:string, pos:number, len?:number) {
		this._string.push(len == null ? substr(s, pos) : substr(s, pos, len));
	}

	public toString(this:StringBuf):string {
		return this._string.join("");
	}

	public clear() {
		this._string = [];
	}

	private _string:string[];
}

const enum StateEnum {
	IGNORE_SPACES,
	BEGIN,
	PCDATA,
	CDATA,
	BEGIN_NODE,
	TAG_NAME,
	BODY,
	ATTRIB_NAME,
	EQUALS,
	ATTVAL_BEGIN,
	ATTRIB_VAL,
	CHILDS,
	WAIT_END,
	WAIT_END_RET,
	CLOSE,
	COMMENT,
	DOCTYPE,
	HEADER,
	ESCAPE,
}

export class HaxeXmlParser {
	public static parse(str: string, strict = false): Xml {
		const doc = Xml.createDocument();
		HaxeXmlParser.doParse(str, strict, 0, doc);
		//console.log(this.printEntire(doc));
		return doc;
	}

	/*private static printEntire(xml: Xml, pretty: boolean = false): string {
		if(xml == null)
			return "??NULL??";
		while(xml.parent !== null)
			xml = xml.parent;
		return Printer.print(xml, pretty);
	}*/

	private static doParse(str:string, strict:boolean, p:number, parent:Xml):number {
		let nsubs:number = 0;
		let xml:Xml = null;
		let state = StateEnum.BEGIN;
		let next = StateEnum.BEGIN;
		let escapeNext = StateEnum.BEGIN;
		let aname:string = null;
		let start:number = 0;
		let nbrackets:number = 0;
		let buf = new StringBuf();
		const addChild = (xml:Xml) => {
			parent.addChild(xml);
			//console.log("Added child", HaxeXmlParser.printEntire(parent));
			nsubs++;
		}
		// need extra state because next is in use
		let attrValQuote:string = null;
		let len = str.length;
		cc: while (p < len) {
			const c = str.charAt(p);
			//if(state === StateEnum.ESCAPE) {
			//	console.log(c, c.charCodeAt(0), StateEnum.toString(state) + " -> " + StateEnum.toString(escapeNext), HaxeXmlParser.printEntire(parent));
			//} else {
			//	console.log(c, c.charCodeAt(0), StateEnum.toString(state) + " -> " + StateEnum.toString(next), HaxeXmlParser.printEntire(parent));
			//}
			if(c.length === 0)
				throw new XmlParserException("Unexpected end of string", str, p);
			if(state === StateEnum.IGNORE_SPACES) {
				if(c === '\n' || c === '\r' || c === '\t' || c === ' ') {

				} else {
					state = next;
					continue cc;
				}
			} else if(state === StateEnum.BEGIN) {
				if(c === '<') {
					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.BEGIN_NODE;
				} else {
					start = p;
					state = StateEnum.PCDATA;
					continue cc;
				}
			} else if(state === StateEnum.PCDATA) {
				if (c === '<') {
					buf.addSub(str, start, p - start);
					let child = Xml.createPCData(buf.toString());
					buf.clear();
					addChild(child);
					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.BEGIN_NODE;
				} else if (c === '&') {
					buf.addSub(str, start, p - start);
					state = StateEnum.ESCAPE;
					escapeNext = StateEnum.PCDATA;
					start = p + 1;
				}
			} else if(state === StateEnum.CDATA) {
				if (c === ']' && str.charAt(p + 1) === ']' && str.charAt(p + 2) === '>') {
					let child = Xml.createCData(substr(str, start, p - start));
					addChild(child);
					p += 2;
					state = StateEnum.BEGIN;
				}
			} else if(state === StateEnum.BEGIN_NODE) {
				if(c === '!') {
					let c2 = str.charAt(p + 1);
					if (c2 === '[') {
						p += 2;
						if (substr(str, p, 6).toUpperCase() !== "CDATA[")
							throw new XmlParserException("Expected <![CDATA[", str, p);
						p += 5;
						state = StateEnum.CDATA;
						start = p + 1;
					} else if (c2 === 'D' || c2 === 'd') {
						if (substr(str, p + 2, 6).toUpperCase() !== "OCTYPE")
							throw new XmlParserException("Expected <!DOCTYPE", str, p);
						p += 8;
						state = StateEnum.DOCTYPE;
						start = p + 1;
					} else if (c2 !== '-' || str.charAt(p + 2) !== '-') {
						throw new XmlParserException("Expected <!--", str, p);
					} else {
						p += 2;
						state = StateEnum.COMMENT;
						start = p + 1;
					}
				} else if(c === '?') {
					state = StateEnum.HEADER;
					start = p;
				} else if(c === '/') {
					if (parent == null)
						throw new XmlParserException("Expected node name", str, p);
					start = p + 1;
					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.CLOSE;
				} else {
					state = StateEnum.TAG_NAME;
					start = p;
					continue cc;
				}
			} else if(state === StateEnum.TAG_NAME) {
				if (!HaxeXmlParser.isValidChar(c)) {
					if (p === start)
						throw new XmlParserException("Expected node name", str, p);
					xml = Xml.createElement(substr(str, start, p - start));
					addChild(xml);
					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.BODY;
					continue cc;
				}
			} else if(state === StateEnum.BODY) {
				if(c === '/') {
					state = StateEnum.WAIT_END;
				} else if(c === '>') {
					state = StateEnum.CHILDS;
				} else {
					state = StateEnum.ATTRIB_NAME;
					start = p;
					continue cc;
				}
			} else if(state === StateEnum.ATTRIB_NAME) {
				if (!HaxeXmlParser.isValidChar(c)) {
					if (start === p)
						throw new XmlParserException("Expected attribute name", str, p);
					let tmp = substr(str, start, p - start);
					aname = tmp;
					if (xml.exists(aname))
						throw new XmlParserException("Duplicate attribute [" + aname + "]", str, p);
					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.EQUALS;
					continue cc;
				}
			} else if(state === StateEnum.EQUALS) {
				if(c !== '=') {
					throw new XmlParserException("Expected =", str, p);
				}
				state = StateEnum.IGNORE_SPACES;
				next = StateEnum.ATTVAL_BEGIN;
			} else if(state === StateEnum.ATTVAL_BEGIN) {
				if(c === '"' || c === "'") {
					buf = new StringBuf();
					state = StateEnum.ATTRIB_VAL;
					start = p + 1;
					attrValQuote = c;
				} else {
					throw new XmlParserException("Expected \"", str, p);
				}
			} else if(state === StateEnum.ATTRIB_VAL) {
				if(c === '&') {
					buf.addSub(str, start, p - start);
					state = StateEnum.ESCAPE;
					escapeNext = StateEnum.ATTRIB_VAL;
					start = p + 1;
				} else if(strict && (c === '>' || c === '<')) {
					throw new XmlParserException("Invalid unescaped " + c + " in attribute value", str, p);
				} else if(c === attrValQuote) {
					buf.addSub(str, start, p - start);
					let val = buf.toString();
					buf = new StringBuf();
					xml.set(aname, val);
					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.BODY;
				}
			} else if(state === StateEnum.CHILDS) {
				p = HaxeXmlParser.doParse(str, strict, p, xml);
				start = p;
				state = StateEnum.BEGIN;
			} else if(state === StateEnum.WAIT_END) {
				if(c === '>') {
					state = StateEnum.BEGIN;
				} else {
					throw new XmlParserException("Expected >", str, p);
				}
			} else if(state === StateEnum.WAIT_END_RET) {
				if(c === '>') {
					if (nsubs === 0)
						parent.addChild(Xml.createPCData(""));
					return p;
				} else {
					throw new XmlParserException("Expected >", str, p);
				}
			} else if(state === StateEnum.CLOSE) {
				if (!HaxeXmlParser.isValidChar(c)) {
					if (start === p)
						throw new XmlParserException("Expected node name", str, p);

					let v = substr(str, start, p - start);
					if (parent === null || parent.nodeType !== XmlType.Element) {
						throw new XmlParserException(`Unexpected </${v}>, tag is not open`, str, p);
					}
					if (v !== parent.nodeName)
						throw new XmlParserException("Expected </" + parent.nodeName + ">", str, p);

					state = StateEnum.IGNORE_SPACES;
					next = StateEnum.WAIT_END_RET;
					continue cc;
				}
			} else if(state === StateEnum.COMMENT) {
				if (c ==='-' && str.charAt(p + 1) ==='-' && str.charAt(p + 2) === '>') {
					addChild(Xml.createComment(substr(str, start, p - start)));
					p += 2;
					state = StateEnum.BEGIN;
				}
			} else if(state === StateEnum.DOCTYPE) {
				if (c === '[')
					nbrackets++;
				else if (c === ']')
					nbrackets--;
				else if (c ==='>' && nbrackets === 0) {
					addChild(Xml.createDocType(substr(str, start, p - start)));
					state = StateEnum.BEGIN;
				}
			} else if(state === StateEnum.HEADER) {
				if (c === '?' && str.charAt(p + 1) === '>') {
					p++;
					let temp = substr(str, start + 1, p - start - 2);
					addChild(Xml.createProcessingInstruction(temp));
					state = StateEnum.BEGIN;
				}
			} else if(state === StateEnum.ESCAPE) {
				if (c === ';') {
					let s = substr(str, start, p - start);
					if (s.charAt(0) === '#') {
						let c = s.charAt(1) === 'x' ? parseInt("0" + substr(s, 1, s.length - 1)) : parseInt(substr(s, 1, s.length - 1));
						/*#if !(target.unicode)
						if (c >= 128) {
							// UTF8-encode it
							if (c <= 0x7FF) {
								buf.addChar(0xC0 | (c >> 6));
								buf.addChar(0x80 | (c & 63));
							} else if (c <= 0xFFFF) {
								buf.addChar(0xE0 | (c >> 12));
								buf.addChar(0x80 | ((c >> 6) & 63));
								buf.addChar(0x80 | (c & 63));
							} else if (c <= 0x10FFFF) {
								buf.addChar(0xF0 | (c >> 18));
								buf.addChar(0x80 | ((c >> 12) & 63));
								buf.addChar(0x80 | ((c >> 6) & 63));
								buf.addChar(0x80 | (c & 63));
							} else
								throw new XmlParserException("Cannot encode UTF8-char " + c, str, p);
						} else
						#end*/
						buf.addChar(c);
					} else if (!escapes.has(s)) {
						if (strict)
							throw new XmlParserException("Undefined entity: " + s, str, p);
						buf.add(`&${s};`);
					} else {
						buf.add(escapes.get(s));
					}
					start = p + 1;
					state = escapeNext;
				} else if (!HaxeXmlParser.isValidChar(c) && c !== "#") {
					if (strict)
						throw new XmlParserException("Invalid character in entity: " + c, str, p);
					buf.add("&");
					buf.addSub(str, start, p - start);
					p--;
					start = p + 1;
					state = escapeNext;
				}
			}
			p += 1;
		}

		if (state === StateEnum.BEGIN) {
			start = p;
			state = StateEnum.PCDATA;
		}

		if (state === StateEnum.PCDATA) {
			if (parent.nodeType === XmlType.Element) {
				throw new XmlParserException("Unclosed node <" + parent.nodeName + ">", str, p);
			}
			if (p !== start || nsubs === 0) {
				buf.addSub(str, start, p - start);
				addChild(Xml.createPCData(buf.toString()));
			}
			return p;
		}

		if (!strict && state === StateEnum.ESCAPE && escapeNext === StateEnum.PCDATA) {
			buf.add("&");
			buf.addSub(str, start, p - start);
			addChild(Xml.createPCData(buf.toString()));
			return p;
		}

		throw new XmlParserException("Unexpected end", str, p);
	}

	static isValidChar(c:string) {
		let cn = c.charCodeAt(0);
		if((cn >= 'a'.charCodeAt(0) && cn <= 'z'.charCodeAt(0))) return true;
		if((cn >= 'A'.charCodeAt(0) && cn <= 'Z'.charCodeAt(0))) return true;
		if((cn >= '0'.charCodeAt(0) && cn <= '9'.charCodeAt(0))) return true;
		return cn === ':'.charCodeAt(0) || cn ==='.'.charCodeAt(0) || cn === '_'.charCodeAt(0) || cn === '-'.charCodeAt(0);
	}
}

class Printer {
    private output: string[];
    private pretty: boolean;

    constructor(pretty: boolean) {
        this.output = [];
        this.pretty = pretty;
    }

    static print(xml: Xml, pretty: boolean = false): string {
		if(xml == null)
			return "??NULL??";
        const printer = new Printer(pretty);
        printer.writeNode(xml, "");
        return printer.output.join("");
    }

    private writeNode(value: Xml, tabs: string): void {
        switch (value.nodeType) {
            case XmlType.CData:
                this.write(`${tabs}<![CDATA[`);
                this.write(value.nodeValue || "");
                this.write("]]>");
                this.newline();
                break;
            case XmlType.Comment:
                let commentContent: string = value.nodeValue || "";
                commentContent = commentContent.replace(/[\n\r\t]+/g, "");
                commentContent = `<!--${commentContent}-->`;
                this.write(tabs);
                this.write(commentContent.trim());
                this.newline();
                break;
            case XmlType.Document:
                for (const child of value.iterator()) {
                    this.writeNode(child, tabs);
                }
                break;
            case XmlType.Element:
                this.write(`${tabs}<`);
                this.write(value.nodeName);
                for (const attribute of value.attributes()) {
                    this.write(` ${attribute}="`);
                    this.write(this.htmlEscape(value.get(attribute)));
                    this.write(`"`);
                }
                if (this.hasChildren(value)) {
                    this.write(">");
                    this.newline();
                    for (const child of value.iterator()) {
                        this.writeNode(child, this.pretty ? `${tabs}\t` : tabs);
                    }
                    this.write(`${tabs}</`);
                    this.write(value.nodeName);
                    this.write(">");
                    this.newline();
                } else {
                    this.write("/>");
                    this.newline();
                }
                break;
            case XmlType.PCData:
                const nodeValue: string = value.nodeValue || "";
                if (nodeValue.length !== 0) {
                    this.write(tabs + this.htmlEscape(nodeValue));
                    this.newline();
                }
                break;
            case XmlType.ProcessingInstruction:
                this.write(`<?${value.nodeValue}?>`);
                this.newline();
                break;
            case XmlType.DocType:
                this.write(`<!DOCTYPE ${value.nodeValue}>`);
                this.newline();
                break;
        }
    }

    private write(input: string): void {
        this.output.push(input);
    }

    private newline(): void {
        if (this.pretty) {
            this.output.push("\n");
        }
    }

    private hasChildren(value: Xml): boolean {
        for (const child of value.iterator()) {
            if (child.nodeType === XmlType.Element || child.nodeType === XmlType.PCData) {
                return true;
            }
            if (child.nodeType === XmlType.CData || child.nodeType === XmlType.Comment) {
                if (child.nodeValue && child.nodeValue.trim().length !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    private htmlEscape(str: string): string {
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
    }
}

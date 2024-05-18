function createHTTPQuery(params: Record<string, any> | string) {
	if(typeof params === 'string') return params;
	if(!params) return '';

	const query = [];
	for (let key of Object.keys(params)) {
		query.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
	}
	return query.join('&');
}

type SuccessCallback = (data: any) => void;
type ErrorCallback = (error: string) => void;
type Method = "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";
type DataType = "text" | "arraybuffer" | "xml";

function createXMLHTTPRequest(url: string | URL, callback:SuccessCallback, errorCallback:ErrorCallback, dataType:DataType) {
	let xmlhttp = (globalThis.XMLHttpRequest && new XMLHttpRequest()) || null;

	if (!xmlhttp) return xmlhttp;

	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState === 4) {
			if (xmlhttp.status < 400) {
				let data = null;
				if (dataType === 'arraybuffer') {
					data = xmlhttp.response;
				}
				if (dataType === 'xml') {
					data = xmlhttp.responseXML;
				}
				if (!data && xmlhttp.responseText) {
					data = xmlhttp.responseText;
				}

				if(callback) callback(data);
			}
			else if(errorCallback) {
				errorCallback(`${url} HTTP Error ${xmlhttp.status}: ${xmlhttp.statusText}`);
			}
		}
	};

	return xmlhttp;
}

function send(url: string | URL, method:Method, params="", callback:SuccessCallback, errorCallback:ErrorCallback, dataType:DataType="text") {
	let xmlhttp = createXMLHTTPRequest(url, callback, errorCallback, dataType);
	if (xmlhttp) {
		let query = createHTTPQuery(params);

		if(method === "GET" && query) url += "?" + query;

		xmlhttp.open(method, url, true);

		if (dataType === 'arraybuffer') {
			xmlhttp.responseType = 'arraybuffer';
		}

		if (method === "POST") {
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}
		xmlhttp.send(method === "GET" ? null : query);
	}
}

function sendGet(url: string, params="", callback:SuccessCallback, errorCallback:ErrorCallback = null, dataType:DataType="text") {
	return send(url, "GET", params, callback, errorCallback, dataType);
}

function sendPost(url: any, params="", callback:SuccessCallback, errorCallback:ErrorCallback = null, dataType:DataType="text") {
	return send(url, "POST", params, callback, errorCallback, dataType);
}

export {sendGet, sendPost};
export default send;
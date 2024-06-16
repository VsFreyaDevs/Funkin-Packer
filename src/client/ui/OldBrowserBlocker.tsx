import * as React from 'react';

import I18 from '../locale/I18';

class OldBrowserBlocker extends React.Component {
	readonly overlayRef: React.RefObject<HTMLDivElement>;

	constructor(props:any) {
		super(props);

		this.overlayRef = React.createRef();
	}

	static isSupported() {
		//check local storage
		if(!globalThis.localStorage) return false;

		//check file reader
		if(!globalThis.FileReader) return false;

		//check canvas
		const canvas = document.createElement("canvas");
		if(!canvas.getContext) return false;

		//check ajax
		//if(!globalThis.XMLHttpRequest) return false;

		return true;
	}

	override render() {
		return (
			<div ref={this.overlayRef} className="old-browser-overlay">
				<div className="old-browser-content">
					<div className="old-browser-header">{I18.f("OLD_BROWSER_MESSAGE1")}</div>
					<br/>
					{I18.f("OLD_BROWSER_MESSAGE2")}
					<br/><br/><br/>

					<a href="https://www.google.com/chrome/" target="_blank" title="Google Chrome">
						<img src="static/images/browser/chrome.png"/>
					</a>

					<a href="https://www.mozilla.org/firefox/" target="_blank" title="Firefox">
						<img src="static/images/browser/firefox.png"/>
					</a>

					<a href="https://www.opera.com/download" target="_blank" title="Google Chrome">
						<img src="static/images/browser/opera.png"/>
					</a>

					<a href="https://www.microsoft.com/windows/microsoft-edge" target="_blank" title="Microsoft Edge">
						<img src="static/images/browser/edge.png"/>
					</a>

				</div>
			</div>
		);
	}
}

export default OldBrowserBlocker;
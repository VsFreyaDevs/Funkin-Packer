import React from 'react';

import I18 from '../utils/I18';

class OldBrowserBlocker extends React.Component {
	constructor(props) {
		super(props);

		this.coverRef = React.createRef();
	}

	static isSupported() {
		//check local storage
		if(!window.localStorage) return false;

		//check file reader
		if(!window.FileReader) return false;

		//check canvas
		let canvas = document.createElement("canvas");
		if(!canvas.getContext) return false;

		//check ajax
		//if(!window.XMLHttpRequest) return false;

		return true;
	}

	render() {
		return (
			<div ref={this.coverRef} className="old-browser-cover">
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
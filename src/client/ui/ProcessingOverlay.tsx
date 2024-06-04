import * as React from 'react';

import I18 from '../utils/I18';

class ProcessingOverlay extends React.Component {
	readonly overlayRef: React.RefObject<HTMLDivElement>;
	showTimer: any;

	constructor(props:any) {
		super(props);

		this.overlayRef = React.createRef();

		this.showTimer = null;
	}

	override componentDidMount = () => {
		let overlay = this.overlayRef.current;
		if(overlay) {
			overlay.style.visibility = "hidden";

			this.showTimer = setTimeout(() => {
				overlay.style.visibility = "visible";
			}, 100);
		}
	}

	override componentWillUnmount = () => {
		clearTimeout(this.showTimer);
	}

	override render() {
		return (
			<div ref={this.overlayRef} className="processing-overlay color-white">
				<div className="processing-content">
					{I18.f("PLEASE_WAIT")}
				</div>
			</div>
		);
	}
}

export default ProcessingOverlay;
import * as React from 'react';

import I18 from '../locale/I18';

class ProcessingOverlay extends React.Component {
	private readonly overlayRef: React.RefObject<HTMLDivElement>;
	private showTimer: NodeJS.Timeout | null = null;

	constructor(props:any) {
		super(props);

		this.overlayRef = React.createRef();
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
		if(this.showTimer) clearTimeout(this.showTimer);
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
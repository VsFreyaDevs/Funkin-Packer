import * as React from 'react';

import I18 from '../utils/I18';

class ProcessingOverlay extends React.Component {
	coverRef: React.RefObject<HTMLDivElement>;
	showTimer: any;

	constructor(props:any) {
		super(props);

		this.coverRef = React.createRef();

		this.showTimer = null;
	}

	componentDidMount = () => {
		let cover = this.coverRef.current;
		if(cover) {
			cover.style.visibility = "hidden";

			this.showTimer = setTimeout(() => {
				cover.style.visibility = "visible";
			}, 100);
		}
	}

	componentWillUnmount = () => {
		clearTimeout(this.showTimer);
	}

	render() {
		return (
			<div ref={this.coverRef} className="processing-cover color-white">
				<div className="processing-content">
					{I18.f("PLEASE_WAIT")}
				</div>
			</div>
		);
	}
}

export default ProcessingOverlay;
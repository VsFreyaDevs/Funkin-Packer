import React from 'react';
import ReactDOM from 'react-dom';

import I18 from '../utils/I18';

class ProcessingCover extends React.Component {
	constructor(props) {
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

export default ProcessingCover;
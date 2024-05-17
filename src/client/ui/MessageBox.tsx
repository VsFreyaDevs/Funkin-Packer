import * as React from 'react';

import I18 from '../utils/I18';

interface Props {
	content: string;
	buttons?: ButtonData[];
	closeCallback?: () => void;
}

export interface ButtonData {
	name: string;
	caption: string;
	callback?: () => void;
}

type ButtonProps = ButtonData & {
	parentBox?: MessageBox;
}

class MessageBox extends React.Component<Props> {
	buttons: ButtonProps[];
	constructor(props:Props) {
		super(props);

		var btns = [];
		if(this.props.buttons) {
			for(let btn of this.props.buttons) {
				btns.push({...btn, parentBox: this});
			}
		}
		this.buttons = btns;

		if(!this.buttons) {
			this.buttons = [
				{name: "ok", caption: I18.f("OK")}
			]
		}
	}

	close = () => {
		this.props.closeCallback();
	}

	render() {
		let buttons = [];

		for(let btn of this.buttons) {
			buttons.push((<MessageBoxButton key={"btn-" + btn.name} name={btn.name} caption={btn.caption} callback={btn.callback} parentBox={this} />));
		}

		return (
			<div className="message-box-wrapper">
				<div className="message-box-window">
					<div className="message-box-content">
						{this.props.content}
					</div>
					<div className="message-box-buttons">
						{buttons}
					</div>
				</div>
			</div>
		);
	}
}

class MessageBoxButton extends React.Component<ButtonProps> {
	constructor(props:ButtonProps) {
		super(props);
	}

	onClick = () => {
		if(this.props.callback) this.props.callback();
		if(this.props.parentBox) this.props.parentBox.close();
	}

	render() {
		return (
			<div className="btn back-600 border-color-gray color-white" onClick={this.onClick}>{this.props.caption}</div>
		);
	}
}

export default MessageBox;
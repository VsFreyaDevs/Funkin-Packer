import * as React from 'react';

import I18 from '../utils/I18';
import { isNullOrUndefined } from '../utils/common';

interface Props {
	readonly content: string;
	readonly buttons?: ButtonData[];
	readonly closeCallback?: () => void;
}

export interface ButtonData {
	readonly name: string;
	readonly caption: string;
	readonly callback?: () => void;
}

type ButtonProps = ButtonData & {
	readonly parentBox?: MessageBox;
}

class MessageBox extends React.Component<Props> {
	readonly buttons: ButtonProps[];
	constructor(props:Props) {
		super(props);

		const btns:ButtonProps[] = [];
		if(this.props.buttons) {
			for(let btn of this.props.buttons) {
				btns.push({...btn, parentBox: this});
			}
		}
		if(btns.length == 0) {
			btns.push({name: "ok", caption: I18.f("OK"), parentBox: this});
		}
		this.buttons = btns;
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
import * as React from 'react';

import ImagesList from './ImagesList';
import MainHeader from './MainHeader';
import PackProperties from './PackProperties';
import PackResults from './PackResults';
import MessageBox, { ButtonData } from './MessageBox';
import ProcessingOverlay from './ProcessingOverlay';
import OldBrowserBlocker from './OldBrowserBlocker';
//import About from './About';
//import Updater from '../platform/electron/Updater';
import EditCustomExporter from './EditCustomExporter';
import SheetSplitter from './SheetSplitter';

import { Observer, GLOBAL_EVENT } from '../Observer';
import TypedObserver from 'TypedObserver';

interface Props {}

interface State {
	messageBox: React.ReactNode;
	processing: boolean;
	//about: boolean;
	editCustomExporter: boolean;
	updater: boolean;
	sheetSplitter: boolean;
	browserBlocker: boolean;
}

class MainLayout extends React.Component<Props, State> {
	constructor(props:Props) {
		super(props);

		this.state = {
			messageBox: null,
			processing: false,
			//about: false,
			editCustomExporter: false,
			updater: false,
			sheetSplitter: false,
			browserBlocker: !OldBrowserBlocker.isSupported()
		};
	}

	componentDidMount = () => {
		TypedObserver.showMessage.on(this.showMessage, this);
		Observer.on(GLOBAL_EVENT.SHOW_PROCESSING, this.showProcessing, this);
		Observer.on(GLOBAL_EVENT.HIDE_PROCESSING, this.hideProcessing, this);
		//Observer.on(GLOBAL_EVENT.SHOW_ABOUT, this.showAbout, this);
		//Observer.on(GLOBAL_EVENT.HIDE_ABOUT, this.hideAbout, this);
		Observer.on(GLOBAL_EVENT.SHOW_EDIT_CUSTOM_EXPORTER, this.showEditCustomExporter, this);
		Observer.on(GLOBAL_EVENT.HIDE_EDIT_CUSTOM_EXPORTER, this.hideEditCustomExporter, this);
		//Observer.on(GLOBAL_EVENT.UPDATE_AVAILABLE, this.onUpdateAvailable, this);
		//Observer.on(GLOBAL_EVENT.HIDE_UPDATER, this.hideUpdater, this);
		Observer.on(GLOBAL_EVENT.SHOW_SHEET_SPLITTER, this.showSheetSplitter, this);
		Observer.on(GLOBAL_EVENT.HIDE_SHEET_SPLITTER, this.hideSheetSplitter, this);
	}

	componentWillUnmount = () => {
		TypedObserver.showMessage.off(this.showMessage, this);
		Observer.off(GLOBAL_EVENT.SHOW_PROCESSING, this.showProcessing, this);
		Observer.off(GLOBAL_EVENT.HIDE_PROCESSING, this.hideProcessing, this);
		//Observer.off(GLOBAL_EVENT.SHOW_ABOUT, this.showAbout, this);
		//Observer.off(GLOBAL_EVENT.HIDE_ABOUT, this.hideAbout, this);
		Observer.off(GLOBAL_EVENT.SHOW_EDIT_CUSTOM_EXPORTER, this.showEditCustomExporter, this);
		Observer.off(GLOBAL_EVENT.HIDE_EDIT_CUSTOM_EXPORTER, this.hideEditCustomExporter, this);
		//Observer.off(GLOBAL_EVENT.UPDATE_AVAILABLE, this.onUpdateAvailable, this);
		//Observer.off(GLOBAL_EVENT.HIDE_UPDATER, this.hideUpdater, this);
		Observer.off(GLOBAL_EVENT.SHOW_SHEET_SPLITTER, this.showSheetSplitter, this);
		Observer.off(GLOBAL_EVENT.HIDE_SHEET_SPLITTER, this.hideSheetSplitter, this);
	}

	/* onUpdateAvailable(info) {
		this.setState({updater: info});
	}

	hideUpdater() {
		this.setState({updater: null});
	} */

	showMessage = (content: string, buttons: ButtonData[] = null) => {
		if(this.state.messageBox) return;

		let box = (<MessageBox content={content} buttons={buttons} closeCallback={this.closeMessage} />);
		this.setState({messageBox: box});
	}

	closeMessage = () => {
		this.setState({messageBox: null});
	}

	showProcessing = () => {
		this.setState({processing: true});
	}

	hideProcessing = () => {
		this.setState({processing: false});
	}

	/*showAbout() {
		this.setState({about: true});
	}

	hideAbout() {
		this.setState({about: false});
	}*/

	showEditCustomExporter = () => {
		this.setState({editCustomExporter: true});
	}

	hideEditCustomExporter = () => {
		this.setState({editCustomExporter: false});
	}

	showSheetSplitter = () => {
		this.setState({sheetSplitter: true});
	}

	hideSheetSplitter = () => {
		this.setState({sheetSplitter: false});
	}

	render() {
		return (
			<div className="main-wrapper">
				<MainHeader/>

				<div className="main-layout border-color-gray">
					<ImagesList/>
					<PackProperties/>
					<PackResults/>
					{this.state.browserBlocker ? (<OldBrowserBlocker/>) : null}
					{/*this.state.about ? (<About/>) : null*/}
					{this.state.editCustomExporter ? (<EditCustomExporter/>) : null}
					{this.state.sheetSplitter ? (<SheetSplitter/>) : null}
					{/* this.state.updater ? (<Updater data={this.state.updater}/>) : null */}
					{this.state.processing ? (<ProcessingOverlay/>) : null}
					{this.state.messageBox}
				</div>
			</div>
		);
	}
}

export default MainLayout;
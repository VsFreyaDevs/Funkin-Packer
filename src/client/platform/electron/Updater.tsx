import * as React from 'react';

import { Observer, GLOBAL_EVENT } from '../../Observer';
import Storage from '../../utils/Storage';
import I18 from '../../locale/I18';
import TypedObserver from 'TypedObserver';

const STORAGE_SKIPPED_VERSIONS_KEY = "skipped-versions";

interface Props {
	data: {
		releaseName: string,
		releaseNotes: string
	}
}

interface State {
	installation: boolean,
	downloadProgress: number
}

class Updater extends React.Component<Props, State> {
	private readonly downloadProgressRef: React.RefObject<HTMLDivElement>;
	skippedVersion: string[];

	constructor(props: Props) {
		super(props);

		this.downloadProgressRef = React.createRef();

		this.state = {
			installation: false,
			downloadProgress: 0
		};

		Observer.on(GLOBAL_EVENT.DOWNLOAD_PROGRESS_CHANGED, this.changeDownloadProgress, this);

		this.skippedVersion = Storage.load(STORAGE_SKIPPED_VERSIONS_KEY);
		if(!Array.isArray(this.skippedVersion)) this.skippedVersion = [];

		if(this.skippedVersion.indexOf(this.props.data.releaseName) >= 0) this.close();
	}

	close = () => {
		Observer.off(GLOBAL_EVENT.DOWNLOAD_PROGRESS_CHANGED, this.changeDownloadProgress, this);
		Observer.emit(GLOBAL_EVENT.HIDE_UPDATER);
	}

	skip = () => {
		let buttons = [
			{name: "yes", caption: I18.f("YES"), callback: this.doSkip},
			{name: "no", caption: I18.f("NO")}
		];

		TypedObserver.showMessage.emit(I18.f("SKIP_VERSION_CONFIRM"), buttons);
	}

	doSkip = () => {
		this.skippedVersion.push(this.props.data.releaseName);
		Storage.save(STORAGE_SKIPPED_VERSIONS_KEY, this.skippedVersion);
		this.close();
	}

	changeDownloadProgress = (val: number) => {
		this.setState({downloadProgress: val});
	}

	install = () => {
		this.setState({installation: true});
		Observer.emit(GLOBAL_EVENT.INSTALL_UPDATE);
	}

	override render() {
		return (
			<div className="updater-overlay">
				<div className="updater-content">

					<div className="updater-header">{I18.f("UPDATER_TITLE", this.props.data.releaseName)}</div>
					<div className="updater-release-notes" dangerouslySetInnerHTML={{ __html: this.props.data.releaseNotes }}></div>

					{
						this.state.installation
						?
						(
							<div className="updater-download">
								<div ref={this.downloadProgressRef} className="updater-download-progress" style={{width: this.state.downloadProgress+"%"}}></div>
							</div>
						)
						:
						(
							<div className="updater-controls">
								<div className="btn back-600 border-color-gray color-white" onClick={this.close}>{I18.f("CLOSE")}</div>
								<div className="btn back-600 border-color-gray color-white" onClick={this.skip}>{I18.f("SKIP_VERSION")}</div>
								<div className="btn back-600 border-color-gray color-white" onClick={this.install}>{I18.f("INSTALL")}</div>
							</div>
						)
					}
				</div>
			</div>
		);
	}
}

export default Updater;
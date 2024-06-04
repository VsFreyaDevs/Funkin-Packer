import * as React from 'react';

import { Observer, GLOBAL_EVENT } from '../Observer';
import I18 from '../utils/I18';
import * as appInfo from '../../../package.json';
import { languages } from '../resources/static/localization/languages';
import StatsInfo from './StatsInfo';
import TypedObserver from 'TypedObserver';

const {
	displayName: appDisplayName,
	version: appVersion
} = appInfo;

class MainHeader extends React.Component {
	/* showAbout() {
		Observer.emit(GLOBAL_EVENT.SHOW_ABOUT);
	} */

	changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		TypedObserver.changeLanguage.emit(e.target.value);
	}

	showSplitter = () => {
		Observer.emit(GLOBAL_EVENT.SHOW_SHEET_SPLITTER);
	}

	override render() {
		return (
			<div className="main-header back-900 color-white">
				<div className='left-align'>
					<div className="main-header-app-name">
						<img src="static/images/logo.png" alt="Logo" />
						{appDisplayName} {appVersion}
						<div className='based-on'>{I18.f("BASED_ON")}</div>
					</div>

					<div className='main-header-github'>
						<a href="https://github.com/NeeEoo/Funkin-Packer" target="_blank">
							<img src="static/images/github-mark-white.png" height="25" alt="Github" />
						</a>
					</div>
					<div className='main-header-ko-fi'>
						<a href="https://ko-fi.com/Ne_Eo" target="_blank">
							<img src="static/images/ko-fi.png" height="25" alt="Ko-Fi" />
						</a>
					</div>
				</div>

				{/* <div className="main-header-about" onClick={this.showAbout}>
					?
				</div> */}

				{/* <div className='main-header-info'>
					<div>0x0</div>
					<div>0 Bytes</div>
				</div> */}

				<StatsInfo />

				<div className='right-align'>
					<div className="main-header-controls">
						<div className="btn back-700 border-color-gray color-white" onClick={this.showSplitter}>{I18.f("SPLITTER")}</div>
					</div>

					<div className="main-header-language border-color-gray">
						{I18.f("LANGUAGE")}
						<select defaultValue={I18.currentLocale} onChange={this.changeLanguage}>
							{
								languages.map((item) => {
									return (
										<option key={"localization_" + item.lang} value={item.lang}>
											{item.name}
										</option>
									)
								})
							}
						</select>
					</div>
				</div>
			</div>
		);
	}
}

export default MainHeader;
import * as React from 'react';

import { Observer, GLOBAL_EVENT } from '../Observer';
import I18 from '../utils/I18';
import { PackResultsData } from 'types';
import TypedObserver from 'TypedObserver';

import { formatBytes } from '../utils/common';

(globalThis as any).formatBytes = formatBytes;

type StatsInfoEvent = {
	packResults: PackResultsData[];
}

export type RepackInfoEvent = {
	width: number;
	height: number;
	totalFrames: number;
}

interface Props {}

interface State {
	info: StatsInfoEvent;
	repackInfo: RepackInfoEvent;
	si: number;
}

class StatsInfo extends React.Component<Props, State> {
	constructor(props:Props) {
		super(props);

		this.state = {
			info: {
				packResults: []
			},
			repackInfo: null,
			si: 1024
		};
	}

	componentDidMount = () => {
		TypedObserver.statsInfoUpdated.on(this.updateStatsInfo, this);
		TypedObserver.siUnitsChanged.on(this.setSI, this);
		TypedObserver.repackInfo.on(this.updateRepackInfo, this);
	}

	componentWillUnmount = () => {
		TypedObserver.statsInfoUpdated.off(this.updateStatsInfo, this);
		TypedObserver.siUnitsChanged.off(this.setSI, this);
		TypedObserver.repackInfo.off(this.updateRepackInfo, this);
	}

	updateStatsInfo = (statsInfo: StatsInfoEvent) => {
		this.setState({ info: statsInfo });
	};

	setSI = (si: number) => {
		this.setState({ si });
	};

	updateRepackInfo = (repackInfo: RepackInfoEvent) => {
		this.setState({ repackInfo });
	};

	render() {
		let sizes = this.state.info.packResults.map((res) => ({ width: res.renderer.width, height: res.renderer.height }));
		let ramUsage = sizes.reduce((acc, res) => acc + res.width * res.height * 4, 0);
		let sizeText = sizes.map((res) => res.width + "x" + res.height).join(" + ");
		let ramText = formatBytes(ramUsage, 3, this.state.si);
		let ramTitle = "";
		let savingText = <></>;
		if (sizes.length === 0) {
			sizeText = "? x ?";
			ramText = "? B";
		} else {
			let repackInfo = this.state.repackInfo;
			if (repackInfo) {
				var oldUsage = (repackInfo.width * repackInfo.height * 4);
				var savedRamPercent = (ramUsage-oldUsage) / oldUsage;
				let savePercentTxt = (savedRamPercent * 100).toFixed(2);
				if(savedRamPercent > 0) savePercentTxt = "+" + savePercentTxt;
				let saveTxt = " (" + savePercentTxt + "%)";
				let color = savedRamPercent < 0 ? "#00FF00" : "#FF0000";
				savingText = <span style={{color}}>{saveTxt}</span>;

				ramTitle = formatBytes(oldUsage, 3, this.state.si) + " -> " + formatBytes(ramUsage, 3, this.state.si);
			}
		}

		return (
			<div className="stats-info">
				<div className="stats-info-item">
					<div className="stats-info-label">{I18.f("STATS_SIZE")}</div>
					<div className="stats-info-value">{sizeText}</div>
				</div>
				<div className="stats-info-item">
					<div className="stats-info-label">{I18.f("STATS_RAM")}</div>
					<div className="stats-info-value" title={ramTitle}>{ramText}{savingText}</div>
				</div>
			</div>
		);
	}
}

export default StatsInfo;
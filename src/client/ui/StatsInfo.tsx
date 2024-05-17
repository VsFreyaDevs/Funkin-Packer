import * as React from 'react';

import { Observer, GLOBAL_EVENT } from '../Observer';
import I18 from '../utils/I18';
import { PackResultsData } from 'types';

function formatBytes(bytes: number, decimals: number = 2, si: number = 1024) {
	if (bytes === 0) return '0 B';

	const k = si;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / k**i).toFixed(dm)) + ' ' + sizes[i];
}
(globalThis as any).formatBytes = formatBytes;

type StatsInfoEvent = {
	packResults: PackResultsData[];
}

interface Props {}

interface State {
	info: StatsInfoEvent;
	si: number;
}

class StatsInfo extends React.Component<Props, State> {
	constructor(props:Props) {
		super(props);

		this.state = {
			info: {
				packResults: []
			},
			si: 1024
		};
	}

	componentDidMount = () => {
		Observer.on(GLOBAL_EVENT.STATS_INFO, this.updateStatsInfo, this);
		Observer.on(GLOBAL_EVENT.STATS_INFO_SET_SI, this.setSI, this);
	}

	componentWillUnmount = () => {
		Observer.off(GLOBAL_EVENT.STATS_INFO, this.updateStatsInfo, this);
		Observer.off(GLOBAL_EVENT.STATS_INFO_SET_SI, this.setSI, this);
	}

	updateStatsInfo = (statsInfo: StatsInfoEvent) => {
		this.setState({ info: statsInfo });
	};

	setSI = (si: number) => {
		this.setState({ si });
	};

	render() {
		let sizes = this.state.info.packResults.map((res) => ({ width: res.renderer.width, height: res.renderer.height }));
		let ramSize = sizes.reduce((acc, res) => acc + res.width * res.height * 4, 0);
		let sizeText = sizes.map((res) => res.width + "x" + res.height).join(" + ");
		let ramText = formatBytes(ramSize, 3, this.state.si);
		if (sizes.length === 0) {
			sizeText = "? x ?";
			ramText = "? B";
		}

		return (
			<div className="stats-info">
				<div className="stats-info-item">
					<div className="stats-info-label">{I18.f("STATS_SIZE")}</div>
					<div className="stats-info-value">{sizeText}</div>
				</div>
				<div className="stats-info-item">
					<div className="stats-info-label">{I18.f("STATS_RAM")}</div>
					<div className="stats-info-value">{ramText}</div>
				</div>
			</div>
		);
	}
}

export default StatsInfo;
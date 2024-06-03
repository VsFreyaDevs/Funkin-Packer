import * as React from 'react';
import { Observer, GLOBAL_EVENT } from '../Observer';
import TextureView from './TextureView';
import SpritesPlayer from './SpritesPlayer';
import I18 from '../utils/I18';
import { PackResultsData } from 'types';
import TypedObserver from 'TypedObserver';
import { StatsInfoEvent } from './StatsInfo';

interface Props {}

const valTextureBackColors = ["grid-back", "white-back", "pink-back", "black-back"] as const;
type TextureBack = typeof valTextureBackColors;

interface State {
	packResult: PackResultsData[];
	textureBack: TextureBack[number];
	displayOutline: boolean;
	selectedImages: string[];
	playerVisible: boolean;
	scale: number;
}

class PackResults extends React.Component<Props, State> {
	readonly spritesPlayerRef: React.RefObject<SpritesPlayer>;
	readonly rangeRef: React.RefObject<HTMLInputElement>;
	readonly wheelRef: React.RefObject<HTMLInputElement>;
	readonly textureBackColors: TextureBack;
	step: number;

	constructor(props: Props) {
		super(props);

		this.spritesPlayerRef = React.createRef();
		this.rangeRef = React.createRef();
		this.wheelRef = React.createRef();

		this.textureBackColors = valTextureBackColors;
		this.step = 0.01;

		this.state = {
			packResult: null,
			textureBack: this.textureBackColors[0],
			displayOutline: false,
			selectedImages: [],
			playerVisible: false,
			scale: 1
		};
	}

	componentDidMount = () => {
		this.wheelRef.current.addEventListener('wheel', this.handleWheel, { passive: false });

		TypedObserver.packComplete.on(this.updatePackResult, this);
		TypedObserver.imagesListSelectedChanged.on(this.onImagesSelected, this);
	}

	onImagesSelected = (data: string[]) => {
		this.setState({selectedImages: data});
	}

	updatePackResult = (data: StatsInfoEvent) => {
		//console.log(data);
		TypedObserver.statsInfoUpdated.emit({
			packResults: data.packResults,
			usedPacker: data.usedPacker
		})
		this.setState({packResult: data.packResults});
	}

	setBack = (e: React.MouseEvent<HTMLDivElement>) => {
		const classNames = (e.target as HTMLDivElement).className.split(" ") as TextureBack[number][];
		for(const name of classNames) {
			if(this.textureBackColors.indexOf(name) >= 0) {
				this.setState({textureBack: name});
				return;
			}
		}
	}

	clearSelection = () => {
		if(this.state.playerVisible) return;

		Observer.emit(GLOBAL_EVENT.IMAGE_CLEAR_SELECTION);
	}

	handleWheel = (e: WheelEvent) => {
		if(!e.ctrlKey) return;

		let value = this.state.scale;
		if (e.deltaY >= 0) {
			if (this.state.scale > 0.1) {
				value = Number((this.state.scale - this.step).toPrecision(2));
				if (value < 0.1) {
					value = 0.1;
				}
				this.setState({scale: value});
			}
		} else {
			if (this.state.scale < 2) {
				value = Number((this.state.scale + this.step).toPrecision(2));
				this.setState({scale: value});
			}
		}

		// update range component
		this.rangeRef.current.value = value.toString(10);

		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	changeOutlines = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({displayOutline: e.target.checked});
	}

	changeScale = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({scale: Number(e.target.value)});
	}

	toggleSpritesPlayer = () => {
		this.setState({playerVisible: !this.state.playerVisible});
	}

	render() {
		const views = [];
		let ix=0;
		if(this.state.packResult) {
			for (const item of this.state.packResult) {
				views.push((
					<TextureView key={"tex-view-" + ix} data={item} scale={this.state.scale} textureBack={this.state.textureBack} selectedImages={this.state.selectedImages} displayOutline={this.state.displayOutline} />
				));
				ix++;
			}
		}

		return (
			<div className="results-view border-color-gray">

				<div className="results-view-wrapper">

					<div ref={this.wheelRef} className="results-view-container back-white" onClick={this.clearSelection}>
						<div className={this.state.playerVisible ? "block-hidden" : "block-visible"}>
							{views}
						</div>
						<div className={!this.state.playerVisible ? "block-hidden" : "block-visible"}>
							<SpritesPlayer ref={this.spritesPlayerRef} data={this.state.packResult} start={this.state.playerVisible} textureBack={this.state.textureBack} />
						</div>
					</div>

					<div className="results-view-footer back-white border-color-gray">

						<hr/>

						<table>
							<tbody>
								<tr>
									{this.textureBackColors.map(name => {
										return (
											<td key={"back-color-btn-" + name}>
												<div className={"btn-back-color " + name + (this.state.textureBack === name ? " selected" : "")} onClick={this.setBack}>&nbsp;</div>
											</td>
										)
									})}
									<td>
										{I18.f("DISPLAY_OUTLINES")}
									</td>
									<td>
										<input type="checkbox" id="result-view-outline" onChange={this.changeOutlines} />
									</td>
									<td>
										{I18.f("SCALE")}
									</td>
									<td style={{width: "50%"}}>
										<input ref={this.rangeRef} style={{width: "100%"}} type="range" min="0.1" max="4" step={this.step} defaultValue="1" onChange={this.changeScale}/>
									</td>
									<td>
										<div className="btn back-800 border-color-gray color-white" onClick={this.toggleSpritesPlayer}>{I18.f("SHOW_SPRITES")}</div>
									</td>
								</tr>
								</tbody>
							</table>
					</div>

				</div>
			</div>
		);
	}
}

export default PackResults;
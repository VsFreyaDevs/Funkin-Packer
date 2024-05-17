import React from 'react';
import ReactDOM from 'react-dom';
import I18 from '../utils/I18';
import { Observer, GLOBAL_EVENT } from "../Observer";
import {cleanPrefix, smartSortImages} from '../utils/common';

class SpritesPlayer extends React.Component {

	constructor(props) {
		super(props);

		this.fpsRef = React.createRef();
		this.speedRef = React.createRef();
		this.bufferRef = React.createRef();
		this.viewRef = React.createRef();
		this.playerContainerRef = React.createRef();
		this.containerRef = React.createRef();

		this.textures = [];

		this.currentTextures = [];
		this.currentFrame = 0;

		this.width = 0;
		this.height = 0;

		this.updateTimer = null;

		this.selectedImages = [];
	}

	componentDidMount = () => {
		Observer.on(GLOBAL_EVENT.IMAGES_LIST_SELECTED_CHANGED, this.onImagesSelected, this);

		if(this.props.start) this.setup();
		else this.stop();
	}

	componentWillUnmount = () => {
		this.stop();
	}

	onImagesSelected = (list=[]) => {
		this.selectedImages = list;
		this.updateCurrentTextures();
	}

	componentDidUpdate = () => {
		if(this.props.start) this.setup();
		else this.stop();
	}

	setup = () => {
		this.playerContainerRef.current.className = "player-view-container " + this.props.textureBack;

		this.textures = [];

		if(!this.props.data) return;

		this.width = 0;
		this.height = 0;

		for(let part of this.props.data) {
			let baseTexture = part.buffer;

			for (let config of part.data) {
				var w = config.sourceSize.mw;
				var h = config.sourceSize.mh;

				//console.log(w, h, config, config.sourceSize);

				if (this.width < w) this.width = w;
				if (this.height < h) this.height = h;

				this.textures.push({
					config: config,
					baseTexture: baseTexture
				});
			}
		}

		if(this.width < 256) this.width = 256;
		if(this.height < 200) this.height = 200;

		let canvas = this.viewRef.current;
		canvas.width = this.width;
		canvas.height = this.height;

		this.updateCurrentTextures();
	}

	forceUpdate = (e) => {
		let key = e.keyCode || e.which;
		if(key === 13) this.updateCurrentTextures();
	}

	onSpeedChange = (e) => {
		this.fpsRef.current.textContent = e.target.value + " fps";
	}

	updateCurrentTextures = () => {
		let textures = [];

		for(let tex of this.textures) {
			if(!tex.config.cloned && this.selectedImages.indexOf(tex.config.file) >= 0) {
				textures.push(tex);
			}

			if(tex.config.cloned && this.selectedImages.indexOf(tex.config.originalFile) >= 0) {
				textures.push(tex);
			}
		}

		textures = textures.sort((a, b) => {
			return smartSortImages(a.config.name, b.config.name);
		});

		this.currentTextures = textures;
		this.currentFrame = 0;
		this.update(true);
	}

	update = (skipFrameUpdate) => {
		clearTimeout(this.updateTimer);

		if(!skipFrameUpdate){
			this.currentFrame++;
			if(this.currentFrame >= this.currentTextures.length) {
				this.currentFrame = 0;
			}
		}
		this.renderTexture();

		this.updateTimer = setTimeout(this.update, 1000 / this.speedRef.current.value);
	}

	renderTexture = () => {
		let ctx = this.viewRef.current.getContext("2d");

		ctx.clearRect(0, 0, this.width, this.height);

		let texture = this.currentTextures[this.currentFrame];
		if(!texture) return;

		console.log(texture.config);

		//var w = Math.max(texture.config.sourceSize.mw, texture.config.sourceSize.w);
		//var h = Math.max(texture.config.sourceSize.mh, texture.config.sourceSize.h);
		var w = texture.config.sourceSize.mw;
		var h = texture.config.sourceSize.mh;

		let buffer = this.bufferRef.current;
		buffer.width = w;
		buffer.height = h;

		let bufferCtx = buffer.getContext("2d");
		bufferCtx.clearRect(0, 0, w, h);

		let x = this.width/2, y = this.height/2;

		if(texture.config.rotated) {
			bufferCtx.save();

			bufferCtx.translate(texture.config.spriteSourceSize.x + texture.config.spriteSourceSize.w/2, texture.config.spriteSourceSize.y + texture.config.spriteSourceSize.h/2);
			bufferCtx.rotate(-Math.PI/2);

			bufferCtx.drawImage(texture.baseTexture,
				texture.config.frame.x, texture.config.frame.y,
				texture.config.frame.h, texture.config.frame.w,
				-texture.config.spriteSourceSize.h/2, -texture.config.spriteSourceSize.w/2,
				texture.config.spriteSourceSize.h, texture.config.spriteSourceSize.w);

			bufferCtx.restore();
		}
		else {
			bufferCtx.drawImage(texture.baseTexture,
				texture.config.frame.x, texture.config.frame.y,
				texture.config.frame.w, texture.config.frame.h,
				texture.config.spriteSourceSize.x, texture.config.spriteSourceSize.y,
				texture.config.spriteSourceSize.w, texture.config.spriteSourceSize.h);
		}

		ctx.drawImage(buffer,
			0, 0,
			w, h,
			x - w/2, y - h/2,
			w, h);
	}

	stop = () => {
		clearTimeout(this.updateTimer);
	}

	render() {
		return (
			<div ref={this.containerRef} className="player-container">
				<div className="player-window border-color-gray">
					<div ref={this.playerContainerRef}>
						<canvas ref={this.viewRef}> </canvas>
						<canvas ref={this.bufferRef} className="player-buffer"> </canvas>
					</div>
					<div>
						<table>
							<tbody>
							<tr>
								<td>
									{I18.f("ANIMATION_SPEED")}
								</td>
								<td>
									<input type="range" ref={this.speedRef} max="60" min="1" defaultValue="24" onChange={this.onSpeedChange}/>
								</td>
								<td>
									<div ref={this.fpsRef} className="player-fps">24 fps</div>
								</td>
							</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		)
	}

}

export default SpritesPlayer;
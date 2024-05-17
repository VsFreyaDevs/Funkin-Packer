import * as React from 'react';
import { Observer, GLOBAL_EVENT } from "../Observer";
import { PropsWithChildren } from 'react';

export interface TreeListItem {
	isFolder: boolean;
	path: string;
	name: string;
	selected: boolean;
	current: boolean;
	img: HTMLImageElement;
	items?: TreeListItem[];
}

interface TreeItemProps {
	data: TreeListItem;
	items?: TreeListItem[];
}

class ItemTreePart extends React.Component<TreeItemProps> {

	constructor(props: TreeItemProps) {
		super(props);
	}

	render() {
		if(!this.props || !this.props.items.length) {
			return (<span>&nbsp;</span>);
		}

		return (
			<div>
				{this.props.items.map((item) => {
					let key = item.path;

					if(item.isFolder) {
						return (
							<ItemTreeView key={"tree-folder-" + key} data={item}>
								<ItemTreePart data={item}/>
							</ItemTreeView>
						);
					}

					return (
						<ItemTreeItem key={"tree-item-" + key} data={item}/>
					);
				})}
			</div>
		);
	}
}

class ItemTreeItem extends React.Component<TreeItemProps> {
	constructor(props:TreeItemProps) {
		super(props);
	}

	onSelect = (e: React.MouseEvent<HTMLDivElement>) => {
		Observer.emit(GLOBAL_EVENT.IMAGE_ITEM_SELECTED, {
			isFolder: false,
			path: this.props.data.path,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey
		});

		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	render() {
		return (
			<div className={"image-list-item" + (this.props.data.selected ? " back-400" : "") + (this.props.data.current ? " image-list-item-current" : "")} onClick={this.onSelect} >
				<div className="image-list-image-container">
					<img src={this.props.data.img.src} className="image-list-image" />
				</div>
				<div className="image-list-name-container">
					{this.props.data.name}
				</div>
			</div>
		);
	}
}

interface TreeViewState {
	collapsed: boolean;
}

class ItemTreeView extends React.Component<PropsWithChildren<TreeItemProps>, TreeViewState> {

	constructor(props: PropsWithChildren<TreeItemProps>) {
		super(props);

		this.state = {
			collapsed: false
		};
	}

	handleCollapse = (e: React.MouseEvent<HTMLDivElement>) => {
		this.setState({collapsed: !this.state.collapsed});

		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		Observer.emit(GLOBAL_EVENT.IMAGE_ITEM_SELECTED, {
			isFolder: true,
			path: this.props.data.path,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey
		});

		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	render() {
		let collapsed = this.state.collapsed;
		let label = this.props.data.name;
		let children = this.props.children;

		let arrowClass = 'tree-view-arrow';
		let containerClass = 'tree-view-children';
		if (collapsed) {
			arrowClass += ' tree-view-arrow-collapsed';
			containerClass += ' tree-view-children-collapsed';
		}

		let arrow = (<div className={arrowClass} onClick={this.handleCollapse}/>);
		let folderIcon = (<div className="tree-view-folder"></div>);

		return (
			<div className="tree-view" onClick={this.handleClick}>
				<div className={'tree-view-item' + (this.props.data.selected ? " back-400" : "")}>
					{arrow}
					{folderIcon}
					{label}
				</div>
				<div className={containerClass}>
					{children}
				</div>
			</div>
		);
	}
}

export default ItemTreePart;
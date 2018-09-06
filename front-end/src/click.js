import React from 'react';
import './index.css';
import openSocket from 'socket.io-client';

class Clicker extends React.Component {
	constructor() {
		super();
		this.state = {
			current: 0,
			total: 0,
			clicks: 0,
			socket: openSocket('http://localhost:9000')
		}
		let self = this
		this.state.socket.on('update', update => {
			this.setState(...self.state, {current: update.current, total: update.total})
		});
	};

	

	handleAdd(){
		this.state.socket.emit('add', '');
	}

	handleRemove(){
		this.state.socket.emit('remove', '');
	}
	

	render(){
		return(
			<div className="Clicker">
				<header className="Clicker-header">
					<h1 className="Clicker-title">Fysiksektionens Digitala Clicker</h1>
				</header>
				<div className="InfoBar-Top">
					Guests: {this.state.current}
				</div>
				<div className="Body">
					<div className="BodyFiller">
					</div>
					<div className="BodyButtons">
					<button className="Add" onClick = {() => this.handleAdd()}>Add</button>
					<button className="Remove" onClick = {() => this.handleRemove()}>Remove</button>
					</div>
					<div className="BodyFiller">
					</div>
				</div>
				<div className="InfoBar-Bot">
					Total guests: {this.state.total}
				</div>
			</div>
		);
	};
} //

export default Clicker
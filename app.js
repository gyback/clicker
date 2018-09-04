/* Source: https://blog.logrocket.com/beyond-rest-using-websockets-for-two-way-communication-in-your-react-app-884eff6655f5
https://gitlab.com/the-gigi/connect4/blob/master/client/src/App.js
https://gitlab.com/the-gigi/connect4/blob/master/server.js
*/
var express = require('express');
const io = require('socket.io')();
const app = express();

const PORT = process.env.PORT || 4001;
const socketPort = process.env.PORT || 8080;

let guests = {
	current: 0,
	total: 0
	};

io.on('connection', function (socket) {	
	socket.emit('update', guests)	

	socket.on('add', function (add){
		guests.current = guests.current + 1
		guests.total = guests.total + 1
		console.log('Guests/Total: ' + guests.current +'/' + guests.total)

		io.emit('update', guests)
	})

	socket.on('remove', function (remove){
		if(guests.current){
			guests.current = guests.current - 1

		io.emit('update', guests)
		}
	})

})


io.listen(socketPort)
console.log('Socket listening on port '+ socketPort + '...')
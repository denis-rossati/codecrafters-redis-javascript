const net = require('net');

function parseEcho(message) {
	return message.replace(/^ECHO\s+"/i, '').replace(/"$/, '');
}


function parseOperator() {

}

function parseMessage(message, position = 0) {
	return message;
}


const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		if (data !== undefined) {
			socket.write(parseMessage(data.toString()));
		} else {
			socket.write('+PONG\r\n')
		}

		socket.end();
	});
});

server.listen(6379, '127.0.0.1', undefined);

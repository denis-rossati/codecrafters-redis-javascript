const net = require('net');

const server = net.createServer((connection) => {
	connection.on('data', (data) => {
		if (data !== undefined) {
			connection.write(`+${data}\r\n`);
		} else {
			connection.write(`+PONG\r\n`);
		}
		connection.end();
	})
});

server.listen(6379, "127.0.0.1");

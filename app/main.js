const net = require('net');

function parseString(message) {

}

function parseErrors() {

}

function parseIntegers() {

}

function parseBulkStrings(message, socket) {
	let strSize;
	let parsedMessage = '+';

	if (message.startsWith('$')) {
		message = message.replace(/^\$/, '');
	} else {
		throw new Error('Bulk string doesn\'t start with length size indicator');
	}

	if (/^\d+\r\n/.test(message)) {
		strSize = message.match(/^d+/)[0];
		// \r\nFOO\r\n -> FOO
		let strContent = parseLineBreak(message).match(/^.+\r\n/)[0].slice(0, -2);

		if (strContent.length !== parseInt(strSize)) {
			throw new Error('Bulk string doesn\'t start with length size digit');
		}

		if (true) {

		}

		parsedMessage = `${strContent}\r\n`;
	}

	return parsedMessage;
}

function parseArray(message, socket) {
	const arrSize = parseInt(message[1]);
	const arr = [];

	message = parseLineBreak(message.replace(/^\*\d/, ''));
	console.log(message);
	for(let index = 0; index < arrSize; index += 1) {
		parseValue(message, socket);
	}
}

function parseLineBreak(message) {
	if (/^\\r\\n/.test(message)) {
		throw new Error('Parsing line break failed')
	}

	return message.replace(/^\\r\\n/, '');
}

function parseValue(message, socket) {
	const commands = {
		'ping': () => '',
	}

	const operators = {
		'+': parseString,
		'-': parseErrors,
		':': parseIntegers,
		'$': parseBulkStrings,
		'*': parseArray,
		'\r\n': parseLineBreak,
	}

	const operator = message[0];
	return operators[operator](message, socket, commands);
}

function parseMessage(message, socket) {
	return parseValue(message, socket);
}


const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		if (data !== undefined) {
			if (data.toString().trim() === 'PING') {
				socket.write('+PONG\r\n');
			} else {
				parseMessage(data.toString(), socket);
			}
		}
	});
});

server.listen(6379, '127.0.0.1');

// parseMessage('"*1\\r\\n$4\\r\\nping\\r\\n');
// console.log(parseMessage('*2\\r\\n$4\\r\\nECHO\\r\\n$3\\r\\nhey\\r\\n'))

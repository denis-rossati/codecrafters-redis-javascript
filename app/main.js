const net = require('net');


function parseString(message) {

}

function parseErrors() {

}

function parseIntegers() {

}

function parseBulkStrings(message) {
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

		parsedMessage = `${strContent}\r\n`;
	}

	return parsedMessage;
}

function parseArray() {

}

function parseLineBreak(message) {
	if (/^\r\n/.test(message)) {
		throw new Error('Parsing line break failed')
	}

	return message.replace(/^\r\n/, '');
}

function parseValue(message) {
	const operators = {
		'+': parseString,
		'-': parseErrors,
		':': parseIntegers,
		'$': parseBulkStrings,
		'*': parseArray,
		'\r\n': parseLineBreak,
	}

	const operator = message[0];
	return operators[operator](message);
}

function parseMessage(message) {
	return parseValue(message);
}


const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		if (data !== undefined) {
			socket.write('+PONG\r\n');
		}
		socket.end();
	});
});

server.listen(6379, '127.0.0.1');

// +PONG\r\n
// parseMessage('"*1\\r\\n$4\\r\\nping\\r\\n');

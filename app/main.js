const net = require('net');

/*
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
*/

function getCommand(message) {
	const firstBulkString = message.match(/.+\s\n.+\s\n.+/)[0];
	return firstBulkString.match(/\w+$/)[0];
}

function hasCommandStatement(message) {
	try {
		getCommand(message);
		return true;
	} catch (e) {
		return false;
	}
}

function fetchEcho() {
	// TO-DO: Implement echo command.
}


function parseMessage(message) {
	let command;
	if (hasCommandStatement(message)) {
		command = getCommand(message).toLocaleLowerCase();
	} else {
		command = 'ping';
	}

	const commands = {
		'echo': fetchEcho,
		'ping': (_message) => '+PONG\r\n',
	};


	return commands[command](message);
}


const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		if (data !== undefined) {
			socket.write(parseMessage(data.toString()));
		}
	});
});

server.listen(6379, '127.0.0.1');

// parseMessage('"*1\\r\\n$4\\r\\nping\\r\\n');

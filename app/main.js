const net = require('net');

function parseString(message) {

}

function parseErrors() {

}

function parseIntegers() {

}

function parseBulkStrings(message, socket, commands) {
	let strSize;
	let parsedMessage = '+';

	if (message.startsWith('$')) {
		message = message.replace(/^\$/, '');
	} else {
		throw new Error('Bulk string doesn\'t start with length size indicator');
	}
	if (/^\d+\r\n/.test(message)) {
		strSize = message.match(/^\d+/)[0];
		message = parseLineBreak(message.replace(/^\d+/, ''));
		// \r\nFOO\r\n -> FOO
		let strContent = parseLineBreak(message).match(/^\w+\r\n/)[0].slice(0, -2);

		if (strContent.length !== parseInt(strSize)) {
			throw new Error('Bulk string doesn\'t start with length size digit');
		}

		const command = Object.keys(commands).find((command) => strContent.toLowerCase().trim().startsWith(command));
		if (command) {
			commands[command](message, socket, commands);
		}

		parsedMessage = `${strContent}\r\n`;
	}

	return parseValue(parsedMessage, socket, message);
}

function parseArray(message, socket, commands) {
	const arrSize = parseInt(message[1]);

	message = parseLineBreak(message.replace(/^\*\d+/, ''));
	for (let index = 0; index < arrSize; index += 1) {
		parseValue(message, socket, commands);
	}
}

function parseLineBreak(message) {
	if (/^\r\n/.test(message)) {
		return message.replace(/^\r\n/, '');
	}

	return message;
}

function handleEcho(message, socket) {

}

function handlePing(message, socket) {
	socket.write('+PONG\r\n');
	message = parseLineBreak(message.replace(/^ping/, ''))
	return message;
}

function parseValue(message, socket, commands) {
	console.log(`Currently parse: ${JSON.stringify(message)}`)
	const command = Object.keys(commands).find((command) => message.toLowerCase().trim().startsWith(command));
	if (command) {
		commands[command](message, socket, commands);
	}

	const operators = {
		'+': parseString,
		'-': parseErrors,
		':': parseIntegers,
		'$': parseBulkStrings,
		'*': parseArray,
		'\r\n': parseLineBreak,
	}

	let operator = message[0].toLowerCase();
	const isUnknownOperator = Object.keys(operators).every((op) => operator !== op);
	if (isUnknownOperator) {
		message = `+${message}`;
		operator = '+';
	}

	return operators[operator](message, socket, commands);
}

function parseMessage(message, socket) {
	const commands = {
		'ping': handlePing,
		'echo': handleEcho,
	}

	const command = Object.keys(commands).find((command) => message.toLowerCase().trim().startsWith(command));
	if (command) {
		commands[command](message, socket, commands);
		message = message.replace(new RegExp(`^${command}`), '');
	}

	return parseValue(message, socket, commands);
}


const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		if (data !== undefined) {
			parseMessage(data.toString(), socket);
		}
	});
});

server.listen(6379, '127.0.0.1');

// parseMessage('"*1\\r\\n$4\\r\\nping\\r\\n');
// parseMessage('*1\r\n$4\r\nping\r\n');

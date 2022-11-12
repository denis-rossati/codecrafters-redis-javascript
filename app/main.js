const net = require('net');

function parseString(message, socket, commands) {
	message = message.replace(/^\+/, '');

	let strContent = message.match(/^\w+/)[0];
	message = message.replace(/^\w+/, '');

	const command = Object.keys(commands).find((command) => strContent.toLowerCase().trim().startsWith(command));
	if (command) {
		message = commands[command](message, socket, commands);
	}

	return parseValue(message, socket, commands);
}

function parseErrors() {

}

function parseIntegers() {

}

function parseBulkStrings(message, socket, commands) {
	message = message.replace(/^\$/, '');

	if (!/^\d+/.test(message)) {
		return;
	}

	const strSize = message.match(/^\d+/)[0];
	message = parseLineBreak(message.replace(/^\d+/, ''));

	let strContent = parseLineBreak(message.match(/^\w+/)[0]);
	parseLineBreak(message.replace(/^\w+/, ''));

	if (strContent.length !== parseInt(strSize)) {
		return;
	}

	const command = Object.keys(commands).find((command) => strContent.toLowerCase().trim().startsWith(command));
	if (command) {
		commands[command](message, socket, commands);
	}

	return parseValue(message, socket, commands);
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
	message = parseLineBreak(message.replace(/^echo/, ''));
	socket.write(message.match(/^\w/)[0]);
	message = message.replace(/^\w/, '')
	return message;
}

function handlePing(message, socket) {
	socket.write('+PONG\r\n');
	message = parseLineBreak(message.replace(/^ping/, ''))
	return message;
}

function parseValue(message, socket, commands) {
	console.log(`Currently parse: ${message}`);

	if (message === '') {
		return;
	}

	const command = Object.keys(commands).find((command) => message.toLowerCase().trim().startsWith(command));
	if (command) {
		commands[command](message, socket, commands);
	}

	const operators = {
		'$': parseBulkStrings,
		'+': parseString,
		'-': parseErrors,
		':': parseIntegers,
		'*': parseArray,
	}

	let operator = message[0].toLowerCase();

	const isUnknownOperator = Object.keys(operators).every((op) => operator !== op) && message !== '';
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

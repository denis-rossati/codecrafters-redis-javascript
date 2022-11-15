const net = require('net');

function parseString(message, socket, commands) {
	message = parseLineBreak(message.replace(/^\+/, ''));

	let strContent = message.match(/^\w+/)[0];
	message = message.replace(/^\w+/, '');

	const command = Object.keys(commands).find((command) => strContent.toLowerCase().trim().split(' ')[0] === command);
	if (command) {
		message = commands[command](message, socket, commands);
	} else {
		socket.write(strContent);
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

	let strContent = message.match(/^\w+/)[0];
	parseLineBreak(message.replace(/^\w+/, ''));

	if (strContent.length !== parseInt(strSize)) {
		return;
	}

	const command = Object.keys(commands).find((command) => strContent.toLowerCase().trim().startsWith(command));
	if (command) {
		message = commands[command](message, socket, commands);
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

	if (/^\\r\\n/.test(message)) {
		return message.replace(/^\\r\\n/, '');
	}

	return message;
}

function handleEcho(message, socket) {
	message = parseLineBreak(parseLineBreak(message.replace(/^echo/, '')).replace(/\$\d+/, ''));
	const strContent = message.match(/^\w+/)[0];
	socket.write(strContent);
	message = message.replace(/^\w+/, '')
	return message;
}

function handlePing(message, socket) {
	socket.write('+PONG\r\n');
	message = parseLineBreak(message.replace(/^ping/, ''))
	return message;
}

function parseValue(message, socket, commands) {

	message = parseLineBreak(message);

	const command = Object.keys(commands).find((command) => message.toLowerCase().trim().split(' ')[0] === command);
	if (command) {
		message = commands[command](message, socket, commands);
	}

	if (message === '') {
		return;
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

	parseValue(message, socket, commands);
}


const server = net.createServer((socket) => {
	socket.on('data', (data) => {
		if (data !== undefined) {
			console.log('message received: ' + data.toString());
			parseMessage(data.toString(), socket);
		}
	});
});

server.listen(6379, '127.0.0.1');

parseMessage(`*2\r\n$4\r\necho\r\n$5\r\nworld`, {write: (message) => console.log(message)});

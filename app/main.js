const net = require('net');

const map = {};

function parseString(message, socket, commands) {
	message = parseLineBreak(message.replace(/^\+/, ''));

	let strContent = message.match(/^\w+/)[0];
	message = message.replace(/^\w+/, '');

	const command = Object.keys(commands).find((command) => strContent.toLowerCase().trim().split(' ')[0] === command);
	if (command) {
		message = commands[command](message, socket, commands);
	} else {
		socket.write(`+${strContent}\r\n`);
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
		message = parseValue(message, socket, commands);
	}

	return message;
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
	socket.write(`+${strContent}\r\n`);
	message = message.replace(/^\w+/, '')
	return message;
}

function handlePing(message, socket) {
	socket.write('+PONG\r\n');
	message = parseLineBreak(message.replace(/^ping/, ''))
	return message;
}

function parseValue(message, socket, commands) {

	const command = Object.keys(commands).find((command) => message.toLowerCase().trim().split(' ')[0] === command);
	if (command) {
		message = commands[command](message, socket, commands);
	}

	if (message === '') {
		return '';
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

function handleSet(message, socket) {
	message = parseLineBreak(message.replace(/^set/, ''));

	message = parseLineBreak(message.replace(/^\$\d+/, ''));

	const key = message.match(/^\w+/)[0];

	message = parseLineBreak(message.replace(/^\w+/, ''));

	message = parseLineBreak(message.replace(/^\$\d+/, ''));

	const value = message.match(/^\w+/)[0];

	message = parseLineBreak(message.replace(/^\w+/, ''));

	if(!map[socket.id.toString()]) {
		map[socket.id.toString()] = {};
	}

	map[socket.id.toString()][key] = value;

	message = parseLineBreak(message.replace(/^\$\d+/, ''));

	const hasPxArgument = /^px\r\n/.test(message);

	if(hasPxArgument) {
		message = parseLineBreak(message.replace(/^px/, ''));
		message = parseLineBreak(message.replace(/^\$\d+/, ''));

		const expiration = parseInt(message.match(/^\d+/));

		message = parseLineBreak(message.replace(/^\d+/, ''));

		setTimeout(() => {
			delete map[socket.id.toString()][key];
		}, expiration)
	}

	socket.write('+OK\r\n');

	return message;
}

function handleGet(message, socket) {
	message = parseLineBreak(message.replace(/^get/, ''));

	message = parseLineBreak(message.replace(/^\$\d+/, ''));

	const key = message.match(/^\w+/)[0];

	const value = map[socket.id.toString()][key];
	if (value) {
		socket.write(`+${value}\r\n`)
	} else {
		socket.write(`+null\r\n`);
	}

	message = parseLineBreak(message.replace(/^\w+/, ''));

	return message;
}

function parseMessage(message, socket) {
	const commands = {
		'ping': handlePing,
		'echo': handleEcho,
		'set': handleSet,
		'get': handleGet,
	}

	parseValue(message, socket, commands);
}

let id = 0;

const server = net.createServer((socket) => {
	socket.id = id;
	id += 1;

	socket.on('data', (data) => {
		if (data !== undefined) {
			parseMessage(data.toString(), socket);
		}
	});
});

server.listen(6379, '127.0.0.1');

// parseMessage(`*5\r\n$3\r\nset\r\n$4\r\nheya\r\n$4\r\ndefg\r\n$2\r\npx\r\n$3\r\n100`, {write: (message) => console.log(message), id: 1});


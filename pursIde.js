const net = require('net');
const { spawn } = require('child_process');

let ideConn = null;

exports.startIDE = function () {
	ideConn = spawn("purs", ["ide", "server", "-p", "9999"]);
}

exports.stopIDE = function () {
	ideConn.kill();
}

exports.execIDE = function (command) {
	return new Promise((resolve, reject) => {
		let client = new net.Socket();

		let json = "";

		client.connect(9999, "localhost", () => {
			client.write(JSON.stringify(command));
			client.end();
		});

		client.on('data', data => {
			json = `${json}${data.toString('utf8')}`;
		});

		client.on('end', _ => {
			resolve(JSON.parse(json.toString("utf8")));
		});

		client.on('error', event => {
			reject(event);
		})
	});
};

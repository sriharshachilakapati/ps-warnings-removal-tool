exports.log = function (msg, percentage = -1) {
	let time = (new Date()).toLocaleTimeString();
	process.stdout.write(`${" ".repeat(process.stdout.columns)}\r`);

	if (percentage === 100)
		console.log(`${time}: ${msg} -- {${percentage}%}`);
	else if (percentage === -1)
		console.log(`${time}: ${msg}`);
	else
		process.stdout.write(`${time}: ${msg} -- {${percentage}%}\r`);
};

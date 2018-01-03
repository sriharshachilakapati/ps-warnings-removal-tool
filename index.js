#!/usr/bin/env node
const fs = require('fs');
const net = require('net');
const { log } = require('./progressLogger');
const { execIDE, startIDE, stopIDE } = require('./pursIde');

if (process.argv.length > 2)
	process.chdir(process.argv[2]);

function getAllSourceFiles(parentDir = "src/") {
	let files = [];

	fs.readdirSync(parentDir).forEach(file => {
		let path = `${parentDir}${file}`;
		if (fs.statSync(path).isDirectory()) {
			getAllSourceFiles(`${path}/`).forEach(f => {
				files.push(f);
			});
		} else {
			files.push(path);
		}
	});

	return files.filter(file => /\.purs$/.test(file));
}

async function main() {
	let files = getAllSourceFiles();
	let results = new Map();

	log("Loading existing modules", 0);
	await execIDE({ "command": "load" });
	log("Loading existing modules", 100);

	log(`Found ${files.length} source files to check for. Rebuilding files.`);

	for (let i = 0; i < files.length; i++) {
		let file = files[i];

		log(`Rebuilding file ${i + 1}/${files.length}`, ((i / files.length) * 100) | 0);

		let cmd = {
			command: "rebuild",
			params: {
				"file": file
			}
		};

		let result = await execIDE(cmd);

		if (result.result.length !== 0)
			results.set(file, result);
	}

	log(`Rebuilding file ${files.length}/${files.length}`, 100);
	log(`Found ${results.size} files with warnings. They are as follows:`);

	for (file of results.keys()) {
		log(`[${results.get(file).result.length} warnings] ${file}`);
	}
}

(async function() {
	try {
		startIDE();
		await main();
		stopIDE();
	} catch (e) {
		console.log(e);
	}
})();

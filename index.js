#!/usr/bin/env node
const fs = require('fs');
const net = require('net');
const { log } = require('./progressLogger');
const { execIDE, startIDE, stopIDE } = require('./pursIde');

const { CodeEditor } = require('./codeEditor');

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

async function sleep(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), time);
	});
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

		if (result.resultType !== "success") {
			log(`Found ${result.result.length} errors in ${file}`);
			log("Cannot continue further when there are errors.");
			return;
		}

		if (result.result.length !== 0)
			results.set(file, result);
	}

	log(`Rebuilding file ${files.length}/${files.length}`, 100);
	log(`Found ${results.size} files with warnings. They are as follows:`);

	for (file of results.keys()) {
		log(`[${results.get(file).result.length} warnings] ${file}`);
	}

	log('Starting to correct the warnings on the sources.');

	for (let [file, result] of results.entries()) {
		let editor = new CodeEditor(file);

		result.result.sort((w1, w2) => {
			if (w1.position == null || w2.position == null)
				return 0;
			return w1.position.startLine - w2.position.startLine;
		});

		for (let i = 0; i < result.result.length; i++) {
			let warning = result.result[i];
			log(`Fixing warnings in ${file}`, ((i / result.result.length) * 100) | 0);

			if (warning.suggestion) {
				editor.replace(warning.suggestion.replaceRange, warning.suggestion.replacement);
			} else {
				switch (warning.errorCode) {
					case "DuplicateSelectiveImport":
						editor.replace(warning.position, "");
						break;
					default:
						log("Unknown warning. Please contact developers on how to fix.");
						log(JSON.stringify(warning, null, 4));
				}
			}
		}

		fs.writeFileSync(file, editor.getCode(), 'utf8');
		log(`Fixing warnings in ${file}`, 100);
	}
}

(async function() {
	try {
		startIDE();
		await sleep(1000);
		await main();
		stopIDE();
	} catch (e) {
		console.log(e);
	}
})();

#!/usr/bin/env node
const fs = require('fs');
const { log } = require('./progressLogger');
const { CodeEditor } = require('./codeEditor');
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
		let replacements = [];
		let unusedTypeVars = new Map();

		for (let i = 0; i < result.result.length; i++) {
			let warning = result.result[i];
			log(`Fixing warnings in ${file}`, ((i / result.result.length) * 100) | 0);

			if (warning.suggestion) {
				replacements.push( {
					range: warning.suggestion.replaceRange,
					string: warning.suggestion.replacement,
					cause: warning
				});
			} else {
				switch (warning.errorCode) {
					// case "DuplicateSelectiveImport":
					// 	replacements.push({
					// 		range: warning.position,
					// 		string: "",
					// 		cause: warning
					// 	});
					// 	break;

					case "UnusedTypeVar":
						let functionName = /in type declaration for (.+)\n/.exec(warning.message)[1];

						if (!unusedTypeVars.has(functionName)) {
							unusedTypeVars.set(functionName, []);
						}

						let varName = /variable (.+) is ambiguous/.exec(warning.message)[1];
						unusedTypeVars.get(functionName).push(varName);

						break;

					default:
						log("Unknown warning. Please contact developers on how to fix.");
						log(JSON.stringify(warning, null, 4));
				}
			}
		}

		for (let [functionName, unusedVars] of unusedTypeVars.entries()) {
			let range = editor.findTypeSignature(functionName);

			if (!range) {
				log(`Cannot find type signature for function ${functionName}. Missing something??`);
				continue;
			}

			let type = editor.select(range);
			let allVars = /::(.+\.)/.exec(type)[1];
			let restType = /\.(.*)/.exec(type)[1].trim();

			for (let unusedVar of unusedVars) {
				allVars = allVars.replace(` ${unusedVar}`, " ");
			}

			let newType = "";

			if (/forall.*\./.test(allVars)) {
				newType = `${functionName} :: ${restType}`;
			} else {
				newType = `${functionName} :: ${allVars} ${restType}`;
			}

			replacements.push({
				range: range,
				string: newType
			});
		}

		replacements.sort((r1, r2) => r1.range.startLine - r2.range.startLine);

		for (let i = 0; i < replacements.length; i++) {
			editor.replace(replacements[i].range, replacements[i].string);
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

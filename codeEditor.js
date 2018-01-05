const fs = require('fs');

class CodeEditor {
	constructor(fileName) {
		this.data = fs.readFileSync(fileName, "utf8").split("\n");
		this.lineOffset = 0;
	}

	select(range) {
		let selection = "";

		if (range.startLine === range.endLine) {
			selection = this.data[range.startLine - 1].substring(range.startColumn - 1, range.endColumn - 1);
		} else {
			selection = this.data[range.startLine - 1].substring(range.startColumn - 1);

			for (let i = range.startLine + 1; i < range.endLine; i++) {
				selection = `${selection}\n${this.data[i - 1]}`;
			}

			selection = `${selection}\n${this.data[range.endLine - 1].substring(0, range.endColumn - 1)}`;
		}

		return selection;
	}

	findTypeSignature(functionName) {
		const funEscaped = functionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		const typeRe = new RegExp(`${funEscaped}\\s*::`);
		const implRe = new RegExp(`${funEscaped}.*=`);

		for (let i = 0; i < this.data.length; i++) {
			let match = typeRe.exec(this.data[i]);

			if (match) {
				let startLine = i + 1;
				let startColumn = match.index + 1;

				for (let j = i; j < this.data.length; j++) {
					match = implRe.exec(this.data[j]);

					if (match) {
						let endLine = j;
						let endColumn = this.data[j - 1].length + 1;

						return {
							startLine: startLine,
							startColumn: startColumn,
							endLine: endLine,
							endColumn: endColumn
						};
					}
				}

				return null;
			}
		}

		return null;
	}

	replace(range, string) {
		string = string.replace(/\n$/, '');

		let startLine = this.data[range.startLine - 1 - this.lineOffset];

		if (range.startLine === range.endLine) {
			let left = startLine.substring(0, range.startColumn - 1);
			let right = startLine.substring(range.endColumn - 1);

			let line = this.data[range.startLine - 1 - this.lineOffset] = `${left}${string}${right}`;

			if (line === "") {
				this.data.splice(range.startLine - 1 - this.lineOffset, 1);
				this.lineOffset++;
			}
		} else {
			let left = startLine.substring(0, range.startColumn - 1);
			this.data[range.startLine - this.lineOffset - 1] = `${left}${string}`;
			let right = this.data[range.endLine - this.lineOffset - 1].substring(range.endColumn - 1);
			this.data[range.endLine - this.lineOffset - 1] = right;

			let offset = this.lineOffset;

			for (let line = range.startLine - offset; line < range.endLine - offset - 1; line++) {
				this.data.splice(line, 1);
				this.lineOffset++;
			}
		}
	}

	getCode() {
		return this.data.join("\n");
	}
}

exports.CodeEditor = CodeEditor;

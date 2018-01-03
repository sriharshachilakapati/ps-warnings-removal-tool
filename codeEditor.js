const fs = require('fs');

class CodeEditor {
	constructor(fileName) {
		this.data = fs.readFileSync(fileName, "utf8").split("\n");
		this.lineOffset = 0;
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

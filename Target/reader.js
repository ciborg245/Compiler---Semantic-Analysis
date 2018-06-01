module.exports = Reader;

function Reader() {
    this.line = null;
    this.word = null;
    this.i = -1;
}

Reader.prototype.setLine = function(line) {
    this.line = line;
    this.i = -1;
    this.setNextWord();
}

Reader.prototype.setNextWord = function() {
    this.i++;
    let char = this.line.charAt(this.i) || null;
    if (char != null) {
        this.word = "";
        while (char != ' ' && char != null && char != '\n' && char != '\t' && this.i < this.line.length) {
            this.word += char;
            this.i++;
            char = this.line.charAt(this.i) || null;
        }
    } else {
        this.word = null;
    }
}

Reader.prototype.getNextWord = function() {
    let res = this.word;
    this.setNextWord();
    return res
}

Reader.prototype.isLastWord = function() {
    return this.i >= this.line.length
}

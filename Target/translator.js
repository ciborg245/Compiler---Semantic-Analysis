module.exports = Translator;

const fs = require('fs');
const Reader = require('./reader');

var reader = new Reader();

function Translator() {
    this.tacArray = [];
    this.armCode = '';
    this.data = '';
    this.regs = [null, null, null, null, null, null, null, null, null];
    this.hashMap = {};
}

Translator.prototype.translate = function(tac) {
    this.tacArray = tac;
    this.armCode = '.text\n';

    for (let i = 0; i < this.tacArray.length; i++) {
        let line = this.tacArray[i].replace('\t','');

        reader.setLine(line);
        let word = reader.getNextWord();

        if (word.includes('BEGIN')) {
            this.armCode += word + ':\n';
        } else
        if (word.includes('LABEL_')){
            this.armCode += `\n${word}:\n`
        } else
        if (word.includes('END')) {
            if (word == "END_main")
                this.armCode += '\tli $v0, 4\n\tsyscall\n'
            else
                this.armCode += '\tjr $ra\n'
        } else
        if (word == 'IF') {
            let operation = reader.getNextWord() + ' ' + reader.getNextWord() +' '+ reader.getNextWord();
            this.getReg(operation);
            reader.getNextWord();
            this.armCode += reader.getNextWord() + '\n';
        } else
        if (word == 'GOTO') {
            this.armCode += `\tj ${reader.getNextWord()}\n`;
        } else
        if (word.includes('LABEL_')){
            this.armCode += `\n${word}:\n`
        } else
        if (word.includes('PARAMS')) {

        } else
        if (word.includes('CALL')) {

        }
        else {
            this.getReg(line);
        }
    }

    this.data = '\n.data\n';
    this.armCode += this.data;

    // fs.writeFileSync('./Target/code.asm', this.armCode);
}

Translator.prototype.getReg = function(ins) {
    console.log(ins);
    let tempReader = new Reader();

    tempReader.setLine(ins);
    let res = tempReader.getNextWord();
    let what = tempReader.getNextWord();
    let op1 = tempReader.getNextWord();
    let op = tempReader.getNextWord();
    let op2 = tempReader.getNextWord();

    // console.log(res);
    // console.log(op1);
    // console.log(op);
    // console.log(op2);

    let op1IsReg;
    let op2IsReg;
    if (op1.includes('L') || op1.includes('G')) {
        op1IsReg = true
    } else {
        op1IsReg = false;
    }
    if (op != null)
        if (op2.includes('L') || op2.includes('G')) {
            op2IsReg = true
        } else {
            op2IsReg = false;
        }
    let rop1;
    let rop2;
    let rres;
    var tempReg1;
    var tempReg2;


    if (this.regs.find(el => el === op1) == null && op1 != null ) {
        tempReg1 = this.getEmptyReg();
        if (tempReg1 != null) {
            rop1 = tempReg1;
            this.regs[tempReg1] = op1;
        } else {

        }

        this.armCode += `\tlw $t${rop1}, ${this.getAddress(op1).replace(/[|]/, '')}\n`
    } else {
        rop1 = this.regs.indexOf(op1)
    }

    if (this.regs.find(el => el === op2) == null && op2 != null) {
        tempReg2 = this.getEmptyReg();
        if (tempReg2 != null) {
            rop2 = tempReg2;
            this.regs[tempReg2] = op2;
        } else {

        }
        this.armCode += `\tlw $t${rop2}, ${this.getAddress(op2).replace(/[|]/, '')}\n`
    } else {
        rop1 = this.regs.indexOf(op1)
    }

    let tempReg = this.getEmptyReg();
    if (tempReg != null) {
        rres = tempReg;
        this.regs[tempReg] = res;
    }


    this.regs[tempReg1] = null;
    this.regs[tempReg2] = null;

    if (what == "=") {
        if (op == null) {
            if (op1IsReg) {
                this.armCode += `\tmove $t${rres}, $t${rop1}\n`;
            } else  {
                this.armCode += `\taddi $t${rres}, $zero, ${op1}\n`
            }
        } else {
            if (op == "+") {
                this.armCode += `\tadd $t${rres}, `
            } else if (op == "*") {
                this.armCode += `\tmul $t${rres}, `
            } else if (op == '-') {
                this.armCode += `\tsub $t${rres}, `
            } else if (op == '/') {
                this.armCode += `\tdiv $t${rres}, `
            }

            if (op1IsReg) {
                this.armCode += `$t${rop1}, `
            } else {
                this.armCode += `${op1}, `
            }
            if (op2IsReg) {
                this.armCode += `$t${rop2}\n`
            } else {
                this.armCode += `${op2}\n`
            }
        }

        if (!res.includes('t')) {
            this.setAddress(res, rres);
        }
    }
    else {
        if (what == "==") {
            this.armCode += `\tbeq $t${rres}, `
        } else if (what == "==") {
            this.armCode += `\tbne $t${rres}, `
        } else if (what == "<") {
            this.armCode += `\tblt $t${rres}, `
        } else if (what == ">") {
            this.armCode += `\tbgt $t${rres}, `
        } else if (what == "<=") {
            this.armCode += `\tble $t${rres}, `
        } else if (what == ">=") {
            this.armCode += `\tbge $t${rres}, `
        }
        if (op1IsReg) {
            this.armCode += `$t${rop1}, `
        } else {
            this.armCode += `${op1}, `
        }
    }

}

Translator.prototype.getCode = function() {
    return this.armCode;
}

Translator.prototype.getEmptyReg = function() {
    for (let i = 0; i < this.regs.length; i++) {
        if (this.regs[i] == null)
            return i
    }
    return null
}

Translator.prototype.getAddress = function(v) {
    if (this.hashMap.hasOwnProperty(v))
        return this.hashMap[v][this.hashMap[v].length-1]
    else {
        return ''
    }
}

Translator.prototype.setAddress = function(key, value) {
    if (this.hashMap.hasOwnProperty(key)) {
        this.hashMap[key].push(value);
    } else {
        this.hashMap[key] = [value]
    }
    this.armCode += `\tsw ${value}, ${key.replace(']','').replace('[','')}\n`
}

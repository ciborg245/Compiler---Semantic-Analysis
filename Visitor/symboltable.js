module.exports = SymbolTable;

const Scope = require('./scope.js');

function SymbolTable() {
    this.symbolTable = [];
    this.lastItem = null;
    this.secondToLastItem = null;
}

SymbolTable.prototype.isGlobalScope = function() {
    return this.symbolTable.length == 1;
}

SymbolTable.prototype.addScope = function() {
    this.symbolTable.push(new Scope());
}

SymbolTable.prototype.deleteScope = function() {
    this.symbolTable.pop();
}

SymbolTable.prototype.addItem = function(key, value) {
    value.isGlobal = this.symbolTable.length == 1 ? true : false;
    this.symbolTable[this.symbolTable.length-1].setItem(key, value);

    this.secondToLastItem = this.lastItem;
    this.lastItem = {
        "key" : key,
        "value" : value
    }
}

SymbolTable.prototype.getLastItem = function() {
    return this.lastItem;
}

SymbolTable.prototype.getSecondToLastItem = function() {
    return this.secondToLastItem;
}

SymbolTable.prototype.hasItemLocal = function(key) {
    return this.symbolTable[this.symbolTable.length-1].hasItem(key);
}

SymbolTable.prototype.hasItemGlobal = function(key) {
    for (var i = this.symbolTable.length-1; i >= 0; i--) {
        if (this.symbolTable[i].hasItem(key))
            return true;
    }
    return false;
}

SymbolTable.prototype.getItem = function(key) {
    for (var i = this.symbolTable.length-1; i >= 0; i--) {
        if (this.symbolTable[i].hasItem(key))
            return this.symbolTable[i].getItem(key);
    }
    return null;
}

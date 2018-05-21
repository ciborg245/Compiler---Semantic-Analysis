module.exports = Leaf;

function Leaf() {
    this.value = null;
    this.next = [];
    this.id = null;
    this.line = null;
}

Leaf.prototype.setID = function (value) {
    this.id = value;
}

Leaf.prototype.getID = function() {
    return this.id;
}

Leaf.prototype.addNext = function(value) {
    this.next = value;
}

Leaf.prototype.getNext = function() {
    return this.next;
}

Leaf.prototype.setValue = function(value) {
    this.value = value;
}

Leaf.prototype.getValue = function() {
    return this.value;
}

Leaf.prototype.hasNext = function() {
    if (this.next.length == 0)
    return false; else return true;
}

Leaf.prototype.getChildrenCount = function() {
    return this.next.length;
}

Leaf.prototype.setLine = function(value) {
    this.line = value;
}

Leaf.prototype.getLine = function() {
    return this.line;
}

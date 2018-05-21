module.exports = Scope;

function Scope() {
    this.length = 0;
    this.items = {};
    this.offset = 0;
}

Scope.prototype.setItem = function(key, value)
{
    var previous = undefined;
    if (this.hasItem(key)) {
        previous = this.items[key];
    }
    else {
        this.length++;
    }

    if (value.symbol != "struct" && value.symbol != "method") {
        value.offset = this.offset;
        this.offset += value.width;
    }

    this.items[key] = value;
    return previous;
}

Scope.prototype.getItem = function(key) {
    return this.items[key];
}

Scope.prototype.hasItem = function(key)
{
    return this.items.hasOwnProperty(key);
}

Scope.prototype.removeItem = function(key)
{
    if (this.hasItem(key)) {
        previous = this.items[key];
        this.length--;
        delete this.items[key];
        return previous;
    }
    else {
        return undefined;
    }
}

Scope.prototype.keys = function()
{
    var keys = [];
    for (var k in this.items) {
        if (this.hasItem(k)) {
            keys.push(k);
        }
    }
    return keys;
}

Scope.prototype.values = function()
{
    var values = [];
    for (var k in this.items) {
        if (this.hasItem(k)) {
            values.push(this.items[k]);
        }
    }
    return values;
}

Scope.prototype.each = function(fn) {
    for (var k in this.items) {
        if (this.hasItem(k)) {
            fn(k, this.items[k]);
        }
    }
}

Scope.prototype.clear = function()
{
    this.items = {}
    this.length = 0;
}

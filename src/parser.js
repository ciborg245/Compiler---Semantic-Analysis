//Se exporta la clase
module.exports = Parser;

//Modulos extras para el funcionamiento del programa
const moo = require('moo');
const nearley = require("nearley");
const grammar = require("../Grammar/grammar.js");
const Leaf = require('./leaf.js');

var treeStack = [];
var leafcont = 1;

//Constructor de la clase
function Parser() {
    this.code = "";
    this.tree = null;
    this.parser = null;
    this.error = "";
}

Parser.prototype.parse = function(code) {
    this.parser = new nearley.Parser(
        nearley.Grammar.fromCompiled(grammar),
        { keepHistory: true }
    );

    this.code = code;
    this.treeStack = [];
    this.error = null;

    //Se parsea el código ingresado
    try {
        this.parser.feed(this.code);

        console.log(this.parser.results.length);

        if (this.parser.results.length != 0) {
            // console.log(this.parser.results[0][3][0]);

            var root;
            mainLoop: for (var j = this.parser.table.length-1; j >= 0 ; j--) {
                for (var i = this.parser.table[j].states.length-1; i>= 0 ;i--) {
                    //console.log(this.parser.table[j].states[i].isComplete);
                    if (this.parser.table[j].states[i].isComplete) {
                        root = this.parser.table[j].states[i];
                        break mainLoop;
                    }
                }
            }

            treeStack = [];
            leafcont = 1;
            treeStack.push([]);
            constructTree(root, 0);
            // console.log(root);
            this.tree = treeStack[0][0];

            //printTree(this.tree, 0);
        } else {
            this.error = "Unexpected token at last character.";
        }
    } catch(err) {
        this.error = err;
    }

    return this.error;
}

Parser.prototype.getTree = function() {
    return this.tree;
}

function printTree(root, cont) {
    var leaves = root.getNext();

    for (var i = 0; i < leaves.length; i++) {
        console.log(leaves[i].getID() + '--'.repeat(cont) + leaves[i].getValue());
        if (leaves[i].hasNext()) {
            printTree(leaves[i], cont+1);
        }
    }
}

function constructTree(root, tabCont) {
    var tempLeaf = new Leaf();
    var tokenFlag = false;
    var actionFlag = false;

    if (root.isComplete)
        if (!root.rule.name.includes("$")){
            // console.log("|" + "--".repeat(tabCont) + root.rule.name);
            tabCont++;

            tempLeaf.setValue(root.rule.name);
            tempLeaf.setID(leafcont);
            leafcont++;
            treeStack[treeStack.length-1].push(tempLeaf);
            treeStack.push([]);
            actionFlag = true;
        }
    if (root.isToken){
        tokenFlag  = true;
        actionFlag = true;
        if (root.token.type == "keyword" || root.token.type == "num" || root.token.type == "id"){
            // console.log("|" + "--".repeat(tabCont) + root.token.value);
            tempLeaf.setValue(root.token.value);
            tempLeaf.setLine(root.token.line);
            tempLeaf.setID(leafcont);
            leafcont++;
            treeStack[treeStack.length-1].push(tempLeaf);
        }
        else {
            // console.log("|" + "--".repeat(tabCont) + root.token.type);
            tempLeaf.setValue(root.token.type);
            tempLeaf.setLine(root.token.line);
            tempLeaf.setID(leafcont);
            leafcont++;
            treeStack[treeStack.length-1].push(tempLeaf);
        }
    }
    if (root.left != undefined){
        constructTree(root.left, tabCont);
    }
    if (root.right != undefined)
        constructTree(root.right, tabCont);

    if (!tokenFlag && actionFlag)
        tempLeaf.addNext(treeStack.pop());

}

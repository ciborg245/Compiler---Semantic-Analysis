module.exports = Visitor;

const SymbolTable = require('./symboltable.js');

function Visitor() {
    this.symbolTable = null;
    this.error = null;
    this.methodControl = null;
    this.taCode = [];
    this.taCodeLine = ``;
    this.lastUsed = null;
    this.tCont = 0;
    this.labelCont = 0;
    this.ifGlobalCont = [];
    this.localGlobal = "L";
}

Visitor.prototype.vProgram = function(node) {
    this.methodControl = [];
    this.symbolTable = new SymbolTable();
    this.error = "";

    this.symbolTable.addScope();
    this.symbolTable.addItem('print', {
        'symbol': 'method',
        'type': 'void'
    });

    let children = node.getNext();
    let res = true;

    var i = 3;
    while (children[i].getValue() == 'declaration') {
        if (children[i].getNext()[0].getValue() == 'methodDeclaration') {
            res = res && this.vMethodDeclaration(children[i].getNext()[0]);
        } else if (children[i].getNext()[0].getValue() == 'varDeclaration') {
            res = res && this.vVarDeclaration(children[i].getNext()[0]);
        } else if (children[i].getNext()[0].getValue() == 'structDeclaration') {
            res = res && this.vStructDeclaration(children[i].getNext()[0]);
        }

        if (res == false)
            return {
                'success': false,
                'error': this.error
            }

        i++;
    }

    if (this.symbolTable.hasItemLocal("main")) {
        let temp = this.symbolTable.getItem("main");
        if (temp.symbol == "method" && temp.type == "void") {
            return {
                'success': true,
                'taCode': this.taCode
            }
        } else {
            this.error += "Error: 'Main' has to be a void method.";
            return {
                'success': false,
                'error': this.error
            }
        }
    } else {
        this.error += "Error: Method void 'Main' not declared.";
        return {
            'success': false,
            'error': this.error
        }
    }
}

Visitor.prototype.vStructDeclaration = function(node) {
    let children = node.getNext();
    let res = true;

    let id = children[1].getValue();

    if (!this.symbolTable.hasItemLocal(id)) {
        this.symbolTable.addScope();

        let cont = 3;
        let items = {};
        let width = 0;
        while (children[cont].getValue() == "varDeclaration") {
            res = res && this.vVarDeclaration(children[cont]);

            let tempVar = this.symbolTable.getLastItem();

            items[tempVar.key] = tempVar.value;


            if (children[cont].getNext()[0].getNext()[0].getValue() == "structDeclaration") {
                let tempStruct = this.symbolTable.getSecondToLastItem();
                items[tempStruct.key] = tempStruct.value;
                items[tempVar.key].type = tempStruct.key;
            }

            width += tempVar.value.width;

            cont++;
        }

        this.symbolTable.deleteScope();

        this.symbolTable.addItem(id, {
            'type': 'struct',
            'symbol': 'struct',
            'items' : items,
            'width' : width
        })

        return res
    } else {
        this.error += "Error: '" + id + "' was already declared. Line " + children[1].getLine() + ".\n";
        return false
    }
}

Visitor.prototype.vVarDeclaration = function(node) {
    let children = node.getNext();

    let type = this.vVarType(children[0]);

    if (type == null) {
        return false
    }

    let id = children[1].getValue();

    let width;
    if (type == "boolean" || type == "int" || type == "char") {
        width = 4
    } else {
        width = this.symbolTable.getItem(type).width;
    }

    if (!this.symbolTable.hasItemLocal(id)) {
        if (children[2].getValue() == '[') {
            if (children[3].getValue() < 0) {
                this.error += "Error: The size of the array " + id + " cannot be less than 0. Line " + children[3].getLine() +".\n";
                return false;
            }
            width *= children[3].getValue();
            this.symbolTable.addItem(id, {
                'type': type,
                'symbol': 'array',
                'width' : width,
                'elements' : children[3].getValue()
            });

            return true
        } else {
            this.symbolTable.addItem(id, {
                'type': type,
                'symbol': 'var',
                'width' : width
            });

            return true
        }
    } else {
        this.error += "Error: '" + id + "' was already declared. Line " + children[1].getLine() + ".\n";
        return false
    }
}

Visitor.prototype.vVarType = function(node) {
    let children = node.getNext();

    let type = children[0].getValue();

    if (type == "struct") {
        let structId = children[1].getValue();

        if (this.symbolTable.hasItemGlobal(structId)) {
            return structId
        } else {
            this.error += "Error: Struct '" + structId + "' has not been declared. Line " + children[0].getLine() + ".\n"
            return null
        }
    } else if (type == "structDeclaration") {
        if (this.vStructDeclaration(children[0])) {
            return this.symbolTable.getLastItem().key;
        } else {
            return null
        }
    }

    return type
}

Visitor.prototype.vMethodDeclaration = function(node) {
    //Se obtienen los hijos del nodo
    let children = node.getNext();

    //Se obtienen los datos principales del metodo
    let type = children[0].getNext()[0].getValue();
    let id = children[1].getValue();
    let res = true;

    //Se revisa si no existe el metodo
    if (!this.symbolTable.hasItemLocal(id)) {
        this.symbolTable.addItem(id, {
            'type': type,
            'symbol': 'method'
        });

        this.taCode.push("BEGIN_"+id);

        this.localGlobal = id == "main" ? "G" : "L";

        //Se leen los parametros
        let i = 3;
        this.symbolTable.addScope();
        while (children[i].getValue() == "parameter") {
            res = res && this.vParameter(children[i]);
            i +=2;
        }

        //Se lee el block del metodo
        this.methodControl.push(type);
        res = res && this.vBlock(children[children.length-1], true);
        this.symbolTable.deleteScope();
        this.methodControl.pop();
        this.taCode.push("END_"+id);

        this.localGlobal = "L";

        return res;
    } else {
        this.error += "Error: Method '" + id + "' declared multiple times. Line " + children[1].getLine() + ".\n";
        return false;
    }
}

Visitor.prototype.vBlock = function(node, scopeFlag = false) {
    if (!scopeFlag)
        this.symbolTable.addScope();

    let children = node.getNext();

    let res = true;
    let i = 1;
    let tempValue = children[i].getValue();
    while (tempValue == "varDeclaration" || tempValue == "statement") {
        if (tempValue == "varDeclaration") {
            res = res && this.vVarDeclaration(children[i]);
        } else if (tempValue == "statement") {
            res = res && this.vStatement(children[i]);
        }

        if (res == false)
            return false;

        i++;
        tempValue = children[i].getValue();
    }

    if (!scopeFlag)
        this.symbolTable.deleteScope();

    return res;
}

Visitor.prototype.vParameter = function(node) {
    let children = node.getNext();
    let res;

    let type = children[0].getNext()[0].getValue();
    let id = children[1].getValue();

    if (!this.symbolTable.hasItemLocal(id)) {
        if (children.length > 2) {
            this.symbolTable.addItem(id, {
                'type': type,
                'symbol': 'array',
                'width' : 0
            });

            return true;
        } else {
            this.symbolTable.addItem(id, {
                'type': type,
                'symbol': 'var',
                'width' : 4
            });

            return true;
        }
    } else {
        this.error += "Error: Variable '" + id + "' declared multiple times. Line " + children[1].getLine() + ".\n";
        return false;
    }
}

Visitor.prototype.vStatement = function(node) {
    let children = node.getNext();

    let res;
    let tempChildren = children[0].getValue();
    if (tempChildren == "if") {
        res = this.vIfStatement(node);
    } else if (tempChildren == "while") {
        res = this.vWhileStatement(node)
    } else if (tempChildren == "return") {
        res = this.vReturnStatement(node);
    } else if (tempChildren == "methodCall") {
        res = this.vMethodCallStatement(node);
    } else if (tempChildren == "block") {
        res = this.vBlockStatement(node);
    } else if (tempChildren == "location") {
        res = this.vLocationStatement(node);
    } else if (tempChildren == "expression" || tempChildren == ";") {
        res = this.vExpressionStatement(node);
    }
    return res;
}

Visitor.prototype.vIfStatement = function(node) {
    let children = node.getNext();

    this.ifGlobalCont.push(this.labelCont);
    // this.taCode.push("IF ");
    let resExpr = this.vExpression(children[2]);
    if (resExpr != "boolean") {
        this.error += "Error: Expression on IF is not boolean. Line " + children[0].getLine() + ".\n"
        return false
    }

    let tempLastUsed = this.lastUsed;
    let lastIfGlobalCont = this.ifGlobalCont.pop();

    this.taCodeLine = `LABEL_TRUE_${this.labelCont-1}:`;
    this.taCode.push(this.taCodeLine);
    let res = this.vBlock(children[4]);
    this.taCodeLine = `GOTO LABEL_END_IF_${lastIfGlobalCont}:`;
    this.taCode.push(this.taCodeLine);


    this.taCodeLine = `LABEL_FALSE_${lastIfGlobalCont}:`;
    this.taCode.push(this.taCodeLine);
    if (children.length > 5) {
        res = res && this.vBlock(children[6]);
    }

    this.taCodeLine = `LABEL_END_IF_${lastIfGlobalCont}:`
    this.taCode.push(this.taCodeLine);

    this.labelCont++;

    return res;
}

Visitor.prototype.vWhileStatement = function(node) {
    let children = node.getNext();

    this.ifGlobalCont.push(this.labelCont);

    this.taCodeLine = `LABEL_WHILE_${this.ifGlobalCont}:`;
    this.taCode.push(this.taCodeLine);
    let expRes = this.vExpression(children[2]);
    if (expRes != "boolean") {
        this.error += "Error: Expression on WHILE is not boolean. Line " + children[0].getLine() + ".\n"
        return false;
    }

    let tempLastUsed = this.lastUsed;
    let lastIfGlobalCont = this.ifGlobalCont.pop();

    this.taCodeLine = `LABEL_TRUE_${this.labelCont-1}:`;
    this.taCode.push(this.taCodeLine);
    let res = this.vBlock(children[4]);
    this.taCodeLine = `GOTO LABEL_WHILE_${lastIfGlobalCont}:`;
    this.taCode.push(this.taCodeLine);
    this.taCodeLine = `LABEL_FALSE_${lastIfGlobalCont}:`;
    this.taCode.push(this.taCodeLine);

    return res;
}

Visitor.prototype.vReturnStatement = function(node) {
    let children = node.getNext();

    let type = this.methodControl[this.methodControl.length-1];
    if (type == "void") {
        this.error += "Error: Can't use a RETURN on a VOID method. Line " + children[0].getLine() + ".\n";
        return false
    } else {
        if (children[1] != ";"){
            let res = this.vExpression(children[1]);
            if (res == "error") {
                return false
            } else {
                let type = this.methodControl[this.methodControl.length-1];
                if (type != res) {
                    this.error += "Error: The value of return and the method's type do not match. Line " + children[0].getLine() + ".\n";
                    return false
                } else {
                    this.taCodeLine = `RETURN ${this.lastUsed}`;
                    this.taCode.push(this.taCodeLine);
                    return true
                }
            }
        } else {
            this.error += "Error: Need a return matching the type of the method's type. Line " + children[0].getLine() + ".\n";
            return false
        }
    }


}

Visitor.prototype.vMethodCallStatement = function(node) {
    let children = node.getNext();
    let res = this.vMethodCall(children[0]);
    if (res != 'void') {
        this.error += "Error: Method is not void. Line " + children[1].getLine() + ".\n";
        return false;
    }

    return true;
}

Visitor.prototype.vBlockStatement = function(node) {
    let children = node.getNext();

    let res = this.vBlock(children[0]);

    return res;
}

Visitor.prototype.vLocationStatement = function(node) {
    let children = node.getNext();

    let locRes = this.vLocation(children[0]);
    let tempLine = `\t${this.lastUsed} = ` ;
    let expRes = this.vExpression(children[2]);
    this.taCodeLine = tempLine + this.lastUsed;

    if (locRes != expRes) {
        this.error += locRes != "error" ?
        "Error: Assigning wrong value. Location is " + locRes.toUpperCase() + ". Line " + children[1].getLine() + ".\n" :
        "Error: Assigning wrong value. Line " + children[1].getLine() + ".\n";
        return false;
    } else {
        this.taCode.push(this.taCodeLine);
        this.tCont = 0;
        this.taCodeLine = ``;
    }

    return true;
}

Visitor.prototype.vExpressionStatement = function(node) {
    let children = node.getNext();

    if (children[0].getValue() != ";") {
        let res = this.vExpression(children[0]);
        if (res == "error")
            return false
        else
            return true
    } else {
        return true
    }
}

Visitor.prototype.vLocation = function(node, local = null, offset = 0) {
    let children = node.getNext();

    let id = children[0].getValue();

    let hasItemFlag;

    if (local != null) {
        if (local.hasOwnProperty(id)) {
            hasItemFlag = true;
        } else {
            hasItemFlag = false;
        }
    } else {
        if (this.symbolTable.hasItemGlobal(id)) {
            hasItemFlag = true;
        } else {
            hasItemFlag = false;
        }
    }

    if (hasItemFlag) {
        let variable = local == null ? this.symbolTable.getItem(id) : local[id];

        if (children.length > 1) {
            if (children[1].getValue() == "[") {
                if (variable.symbol != "array") {
                    this.error += "Error: '" + id + "' is not an array. Line " + children[0].getLine() + ".\n";
                    return "error"
                }

                let expRes = this.vExpression(children[2]);
                if (expRes != 'int') {
                    this.error += "Error: The expression has to be an integer. Line " + children[0].getLine() + ".\n";
                    return "error"
                }

                if (children.length > 4) {
                    let flag;
                    let tempStruct;
                    if (local == null) {
                        tempStruct = this.symbolTable.hasItemGlobal(variable.type) ? this.symbolTable.getItem(variable.type) : null;
                    } else {
                        tempStruct = local.hasOwnProperty(variable.type) ? local[variable.type] : null;
                    }

                    if (tempStruct != null) {
                        let items = tempStruct.items;
                        return this.vLocation(children[5], items, offset + variable.offset);
                    } else {
                        this.error += "Error: The variable " + id + " has no properties. Line " + children[0].getLine() + ".\n";
                        return "error"
                    }
                } else {
                    let arrayOffset = variable.width / variable.elements * this.lastUsed;
                    this.lastUsed = `${this.localGlobal}[${variable.offset + offset + arrayOffset}]`;
                    return variable.type
                }
            } else {
                if (variable.symbol != "var") {
                    this.error += "Error: '" + id + "' is not a variable. Line " + children[0].getLine() + ".\n";
                    return "error"
                }
            }

            if (children[1].getValue() == '.') {
                let flag;
                let tempStruct;
                if (local == null) {
                    tempStruct = this.symbolTable.hasItemGlobal(variable.type) ? this.symbolTable.getItem(variable.type) : null;
                } else {
                    tempStruct = local.hasOwnProperty(variable.type) ? local[variable.type] : null;
                }

                if (tempStruct != null) {
                    let items = tempStruct.items;
                    return this.vLocation(children[2], items, offset + variable.offset);
                } else {
                    this.error += "Error: The variable " + id + " has no properties. Line " + children[0].getLine() + ".\n";
                    return "error"
                }
            }
        } else {
            this.lastUsed = `${this.localGlobal}[${variable.offset + offset}]`;
            return variable.type
        }
    } else {
        this.error += local == null ? "Error: The variable '" + id + "' has not been declared yet. Line " + children[0].getLine() + ".\n"
            : "Error: Property '" + id + "' doesn't exist. Line " + children[0].getLine() + ".\n";
        return "error"
    }
}

Visitor.prototype.vExpression = function(node) {
    let children = node.getNext();

    let res;
    if (children[0].getValue() == "(") {
        res = this.seventhLevel(children[1])
    } else if (children[0].getValue() == "seventhLevel") {
        res = this.seventhLevel(children[0])
    } else if (children[0].getValue() == "omegaLevel") {
        res = this.vOmegaLevel(children[0])
    }

    return res
}

Visitor.prototype.vOmegaLevel = function(node) {
    let children = node.getNext();
    let res;

    if (children[0].getValue() == "location") {
        res = this.vLocation(children[0]);
    } else if (children[0].getValue() == "literal") {
        res = this.vLiteral(children[0]);
    } else if (children[0].getValue() == "methodCall") {
        res = this.vMethodCall(children[0]);
    }

    return res
}

// ---------------------------- OR ----------------------------
Visitor.prototype.seventhLevel = function(node) {
    let children = node.getNext();

    if (children[0].getValue() == "sixthLevel") {
        return this.sixthLevel(children[0])
    } else {
        let leftRes  = this.seventhLevel(children[0]);

        let tempTac = `LABEL_TRUE_${this.lastUsed}:`;

        let rightRes = this.sixthLevel(children[2]);

        this.taCode.push(tempTac);

        if (leftRes != "boolean") {
            this.error += "Error: Cannot use non-booleans with operator ||. Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        } else if (rightRes != "boolean") {
            this.error += "Error: Cannot use non-booleans with operator ||. Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        }

        return "boolean"
    }
}

// ---------------------------- AND ----------------------------
Visitor.prototype.sixthLevel = function(node) {
    let children = node.getNext();

    if (children[0].getValue() == "fifthLevel") {
        return this.fifthLevel(children[0])
    }  else {
        let leftRes = this.sixthLevel(children[0]);

        let tempTac = `LABEL_TRUE_${this.lastUsed}:`;
        this.taCode.push(tempTac);

        let rightRes = this.fifthLevel(children[2]);

        if (leftRes != "boolean") {
            this.error += "Error: Cannot use non-booleans with operator &&. Line " + children[1].getLine() + ".\n";
            return "error"
        } else if (rightRes != "boolean") {
            this.error += "Error: Cannot use non-booleans with operator &&. Line " + children[1].getLine() + ".\n";
            return "error"
        }

        return "boolean"
    }
}

// ---------------------------- == / != ----------------------------
Visitor.prototype.fifthLevel = function(node) {
    let children = node.getNext();

    if (children[0].getValue() == "fourthLevel") {
        return this.fourthLevel(children[0])
    } else {
        let tempTac = "";
        let tempLastUsed;

        let leftRes = this.fifthLevel(children[0]);
        tempTac += `${this.lastUsed} ${children[1].getNext()[0].getValue()} `;

        let rightRes = this.fourthLevel(children[2]);
        tempTac += `${this.lastUsed}`;

        tempTac = `IF ${tempTac} GOTO LABEL_TRUE_${this.labelCont}`;
        this.taCode.push(tempTac);
        tempTac = `GOTO LABEL_FALSE_${this.ifGlobalCont}`;
        this.taCode.push(tempTac);
        tempLastUsed = `${this.labelCont}`;
        this.labelCont += 1;

        if (leftRes != rightRes) {
            if (leftRes == "error" || rightRes == "error")
                this.error += "Error: Cannot compare different types. Line " + children[1].getNext()[0].getLine() + ".\n";
            else
                this.error += "Error: Cannot compare " + leftRes.toUpperCase() + " and " + rightRes.toUpperCase() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        }

        this.lastUsed = tempLastUsed;

        return "boolean"
    }
}

// ------------------------ < / > / <= / >= ------------------------
Visitor.prototype.fourthLevel = function(node) {
    let children = node.getNext();

    if (children[0].getValue() == "thirdLevel") {
        return this.thirdLevel(children[0]);
    } else {
        let tempTac = "";
        let tempLastUsed;

        let leftRes = this.fourthLevel(children[0]);
        tempTac += `${this.lastUsed} ${children[1].getNext()[0].getValue()} `;

        let rightRes = this.thirdLevel(children[2]);
        tempTac += `${this.lastUsed}`;

        tempTac = `IF ${tempTac} GOTO LABEL_TRUE_${this.labelCont}`;
        this.taCode.push(tempTac);
        tempTac = `GOTO LABEL_FALSE_${this.ifGlobalCont}`;
        this.taCode.push(tempTac);
        tempLastUsed = `${this.labelCont}`;
        this.labelCont += 1;

        if (leftRes != "int") {
            this.error += "Error: Cannot use non-integers with operator " + children[1].getNext()[0].getValue() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        } else if (rightRes != "int") {
            this.error += "Error: Cannot use non-integers with operator " + children[1].getNext()[0].getValue() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        }

        this.lastUsed = tempLastUsed;

        return "boolean"
    }
}

// ------------------------ + / - ------------------------
Visitor.prototype.thirdLevel = function(node) {
    let children = node.getNext();

    if (children[0].getValue() == "secondLevel") {
        return this.secondLevel(children[0])
    } else {
        let tempTac = "";
        let tempLastUsed;

        let leftRes = this.thirdLevel(children[0]);
        tempTac += `${this.lastUsed} ${children[1].getNext()[0].getValue()} `;

        let rightRes = this.secondLevel(children[2]);
        tempTac += `${this.lastUsed}`;

        tempTac = `\tt${this.tCont} = ` + tempTac;
        tempLastUsed = `t${this.tCont}`;
        this.tCont++;

        if (leftRes != "int") {
            this.error += "Error: Cannot use non-integers with operator " + children[1].getNext()[0].getValue() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        } else if (rightRes != "int") {
            this.error += "Error: Cannot use non-integers with operator " + children[1].getNext()[0].getValue() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        }

        this.taCode.push(tempTac);
        this.lastUsed = tempLastUsed;

        return "int"
    }
}

// ------------------------ * / '/' / % ------------------------
Visitor.prototype.secondLevel = function(node) {
    let children = node.getNext();

    if (children[0].getValue() == "firstLevel") {
        return this.firstLevel(children[0])
    } else {
        let tempTac = ``;
        let tempLastUsed;

        let leftRes = this.secondLevel(children[0]);
        tempTac += `${this.lastUsed} ${children[1].getNext()[0].getValue()} `;

        let rightRes = this.firstLevel(children[2]);
        tempTac += `${this.lastUsed}`;

        tempTac = `\tt${this.tCont} = ` + tempTac;
        tempLastUsed = `t${this.tCont}`;
        this.tCont++;

        if (leftRes != "int") {
            this.error += "Error: Cannot use non-integers with operator " + children[1].getNext()[0].getValue() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        } else if (rightRes != "int") {
            this.error += "Error: Cannot use non-integers with operator " + children[1].getNext()[0].getValue() + ". Line " + children[1].getNext()[0].getLine() + ".\n";
            return "error"
        }

        this.taCode.push(tempTac);
        this.lastUsed = tempLastUsed;

        return "int"
    }
}

Visitor.prototype.firstLevel = function(node) {
    let children = node.getNext();
    let res;

    if (children[0].getValue() == "!") {
        res = this.minusFL(node)
    } else if (children[0].getValue() == "-") {
        res = this.minusFL(node)
    } else if (children[0].getValue() == "omegaLevel") {
        res = this.vOmegaLevel(children[0])
    }

    return res
}

// ------------------------ ! / - ------------------------
Visitor.prototype.minusFL = function(node) {
    let children = node.getNext();
    let res;

    let expRes = this.vOmegaLevel(children[1]);
    if (expRes != "int") {
        this.error += "Error: Cannot use the negative '-' of non-integers. Line " + children[0].getLine() + ".\n";
        return "error"
    }

    return expRes
}

Visitor.prototype.negFL = function(node) {
    let children = node.getNext();

    let expRes = this.vOmegaLevel(children[1]);
    if (expRes != "boolean") {
        this.error += "Error: Cannot use '!' with non-booleans. Line" + children[0].getLine() + ".\n";
        return "error"
    }

    return expRes

}

Visitor.prototype.vMethodCall = function(node) {
    let children = node.getNext();

    let id = children[0].getValue();
    if (this.symbolTable.hasItemGlobal(id)) {
        let method = this.symbolTable.getItem(id);
        if (method.symbol != "method") {
            this.error += "Error: '" + id + "' is not a method. Line " + children[0].getLine() + ".\n"
            return "error"
        }

        let cont = 2;
        while (children[cont].getValue() == "arg") {
            this.arg(children[cont]);
            this.taCodeLine = `PUSH_PARAM ${this.lastUsed}`;
            this.taCode.push(this.taCodeLine);

            cont++;
            if (children[cont].getValue() == ",")
                cont++;
        }

        if (method.type != "void") {
            this.taCodeLine = `${this.lastUsed} = CALL ${id}, ${cont-2}`;
            this.taCode.push(this.taCodeLine);
        } else {
            this.taCodeLine = `CALL ${id}, ${cont-2}`;
            this.taCode.push(this.taCodeLine);
        }

        this.taCodeLine = `POP_PARAMS`;
        this.taCode.push(this.taCodeLine);

        console.log(this.lastUsed);

        return method.type;
    } else {
        this.error += "Error: Method " + id + " not declared. Line " + children[0].getLine() + ".\n"
        return "error";
    }
}

Visitor.prototype.arg = function(node) {
    let child = node.getNext()[0];

    let expRes = this.vExpression(child);

    return expRes;
}

Visitor.prototype.vLiteral = function(node) {
    let child = node.getNext()[0];

    if (child.getValue() == "int_literal") {
        this.lastUsed = child.getNext()[0].getValue();
        return "int"
    } else if (child.getValue() == "char_literal") {
        this.lastUsed = child.getNext()[0].getValue();
        return "char"
    } else if (child.getValue() == "bool_literal") {
        this.lastUsed = child.getNext()[0].getValue();
        return "boolean"
    }
}

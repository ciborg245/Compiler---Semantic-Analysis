@{%

const moo = require('moo');

let lexer = moo.compile({
	keyword: ['class', 'struct', 'true', 'false', 'void', 'if', 'else', 'while', 'return', 'int', 'char', 'boolean'],
	space: {match: /\s+/, lineBreaks: true},
	char: /'[a-zA-Z]'/,
	id:  /[a-zA-Z][a-zA-Z0-9]*/,
    string: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
    '{': '{',
    '}': '}',
    '[': '[',
    ']': ']',
    '(': '(',
    ')': ')',
    ',': ',',
    ':': ':',
    ';': ';',
    '+': '+',
    '-': '-',
    '*': '*',
    '%': '%',
    '/': '/',
    '==': '==',
    '=': '=',
    '&&': '&&',
    '||': '||',
    '<=': '<=',
    '>=': '>=',
    '>': '>',
    '<': '<',
    '!=': '!=',
    '\'': '\'',
    'true': 'true',
    'false': 'false',
    '!': '!',
    '.': '.',
	num: /-?(?:[0-9]|[1-9][0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b/,
})

lexer.next = (next => () => {
    let tok;
    while ((tok = next.call(lexer)) && tok.type === "space") {}
    return tok;
})(lexer.next);

%}

@lexer lexer

program 			-> "class" %id "{" declaration:* "}"

declaration 		-> structDeclaration
					| varDeclaration
					| methodDeclaration

varDeclaration 		-> varType %id ";"
					| varType %id "[" %num "]" ";"

structDeclaration 	-> "struct" %id "{" varDeclaration:* "}"

varType 			-> "int"
					| "char"
					| "boolean"
					| "struct" %id
					| structDeclaration
					| "void"

methodDeclaration 	-> methodType %id "(" (parameter ("," parameter):*):? ")" block

methodType 			-> "int"
					| "char"
					| "boolean"
					| "void"

parameter 			-> parameterType %id
					| parameterType %id "[" "]"

parameterType 		-> "int"
					| "char"
					| "boolean"

block 				-> "{" varDeclaration:* statement:* "}"

statement 			-> "if" "(" expression ")" block ("else" block):?
					| "while" "(" expression ")" block
					| "return" expression:? ";"
					| methodCall ";"
					| block
					| location "=" expression ";"
					| expression:? ";"

location 			-> (%id | %id "[" expression "]") ("." location):?

expression 			-> "(" seventhLevel ")"
					| seventhLevel
					| omegaLevel

omegaLevel 			-> literal
					| location
					| methodCall

firstLevel          -> "-" omegaLevel
                    | "!" omegaLevel
                    | omegaLevel

secondLevel         -> secondLevel arith_high_op firstLevel
                    | firstLevel

thirdLevel          -> thirdLevel arith_op secondLevel
                    | secondLevel

fourthLevel         -> fourthLevel rel_op thirdLevel
                    | thirdLevel

fifthLevel          -> fifthLevel eq_op fourthLevel
                    | fourthLevel

sixthLevel          -> sixthLevel and_op fifthLevel
                    | fifthLevel

seventhLevel        -> seventhLevel cond_op sixthLevel
                    | sixthLevel

methodCall 			-> %id "(" (arg ( "," arg):*):? ")"

arg 				-> expression

arith_op 			-> "+" | "-"

arith_high_op 		-> "*" | "/" | "%"

rel_op 				-> "<" | ">" | "<=" | ">="

eq_op 				-> "==" | "!="

cond_op				-> "||"

and_op              -> "&&"

literal 			-> int_literal | char_literal | bool_literal

int_literal 		-> %num

char_literal 		-> %char

bool_literal 		-> "true" | "false"

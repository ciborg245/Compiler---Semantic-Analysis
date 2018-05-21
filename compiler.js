/*
    Autor: Alejandro Chaclan

    Compiladores 2 Proyecto 0

*/

//Dependencias del programa
const fs = require('fs');
const Parser = require('./src/parser');
const Visitor = require('./Visitor/visitor');

//Variables globales de la clase
var visitor = new Visitor();
var parser = new Parser();
var tempHTML = "";

//Objetos en html
const codeTPArea = document.getElementById('codeToParseArea');
const codeTPCompileButton = document.getElementById('codeToParseCompileButton');
const treeDiv = document.getElementById('treeDiv');
const errorsArea = document.getElementById('errorsArea');
const taCodeArea = document.getElementById('taCodeArea');



codeTPCompileButton.addEventListener("click", function() {

    codeTP = codeTPArea.value;
    console.log(codeTP);
    let error = parser.parse(codeTP);

    if (error == null) {
        //Se construye y muestra la estructura de arbol en HTML usando <table>
        with(treeDiv) {
            tree = parser.getTree();
            innerHTML = "";
            tempHTML = "";
            tempHTML +=
                "<table>" +
                "<tbody>";

            buildTree(tree, 0);

            tempHTML +=
                "</tbody>" +
                "</table>";

            //console.log(tempHTML);
            innerHTML = tempHTML;
        }
        //Se usa el metodo de "Visitor" para hacer el analisis semantico
        let res = visitor.vProgram(parser.getTree());




        if (!res.success) {
            console.log(res.error);
            errorsArea.value = res.error;
            document.getElementById('nav3').click();
        } else {
            console.log("No errors found.");
            errorsArea.value = "No errors found.";
            taCodeArea.value = "";
            for (var i = 0; i < res.taCode.length; i++)
                taCodeArea.value += res.taCode[i] + "\n";
            document.getElementById('nav4').click();
        }
    } else {
        console.log(error);
        errorsArea.value = error;
    }
});




//Funcion para construir una estructura de arbol usando <table>
function buildTree(root, cont) {
    var toggleText = "";
    var leaves = root.getNext();

    for (var i = 0; i < leaves.length; i++) {
        toggleText += "\'r" + leaves[i].getID() + "\',";
    }
    toggleText = toggleText.substring(0, toggleText.length-1);
    if (cont == 0){
        tempHTML += "<tr id = \"r" + root.getID() + "\" class = \"expands\" onclick =\"toggle(" + toggleText + "); toggleExtra(this);\"";
    } else {
        if (root.hasNext())
            tempHTML += "<tr id = \"r" + root.getID() + "\" class = \"expands removed\" onclick =\"toggle(" + toggleText + "); toggleExtra(this);\"";
        else {
            tempHTML += "<tr id = \"r" + root.getID() + "\" class = \"removed\"";
        }
    }
    tempHTML += ">";

    if (root.hasNext()) {
        tempHTML += "<td style = \"padding: 0 0 1em " + cont + "em;\" ><span id = \"rt" + root.getID() + "\">+" + root.getValue() + "</span></td>";
    } else {
        tempHTML += "<td style = \"padding: 0 0 1em " + cont + "em;\" ><span id = \"rt" + root.getID() + "\">" + root.getValue() + "</span></td>";
    }

    tempHTML += "</tr>";

    if (root.hasNext()) {
        for (var i = 0; i < leaves.length; i++) {
            buildTree(leaves[i], cont+1)
        }
    }
}

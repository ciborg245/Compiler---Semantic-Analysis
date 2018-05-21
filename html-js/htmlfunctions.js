function fileChosen(event, el) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function(){
        var text = reader.result;
        var textArea = document.getElementById('codeToParseArea');
        textArea.value = "";
        textArea.value = text;
        el.value = null;
    };
    reader.readAsText(input.files[0]);
}


function toggle()
{
    for(var i=0; i<arguments.length; i++)
    {
        with(document.getElementById(arguments[i]))
        {
            if(className.indexOf('removed') > -1)
            {
                className = className.replace('removed', "");
            }
            else
            {
                className += ' removed';
            }
        }
    }
}

function toggleExtra(obj) {
    cellId = obj.id;
    spanId = cellId.substring(0,1) + "t" + cellId.substring(1,cellId.length);
    with (document.getElementById(spanId)) {
        text = innerHTML;
        if (text.charAt(0) == "+") {
            text = "-" + text.substring(1, text.length);
            innerHTML = text;
        } else if (text.charAt(0) == "-") {
            text = "+" + text.substring(1, text.length);
            innerHTML = text;
        }
    }
}

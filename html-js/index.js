$(document).ready(function(){
 var item_num = $('nav li').length + 1;
 var btn_state = true;

 $('nav li').hover(function(){
   $(this).addClass('hover');
 },function(){
   $(this).removeClass('hover');
 });

 $('nav li').on('click',function(){
   if(btn_state){
     btn_state = !btn_state;
     $('nav li').removeClass('currentPage');
     $(this).addClass('currentPage');

     var i = $('nav li').index(this);
     $('article').removeClass('show');
     $('article').addClass('hide');
     $('article').eq(i).addClass('show');

     setTimeout(function(){
       btn_state = !btn_state;
     },500);
   }
 });


});

// $(document).delegate('#codeToParseArea', 'keydown', function(e) {
//   var keyCode = e.keyCode || e.which;
//
//   if (keyCode == 9) {
//     e.preventDefault();
//     var start = this.selectionStart;
//     var end = this.selectionEnd;
//
//     // set textarea value to: text before caret + tab + text after caret
//     $(this).val($(this).val().substring(0, start)
//                 + "\t"
//                 + $(this).val().substring(end));
//
//     // put caret at right position again
//     this.selectionStart =
//     this.selectionEnd = start + 1;
//   }
// });

$("textarea").keydown(function(e) {
    if(e.keyCode === 9) { // tab was pressed
        // get caret position/selection
        var start = this.selectionStart;
            end = this.selectionEnd;

        var $this = $(this);

        // set textarea value to: text before caret + tab + text after caret
        $this.val($this.val().substring(0, start)
                    + "\t"
                    + $this.val().substring(end));

        // put caret at right position again
        this.selectionStart = this.selectionEnd = start + 1;

        // prevent the focus lose
        return false;
    }
});

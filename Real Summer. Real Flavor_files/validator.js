var non_characters = {
      8: "backspace",
      9: "tab",
     13: "enter",
     16: "shift",
     17: "ctrl",
     18: "alt",
     20: "caps lock",
     27: "escape",
     32: "space",
     33: "page up",
     34: "page down",
     35: "end",
     36: "home",
     37: "left",
     38: "up",
     39: "right",
     40: "down",
     45: "insert",
     46: "delete",
     91: "windows (start)",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    122: "f11",
    123: "f12",
    144: "num lock"
};

var x = new Object();
x.match = function(input, regex){
    regex = regex.replace(/^\//, "").replace(/\/$/,"");
    var re = new RegExp(regex);
    return re.exec(input.value);
}

x.nomatch = function(input, regex){
    regex = regex.replace(/^\//, "").replace(/\/$/,"");
    var re = new RegExp(regex);
    return !re.exec(input.value);
}

function email(input, evt){
    return input.value.match(/^.*\@.*\.\w+$/) != null;
}

function field_match(input, evt, field){
    var field_value = $("#"+field).find("input").val();
    return input.value == field_value;
}

function zip(input, evt){
    return input.value.match(/^((\d{5})|(\d{5}-\d{4})|([a-zA-Z]\d[a-zA-Z](\s|-)?\d[a-zA-Z]\d))$/) != null;
}

function word_limit(input, evt, limit){
    var words;
    if (evt.type == 'keyup') {
        words = _words($(input).val(), limit);
    } else if (evt.type == 'paste') {
        input = document.activeElement;
        words = _words($(input).val(), limit);
    } else {
        words = _words($(input).val() + (_is_character(evt.keyCode) ? "a" : ""), limit);
    }

    _update_remaining(input.name, words);

    if (words.count <= limit) {
        return true;
    } else if (_is_character(evt.keyCode)) {
        _cancel(evt);
    }

    return false;
}

function _is_character(key_code) {
    return !non_characters[key_code];
}

function _update_remaining(name, words) {
    // Update a counter if it exists.
    $("#" + name + "_remaining").empty().html("" + words.remaining);
}

function _words(text, limit) {
    text = text.replace(/^\s+/, "").replace(/\s+$/, "");
    var count = text.length ? text.split(/\s+/).length : 0;
    var remaining = limit - count;

    return { count: count, remaining: (remaining > 0 ? remaining : 0) };
}

function _cancel(evt) {
    evt.cancelBubble = true;
    if (evt.stopPropagation) evt.stopPropagation();
}

/* ------- */

// A bit of jankiness since guards don't quote their arguments.
function validate(input, evt, guards){

    evt.cancelBubble = false;
    //if (evt.stopPropagation) evt.stopPropagation();

    var guards = guards.split('&&');
    var function_regex = new RegExp(/([\w\.]+)\((.*)\)/);
    var comparison_regex = new RegExp(/x ([\>\<=]+) (\d+)/);

    var result = true;
    var cancelBubble;
    for(var i=0;i<guards.length; i++){
        if(guards[i].match(function_regex)){
            var func = RegExp.$1;
            var args = RegExp.$2;
            if(args)
                args = ',"' + args.split(',').join('","') +'"';

            if(!eval(func +"(input, evt"+ args +")"))
                result = false;
        }
        else {
            guards[i].match(comparison_regex);
            var operator = RegExp.$1;
            var integer = RegExp.$2;

            if(!input.value.match(/^\d+$/) || !eval(input.value + operator + integer))
                result = false;
        }
    }

    if(!result){
        $("#"+input.name).addClass("error");
    }
    else {
        $("#"+input.name).removeClass("error");
    }

    return !evt.cancelBubble;
}

function terminal(input, guard){
    return validate(input, guard);
}

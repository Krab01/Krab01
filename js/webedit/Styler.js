var Styler = function (css) {

    var result = {};

    for (var key in css) {
        if (css.hasOwnProperty(key) && Styler[key]) {
            Styler[key](key, css[key], result);
        }
    }

    return result;
};

Styler.color = function (key, val, result) {
    result.color = val;
};

Styler.bgcolor = function (key, val, result) {
    result.backgroundColor = val;
};

Styler.fontsize = function (key, val, result) {
    result.fontSize = val;
};

Styler.height = function (key, val, result) {
    result.height = val;
};

Styler.width = function (key, val, result) {
    if (val)
        result.width = val;
};

Styler.center = function (key, val, result) {
    if (val) {
        result.margin = "0 auto";
    }
};

Styler.family = function (key, val, result) {
    result.fontFamily = val;
};

Styler.margins = function (key, val, result) {
    result.marginLeft = val.marginLeft;
    result.marginRight = val.marginRight;
    result.marginBottom = val.marginBottom;
    result.marginTop = val.marginTop;
}

Styler.align = function (key, val, result) {
    result['textAlign'] = val;
}


Styler.padding = function (key, val, result) {
    result.paddingLeft = val.paddingLeft;
    result.paddingRight = val.paddingRight;
    result.paddingBottom = val.paddingBottom;
    result.paddingTop = val.paddingTop;
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) != -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

Array.prototype.add = function(item) {
    for (var n = 0; n < this.length; n++) if (this[n] == item) return false;
    this.push(item);
    return true;
};


Number.prototype.format0 = function() {
    var conv_val = Math.round(this).toString();
    return conv_val.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
};

Number.prototype.format1 = function() {
    var conv_val = (Math.round(this * 10)/10).toFixed(1);
    return conv_val.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
};

Number.prototype.format2 = function() {
    var conv_val = (Math.round(this * 100)/100).toFixed(2);
    return conv_val.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function parseFloatValue(floatStr) {
    floatStr = floatStr.replace(/ /g, "");
    floatStr = floatStr.replace(/\,/g, ".");
    if (floatStr.length == 0) return null;

    // floatStr = floatStr.replace(/[^\d\.]/g, "");
    floatStr = parseFloat(floatStr);
    return isNaN(floatStr) ? false : floatStr;
}

function float2str(float_v) {
    if (float_v == null || float_v == "")
        return "";
    else
        return ""+(Math.round(float_v*10)*0.1).toFixed(1);
}

function sharePercent(sum, fact) {
    var percent;

    if (fact != 0) {
        var share = Math.round(((fact/sum - 1)*100)*100)/100;
        percent = (share < 0) ? share.toFixed(2) + '%' : '+' + share.toFixed(2) + '%';
        percent = ' (' + percent + ')';
    }
    else
        percent = '';
    return fact.format1() + percent;
}

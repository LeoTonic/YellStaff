function CPager(tree) {
    this.pg_total = 0;
    this.pg_current = 0;
    this.pg_rowspp = 20; // rows per page
    this.tree = tree;
}

CPager.prototype.createHtml = function() {
    if (this.pg_total < 2) return '';

    var html = "<ul class='pagination'>";

    // add left pager
    if (this.pg_current > 6 && this.pg_total > 11) {
        html += "<li class='page_prev'>";
        html += "<a href='#'>&laquo;</a></li>";
    }
    // add left edge page
    html += "<li class='page_1";
    if (this.pg_current == 1) html += " active";
    html += "'><a href='#' page_num='1'>1</a></li>";

    // middle content
    var cycleCnt = (this.pg_total > 11) ? 11 : this.pg_total;
    for (var n = 2; n <= (cycleCnt-1); n++) {
        var page_id = "page_" + n;
        var cls_active = "";
        var page_num;
        var is_dot = false;

        if (this.pg_current < 7) {
            page_num = n;
            cls_active = (this.pg_current == n) ? "active" : "";
        }
        else if (this.pg_current > (this.pg_total-6)) {
            page_num = this.pg_total-cycleCnt+n;
            cls_active = (this.pg_current==(this.pg_total-cycleCnt+n)) ? "active" : "";
        }
        else if (n != 2 && n != 10) {
            page_num = this.pg_current+n-6;
            cls_active = (n==6) ? "active" : "";
        }
        if (this.pg_total > 11 && ((n == 2 && this.pg_current > 6) || (n == 10 && this.pg_current < (this.pg_total-5)))) {
            is_dot = true;
            cls_active = "disabled";
        }
        var oc_class = 'page_' + n + ' ' + cls_active;
        html += ("<li class='" + oc_class + "'");
        html += cls_active;
        html += "><a href='#'";

        if (is_dot) {
            html += ">&hellip;";
        } else {
            html += (" page_num='" + page_num + "'");
            html += (">" + page_num);
        }
        html += "</a></li>";
    }

    // add right edge page
    html += "<li class='page_11";
    if (this.pg_current == this.pg_total) html += " active";
    html += ("'><a href='#' page_num='" + this.pg_total + "'>" + this.pg_total +"</a></li>");
    // add right pager
    if (this.pg_current < (this.pg_total-5) && this.pg_total > 11) {
        html += "<li class='page_next'>";
        html += "<a href='#'>&raquo;</a></li>";
    }

    html += "</ul>";
    return html;
};

CPager.prototype.reset = function() {
    var rcnt = this.tree.rowsCount();
    this.pg_total = Math.ceil(rcnt / this.pg_rowspp);
    this.pg_current = 1;
};

CPager.prototype.addHandlers = function(contentDepth) {
    var pager = this;
    // add handlers to pager buttons
    $('.page_prev').on('click', function() {
        pager.pg_current--;
        $('.page_navigator').html(pager.createHtml());
        $('#table_content').html('');
        pager.tree.createHTMLTable($('#table_content'), contentDepth, pager, 1);
        pager.addHandlers(contentDepth);
    });
    $('.page_next').on('click', function() {
        pager.pg_current++;
        $('.page_navigator').html(pager.createHtml());
        $('#table_content').html('');
        pager.tree.createHTMLTable($('#table_content'), contentDepth, pager, 1);
        pager.addHandlers(contentDepth);
    });
    for (var n = 1; n <= 11; n++) {
        $('.page_'+n).on('click', function() {
            if (!$(this).hasClass('disabled')) {
                var p_num = parseInt($(this).find('a').attr('page_num'), 10);
                pager.pg_current = p_num;
                $('.page_navigator').html(pager.createHtml());
                $('#table_content').html('');
                pager.tree.createHTMLTable($('#table_content'), contentDepth, pager, 1);
                pager.addHandlers(contentDepth);
            }
        });
    }
};

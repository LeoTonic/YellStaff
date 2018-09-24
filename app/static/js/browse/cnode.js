/*
    CNode class definition (for browse module)
*/

function CNode (name, name_short, parent) {
    this.id = new_id;
    new_id++;
    this.name = name;
    this.name_short = name_short;
    this.cnodes = []; // children nodes
    this.cparent = parent;
    if (parent != null) {
        this.root = parent.root;
        this.depth = parent.depth + 1; // current depth of tree
    }
    else {
        this.depth = 0; // or zero for root
        this.root = this;
    }

    this.current = null; // current value
    this.measurement = null; // measurement
    this.selected_val = true;
    this.selected_pos = true;
    this.vsp_order = []; // array of selected offices (only in root)
}

CNode.prototype.add = function(name, name_short) {
    // CValue: add children node to tree or return existing
    var newNode = this.getNode(name);
    if (newNode == null) {
        newNode = new CNode(name, name_short, this);
        this.cnodes.push(newNode);
    }
    return newNode;
};

CNode.prototype.getNode = function(name) {
    // CValue: get node from children array if exist or null
    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        var getNode = this.cnodes[n];
        if (getNode.name == name) return getNode;
    }
    return null;
};

CNode.prototype.getComboBoxContent = function(depth, select_mode) {
    // get content for fill combos (without positions combo)
    if (!this.is_selected() || this.depth > depth) return "";
    if (this.depth == 1 && depth == 2) {
        // apply opt group
        var content = "<optgroup label='" + this.name + "'>";
        var nlen = this.cnodes.length;
        for (var n = 0; n < nlen; n++)
            content += this.cnodes[n].getComboBoxContent(depth, select_mode);
        content += "</optgroup>";
        return content;
    }
    else if ((this.depth == 2 && depth == 2) || (this.depth == 1 && depth == 1)) {
        if (select_mode == SELMODE_VAL)
            return ("<option value=" + this.id + " selected>" + this.name + "</option>");
        else
            return ("<option value=" + this.name_short + " selected>" + this.name + "</option>");
    }

    var content = "", n_len = this.cnodes.length;
    for (var n = 0; n < n_len; n++) {
        content += this.cnodes[n].getComboBoxContent(depth, select_mode);
    }
    return content;
};

CNode.prototype.is_selected = function() {
    return (this.selected_val && this.selected_pos);
};

CNode.prototype.filter = function(select_values, depth, select_mode) {
    // Filtering selected values and deselect other
    if (this.depth == depth) {
        var sel_val = (select_values) ? this.inArray(select_values, select_mode) : false;
        this.selectItem(sel_val, select_mode);
        return;
    }

    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        this.cnodes[n].filter(select_values, depth, select_mode);
    }
};

CNode.prototype.inArray = function(array_values, select_mode) {
    // check if node.id in arrayValues
    var nlen = array_values.length;
    for (var n = 0; n < nlen; n++) {
        switch (select_mode) {
            case SELMODE_VAL:
                if (this.id == array_values[n]) return true;
                break;
            case SELMODE_POS:
                if (this.name_short == array_values[n]) return true;
                break;
        }
    }
    return false;
};

CNode.prototype.selectItem = function(selected, select_mode) {
    // select or deselect current and children items
    if (select_mode == SELMODE_POS)
        this.selected_pos = selected;
    else if (select_mode == SELMODE_VAL)
        this.selected_val = selected;

    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        var gitem = this.cnodes[n];
        gitem.selectItem(selected, select_mode);
    }
};

CNode.prototype.rowsCount = function() {
    // get quantity of pages for pagination

    // return row if node is on edge
    if (this.depth == 3) return (this.is_selected()) ? 1 : 0;

    var pageCnt = 0, nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        pageCnt += this.cnodes[n].rowsCount();
    }
    return pageCnt;
};

CNode.prototype.createVSPList = function(vspTree) {
    // create vsp list from vsp tree elements
    var nlen = vspTree.cnodes.length;
    this.vsp_order = [];
    for (var n = 0; n < nlen; n++) {
        var vspItem = vspTree.cnodes[n];
        if (vspItem.is_selected()) {
            var vsp = vspItem.name;
            this.vsp_order.push(vsp);
        }
    }
};

CNode.prototype.createHTMLHead = function(jQ) {
    var root = this.root;
    if (root.vsp_order.length == 0) return;
    var j_tr = $('<tr></tr>');
    $('<th></th>').html('Показатель активности').addClass('col-sm-4').appendTo(j_tr);
    var nlen = root.vsp_order.length;
    for (var n = 0; n < nlen; n++) $('<th></th>').addClass('browse-cell').html(root.vsp_order[n]).appendTo(j_tr);
    j_tr.appendTo(jQ);
};

CNode.prototype.createHTMLTable = function(jQ, contentDepth, pager, cur_row) {
    if (this.root.vsp_order.length == 0) return;
    var current_row = cur_row;
    var calc_page = Math.ceil(current_row / pager.pg_rowspp);
    var header_drawed = false;
    if (this.depth == contentDepth) {
        if (this.rowsCount() > 0) {
            if (calc_page == pager.pg_current) {
                this.drawHeader(jQ);
                header_drawed = true;
            }
            // draw rows
            var val_len = this.cnodes.length;
            for (var n = 0; n < val_len; n++) {
                var val_item = this.cnodes[n];
                var pos_len = val_item.cnodes.length;
                // draw positions
                for (var p = 0; p < pos_len; p++) {
                    var pos_item = val_item.cnodes[p];
                    calc_page = Math.ceil(current_row / pager.pg_rowspp);
                    if (pos_item.is_selected()) {
                        if (calc_page == pager.pg_current) {
                            if (!header_drawed) {
                                this.drawHeader(jQ);
                                header_drawed = true;
                            }
                            pos_item.drawRow(jQ);
                        }
                        current_row++;
                    }
                }
            }
        }
    }
    else {
        var nlen = this.cnodes.length;
        for (var n = 0; n < nlen; n++)
            if (this.cnodes[n].is_selected()) current_row = this.cnodes[n].createHTMLTable(jQ, contentDepth, pager, current_row);
    }
    return current_row;
};

CNode.prototype.drawHeader = function(jQ) {
    var node_item = this; // value group
    var j_tr = $("<tr></tr>").addClass('header-label');
    var col_cnt = '' + (this.root.vsp_order.length + 1);
    $("<th></th>").attr({ scope: 'row', colspan: col_cnt, class: 'data-label' }).html(node_item.name).appendTo(j_tr);
    j_tr.appendTo(jQ);
};

CNode.prototype.drawRow = function(jQ) {
    var node_item = this;
    var val_item = this.cparent;

    var j_tr = $("<tr></tr>");
    // draw value name
    $('<td></td>').html(val_item.name + ' (' + node_item.name_short + ')').appendTo(j_tr);

    // draw vsp items
    var order_len = this.root.vsp_order.length;
    for (var n = 0; n < order_len; n++) {
        var j_td = $('<td></td>');
        j_td.addClass('browse-cell');
        var vsp_name = this.root.vsp_order[n];
        var vsp_item = node_item.getNode(vsp_name);
        if (vsp_item)
            j_td.html(isNumeric(vsp_item.current) ? vsp_item.current.format2() : vsp_item.current);
        else
            j_td.html('-');
        j_td.appendTo(j_tr);
    }
    j_tr.appendTo(jQ);
};

function CNode(name, parent) {
    this.id = new_id;
    new_id++;

    this.name = name;                   // node name (TB, RSO, ..., VSP, POSITION)
    this.id_struct = null;              // office id_struct
    this.cparent = parent;              // reference to parent
    this.cnodes = [];                   // children nodes

    if (parent != null) {
        this.depth = parent.depth + 1;  // current depth of tree
        this.root = parent.root;        // root reference
    }
    else {
        this.depth = 0;                 // or zero for root
        this.root = this;               // root reference
        this.positions = [];            // array of position string labels (short names)
        // for outcome row in table
        this.outcome_row_actual = 0;
        this.outcome_row_propose_ca = 0;
        this.outcome_row_propose_tb = 0;
    }

    // set quantity approved attribute for tb and gosb only!
    if (this.depth == 1 || this.depth == 2) this.quantity_approved = 0;

    // set outcomes for levels 0 - 5
    if (this.depth < 6) {
        this.outcome_qnt_total = [];            // total quantity for all vsp
        this.outcome_qnt_actual = [];           // actual quantity (for corrections between vsp)
        this.outcome_qnt_propose_tb = [];       // propose quantity from regional branch (for corrections)
        this.outcome_vsp_propose_ca = [];       // quantity of vsp with ca proposes
        this.outcome_vsp_approve_ca = [];       // quantity of vsp with ca proposes approved
        this.outcome_vsp_deny_ca = [];          // quantity of vsp with tb propose equal with actual
        this.outcome_vsp_change_tb = [];        // quantity correction between vsp by tb
        // vsp_propose_ca = vsp_approve_ca + vsp_deny_ca
        // qnt_actual = qnt_propose_tb
    }

    this.selected_cons = true;          // current node is selected for filtering
                                        // for consolidations
    this.selected_pos = true;           // filtering for positions
    this.selected_approve = true;       // filtering for approving

    this.city_name = null;              // city name

    this.potential = null;              // potential quantity
    this.actual = null;                 // actual quantity
    this.propose_ca = null;             // central department quantity proposition
    this.propose_tb = null;             // regional department quantity proposition
    this.propose_comment = null;        // last comment for propose_tb

    this.propose_user_name = null;      // last propose user name
    this.propose_role_ccode = null;     // last propose role ccode
    this.propose_role_id = null;        // last propose role id

    this.alert_increase = null;          // quantity increase risk information
    this.alert_decrease = null;          // quantity decrease risk information

    this.staff_id = null;               // identifier of staff record
    this.iteration_id = null;           // identifier of current iteration

    this.is_browse = false;             // node added to browse list
}

CNode.prototype.add = function(name) {
    // CNode: add children node to tree or return existing
    var newNode = this.getNode(name);
    if (newNode == null) {
        newNode = new CNode(name, this);
        this.cnodes.push(newNode);
    }
    return newNode;
};

CNode.prototype.getNode = function(name) {
    // CNode: get node from children array if exist or null
    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        var getNode = this.cnodes[n];
        if (getNode.name == name) return getNode;
    }
    return null;
};

CNode.prototype.getVSPNode = function(id_struct) {
    if (this.id_struct && this.id_struct == id_struct) return this;
    var L = this.cnodes.length;
    for (var n = 0; n < L; n++) {
        var result = this.cnodes[n].getVSPNode(id_struct);
        if (result) return result;
    }
    return null;
};

CNode.prototype.filter = function(selectedValues, depth, selectMode) {
    // Filtering selected values and deselect other
    if (this.depth == depth) {
        var sel_val = (selectedValues) ? this.inArray(selectedValues, selectMode) : false;
        this.setSelected(sel_val, selectMode);
        this.selectChildren(sel_val, selectMode);
        return;
    }

    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        this.cnodes[n].filter(selectedValues, depth, selectMode);
    }
};

CNode.prototype.inArray = function(arrayValues, selectMode) {
    var nlen = arrayValues.length;
    for (var n = 0; n < nlen; n++) {
        switch (selectMode) {
            case SELMODE_CONS:
                if (this.id == arrayValues[n]) return true;
                break;
            case SELMODE_POS:
                if (this.name == arrayValues[n]) return true;
                break;
            case SELMODE_APPROVE:
                if (arrayValues[n] == APPMODE_CA && this.propose_ca != this.actual) return true;
                if (arrayValues[n] == APPMODE_TB && this.propose_tb != this.propose_ca) return true;
                if (arrayValues[n] == APPMODE_NONE && (this.propose_ca == this.propose_tb)) return true;
                break;
        }
    }
    return false;
};

CNode.prototype.selectChildren = function(selected, selectMode) {
    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) {
        var gitem = this.cnodes[n];
        gitem.selectChildren(selected, selectMode);
    }
    this.setSelected(selected, selectMode);
};

CNode.prototype.setSelected = function(selected, selectMode) {
    switch (selectMode) {
        case SELMODE_CONS:
            this.selected_cons = selected;
            break;
        case SELMODE_POS:
            this.selected_pos = selected;
            break;
        case SELMODE_APPROVE:
            this.selected_approve = selected;
            break;
    }
};

CNode.prototype.rowsCount = function() {
    // get quantity of pages for pagination

    // return row if node is on edge
    var nlen = this.cnodes.length;
    if (nlen == 0 && this.depth >= 6) {
        return (this.selected_cons && this.selected_pos && this.selected_approve) ? 1 : 0;
    }

    var pageCnt = 0;
    for (var n = 0; n < nlen; n++) {
        pageCnt += this.cnodes[n].rowsCount();
    }
    return pageCnt;
};

CNode.prototype.getComboBoxContent = function(depth, selectMode) {
    // get content for fill combos (without positions combo)
    if (!this.selected_cons) return "";
    if (this.depth == depth) {
        if (selectMode == SELMODE_CONS)
            return ("<option value=" + this.id + " selected>" + this.name + "</option>");
        else
            return ("<option value=" + this.name + " selected>" + this.name + "</option>");
    }

    var content = "", n_len = this.cnodes.length;
    for (var n = 0; n < n_len; n++) {
        content += this.cnodes[n].getComboBoxContent(depth, selectMode);
    }
    return content;
};

CNode.prototype.createHTMLTable = function(jQ, contentDepth, pager, cur_row) {
    var current_row = cur_row;
    var calc_page = Math.ceil(current_row / pager.pg_rowspp);
    var header_drawed = false;

    if (this.depth == contentDepth) {
        if (this.rowsCount() > 0) {
            if (calc_page == pager.pg_current) {
                this.drawHeader(jQ, pager);
                header_drawed = true;
            }
            // draw rows
            var vsp_len = this.cnodes.length;
            for (var n = 0; n < vsp_len; n++) {
                var vsp_item = this.cnodes[n];
                var pos_len = vsp_item.cnodes.length;
                // draw positions
                for (var p = 0; p < pos_len; p++) {
                    var pos_item = vsp_item.cnodes[p];
                    calc_page = Math.ceil(current_row / pager.pg_rowspp);
                    if (pos_item.selected_cons && pos_item.selected_pos && pos_item.selected_approve) {
                        if (calc_page == pager.pg_current) {
                            if (!header_drawed) {
                                this.drawHeader(jQ, pager);
                                header_drawed = true;
                            }
                            pos_item.drawRow(jQ, pager);
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
            if (this.cnodes[n].selected_cons) current_row = this.cnodes[n].createHTMLTable(jQ, contentDepth, pager, current_row);
    }
    return current_row;
};

CNode.prototype.drawHeader = function(jQ, pager) {
    var node_item = this; // rgo

    var rso_name = this.cparent.name;
    var gosb_name = this.cparent.cparent.name;
    var tb_name = this.cparent.cparent.cparent.name;
    var header = tb_name + ' &#x25BA; ' + gosb_name + ' &#x25BA; ' + rso_name + ' &#x25BA; ' + this.name;
    var j_tr = $("<tr></tr>").addClass('header-label').addClass('browse');
    var j_th = $("<th></th>");
    j_th.attr({ scope: 'row', colspan: '10', class: 'data-label rowcheck' }).html(header);
    j_th.appendTo(j_tr);

    j_tr.appendTo(jQ);
    j_tr.on('click', function() {
        // check for anything is browsing
        // if some one child is browsing - uncheck all
        // overwise if none child is browsing - try to check all
        var childBrowse = false;
        for (var n = 0; n < node_item.cnodes.length; n++) {
            if (node_item.cnodes[n].is_browse) childBrowse = true;
        }
        if (!childBrowse) {
            // try to check all
            for (var n = 0; n < node_item.cnodes.length; n++) {
                var vsp_node = node_item.cnodes[n];
                // exit if list is full
                if (BROWSE_LIST.length >= BROWSE_LIST_SIZE) break;
                // check for anyone selected positions in vsp
                var is_selected_vsp = false;
                var pos_len = vsp_node.cnodes.length;
                for (var p = 0; p < pos_len; p++) {
                    var p_item = vsp_node.cnodes[p];
                    if (p_item.selected_cons && p_item.selected_pos && p_item.selected_approve) is_selected_vsp = true;
                }
                if (!is_selected_vsp) continue;

                if (BROWSE_LIST.add(vsp_node)) {
                    vsp_node.is_browse = true;
                    vsp_node.checkBrowse(pager);
                }
            }
        }
        else {
            // uncheck all
            for (var n = 0; n < node_item.cnodes.length; n++) {
                var vsp_node = node_item.cnodes[n];
                if (BROWSE_LIST.length <= 0) break;
                BROWSE_LIST.remove(vsp_node);
                vsp_node.is_browse = false;
                vsp_node.checkBrowse(pager);
            }
        }
    });
};

CNode.prototype.drawRow = function(jQ, pager) {
    var node_item = this;
    var vsp_node = this.cparent;

    var j_tr = $("<tr></tr>");
    j_tr.attr('vspid', vspid + vsp_node.id);
    j_tr.addClass(vspid+vsp_node.id);
    j_tr.on('click', function() {
        if (!node_item.is_browse) {
            // check item
            if (BROWSE_LIST.length >= BROWSE_LIST_SIZE) {
                // can't add to list
                showAlert('Список ВСП заполнен', 'Чтобы добавить данное ВСП в список для обзора показателей, удалите одно или несколько ВСП из списка.');
                return;
            }
            if (BROWSE_LIST.add(vsp_node)) {
                vsp_node.is_browse = true;
                vsp_node.checkBrowse(pager);
            }
        }
        else {
            // uncheck item
            BROWSE_LIST.remove(vsp_node);
            vsp_node.is_browse = false;
            vsp_node.checkBrowse(pager);
        }
    });

    var attr_sid = isid + node_item.staff_id;
    var u_name_td = aunid + node_item.id;
    var u_role_td = aurid + node_item.id;

    // city
    var j_city = $("<td></td>");
    j_city.addClass('hidden-xs').addClass('browse').addClass('rowcheck');
    j_city.html(this.city_name);
    // add browse checkbox
    var j_dv = $('<div></div>').addClass('rowcheck');
    var j_lb = $('<label></label>');
    var j_cb = $("<input/>").attr('type', 'checkbox');
    j_cb.addClass('rowcheck');
    j_cb.appendTo(j_lb);
    j_lb.appendTo(j_dv);
    j_dv.appendTo(j_city);
    j_city.appendTo(j_tr);

    // vsp name
    var j_vsp = $("<td></td>");
    j_vsp.addClass('browse');
    j_vsp.html(this.cparent.name);
    j_vsp.appendTo(j_tr);

    // position
    $("<td></td>").addClass('browse').html(this.name).appendTo(j_tr);

    // potential
    $("<td class='hidden-xs browse'></td>").html(float2str(this.potential)).appendTo(j_tr);

    // quantity
    $("<td></td>").addClass('browse').html(float2str(this.actual)).appendTo(j_tr);

    // propose_CA
    $("<td></td>").addClass('browse').addClass('text-info').html(float2str(this.propose_ca)).appendTo(j_tr);

    // propose_TB
    var j_td = $("<td></td>");

    var attr_val = float2str(this.propose_tb);
    var j_in = $("<input/>").attr({
        type: 'text',
        class: 'propose text-danger form-control',
        size: 5,
        sid: attr_sid,
        old_value: attr_val,
        value: attr_val });
    j_in.on('change', function() {
        var jI = $(this);
        if (jI.is(':disabled')) return;

        // check for user role
        if (!isPermissionEdit()) {
            showAlert("Согласование завершилось", "Вышел срок предложений по численности штата для вашего уровня управления, либо корректировки уже согласованы!");
            jI.val(float2str(node_item.propose_tb));
            return;
        }
        var isid_id = jI.attr('sid');

        var ipid_old = parseFloatValue(jI.attr('old_value'));

        var si = isid_id.indexOf(isid);
        var isid_val = null;
        if (si >= 0)
            isid_val = parseInt(isid_id.substr(si+isid.length),10);
        if (isid_val == null) {
            alert('System Error: Inputbox not identified by staff_id!');
            return;
        }

        var ipid_data = parseFloatValue(jI.val());
        console.log(ipid_data);

        // check for equal
        if (ipid_data == ipid_old) return;

        // check for correct value
        if (ipid_data == false) return;

        // post query to set value in db
        jI.prop('disabled', true);
        $.post('/propose', {
            'user_id': USER_ID,
            'staff_id': isid_val,
            'propose': ipid_data,
            'comment': ''
        }).done(function(response) {
            jI.prop('disabled', false);
            jI.attr('old_value', float2str(response['propose_val']));
            jI.val(float2str(response['propose_val']));

            node_item.propose_tb = parseFloatValue(response['propose_val']);
            node_item.propose_user_name = response['propose_user_name'];
            node_item.propose_role_ccode = response['propose_role_ccode'];
            node_item.propose_role_id = response['propose_role_id'];

            // set row colouring by risk
            node_item.setProposeAlert(j_tr);

            // set content values
            $('#' + u_name_td).html(node_item.propose_user_name);
            $('#' + u_role_td).html(node_item.propose_role_ccode);

            // update totals
            node_item.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
            node_item.renderOutcomePanel($('#control-panel'), $('#control-alert'), $('#control-label'), $('#control-ca'), $('#control-tb'), $('#control-content'));

        }).fail(function() {
            showAlert("Ошибка", "Отсутствует соединение с сервером!");
            jI.prop('disabled', false);
            jI.val(float2str(ipid_old));
        });
    });
    j_in.on('blur', function() {
        // check for correct value
        if (parseFloatValue($(this).val()) == false) {
            $(this).removeClass("error_value");
            $(this).addClass("error_value");
            $(this).focus();
        }
        else
            $(this).removeClass("error_value");
    });
    j_in.keydown(function(event) {
        if (event.which == 40)
            $(this).closest('tr').next().find('.propose').focus();
        else if (event.which == 38)
            $(this).closest('tr').prev().find('.propose').focus();
    });
    j_in.on('click', function(event) {
        event.stopPropagation();
    });

    j_in.appendTo(j_td);
    j_td.on('click', function() { $(this).find('.propose').focus(); });
    j_tr.append(j_td);

    // propose name
    var u_td = $("<td class='hidden-xs hidden-sm browse'></td>").html(this.propose_user_name);
    u_td.attr('id', u_name_td);
    u_td.appendTo(j_tr);

    // propose role
    var r_td = $("<td class='hidden-xs hidden-sm browse'></td>").html(this.propose_role_ccode);
    r_td.attr('id', u_role_td);
    r_td.appendTo(j_tr);

    // risk_comment
    $("<td class='risk_comment browse'></td>").html('').appendTo(j_tr);

    // set risk colouring
    node_item.setProposeAlert(j_tr);

    j_tr.appendTo(jQ);
};

CNode.prototype.setProposeAlert = function(rowEl) {
    rowEl.removeClass();
    // browse check in priority
    rowEl.find('input.rowcheck').prop('checked', this.is_browse);

    if (this.is_browse) {
        rowEl.addClass('browse-checked');
    }
    else {
        var prop_ca = (this.propose_ca != null && this.propose_ca != "" && this.propose_ca != this.actual),
            prop_tb = (this.propose_tb != null && this.propose_tb != "" && this.propose_tb != this.propose_ca);
        rowEl.addClass((prop_tb) ? 'propose-alert-tb' : ((prop_ca) ? 'propose-alert-ca' : ''));
    }

    if (this.propose_tb != null && this.propose_tb != "" && this.propose_ca != null) {
        if (this.propose_tb > this.propose_ca && this.alert_increase != null)
            rowEl.find('.risk_comment').html(this.alert_increase);
        else if (this.propose_tb < this.propose_ca && this.alert_decrease != null)
            rowEl.find('.risk_comment').html(this.alert_decrease);
    }
    rowEl.addClass(rowEl.attr('vspid'));
};

CNode.prototype.setChildrenBrowseValue = function(browse) {
    var L = this.cnodes.length;
    for (var n = 0; n < L; n++) this.cnodes[n].setChildrenBrowseValue(browse);
    this.is_browse = browse;
};

CNode.prototype.checkBrowse = function(pager) {
    var node = this;
    // set browse attribute for children
    this.setChildrenBrowseValue(node.is_browse);
    // set rows colouring
    $('.' + vspid + this.id).each(function(index) {
        if (node.cnodes.length > 0) node.cnodes[0].setProposeAlert($(this));
    });
    refreshBrowseButton(node.root, pager);
};

CNode.prototype.setOutcomesPanel = function() {
    this.redefineOutcomeArray(this.outcome_qnt_total);
    this.redefineOutcomeArray(this.outcome_qnt_actual);
    this.redefineOutcomeArray(this.outcome_qnt_propose_tb);
    this.redefineOutcomeArray(this.outcome_vsp_propose_ca);
    this.redefineOutcomeArray(this.outcome_vsp_approve_ca);
    this.redefineOutcomeArray(this.outcome_vsp_deny_ca);
    this.redefineOutcomeArray(this.outcome_vsp_change_tb);

    if (this.depth == 5) {
        var pos_len = this.cnodes.length;
        for (var p = 0; p < pos_len; p++) {
            var p_item = this.cnodes[p];
            var pn = p_item.name;
            var p_actual = (p_item.actual) ? parseFloat(p_item.actual) : 0.0;
            var p_prop_ca = (p_item.propose_ca) ? parseFloat(p_item.propose_ca) : 0.0;
            var p_prop_tb = (p_item.propose_tb) ? parseFloat(p_item.propose_tb) : 0.0;

            this.outcome_qnt_total[pn] += p_actual;

            if (p_prop_ca != p_actual) {
                this.outcome_vsp_propose_ca[pn]++;
                // propose ca
                if (p_prop_tb == p_prop_ca)
                    this.outcome_vsp_approve_ca[pn]++;
                else if (p_prop_tb == p_actual)
                    this.outcome_vsp_deny_ca[pn]++;
            }
            else {
                // correction between tb
                this.outcome_qnt_actual[pn] += p_actual;
                this.outcome_qnt_propose_tb[pn] += p_prop_tb;
                if (p_prop_tb != p_actual) this.outcome_vsp_change_tb[pn]++;
            }
        }
    }
    else {
        var nlen = this.cnodes.length;
        for (var n = 0; n < nlen; n++) {
            var c_item = this.cnodes[n];
            c_item.setOutcomesPanel();
            var pos_len = this.root.positions.length;
            for (var p = 0; p < pos_len; p++) {
                var pn = this.root.positions[p];
                this.outcome_qnt_total[pn] += c_item.outcome_qnt_total[pn];
                this.outcome_qnt_actual[pn] += c_item.outcome_qnt_actual[pn];
                this.outcome_qnt_propose_tb[pn] += c_item.outcome_qnt_propose_tb[pn];
                this.outcome_vsp_propose_ca[pn] += c_item.outcome_vsp_propose_ca[pn];
                this.outcome_vsp_approve_ca[pn] += c_item.outcome_vsp_approve_ca[pn];
                this.outcome_vsp_deny_ca[pn] += c_item.outcome_vsp_deny_ca[pn];
                this.outcome_vsp_change_tb[pn] += c_item.outcome_vsp_change_tb[pn];
            }
        }
    }
};

CNode.prototype.redefineOutcomeArray = function(element) {
    if (typeof(element) == 'undefined') return;
    var pos_len = this.root.positions.length;
    for (var n = 0; n < pos_len; n++) element[this.root.positions[n]] = 0;
};

CNode.prototype.renderOutcomePanel = function(jc_panel, jc_alert, jc_lbl, jc_ca, jc_tb, jc_cnt) {
    // render only for user role gosb and above and admin
    if (USER_ROLE <= 6 && USER_ROLE != 0) return;

    // define user node
    var userNode = this.root;

    if (USER_ROLE >= 16 && USER_ROLE <= 18) // for tb
        userNode = userNode.cnodes[0];
    else if (USER_ROLE >= 9 && USER_ROLE < 16) // for gosb
        userNode = userNode.cnodes[0].cnodes[0];

    userNode.setOutcomesPanel();

    // styling controls
    var success_ca = true, success_tb = true;

    for (var n = 0; n < this.root.positions.length; n++) {
        var pos = this.root.positions[n];
        var ca_total = Math.round(userNode.outcome_vsp_propose_ca[pos]),
            ca_approve = Math.round(userNode.outcome_vsp_approve_ca[pos]),
            ca_deny = Math.round(userNode.outcome_vsp_deny_ca[pos]),
            tb_actual = Math.round(userNode.outcome_qnt_actual[pos]),
            tb_propose = Math.round(userNode.outcome_qnt_propose_tb[pos]);
        if (ca_approve + ca_deny != ca_total) success_ca = false;
        if (tb_actual != tb_propose) success_tb = false;
        console.log(pos + '-' + ca_total);
    }
    setStyle(jc_ca, success_ca);
    setStyle(jc_tb, success_tb);

    // panel customization
    if (jc_panel.hasClass('panel-danger')) jc_panel.removeClass('panel-danger');
    if (jc_panel.hasClass('panel-success')) jc_panel.removeClass('panel-success');
    if (jc_alert.hasClass('glyphicon-alert')) jc_alert.removeClass('glyphicon-alert');
    if (jc_alert.hasClass('glyphicon-ok')) jc_alert.removeClass('glyphicon-ok');

    if (success_ca && success_tb) {
        jc_panel.addClass('panel-success');
        jc_alert.addClass('glyphicon-ok');
        jc_lbl.html('Контроль численности пройден');
        checkApproveButton(false);
    }
    else {
        jc_panel.addClass('panel-danger');
        jc_alert.addClass('glyphicon-alert');
        jc_lbl.html('Контроль численности не пройден');
        checkApproveButton(true);
    }

    // render content
    var j_tb = jc_cnt.find('.report');
    j_tb.html('');
    for (var div = 0; div < userNode.cnodes.length; div++) {
        // header
        var div_item = userNode.cnodes[div];
        var j_th = $('<tr></tr>');
        j_th.addClass('total-panel--header');
        var j_td = $('<td></td>');
        j_td.addClass('total-panel--badge');
        var j_lb = $('<span></span>').addClass('label');
        if (typeof(div_item.quantity_approved) != 'undefined') {
            if (div_item.quantity_approved == 1)
                j_lb.addClass('label-success').html('согласовано');
            else
                j_lb.addClass('label-danger').html('не согласовано');
        }
        j_lb.appendTo(j_td);
        j_td.appendTo(j_th);
        $("<td colspan='6'></td>").addClass('total-panel--content').html(div_item.name).appendTo(j_th);
        j_th.appendTo(j_tb);

        for (var n = 0; n < this.root.positions.length; n++) {
            var pos_item = this.root.positions[n];
            var j_tr = $('<tr></tr>');
            // status
            $('<td></td>').html('').appendTo(j_tr);
            // position name
            $('<td></td>').html(pos_item).appendTo(j_tr);

            var ca_prop = div_item.outcome_vsp_propose_ca[pos_item],
                ca_approve = div_item.outcome_vsp_approve_ca[pos_item],
                ca_deny = div_item.outcome_vsp_deny_ca[pos_item],
                tb_actual = div_item.outcome_qnt_actual[pos_item],
                tb_prop = div_item.outcome_qnt_propose_tb[pos_item],
                qnt_total = div_item.outcome_qnt_total[pos_item],
                tb_change = div_item.outcome_vsp_change_tb[pos_item];

            // total quantity
            $('<td></td>').html(qnt_total.format1()).appendTo(j_tr);

            // propose ca quantity of vsp
            var j_td = $('<td></td>');
            j_td.html(ca_prop.format0()).appendTo(j_tr);
            var success = ((ca_approve + ca_deny) == ca_prop);
            var j_span = $('<span></span>').addClass('glyphicon').appendTo(j_td);
            setStyle(j_td, success);

            // propose ca approved by tb and control marker
            var j_td = $('<td></td>');
//            if (ca_prop > 0)
//                j_td.html(ca_approve.format0() + " (" + (Math.round((ca_approve/ca_prop)*10000)/100).toFixed(2) + "%" + ")");
//            else
            j_td.html(ca_approve.format0());

            j_td.appendTo(j_tr);

            // propose tb quantity of correted vsp
            var success = (tb_actual == tb_prop);
            var j_td = $('<td></td>').html(tb_change);
            var j_span = $('<span></span>').addClass('glyphicon').appendTo(j_td);
            setStyle(j_td, success);
            j_td.appendTo(j_tr);

            j_tr.appendTo(j_tb);
        }
    }

    return;

    function setStyle(element, success) {
        var s = element.find('span');
        if (s.hasClass('glyphicon-ok')) s.removeClass('glyphicon-ok');
        if (s.hasClass('glyphicon-remove')) s.removeClass('glyphicon-remove');
        if (element.hasClass('text-success')) element.removeClass('text-success');
        if (element.hasClass('text-danger')) element.removeClass('text-danger');

        if (success) {
            s.addClass('glyphicon-ok');
            element.addClass('text-success');
        }
        else {
            s.addClass('glyphicon-remove');
            element.addClass('text-danger');
        }
    }
};

CNode.prototype.setOutcomesRow = function() {
    if (this.selected_cons && this.selected_pos && this.selected_approve) {
        if (this.actual) this.root.outcome_row_actual += this.actual;
        if (this.propose_tb) this.root.outcome_row_propose_tb += this.propose_tb;
        if (this.propose_ca) this.root.outcome_row_propose_ca += this.propose_ca;
    }
    var nlen = this.cnodes.length;
    for (var n = 0; n < nlen; n++) this.cnodes[n].setOutcomesRow();
};

CNode.prototype.renderOutcomeRow = function(jQ_act, jQ_pca, jQ_ptb) {
    this.root.outcome_row_actual = 0;
    this.root.outcome_row_propose_tb = 0;
    this.root.outcome_row_propose_ca = 0;
    this.root.setOutcomesRow();

    jQ_act.html(this.root.outcome_row_actual.format1());
    jQ_pca.html(sharePercent(this.root.outcome_row_actual, this.root.outcome_row_propose_ca));
    jQ_ptb.html(sharePercent(this.root.outcome_row_actual, this.root.outcome_row_propose_tb));
};

CNode.prototype.setApproved = function(id) {
    var app_len = APPROVES_LIST.length;
    for (var n = 0; n < app_len; n++) {
        if (APPROVES_LIST[n] == id && typeof(this.quantity_approved != 'undefined')) {
            this.quantity_approved = 1;
            return;
        }
    }
};
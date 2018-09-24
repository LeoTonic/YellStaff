$(document).on('ready', function() {
    //$('[data-toggle="tooltip"]').tooltip();
    var contentDepth = 4;

    // check user_role and hide total panel for rso and lower
    if (USER_ROLE <= 6 && USER_ROLE != 0)
        $('.total-panel').hide(0);
    else {
        $('.total-panel').show(0);
        createApprovesList();
    }

    // create model
    var treeNode = new CNode('Root', null);
    var posNode = new CNode('Pos', null);
    createTree(treeNode, posNode);

    // store positions array
    treeNode.positions = [];
    for (var n = 0; n < posNode.cnodes.length; n++)
        treeNode.positions.push(posNode.cnodes[n].name);

    var pagerWrap = new CPager(treeNode);

    treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    treeNode.renderOutcomePanel($('#control-panel'), $('#control-alert'), $('#control-label'), $('#control-ca'), $('#control-tb'), $('#control-content'));

    $('#cbo_tb').html(treeNode.getComboBoxContent(1, SELMODE_CONS)).selectpicker('refresh');
    $('#cbo_gosb').html(treeNode.getComboBoxContent(2, SELMODE_CONS)).selectpicker('refresh');
    $('#cbo_rso').html(treeNode.getComboBoxContent(3, SELMODE_CONS)).selectpicker('refresh');
    $('#cbo_rgo').html(treeNode.getComboBoxContent(4, SELMODE_CONS)).selectpicker('refresh');

    // create approve combobox
    var cbo_app = $('#cbo_approve');
    cbo_app.html('');
    var html = '';
    for (var n = 0; n < APPMODE_ARR.length; n++) html += ("<option value=" + n + " selected>" + APPMODE_ARR[n] + "</option>");
    cbo_app.html(html).selectpicker('refresh');
    $('#cbo_pos').html(posNode.getComboBoxContent(1, SELMODE_POS)).selectpicker('refresh');

    // set pagination
    pagerWrap.reset();
    $('.page_navigator').html(pagerWrap.createHtml());
    pagerWrap.addHandlers(contentDepth);

    // initialize browse vsp list
    if (initBrowseList(treeNode)) {
        // apply values to combo boxes
        if (BROWSE_CBO_TB.length > 0) {
            $('#cbo_tb').val(BROWSE_CBO_TB).selectpicker('refresh');
            var selectedValues = $('#cbo_tb').val();
            treeNode.filter(selectedValues, contentDepth-3, SELMODE_CONS);
            controlDisable('#cbo_gosb', (selectedValues == null), 2);
        }

        if (BROWSE_CBO_GOSB.length > 0) {
            $('#cbo_gosb').val(BROWSE_CBO_GOSB).selectpicker('refresh');
            var selectedValues = $('#cbo_gosb').val();
            treeNode.filter(selectedValues, contentDepth-2, SELMODE_CONS);
            controlDisable('#cbo_rso', (selectedValues == null), 3);
        }

        if (BROWSE_CBO_RSO.length > 0) {
            $('#cbo_rso').val(BROWSE_CBO_RSO).selectpicker('refresh');
            var selectedValues = $('#cbo_rso').val();
            treeNode.filter(selectedValues, contentDepth-1, SELMODE_CONS);
            controlDisable('#cbo_rgo', (selectedValues == null), 4);
        }

        if (BROWSE_CBO_RGO.length > 0) {
            $('#cbo_rgo').val(BROWSE_CBO_RGO).selectpicker('refresh');
            var selectedValues = $('#cbo_rgo').val();
            treeNode.filter($('#cbo_rgo').val(), contentDepth, SELMODE_CONS);
        }

        if (BROWSE_CBO_POS.length > 0) {
            $('#cbo_pos').val(BROWSE_CBO_POS).selectpicker('refresh');
            treeNode.filter($('#cbo_pos').val(), contentDepth+2, SELMODE_POS);
        }

        if (BROWSE_CBO_APPROVE.length > 0) {
            $('#cbo_approve').val(BROWSE_CBO_APPROVE).selectpicker('refresh');
            treeNode.filter($('#cbo_approve').val(), contentDepth+2, SELMODE_APPROVE);
        }


        // apply current page to pager
        pagerWrap.reset();
        if (BROWSE_PAGE) pagerWrap.pg_current = BROWSE_PAGE;
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);

        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    }

    // show-hide browse button
    refreshBrowseButton(treeNode, pagerWrap);

    $('#table_content').html('');
    treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);

    $('#cbo_tb').on('change', function() {
        // change tb combo box values
        var selectedValues = $(this).val();
        treeNode.filter(selectedValues, contentDepth-3, SELMODE_CONS);

        // change content
        controlDisable('#cbo_gosb', (selectedValues == null), 2);
        controlDisable('#cbo_rso', (selectedValues == null), 3);
        controlDisable('#cbo_rgo', (selectedValues == null), 4);

        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    });

    $('#cbo_gosb').on('change', function() {
        // change gosb combo box values
        var selectedValues = $(this).val();
        treeNode.filter(selectedValues, contentDepth-2, SELMODE_CONS);

        // change content
        controlDisable('#cbo_rso', (selectedValues == null), 3);
        controlDisable('#cbo_rgo', (selectedValues == null), 4);

        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    });

    $('#cbo_rso').on('change', function() {
        // change gosb combo box values
        var selectedValues = $(this).val();
        treeNode.filter(selectedValues, contentDepth-1, SELMODE_CONS);

        // change content
        controlDisable('#cbo_rgo', (selectedValues == null), 4);

        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    });

    $('#cbo_rgo').on('change', function() {
        // change gosb combo box values
        var selectedValues = $(this).val();
        treeNode.filter(selectedValues, contentDepth, SELMODE_CONS);

        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    });

    function controlDisable(id, disabled, depth) {
        obj = $(id);
        if (disabled)
            obj.html('');
        else
            obj.html(treeNode.getComboBoxContent(depth, SELMODE_CONS));
        obj.prop('disabled', disabled).selectpicker('refresh');
    }

    $('#cbo_pos').on('change', function() {
        var selectedValues = $(this).val();
        treeNode.filter(selectedValues, contentDepth+2, SELMODE_POS);

        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    });

    $('#cbo_approve').on('change', function() {
        var selectedValues = $(this).val();
        treeNode.filter(selectedValues, contentDepth+2, SELMODE_APPROVE);

        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
        treeNode.renderOutcomeRow($('#outcome_actual'), $('#outcome_propose_ca'), $('#outcome_propose_tb'));
    });

    $('#cbo_rows_page').on('change', function() {
        pagerWrap.pg_rowspp = parseInt($(this).val(), 10);
        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        treeNode.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
    });

    $('#browse').on('click', function() {
        var get_form = $('.browse-form');
        get_form.html('');
        for (var n = 0; n < BROWSE_LIST.length; n++) {
            $("<input type='text'/>").attr('name', 'offices[]').val(BROWSE_LIST[n].id_struct).appendTo(get_form);
        }
        // store current page
        $("<input type='text'/>").attr('name', 'current_page').val(pagerWrap.pg_current).appendTo(get_form);

        // store combo values
        var arr_tb = $('#cbo_tb').val(),
            arr_gosb = $('#cbo_gosb').val(),
            arr_rso = $('#cbo_rso').val(),
            arr_rgo = $('#cbo_rgo').val(),
            arr_pos = $('#cbo_pos').val(),
            arr_approve = $('#cbo_approve').val();
        for (var n = 0; n < arr_tb.length; n++)
            $("<input type='text'/>").attr('name', 'cbo_tb[]').val(arr_tb[n]).appendTo(get_form);
        for (var n = 0; n < arr_gosb.length; n++)
            $("<input type='text'/>").attr('name', 'cbo_gosb[]').val(arr_gosb[n]).appendTo(get_form);
        for (var n = 0; n < arr_rso.length; n++)
            $("<input type='text'/>").attr('name', 'cbo_rso[]').val(arr_rso[n]).appendTo(get_form);
        for (var n = 0; n < arr_rgo.length; n++)
            $("<input type='text'/>").attr('name', 'cbo_rgo[]').val(arr_rgo[n]).appendTo(get_form);
        for (var n = 0; n < arr_pos.length; n++)
            $("<input type='text'/>").attr('name', 'cbo_pos[]').val(arr_pos[n]).appendTo(get_form);
        for (var n = 0; n < arr_approve.length; n++)
            $("<input type='text'/>").attr('name', 'cbo_approve[]').val(arr_approve[n]).appendTo(get_form);
        get_form.submit();
    });

    $('#browse-dump').on('click', function() {
        showAlert('Детальный обзор ВСП', 'Чтобы добавить одно или несколько ВСП в детальный обзор, кликните на строку в таблице.');
    });

    // Expand button click
    $('.total-panel--head').on('click', function() {
        var pButton = $(this).find('.total-panel--expander');
        if (pButton.hasClass('glyphicon-chevron-down')) {
            // expand
            pButton.removeClass('glyphicon-chevron-down');
            pButton.addClass('glyphicon-chevron-up');
            $('.total-panel--info').show(300);
        }
        else {
            // collapse
            pButton.removeClass('glyphicon-chevron-up');
            pButton.addClass('glyphicon-chevron-down');
            $('.total-panel--info').hide(300);
        }
    });

    // approve button click
    $('#approve-button').on('click', function() {
        $(this).prop('disabled', true);
        $.post('/approve', {
            'user_id': USER_ID,
            'approved': QUANTITY_APPROVED
        }).done(function(response) {
            QUANTITY_APPROVED = response['approved'];
            if (QUANTITY_APPROVED == 1)
                showAlert('Согласовано', 'Корректировка численности успешно согласована!');
            else
                showAlert('Отозвано', 'Согласование корректировки численности успешно отозвано!');
            checkApproveButton();
        }).fail(function() {
            showAlert("Ошибка", "Отсутствует соединение с сервером!");
            checkApproveButton();
        });
    });
});

function showAlert(title, message) {
    var modalBox = $("#alertModal");
    if (modalBox) {
        modalBox.find("#alertModalHeader").html(title);
        modalBox.find("#alertModalContent").html(message);
        modalBox.modal();
    }
}

function refreshBrowseButton(tree, pager) {
    if (BROWSE_LIST.length > 0) {
        var browseButton = $('.browse-button');
        var browseDump = $('.browse-button-dump');

        // create browse button content
        browseButton.find('.badge').html(BROWSE_LIST.length);
        var browseUL = browseButton.find('ul.browse');
        browseUL.html('');
        // create offices list
        for (var n = 0; n < BROWSE_LIST.length; n++) {
            var itemLI = $('<li></li>').addClass('browse--item');
            var itemA = $('<a></a>');
            itemA.html(BROWSE_LIST[n].name);
            itemA.attr('lid', BROWSE_LIST[n].id);
            itemA.appendTo(itemLI);
            itemLI.appendTo(browseUL);
            itemA.hover(function() {
                var sp = $('<span></span>');
                sp.addClass('glyphicon').addClass('glyphicon-remove');
                $(this).append(sp);
            },
            function() {
                $(this).find('span:last').remove();
            });
            itemA.on('click', function() {
                var browseItem = null;
                var lid = $(this).attr('lid');
                for (var n = 0; n < BROWSE_LIST.length; n++) {
                    if (lid == BROWSE_LIST[n].id) {
                        browseItem = BROWSE_LIST[n];
                        break;
                    }
                }
                if (browseItem == null) return;
                // remove office from list
                browseItem.is_browse = false;
                browseItem.setChildrenBrowseValue(false);
                BROWSE_LIST.remove(browseItem);
                $('#table_content').html('');
                tree.createHTMLTable($('#table_content'), 4, pager, 1);
                refreshBrowseButton(tree, pager);
            });
        }
        // show button
        browseButton.fadeIn(300);
        browseDump.fadeOut(300);
    }
    else {
        // hide button
        $('.browse-button').fadeOut(300);
        $('.browse-button-dump').fadeIn(300);
    }
}

// check edit quantity permission for current user
function isPermissionEdit() {
    if (USER_ROLE == 0)
        return true;
    else if (QUANTITY_APPROVED == 1)
        return false;
    else
        return (PROPOSE_ROLE <= USER_ROLE);
}


function checkApproveButton(forceDisable) {
    var approveButton = $('#approve-button');
    if (USER_ROLE == 0 || USER_ROLE >= 20) {
        approveButton.hide(0);
        $('#col-panel-content').removeClass().addClass('col-sm-12');
        $('#col-panel-approve').removeClass();
    }
    else {
        approveButton.show(0);
        $('#col-panel-content').removeClass().addClass('col-sm-10');
        $('#col-panel-approve').removeClass().addClass('col-sm-2');
    }

    var iconSpan = approveButton.find('span.glyphicon');
    var btnLabel = approveButton.find('span.lbl');

    if (approveButton.hasClass('btn-success')) approveButton.removeClass('btn-success');
    if (approveButton.hasClass('btn-danger')) approveButton.removeClass('btn-danger');

    if (iconSpan.hasClass('glyphicon-ok')) iconSpan.removeClass('glyphicon-ok');
    if (iconSpan.hasClass('glyphicon-remove')) iconSpan.removeClass('glyphicon-remove');

    if (QUANTITY_APPROVED == 1) {
        if (USER_ROLE == PROPOSE_ROLE) {
            iconSpan.addClass('glyphicon-remove');
            approveButton.addClass('btn-danger');
            btnLabel.html('Отозвать');
            approveButton.prop('disabled', false);
        }
        else {
            iconSpan.addClass('glyphicon-ok');
            approveButton.addClass('btn-success');
            btnLabel.html('Согласовано');
            approveButton.prop('disabled', true);
        }
        return;
    }
    else {
        iconSpan.addClass('glyphicon-ok');
        approveButton.addClass('btn-success');
        btnLabel.html('Согласовать');
        if (typeof(forceDisable) == 'undefined') {
            approveButton.prop('disabled', (USER_ROLE != PROPOSE_ROLE));
        }
        else if (USER_ROLE == PROPOSE_ROLE) {
            approveButton.prop('disabled', forceDisable);
        }
        else {
            approveButton.prop('disabled', true);
        }
    }
}

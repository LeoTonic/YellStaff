$(document).on('ready', function() {
    $('a.navbar-brand').text('<< вернуться');

    var contentDepth = 1;
    var valueTree = new CNode('Root', null);
    var vspTree = new CNode('Root', null);
    var posTree = new CNode('Root', null);

    createTree(valueTree, vspTree, posTree);
    var pagerWrap = new CPager(valueTree);
    valueTree.createVSPList(vspTree);

    $('#cbo_valuegroup').html(valueTree.getComboBoxContent(contentDepth, SELMODE_VAL)).selectpicker('refresh');
    $('#cbo_valueitem').html(valueTree.getComboBoxContent(contentDepth+1, SELMODE_VAL)).selectpicker('refresh');
    $('#cbo_vsp').html(vspTree.getComboBoxContent(contentDepth, SELMODE_VAL)).selectpicker('refresh');
    $('#cbo_pos').html(posTree.getComboBoxContent(contentDepth, SELMODE_POS)).selectpicker('refresh');

    // set pagination
    pagerWrap.reset();
    $('.page_navigator').html(pagerWrap.createHtml());
    pagerWrap.addHandlers(contentDepth);
    $('#table_head').html('');
    valueTree.createHTMLHead($('#table_head'));
    $('#table_content').html('');
    valueTree.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);


    $('#cbo_valuegroup').on('change', function() {
        // change tb combo box values
        var selectedValues = $(this).val();
        valueTree.filter(selectedValues, contentDepth, SELMODE_VAL);

        // change content
        controlDisable('#cbo_valueitem', (selectedValues == null), contentDepth+1);

        // create content and pagination
        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        valueTree.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
    });

    $('#cbo_valueitem').on('change', function() {
        var selectedValues = $(this).val();
        valueTree.filter(selectedValues, contentDepth+1, SELMODE_VAL);

        // create content and pagination
        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        valueTree.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
    });

    $('#cbo_pos').on('change', function() {
        var selectedValues = $(this).val();
        valueTree.filter(selectedValues, contentDepth+2, SELMODE_POS);

        // create content and pagination
        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        valueTree.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
    });

    $('#cbo_vsp').on('change', function() {
        var selectedValues = $(this).val();
        vspTree.filter(selectedValues, 1, SELMODE_VAL);
        valueTree.createVSPList(vspTree);
        $('#table_head').html('');
        valueTree.createHTMLHead($('#table_head'));
        $('#table_content').html('');
        valueTree.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
    });

    $('#cbo_rows_page').on('change', function() {
        pagerWrap.pg_rowspp = parseInt($(this).val(), 10);
        pagerWrap.reset();
        $('.page_navigator').html(pagerWrap.createHtml());
        pagerWrap.addHandlers(contentDepth);
        $('#table_content').html('');
        valueTree.createHTMLTable($('#table_content'), contentDepth, pagerWrap, 1);
    });


    function controlDisable(id, disabled, depth) {
        obj = $(id);
        if (disabled)
            obj.html('');
        else
            obj.html(valueTree.getComboBoxContent(depth, SELMODE_VAL));
        obj.prop('disabled', disabled).selectpicker('refresh');
    }
});

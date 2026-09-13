import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const PT_BR_MESSAGES = {
    autoComplete: {
        clear: "Limpar"
    },
    breadcrumb: {
        breadcrumb: "Trilha de navegação"
    },
    buttonGroup: {
        buttonGroup: "Grupo de botões"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Calendário, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) => `${start} a ${end}`,
        decadeViewLabel: (start: number, end: number) => `Visualização de década, ${start} - ${end}`,
        goToToday: (formattedDate: string) => `Ir para hoje, ${formattedDate}`,
        nextDecade: "Próxima década",
        nextMonth: "Próximo mês",
        nextYear: "Próximo ano",
        previousDecade: "Década anterior",
        previousMonth: "Mês anterior",
        previousYear: "Ano anterior",
        switchToDecadeView: (currentYear: string) =>
            `Alternar para a visualização de década, atualmente ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Alternar para a visualização de ano, atualmente ${currentMonthAndYear}`,
        today: "Hoje",
        yearCellLabel: (year: number) => `Ano ${year}`,
        yearViewLabel: (year: string) => `Visualização de ano, ${year}`
    },
    card: {
        actionsLabel: "Ações do cartão"
    },
    chart: {
        change: "Variação",
        chart: "Gráfico",
        chartLegend: "Legenda do gráfico",
        close: "Fechamento",
        closeAbbreviation: "F",
        colorScale: "Escala de cores",
        conversion: "Conversão",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}, de ${minimum} a ${maximum}, ponto médio ${midpoint}`,
        dropOff: "Abandono",
        falling: "Em queda",
        high: "Máxima",
        highAbbreviation: "Máx",
        labelValueSeparator: ":",
        low: "Mínima",
        lowAbbreviation: "Mín",
        noData: "Nenhum dado disponível",
        open: "Abertura",
        openAbbreviation: "A",
        overall: "Geral",
        range: "Intervalo",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, de ${minimum} a ${maximum}`,
        rising: "Em alta",
        runningTotal: "Total acumulado",
        size: "tamanho",
        unchanged: "Sem alteração",
        value: "Valor",
        visualIndicatorClamped: "Indicador visual limitado"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Remover, ${label}` : "Remover, item")
    },
    colorGradient: {
        apply: "Aplicar",
        cancel: "Cancelar",
        clearColor: "Limpar cor",
        copyAsHex: "Copiar como HEX",
        copyAsRgb: "Copiar como RGB",
        copyColor: "Copiar cor",
        currentColor: "Cor atual",
        previousColor: "Cor anterior",
        saturationAndValue: "Saturação e valor da cor",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturação ${saturation}%, valor ${value}%`,
        switchColorMode: "Alternar modo de cor"
    },
    colorPalette: {
        color: (color: string) => `Cor: ${color}`,
        colorPalette: "Paleta de cores"
    },
    colorPicker: {
        clearColor: "Limpar cor",
        colorGradientPicker: "Seletor de gradiente de cores",
        colorPalettePicker: "Seletor de paleta de cores",
        colorPicker: "Seletor de cores"
    },
    comboBox: {
        clear: "Limpar"
    },
    datePicker: {
        datePicker: "Seletor de data",
        openCalendar: "Abrir calendário"
    },
    dateTimePicker: {
        calendar: "Calendário",
        cancel: "Cancelar",
        date: "Data",
        dateTimePicker: "Seletor de data e hora",
        openDateTimePicker: "Abrir seletor de data e hora",
        set: "Definir",
        time: "Hora",
        timePicker: "Seletor de hora"
    },
    dialog: {
        cancel: "Cancelar",
        closeDialog: "Fechar diálogo",
        ok: "OK"
    },
    dropdownList: {
        clear: "Limpar"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${position} de ${total}`,
        noResultsFound: "Nenhum resultado encontrado",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 resultado disponível" : `${count} resultados disponíveis`
    },
    editor: {
        addColumnAfter: "Inserir coluna depois",
        addColumnBefore: "Inserir coluna antes",
        addHorizontalLine: "Inserir linha horizontal",
        addRowAfter: "Inserir linha depois",
        addRowBefore: "Inserir linha antes",
        alignCenter: "Centralizar texto",
        alignLeft: "Alinhar texto à esquerda",
        alignRight: "Alinhar texto à direita",
        altText: "Texto alternativo",
        backgroundColor: "Cor de fundo",
        bold: "Negrito",
        cancel: "Cancelar",
        codeBlock: "Bloco de código",
        color: "Cor",
        deleteColumn: "Excluir coluna",
        deleteRow: "Excluir linha",
        deleteTable: "Excluir tabela",
        enterUrl: "Inserir a URL",
        fontSize: "Tamanho da fonte",
        format: "Formatação",
        heading: (level: number) => `Título ${level}`,
        heightPx: "Altura (px)",
        imageUrl: "URL da imagem",
        indent: "Aumentar recuo",
        insert: "Inserir",
        insertImage: "Inserir imagem",
        insertLink: "Inserir link",
        insertOrderedList: "Inserir lista numerada",
        insertTable: "Inserir tabela",
        insertTaskList: "Inserir lista de tarefas",
        insertUnorderedList: "Inserir lista com marcadores",
        italic: "Itálico",
        justify: "Justificar",
        mergeCells: "Mesclar células selecionadas",
        outdent: "Diminuir recuo",
        paragraph: "Parágrafo",
        quotation: "Citação",
        redo: "Refazer",
        removeLink: "Remover link",
        selectFontFamily: "Selecionar família de fontes",
        selectFontSize: "Selecionar tamanho da fonte",
        splitCell: "Dividir célula",
        strikethrough: "Tachado",
        subscript: "Subscrito",
        superscript: "Sobrescrito",
        toggleHeaderRow: "Alternar linha de cabeçalho",
        underline: "Sublinhado",
        undo: "Desfazer",
        widthPx: "Largura (px)"
    },
    filter: {
        and: "E",
        apply: "Aplicar",
        clear: "Limpar",
        contains: "Contém",
        doesNotContain: "Não contém",
        endsWith: "Termina com",
        isAfter: "É posterior a",
        isAfterOrEqualTo: "É posterior ou igual a",
        isBefore: "É anterior a",
        isBeforeOrEqualTo: "É anterior ou igual a",
        isEmpty: "Está vazio",
        isEqualTo: "É igual a",
        isFalse: "É falso",
        isGreaterThan: "É maior que",
        isGreaterThanOrEqualTo: "É maior ou igual a",
        isLessThan: "É menor que",
        isLessThanOrEqualTo: "É menor ou igual a",
        isNotEmpty: "Não está vazio",
        isNotEqualTo: "É diferente de",
        isNotNull: "Não é nulo",
        isNotNullOrEmpty: "Não é nulo nem vazio",
        isNull: "É nulo",
        isNullOrEmpty: "É nulo ou vazio",
        isTrue: "É verdadeiro",
        or: "Ou",
        startsWith: "Começa com"
    },
    grid: {
        all: "(Todos)",
        apply: "Aplicar",
        cancel: "Cancelar",
        cancelRowEdit: "Cancelar edição da linha",
        columns: "Colunas",
        columnsSelected: (count: number) =>
            count === 1 ? "1 coluna selecionada" : `${count} colunas selecionadas`,
        delete: "Excluir",
        deleteRowConfirmation: "Tem certeza de que deseja excluir este item?",
        deleteRowTitle: "Excluir linha?",
        dragColumnHeaderToGroup: "Arraste o cabeçalho de uma coluna aqui para agrupar",
        edit: "Editar",
        editRow: "Editar linha",
        fieldValidationError: "Valor inválido.",
        filterByColumn: (column: string) => `Filtrar por ${column}`,
        filterPlaceholder: "Filtrar...",
        modified: "Modificado",
        moveAsNext: "Mover como próximo",
        moveAsPrevious: "Mover como anterior",
        moveRow: "Mover linha",
        noData: "Nenhum dado disponível",
        remove: "Remover",
        removeRow: "Remover linha",
        reorderRow: (rowNumber: number) => `Reordenar linha ${rowNumber}`,
        resizeColumn: "Redimensionar coluna",
        rowReorder: "Reordenar linha",
        rowReorderDisabled: "A reordenação de linhas está desabilitada.",
        rowReorderDisabledEditing: "Conclua a edição antes de reordenar as linhas.",
        rowReorderDisabledFiltered: "Remova os filtros antes de reordenar as linhas.",
        rowReorderDisabledGrouped: "Remova o agrupamento antes de reordenar as linhas.",
        rowReorderDisabledSingleRow: "São necessárias pelo menos duas linhas para reordenar.",
        rowReorderDisabledSorted: "Remova a ordenação antes de reordenar as linhas.",
        rowReorderDisabledVirtualScroll:
            "A reordenação de linhas não está disponível com a rolagem virtual ativada.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Linha ${fromRowNumber} movida para a posição ${toPosition}.`,
        rowValidationError: "Esta linha contém erros de validação.",
        save: "Salvar",
        saveRow: "Salvar linha",
        selectAllRows: "Selecionar todas as linhas",
        selectRow: (rowNumber: number) => `Selecionar linha ${rowNumber}`
    },
    list: {
        noData: "Nenhum dado disponível"
    },
    listBox: {
        clearSelection: "Limpar seleção",
        moveDown: "Mover para baixo",
        moveUp: "Mover para cima",
        remove: "Remover",
        transferAllFrom: "Mover todos da outra lista",
        transferAllTo: "Mover todos para a outra lista",
        transferFrom: "Mover da outra lista",
        transferTo: "Mover para a outra lista"
    },
    multiSelect: {
        clear: "Limpar",
        itemsCount: (count: number) => (count === 1 ? "+ 1 item" : `+ ${count} itens`)
    },
    notification: {
        close: "Fechar",
        error: "Erro",
        info: "Informação",
        success: "Sucesso",
        warning: "Aviso"
    },
    numericTextBox: {
        decrease: "Diminuir valor",
        increase: "Aumentar valor"
    },
    otpInput: {
        verificationCode: "Código de verificação"
    },
    pager: {
        firstPageLabel: "Primeira página",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Retroceder 1 página" : `Retroceder ${pages} páginas`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avançar 1 página" : `Avançar ${pages} páginas`,
        lastPageLabel: "Última página",
        nextPageLabel: "Próxima página",
        ofText: "de",
        pageLabel: (page: number) => `Página ${page}`,
        pageSizeLabel: (pageSize: number) => `${pageSize} / página`,
        pageStatus: (page: number, totalPages: number) => `Página ${page} de ${totalPages}`,
        pageText: "Página",
        previousPageLabel: "Página anterior",
        rangeStatus: (start: number, end: number, total: number) =>
            `${start} - ${end} de ${total} ${total === 1 ? "item" : "itens"}`
    },
    rating: {
        notRated: "Não avaliado",
        valueText: (value: number, max: number) => `${value} de ${max}`
    },
    scrollView: {
        carousel: "carrossel",
        nextPage: "Próxima página",
        page: (current: number) => `Página ${current}`,
        pageOf: (current: number, total: number) => `Página ${current} de ${total}`,
        previousPage: "Página anterior",
        scrollPagerNext: "Rolar opções do paginador para a frente",
        scrollPagerPrevious: "Rolar opções do paginador para trás",
        slide: "slide"
    },
    sheet: {
        closeSheet: "Fechar painel"
    },
    slider: {
        maximumValue: "Valor máximo",
        minimumValue: "Valor mínimo",
        sliderValue: "Valor do controle deslizante"
    },
    spinner: {
        cancel: "Cancelar",
        loading: "Carregando"
    },
    splitButton: {
        menuButtonAriaLabel: "Mostrar opções do menu",
        splitButton: (text: string) => (text ? `${text}, botão com menu` : "Botão com menu")
    },
    splitter: {
        collapseDown: "Recolher painel inferior",
        collapseNext: "Recolher próximo painel",
        collapsePrevious: "Recolher painel anterior",
        collapseUp: "Recolher painel superior",
        resizer: "Separador de painéis"
    },
    stepper: {
        stepProgress: "Progresso das etapas",
        stepper: "Progresso"
    },
    tabs: {
        closeTab: "Fechar aba",
        scrollNext: "Rolar abas para a frente",
        scrollPrevious: "Rolar abas para trás"
    },
    textBox: {
        clear: "Limpar"
    },
    timePicker: {
        openTimePicker: "Abrir seletor de hora",
        timePicker: "Seletor de hora"
    },
    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "h",
        headerMinutes: "min",
        headerSeconds: "s",
        hours: "Horas",
        minutes: "Minutos",
        now: "Agora",
        pm: "PM",
        seconds: "Segundos",
        set: "Definir",
        timeSelector: "Seletor de hora"
    },
    treeView: {
        collapse: "Recolher",
        expand: "Expandir",
        filter: "Filtrar",
        filterTree: "Filtrar árvore"
    },
    window: {
        close: "Fechar",
        closeWindow: "Fechar janela",
        maximize: "Maximizar",
        minimize: "Minimizar",
        moveWindow: "Mover janela. Use as teclas de seta para mover.",
        resizeBottom:
            "Redimensionar janela a partir da borda inferior. Use as teclas de seta para redimensionar.",
        resizeBottomLeft:
            "Redimensionar janela a partir do canto inferior esquerdo. Use as teclas de seta para redimensionar.",
        resizeBottomRight:
            "Redimensionar janela a partir do canto inferior direito. Use as teclas de seta para redimensionar.",
        resizeLeft:
            "Redimensionar janela a partir da borda esquerda. Use as teclas de seta para redimensionar.",
        resizeRight:
            "Redimensionar janela a partir da borda direita. Use as teclas de seta para redimensionar.",
        resizeTop:
            "Redimensionar janela a partir da borda superior. Use as teclas de seta para redimensionar.",
        resizeTopLeft:
            "Redimensionar janela a partir do canto superior esquerdo. Use as teclas de seta para redimensionar.",
        resizeTopRight:
            "Redimensionar janela a partir do canto superior direito. Use as teclas de seta para redimensionar.",
        restore: "Restaurar"
    }
} satisfies MonaLocaleMessages;

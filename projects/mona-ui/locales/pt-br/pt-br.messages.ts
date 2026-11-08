// Generated from pt-br.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "pt-BR", options);
}

const PLURAL_RULES = new Intl.PluralRules("pt-BR");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const PT_BR_MESSAGES = {
    autoComplete: {
        clear: "Limpar"
    },
    breadcrumb: {
        breadcrumb: "Trilha de navegação",
        showFullPath: "Mostrar caminho completo"
    },
    buttonGroup: {
        buttonGroup: "Grupo de botões"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Calendário, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} a ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Visualização de década, ${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
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
        yearCellLabel: (year: number) => `Ano ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Visualização de ano, ${year}`
    },
    card: {
        actionsLabel: "Ações do cartão"
    },
    chart: {
        announcementSeparator: ", ",
        brushApplied: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Seleção aplicada, ${localizeNumber(count)} ponto`,
                other: () => `Seleção aplicada, ${localizeNumber(count)} pontos`
            }),
        brushCleared: "Seleção removida",
        brushRange: (from: string, to: string) => `Seleção de ${from} a ${to}`,
        category: "Categoria",
        categoryFallbackName: (index: number) => `Categoria ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `De ${from} a ${to}.`,
        change: "Variação",
        changeValue: (change: string) => `variação ${change}`,
        chart: "Gráfico",
        chartLegend: "Legenda do gráfico",
        chartRoleDescription: "gráfico",
        close: "Fechamento",
        closeAbbreviation: "F",
        colorScale: "Escala de cores",
        conversion: "Conversão",
        conversionOfPrevious: (rate: string) => `Conversão de ${rate} em relação à etapa anterior`,
        dataTableTruncated: (shown: number, total: number) =>
            `Mostrando as primeiras ${localizeNumber(shown)} de ${localizeNumber(total)} linhas.`,
        decrease: "Diminuição",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `diminuição de ${delta}, total acumulado de ${from} a ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, de ${minimum} a ${maximum}, ponto médio ${midpoint}`,
        dropOff: "Abandono",
        dropOffValue: (value: string) => `Abandono ${value}`,
        falling: "Em queda",
        gaugeRange: (minimum: string, maximum: string) => `intervalo de ${minimum} a ${maximum}`,
        high: "Máxima",
        highAbbreviation: "Máx",
        increase: "Aumento",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `aumento de ${delta}, total acumulado de ${from} a ${to}`,
        itemDeselected: (item: string) => `${item}, desmarcado`,
        itemFallbackName: (index: number) => `Elemento ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}, selecionado`,
        keyboardHelp:
            "Use as setas para navegar entre os pontos de dados, Home e End para ir ao primeiro e ao último, Enter ou Espaço para ativar e Esc para limpar.",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}: ${value}`,
        low: "Mínima",
        lowAbbreviation: "Mín",
        noChange: "Sem alteração",
        noChangeAnnouncement: (value: string) => `sem alteração, total acumulado ${value}`,
        noData: "Nenhum dado disponível",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `Abertura ${open}, máxima ${high}, mínima ${low}, fechamento ${close}`,
        open: "Abertura",
        openAbbreviation: "A",
        overall: "Geral",
        overallConversion: (rate: string) => `Conversão geral ${rate}`,
        pannedDown: "Movido para baixo",
        pannedLeft: "Movido para a esquerda",
        pannedRight: "Movido para a direita",
        pannedUp: "Movido para cima",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} de ${localizeNumber(total)}`,
        range: "Intervalo",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, de ${minimum} a ${maximum}`,
        rangeValue: (from: string, to: string) => `de ${from} a ${to}`,
        rising: "Em alta",
        runningTotal: "Total acumulado",
        seriesFallbackName: (index: number) => `Série ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series} oculta`,
        seriesShown: (series: string) => `${series} exibida`,
        seriesSummary: (count: number, names: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Uma série: ${names}.`,
                other: () => `${localizeNumber(count)} séries: ${names}.`
            }),
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}: mínimo ${minimum}, máximo ${maximum}.`,
        shareOfTotal: (share: string) => `${share} do total`,
        size: "tamanho",
        sizeValue: (size: string) => `tamanho ${size}`,
        stackShare: (share: string) => `participação na pilha ${share}`,
        stageFallbackName: (index: number) => `Etapa ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `etapa ${localizeNumber(position)} de ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `Passo ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `passo ${localizeNumber(position)} de ${localizeNumber(total)}`,
        subtotal: "Total parcial",
        subtotalAnnouncement: (value: string) => `total parcial ${value}`,
        total: "Soma total",
        totalAnnouncement: (value: string) => `soma total ${value}`,
        treemapGroup: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Grupo (${localizeNumber(count)} filho)`,
                other: () => `Grupo (${localizeNumber(count)} filhos)`
            }),
        treemapLeaf: "Folha",
        unchanged: "Sem alteração",
        value: "Valor",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "Visualização redefinida para o intervalo padrão",
        viewportResetToFull: "Visualização redefinida para o intervalo completo",
        visualIndicatorClamped: "Indicador visual limitado",
        zoomedIn: "Ampliado",
        zoomedOut: "Reduzido"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Remover ${label}` : "Remover item")
    },
    colorGradient: {
        alpha: "Canal alfa",
        alphaText: (opacity: number) => `Opacidade ${localizeNumber(opacity)}%`,
        apply: "Aplicar",
        blue: "Azul",
        cancel: "Cancelar",
        clearColor: "Limpar cor",
        colorCopied: "Cor copiada",
        colorGradient: "Gradiente de cor",
        copyAsHex: "Copiar como HEX",
        copyAsRgb: "Copiar como RGB",
        copyColor: "Copiar cor",
        copyFailed: "Não foi possível copiar a cor",
        currentColor: "Cor atual",
        green: "Verde",
        hexColor: "Cor hexadecimal",
        hue: "Matiz",
        previousColor: "Cor anterior",
        red: "Vermelho",
        saturation: "Saturação",
        saturationAndValue: "Saturação e valor da cor",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturação ${localizeNumber(saturation)}%, valor ${localizeNumber(value)}%`,
        switchColorMode: "Alternar modo de cor",
        value: "Valor"
    },
    colorPalette: {
        color: (color: string) => `Cor: ${color}`,
        colorPalette: "Paleta de cores",
        namedColor: (name: string, color: string) => `${name}, ${color}`
    },
    colorPicker: {
        clearColor: "Limpar cor",
        colorGradientPicker: "Seletor de gradiente de cores",
        colorPalettePicker: "Seletor de paleta de cores",
        colorPicker: "Seletor de cores",
        noColor: "Sem cor"
    },
    comboBox: {
        clear: "Limpar"
    },
    command: {
        dialogLabel: "Menu de comandos",
        inputLabel: "Pesquisar comandos",
        listLabel: "Resultados",
        loading: "Carregando",
        noResults: "Nenhum resultado encontrado",
        placeholder: "Digite um comando ou pesquise…",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 resultado disponível" : `${localizeNumber(count)} resultados disponíveis`
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
            `${text}, ${localizeNumber(position)} de ${localizeNumber(total)}`,
        noResultsFound: "Nenhum resultado encontrado",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 resultado disponível" : `${localizeNumber(count)} resultados disponíveis`
    },
    editor: {
        addColumnAfter: "Inserir coluna depois",
        addColumnBefore: "Inserir coluna antes",
        addHorizontalLine: "Inserir linha horizontal",
        addRowAfter: "Inserir linha depois",
        addRowBefore: "Inserir linha antes",
        alignCenter: "Centralizar texto",
        alignEnd: "Alinhar texto ao fim",
        alignLeft: "Alinhar texto à esquerda",
        alignRight: "Alinhar texto à direita",
        alignStart: "Alinhar texto ao início",
        alignmentGroup: "Alinhamento",
        altText: "Texto alternativo",
        apply: "Aplicar",
        backgroundColor: "Cor de fundo",
        bold: "Negrito",
        cancel: "Cancelar",
        codeBlock: "Bloco de código",
        color: "Cor",
        contentLabel: "Editor de texto formatado",
        defaultFontFamily: "Fonte padrão",
        deleteColumn: "Excluir coluna",
        deleteRow: "Excluir linha",
        deleteTable: "Excluir tabela",
        editLink: "Editar link",
        enterUrl: "Inserir a URL",
        fontSize: "Tamanho da fonte",
        format: "Formatação",
        heading: (level: number) => `Título ${localizeNumber(level)}`,
        heightPx: "Altura (px)",
        historyGroup: "Histórico",
        imageUrl: "URL da imagem",
        indent: "Aumentar recuo",
        indentGroup: "Recuo",
        insert: "Inserir",
        insertImage: "Inserir imagem",
        insertLink: "Inserir link",
        insertOrderedList: "Inserir lista numerada",
        insertTable: "Inserir tabela",
        insertTaskList: "Inserir lista de tarefas",
        insertUnorderedList: "Inserir lista com marcadores",
        invalidUrl: "Insira um endereço da web, um link mailto: ou tel:, ou um caminho relativo.",
        italic: "Itálico",
        justify: "Justificar",
        linkGroup: "Hiperlink",
        listGroup: "Listas",
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
        tableGroup: "Tabela",
        tableSize: (rows: number, columns: number) =>
            `Linhas: ${localizeNumber(rows)}, colunas: ${localizeNumber(columns)}`,
        textStyleGroup: "Estilo do texto",
        toggleHeaderRow: "Alternar linha de cabeçalho",
        toolbar: "Formatação",
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
        logic: "Combinar condições",
        operator: "Operador",
        or: "Ou",
        secondOperator: "Segundo operador",
        secondValue: "Segundo valor",
        startsWith: "Começa com",
        value: "Valor"
    },
    grid: {
        all: "(Todos)",
        apply: "Aplicar",
        cancel: "Cancelar",
        cancelNewRow: "Descartar nova linha",
        cancelRowEdit: (rowNumber: number) => `Cancelar edição da linha ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Limpar filtro de ${column}`,
        collapseDetail: (rowNumber: number) => `Recolher detalhes da linha ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Agrupado por ${column}`,
        columnMoved: (column: string, position: number) =>
            `Coluna ${column} movida para a posição ${localizeNumber(position)}`,
        columns: "Colunas",
        columnsSelected: (count: number) =>
            count === 1 ? "1 coluna selecionada" : `${localizeNumber(count)} colunas selecionadas`,
        commandColumnTitle: "Comandos",
        delete: "Excluir",
        deleteRowConfirmation: (rowNumber: number) =>
            `Tem certeza de que deseja excluir a linha ${localizeNumber(rowNumber)}?`,
        deleteRowTitle: "Excluir linha?",
        details: "Detalhes",
        dragColumnHeaderToGroup: "Arraste o cabeçalho de uma coluna aqui para agrupar",
        edit: "Editar",
        editRow: (rowNumber: number) => `Editar linha ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Expandir detalhes da linha ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Valor inválido.",
        filterByColumn: (column: string) => `Filtrar por ${column}`,
        filterByColumnFiltered: (column: string) => `Filtrar por ${column}, filtrado`,
        filterOperator: (column: string, operator: string) => `Operador de filtro de ${column}: ${operator}`,
        filterPlaceholder: "Filtrar...",
        group: "Grupo",
        groupOptions: (column: string) => `Opções do grupo ${column}`,
        loading: "Carregando",
        modified: "Modificado",
        moveAsNext: "Mover como próximo",
        moveAsPrevious: "Mover como anterior",
        moveRow: "Mover linha",
        noData: "Nenhum dado disponível",
        remove: "Remover",
        removeRow: (rowNumber: number) => `Remover linha ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `Reordenar linha ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Redimensionar coluna ${column}`,
        rowReorder: "Reordenar linhas",
        rowReorderDisabled: "A reordenação de linhas está desabilitada.",
        rowReorderDisabledEditing: "Conclua a edição antes de reordenar as linhas.",
        rowReorderDisabledFiltered: "Remova os filtros antes de reordenar as linhas.",
        rowReorderDisabledGrouped: "Remova o agrupamento antes de reordenar as linhas.",
        rowReorderDisabledServerBinding: "A reordenação de linhas não está disponível com vinculação ao servidor.",
        rowReorderDisabledSingleRow: "São necessárias pelo menos duas linhas para reordenar.",
        rowReorderDisabledSorted: "Remova a ordenação antes de reordenar as linhas.",
        rowReorderDisabledVirtualScroll: "A reordenação de linhas não está disponível com a rolagem virtual ativada.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Linha ${localizeNumber(fromRowNumber)} movida para a posição ${localizeNumber(toPosition)}.`,
        rowValidationError: "Esta linha contém erros de validação.",
        save: "Salvar",
        saveNewRow: "Salvar nova linha",
        saveRow: (rowNumber: number) => `Salvar linha ${localizeNumber(rowNumber)}`,
        selectAllRows: "Selecionar todas as linhas",
        selectRow: (rowNumber: number) => `Selecionar linha ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Ordem de classificação ${localizeNumber(position)}`,
        toolbar: "Barra de ferramentas da tabela"
    },
    label: {
        optional: "Opcional"
    },
    list: {
        filterList: "Filtrar lista",
        loading: "Carregando",
        noData: "Nenhum dado disponível",
        pagerLabel: (list: string) => `Paginação de ${list}`
    },
    listBox: {
        clearSelection: "Limpar seleção",
        itemsMoved: (position: number, total: number) =>
            `Movido para a posição ${localizeNumber(position)} de ${localizeNumber(total)}`,
        itemsRemoved: (count: number) =>
            count === 1 ? `${localizeNumber(count)} item removido` : `${localizeNumber(count)} itens removidos`,
        itemsTransferred: (count: number, list: string) =>
            count === 1
                ? `${localizeNumber(count)} item movido para ${list}`
                : `${localizeNumber(count)} itens movidos para ${list}`,
        itemsTransferredToOtherList: (count: number) =>
            count === 1
                ? `${localizeNumber(count)} item movido para a outra lista`
                : `${localizeNumber(count)} itens movidos para a outra lista`,
        moveDown: "Mover para baixo",
        moveUp: "Mover para cima",
        remove: "Remover",
        selectionCleared: "Seleção limpa",
        toolbarLabel: (list: string) => `Ações de ${list}`,
        transferAllFrom: "Mover todos da outra lista",
        transferAllFromList: (list: string) => `Mover todos de ${list}`,
        transferAllTo: "Mover todos para a outra lista",
        transferAllToList: (list: string) => `Mover todos para ${list}`,
        transferFrom: "Mover da outra lista",
        transferFromList: (list: string) => `Mover de ${list}`,
        transferTo: "Mover para a outra lista",
        transferToList: (list: string) => `Mover para ${list}`
    },
    multiSelect: {
        clear: "Limpar",
        itemsCount: (count: number) => (count === 1 ? "+ 1 item" : `+ ${localizeNumber(count)} itens`),
        removeMoreItems: (count: number) =>
            count === 1 ? "Remover mais 1 item" : `Remover mais ${localizeNumber(count)} itens`
    },
    notification: {
        close: "Fechar",
        error: "Erro",
        info: "Informação",
        region: "Notificações",
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
        itemsPerPageLabel: "Itens por página",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Retroceder 1 página" : `Retroceder ${localizeNumber(pages)} páginas`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avançar 1 página" : `Avançar ${localizeNumber(pages)} páginas`,
        lastPageLabel: "Última página",
        nextPageLabel: "Próxima página",
        ofText: "de",
        pageInputPrefix: (_totalPages: number) => "Página",
        pageInputSuffix: (totalPages: number) => `de ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Página ${localizeNumber(page)}`,
        pageSelectLabel: "Página",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} / página`,
        pageStatus: (page: number, totalPages: number) =>
            `Página ${localizeNumber(page)} de ${localizeNumber(totalPages)}`,
        pageText: "Página",
        pagerLabel: "Paginação",
        previousPageLabel: "Página anterior",
        rangeStatus: (start: number, end: number, total: number) =>
            total === 1
                ? `${localizeNumber(start)} - ${localizeNumber(end)} de ${localizeNumber(total)} item`
                : `${localizeNumber(start)} - ${localizeNumber(end)} de ${localizeNumber(total)} itens`
    },
    progressBar: {
        label: "Progresso"
    },
    rating: {
        notRated: "Não avaliado",
        valueText: (value: number, max: number) => `${localizeNumber(value)} de ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "carrossel",
        nextPage: "Próxima página",
        page: (current: number) => `Página ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Página ${localizeNumber(current)} de ${localizeNumber(total)}`,
        pages: "Páginas",
        previousPage: "Página anterior",
        scrollPagerNext: "Rolar opções do paginador para a frente",
        scrollPagerPrevious: "Rolar opções do paginador para trás",
        slide: "slide"
    },
    sheet: {
        closeSheet: "Fechar painel"
    },
    sidebar: {
        drawerLabel: "Barra lateral",
        rail: "Mostrar ou ocultar a barra lateral"
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
        menuButtonWithText: (text: string) => `Mais opções de ${text}`,
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
        stepCompleted: "Concluída",
        stepInvalid: "Contém erros",
        stepPosition: (current: number, total: number) =>
            `Etapa ${localizeNumber(current)} de ${localizeNumber(total)}`,
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
        filterLabel: (tree: string) => `Filtrar ${tree}`,
        filterTree: "Filtrar árvore",
        loadError: (node: string) => `Não foi possível carregar os itens de ${node}`,
        loadingNode: (node: string) => `Carregando ${node}`,
        movedAfter: (node: string, target: string) => `${node} movido para depois de ${target}`,
        movedBefore: (node: string, target: string) => `${node} movido para antes de ${target}`,
        movedInto: (node: string, target: string) => `${node} movido para dentro de ${target}`,
        noData: "Nenhum dado disponível",
        noMatches: "Nenhum item correspondente",
        results: (count: number) =>
            count === 1 ? `${localizeNumber(count)} resultado` : `${localizeNumber(count)} resultados`,
        retryLoading: (node: string) => `Tentar carregar ${node} novamente`
    },
    window: {
        close: "Fechar",
        closeWindow: "Fechar janela",
        maximize: "Maximizar",
        minimize: "Minimizar",
        moveOrResizeWindow:
            "Mover ou redimensionar janela. Use as teclas de seta para mover, ou Ctrl e as teclas de seta para redimensionar.",
        moveWindow: "Mover janela. Use as teclas de seta para mover.",
        resizeBottom: "Redimensionar janela a partir da borda inferior. Use as teclas de seta para redimensionar.",
        resizeBottomLeft:
            "Redimensionar janela a partir do canto inferior esquerdo. Use as teclas de seta para redimensionar.",
        resizeBottomRight:
            "Redimensionar janela a partir do canto inferior direito. Use as teclas de seta para redimensionar.",
        resizeLeft: "Redimensionar janela a partir da borda esquerda. Use as teclas de seta para redimensionar.",
        resizeRight: "Redimensionar janela a partir da borda direita. Use as teclas de seta para redimensionar.",
        resizeTop: "Redimensionar janela a partir da borda superior. Use as teclas de seta para redimensionar.",
        resizeTopLeft:
            "Redimensionar janela a partir do canto superior esquerdo. Use as teclas de seta para redimensionar.",
        resizeTopRight:
            "Redimensionar janela a partir do canto superior direito. Use as teclas de seta para redimensionar.",
        resizeWindow: "Redimensionar janela. Use Ctrl e as teclas de seta para redimensionar.",
        restore: "Restaurar"
    }
} satisfies MonaLocaleMessages;

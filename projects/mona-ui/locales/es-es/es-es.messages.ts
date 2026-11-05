// Generated from es-es.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "es-ES", options);
}

const PLURAL_RULES = new Intl.PluralRules("es-ES");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const ES_ES_MESSAGES = {
    autoComplete: {
        clear: "Limpiar"
    },
    breadcrumb: {
        breadcrumb: "Ruta de navegación"
    },
    buttonGroup: {
        buttonGroup: "Grupo de botones"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Calendario, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} a ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Vista de década, ${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Ir a hoy, ${formattedDate}`,
        nextDecade: "Década siguiente",
        nextMonth: "Mes siguiente",
        nextYear: "Año siguiente",
        previousDecade: "Década anterior",
        previousMonth: "Mes anterior",
        previousYear: "Año anterior",
        switchToDecadeView: (currentYear: string) => `Cambiar a vista de década, actualmente ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `Cambiar a vista anual, actualmente ${currentMonthAndYear}`,
        today: "Hoy",
        yearCellLabel: (year: number) => `Año ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Vista anual, ${year}`
    },
    card: {
        actionsLabel: "Acciones de la tarjeta"
    },
    chart: {
        announcementSeparator: ", ",
        brushApplied: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Selección aplicada, ${localizeNumber(count)} punto`,
                other: () => `Selección aplicada, ${localizeNumber(count)} puntos`
            }),
        brushCleared: "Selección borrada",
        brushRange: (from: string, to: string) => `Selección de ${from} a ${to}`,
        category: "Categoría",
        categoryFallbackName: (index: number) => `Categoría ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `De ${from} a ${to}.`,
        change: "Cambio",
        changeValue: (change: string) => `cambio ${change}`,
        chart: "Gráfico",
        chartLegend: "Leyenda del gráfico",
        chartRoleDescription: "gráfico",
        close: "Cierre",
        closeAbbreviation: "C",
        colorScale: "Escala de colores",
        conversion: "Conversión",
        conversionOfPrevious: (rate: string) => `Conversión del ${rate} respecto a la etapa anterior`,
        dataTableTruncated: (shown: number, total: number) =>
            `Se muestran las primeras ${localizeNumber(shown)} de ${localizeNumber(total)} filas.`,
        decrease: "Disminución",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `disminución de ${delta}, total acumulado de ${from} a ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, de ${minimum} a ${maximum}, con punto medio en ${midpoint}`,
        dropOff: "Abandono",
        dropOffValue: (value: string) => `Abandono ${value}`,
        falling: "En descenso",
        gaugeRange: (minimum: string, maximum: string) => `rango de ${minimum} a ${maximum}`,
        high: "Máximo",
        highAbbreviation: "Máx",
        increase: "Aumento",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `aumento de ${delta}, total acumulado de ${from} a ${to}`,
        itemDeselected: (item: string) => `${item}, deseleccionado`,
        itemFallbackName: (index: number) => `Elemento ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}, seleccionado`,
        keyboardHelp:
            "Use las flechas para moverse entre los puntos de datos, Inicio y Fin para ir al primero y al último, Intro o Espacio para activar y Escape para borrar.",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}: ${value}`,
        low: "Mínimo",
        lowAbbreviation: "Mín",
        noChange: "Sin cambios",
        noChangeAnnouncement: (value: string) => `sin cambios, total acumulado ${value}`,
        noData: "No hay datos disponibles",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `Apertura ${open}, máximo ${high}, mínimo ${low}, cierre ${close}`,
        open: "Apertura",
        openAbbreviation: "A",
        overall: "Global",
        overallConversion: (rate: string) => `Conversión global ${rate}`,
        pannedDown: "Desplazado hacia abajo",
        pannedLeft: "Desplazado a la izquierda",
        pannedRight: "Desplazado a la derecha",
        pannedUp: "Desplazado hacia arriba",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} de ${localizeNumber(total)}`,
        range: "Rango",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, de ${minimum} a ${maximum}`,
        rangeValue: (from: string, to: string) => `de ${from} a ${to}`,
        rising: "En alza",
        runningTotal: "Total acumulado",
        seriesFallbackName: (index: number) => `Serie ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series} oculta`,
        seriesShown: (series: string) => `${series} visible`,
        seriesSummary: (count: number, names: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Una serie: ${names}.`,
                other: () => `${localizeNumber(count)} series: ${names}.`
            }),
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}: mínimo ${minimum}, máximo ${maximum}.`,
        shareOfTotal: (share: string) => `${share} del total`,
        size: "tamaño",
        sizeValue: (size: string) => `tamaño ${size}`,
        stackShare: (share: string) => `proporción de la pila ${share}`,
        stageFallbackName: (index: number) => `Etapa ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `etapa ${localizeNumber(position)} de ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `Paso ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `paso ${localizeNumber(position)} de ${localizeNumber(total)}`,
        subtotal: "Total parcial",
        subtotalAnnouncement: (value: string) => `total parcial ${value}`,
        total: "Suma total",
        totalAnnouncement: (value: string) => `suma total ${value}`,
        treemapGroup: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Grupo (${localizeNumber(count)} elemento secundario)`,
                other: () => `Grupo (${localizeNumber(count)} elementos secundarios)`
            }),
        treemapLeaf: "Hoja",
        unchanged: "Sin cambios",
        value: "Valor",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "Vista restablecida al rango predeterminado",
        viewportResetToFull: "Vista restablecida al rango completo",
        visualIndicatorClamped: "Indicador visual acotado",
        zoomedIn: "Acercado",
        zoomedOut: "Alejado"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Quitar ${label}` : "Quitar elemento")
    },
    colorGradient: {
        apply: "Aplicar",
        cancel: "Cancelar",
        clearColor: "Limpiar color",
        copyAsHex: "Copiar como HEX",
        copyAsRgb: "Copiar como RGB",
        copyColor: "Copiar color",
        currentColor: "Color actual",
        previousColor: "Color anterior",
        saturationAndValue: "Saturación y valor del color",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturación ${localizeNumber(saturation)}%, valor ${localizeNumber(value)}%`,
        switchColorMode: "Cambiar modo de color"
    },
    colorPalette: {
        color: (color: string) => `Color ${color}`,
        colorPalette: "Paleta de colores"
    },
    colorPicker: {
        clearColor: "Limpiar color",
        colorGradientPicker: "Selector de color por degradado",
        colorPalettePicker: "Selector de color por paleta",
        colorPicker: "Selector de color"
    },
    comboBox: {
        clear: "Limpiar"
    },
    datePicker: {
        datePicker: "Selector de fecha",
        openCalendar: "Abrir calendario"
    },
    dateTimePicker: {
        calendar: "Calendario",
        cancel: "Cancelar",
        date: "Fecha",
        dateTimePicker: "Selector de fecha y hora",
        openDateTimePicker: "Abrir selector de fecha y hora",
        set: "Establecer",
        time: "Hora",
        timePicker: "Selector de hora"
    },
    dialog: {
        cancel: "Cancelar",
        closeDialog: "Cerrar cuadro de diálogo",
        ok: "Aceptar"
    },
    dropdownList: {
        clear: "Limpiar"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${localizeNumber(position)} de ${localizeNumber(total)}`,
        noResultsFound: "No se han encontrado resultados",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 resultado disponible" : `${localizeNumber(count)} resultados disponibles`
    },
    editor: {
        addColumnAfter: "Añadir columna después",
        addColumnBefore: "Añadir columna antes",
        addHorizontalLine: "Añadir línea horizontal",
        addRowAfter: "Añadir fila después",
        addRowBefore: "Añadir fila antes",
        alignCenter: "Centrar texto",
        alignEnd: "Alinear el texto al final",
        alignLeft: "Alinear texto a la izquierda",
        alignRight: "Alinear texto a la derecha",
        alignStart: "Alinear el texto al inicio",
        alignmentGroup: "Alineación",
        altText: "Texto alternativo",
        apply: "Aplicar",
        backgroundColor: "Color de fondo",
        bold: "Negrita",
        cancel: "Cancelar",
        codeBlock: "Bloque de código",
        color: "Color",
        contentLabel: "Editor de texto enriquecido",
        defaultFontFamily: "Fuente predeterminada",
        deleteColumn: "Eliminar columna",
        deleteRow: "Eliminar fila",
        deleteTable: "Eliminar tabla",
        editLink: "Editar enlace",
        enterUrl: "Introducir la URL",
        fontSize: "Tamaño de fuente",
        format: "Formato",
        heading: (level: number) => `Encabezado ${localizeNumber(level)}`,
        heightPx: "Altura (px)",
        historyGroup: "Historial",
        imageUrl: "URL de la imagen",
        indent: "Aumentar sangría",
        indentGroup: "Sangría",
        insert: "Insertar",
        insertImage: "Insertar imagen",
        insertLink: "Insertar enlace",
        insertOrderedList: "Insertar lista numerada",
        insertTable: "Insertar tabla",
        insertTaskList: "Insertar lista de tareas",
        insertUnorderedList: "Insertar lista con viñetas",
        invalidUrl: "Introduzca una dirección web, un enlace mailto: o tel:, o una ruta relativa.",
        italic: "Cursiva",
        justify: "Justificar",
        linkGroup: "Enlace",
        listGroup: "Listas",
        mergeCells: "Combinar celdas seleccionadas",
        outdent: "Reducir sangría",
        paragraph: "Párrafo",
        quotation: "Cita",
        redo: "Rehacer",
        removeLink: "Quitar enlace",
        selectFontFamily: "Seleccionar familia de fuentes",
        selectFontSize: "Seleccionar tamaño de fuente",
        splitCell: "Dividir celda",
        strikethrough: "Tachado",
        subscript: "Subíndice",
        superscript: "Superíndice",
        tableGroup: "Tabla",
        tableSize: (rows: number, columns: number) =>
            `Filas: ${localizeNumber(rows)}, columnas: ${localizeNumber(columns)}`,
        textStyleGroup: "Estilo de texto",
        toggleHeaderRow: "Alternar fila de encabezado",
        toolbar: "Formato",
        underline: "Subrayado",
        undo: "Deshacer",
        widthPx: "Anchura (px)"
    },
    filter: {
        and: "Y",
        apply: "Aplicar",
        clear: "Limpiar",
        contains: "Contiene",
        doesNotContain: "No contiene",
        endsWith: "Termina con",
        isAfter: "Es posterior a",
        isAfterOrEqualTo: "Es posterior o igual a",
        isBefore: "Es anterior a",
        isBeforeOrEqualTo: "Es anterior o igual a",
        isEmpty: "Está vacío",
        isEqualTo: "Es igual a",
        isFalse: "Es falso",
        isGreaterThan: "Es mayor que",
        isGreaterThanOrEqualTo: "Es mayor o igual que",
        isLessThan: "Es menor que",
        isLessThanOrEqualTo: "Es menor o igual que",
        isNotEmpty: "No está vacío",
        isNotEqualTo: "No es igual a",
        isNotNull: "No es nulo",
        isNotNullOrEmpty: "No es nulo ni está vacío",
        isNull: "Es nulo",
        isNullOrEmpty: "Es nulo o está vacío",
        isTrue: "Es verdadero",
        logic: "Combinar condiciones",
        operator: "Operador",
        or: "O",
        secondOperator: "Segundo operador",
        secondValue: "Segundo valor",
        startsWith: "Empieza con",
        value: "Valor"
    },
    grid: {
        all: "(Todos)",
        apply: "Aplicar",
        cancel: "Cancelar",
        cancelNewRow: "Descartar fila nueva",
        cancelRowEdit: (rowNumber: number) => `Cancelar edición de la fila ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Limpiar filtro de ${column}`,
        collapseDetail: (rowNumber: number) => `Ocultar detalles de la fila ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Agrupado por ${column}`,
        columnMoved: (column: string, position: number) =>
            `Columna ${column} movida a la posición ${localizeNumber(position)}`,
        columns: "Columnas",
        columnsSelected: (count: number) =>
            count === 1 ? "1 columna seleccionada" : `${localizeNumber(count)} columnas seleccionadas`,
        commandColumnTitle: "Comandos",
        delete: "Eliminar",
        deleteRowConfirmation: (rowNumber: number) =>
            `¿Seguro que deseas eliminar la fila ${localizeNumber(rowNumber)}?`,
        deleteRowTitle: "¿Eliminar fila?",
        details: "Detalles",
        dragColumnHeaderToGroup: "Arrastra el encabezado de una columna aquí para agrupar",
        edit: "Editar",
        editRow: (rowNumber: number) => `Editar fila ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Mostrar detalles de la fila ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Valor no válido.",
        filterByColumn: (column: string) => `Filtrar por ${column}`,
        filterByColumnFiltered: (column: string) => `Filtrar por ${column}, filtrado`,
        filterOperator: (column: string, operator: string) => `Operador de filtro de ${column}: ${operator}`,
        filterPlaceholder: "Filtrar...",
        group: "Grupo",
        loading: "Cargando",
        modified: "Modificado",
        moveAsNext: "Mover como siguiente",
        moveAsPrevious: "Mover como anterior",
        moveRow: "Mover fila",
        noData: "No hay datos",
        remove: "Quitar",
        removeRow: (rowNumber: number) => `Quitar fila ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `Reordenar fila ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Cambiar tamaño de la columna ${column}`,
        rowReorder: "Reordenar fila",
        rowReorderDisabled: "La reordenación de filas está desactivada.",
        rowReorderDisabledEditing: "Termina la edición para reordenar las filas.",
        rowReorderDisabledFiltered: "Limpia los filtros para reordenar las filas.",
        rowReorderDisabledGrouped: "Quita la agrupación para reordenar las filas.",
        rowReorderDisabledServerBinding: "No se pueden reordenar filas con vinculación al servidor.",
        rowReorderDisabledSingleRow: "Se necesitan al menos dos filas para reordenarlas.",
        rowReorderDisabledSorted: "Quita la ordenación para reordenar las filas.",
        rowReorderDisabledVirtualScroll:
            "La reordenación de filas no está disponible mientras el desplazamiento virtual está activado.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Usa Alt más Flecha arriba o Alt más Flecha abajo para mover.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Fila ${localizeNumber(fromRowNumber)} movida a la posición ${localizeNumber(toPosition)}.`,
        rowValidationError: "Esta fila contiene errores de validación.",
        save: "Guardar",
        saveNewRow: "Guardar fila nueva",
        saveRow: (rowNumber: number) => `Guardar fila ${localizeNumber(rowNumber)}`,
        selectAllRows: "Seleccionar todas las filas",
        selectRow: (rowNumber: number) => `Seleccionar fila ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Orden de clasificación ${localizeNumber(position)}`,
        toolbar: "Barra de herramientas de la tabla"
    },
    list: {
        filterList: "Filtrar lista",
        loading: "Cargando",
        noData: "No hay datos",
        pagerLabel: (list: string) => `Paginación de ${list}`
    },
    listBox: {
        clearSelection: "Limpiar selección",
        itemsMoved: (position: number, total: number) =>
            `Movido a la posición ${localizeNumber(position)} de ${localizeNumber(total)}`,
        itemsRemoved: (count: number) =>
            count === 1 ? `${localizeNumber(count)} elemento quitado` : `${localizeNumber(count)} elementos quitados`,
        itemsTransferred: (count: number, list: string) =>
            count === 1
                ? `${localizeNumber(count)} elemento transferido a ${list}`
                : `${localizeNumber(count)} elementos transferidos a ${list}`,
        itemsTransferredToOtherList: (count: number) =>
            count === 1
                ? `${localizeNumber(count)} elemento transferido a la otra lista`
                : `${localizeNumber(count)} elementos transferidos a la otra lista`,
        moveDown: "Bajar",
        moveUp: "Subir",
        remove: "Quitar",
        selectionCleared: "Selección borrada",
        toolbarLabel: (list: string) => `Acciones de ${list}`,
        transferAllFrom: "Transferir todo desde la otra lista",
        transferAllFromList: (list: string) => `Transferir todo desde ${list}`,
        transferAllTo: "Transferir todo a la otra lista",
        transferAllToList: (list: string) => `Transferir todo a ${list}`,
        transferFrom: "Transferir desde la otra lista",
        transferFromList: (list: string) => `Transferir desde ${list}`,
        transferTo: "Transferir a la otra lista",
        transferToList: (list: string) => `Transferir a ${list}`
    },
    multiSelect: {
        clear: "Limpiar",
        itemsCount: (count: number) =>
            count === 1 ? `+ ${localizeNumber(count)} elemento` : `+ ${localizeNumber(count)} elementos`,
        removeMoreItems: (count: number) =>
            count === 1
                ? `Quitar ${localizeNumber(count)} elemento más`
                : `Quitar ${localizeNumber(count)} elementos más`
    },
    notification: {
        close: "Cerrar",
        error: "Error",
        info: "Información",
        region: "Notificaciones",
        success: "Éxito",
        warning: "Advertencia"
    },
    numericTextBox: {
        decrease: "Reducir valor",
        increase: "Aumentar valor"
    },
    otpInput: {
        verificationCode: "Código de verificación"
    },
    pager: {
        firstPageLabel: "Primera página",
        itemsPerPageLabel: "Elementos por página",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Retroceder 1 página" : `Retroceder ${localizeNumber(pages)} páginas`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avanzar 1 página" : `Avanzar ${localizeNumber(pages)} páginas`,
        lastPageLabel: "Última página",
        nextPageLabel: "Página siguiente",
        ofText: "de",
        pageInputPrefix: (_totalPages: number) => "Página",
        pageInputSuffix: (totalPages: number) => `de ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Página ${localizeNumber(page)}`,
        pageSelectLabel: "Página",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} / página`,
        pageStatus: (page: number, totalPages: number) =>
            `Página ${localizeNumber(page)} de ${localizeNumber(totalPages)}`,
        pageText: "Página",
        pagerLabel: "Paginación",
        previousPageLabel: "Página anterior",
        rangeStatus: (start: number, end: number, total: number) =>
            total === 1
                ? `${localizeNumber(start)} - ${localizeNumber(end)} de ${localizeNumber(total)} elemento`
                : `${localizeNumber(start)} - ${localizeNumber(end)} de ${localizeNumber(total)} elementos`
    },
    rating: {
        notRated: "Sin valoración",
        valueText: (value: number, max: number) => `${localizeNumber(value)} de ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "carrusel",
        nextPage: "Página siguiente",
        page: (current: number) => `Página ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Página ${localizeNumber(current)} de ${localizeNumber(total)}`,
        previousPage: "Página anterior",
        scrollPagerNext: "Desplazar la paginación hacia delante",
        scrollPagerPrevious: "Desplazar la paginación hacia atrás",
        slide: "diapositiva"
    },
    sheet: {
        closeSheet: "Cerrar panel"
    },
    slider: {
        maximumValue: "Valor máximo",
        minimumValue: "Valor mínimo",
        sliderValue: "Valor del control deslizante"
    },
    spinner: {
        cancel: "Cancelar",
        loading: "Cargando"
    },
    splitButton: {
        menuButtonAriaLabel: "Mostrar opciones de menú",
        menuButtonWithText: (text: string) => `Más opciones de ${text}`,
        splitButton: (text: string) => (text ? `${text}, botón dividido` : "Botón dividido")
    },
    splitter: {
        collapseDown: "Contraer panel inferior",
        collapseNext: "Contraer panel siguiente",
        collapsePrevious: "Contraer panel anterior",
        collapseUp: "Contraer panel superior",
        resizer: "Separador de paneles"
    },
    stepper: {
        stepProgress: "Progreso del paso",
        stepper: "Progreso"
    },
    tabs: {
        closeTab: "Cerrar pestaña",
        scrollNext: "Desplazar pestañas hacia delante",
        scrollPrevious: "Desplazar pestañas hacia atrás"
    },
    textBox: {
        clear: "Limpiar"
    },
    timePicker: {
        openTimePicker: "Abrir selector de hora",
        timePicker: "Selector de hora"
    },
    timeSelector: {
        am: "a. m.",
        amPm: "a. m./p. m.",
        headerHours: "h",
        headerMinutes: "min",
        headerSeconds: "s",
        hours: "Horas",
        minutes: "Minutos",
        now: "Ahora",
        pm: "p. m.",
        seconds: "Segundos",
        set: "Establecer",
        timeSelector: "Selector de hora"
    },
    treeView: {
        collapse: "Contraer",
        expand: "Expandir",
        filter: "Filtrar",
        filterLabel: (tree: string) => `Filtrar ${tree}`,
        filterTree: "Filtrar árbol",
        loadError: (node: string) => `No se pudieron cargar los elementos de ${node}`,
        loadingNode: (node: string) => `Cargando ${node}`,
        movedAfter: (node: string, target: string) => `${node} se movió después de ${target}`,
        movedBefore: (node: string, target: string) => `${node} se movió antes de ${target}`,
        movedInto: (node: string, target: string) => `${node} se movió dentro de ${target}`,
        noData: "No hay datos",
        noMatches: "No hay elementos coincidentes",
        results: (count: number) =>
            count === 1 ? `${localizeNumber(count)} resultado` : `${localizeNumber(count)} resultados`,
        retryLoading: (node: string) => `Reintentar cargar ${node}`
    },
    window: {
        close: "Cerrar",
        closeWindow: "Cerrar ventana",
        maximize: "Maximizar",
        minimize: "Minimizar",
        moveOrResizeWindow:
            "Mover o cambiar el tamaño de la ventana. Usa las teclas de flecha para mover, o Ctrl y las teclas de flecha para cambiar el tamaño.",
        moveWindow: "Mover ventana. Usa las teclas de flecha para mover.",
        resizeBottom: "Cambiar tamaño de ventana desde abajo. Usa las teclas de flecha para cambiar el tamaño.",
        resizeBottomLeft:
            "Cambiar tamaño de ventana desde la esquina inferior izquierda. Usa las teclas de flecha para cambiar el tamaño.",
        resizeBottomRight:
            "Cambiar tamaño de ventana desde la esquina inferior derecha. Usa las teclas de flecha para cambiar el tamaño.",
        resizeLeft: "Cambiar tamaño de ventana desde la izquierda. Usa las teclas de flecha para cambiar el tamaño.",
        resizeRight: "Cambiar tamaño de ventana desde la derecha. Usa las teclas de flecha para cambiar el tamaño.",
        resizeTop: "Cambiar tamaño de ventana desde arriba. Usa las teclas de flecha para cambiar el tamaño.",
        resizeTopLeft:
            "Cambiar tamaño de ventana desde la esquina superior izquierda. Usa las teclas de flecha para cambiar el tamaño.",
        resizeTopRight:
            "Cambiar tamaño de ventana desde la esquina superior derecha. Usa las teclas de flecha para cambiar el tamaño.",
        resizeWindow: "Cambiar el tamaño de la ventana. Usa Ctrl y las teclas de flecha para cambiar el tamaño.",
        restore: "Restaurar"
    }
} satisfies MonaLocaleMessages;

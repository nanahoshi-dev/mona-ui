import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

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
        decadeRange: (start: number, end: number) => `${start} a ${end}`,
        decadeViewLabel: (start: number, end: number) => `Vista de década, ${start} - ${end}`,
        goToToday: (formattedDate: string) => `Ir a hoy, ${formattedDate}`,
        nextDecade: "Década siguiente",
        nextMonth: "Mes siguiente",
        nextYear: "Año siguiente",
        previousDecade: "Década anterior",
        previousMonth: "Mes anterior",
        previousYear: "Año anterior",
        switchToDecadeView: (currentYear: string) => `Cambiar a vista de década, actualmente ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Cambiar a vista anual, actualmente ${currentMonthAndYear}`,
        today: "Hoy",
        yearCellLabel: (year: number) => `Año ${year}`,
        yearViewLabel: (year: string) => `Vista anual, ${year}`
    },
    card: {
        actionsLabel: "Acciones de la tarjeta"
    },
    chart: {
        change: "Cambio",
        chart: "Gráfico",
        chartLegend: "Leyenda del gráfico",
        close: "Cierre",
        closeAbbreviation: "C",
        colorScale: "Escala de colores",
        conversion: "Conversión",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}, de ${minimum} a ${maximum}, con punto medio en ${midpoint}`,
        dropOff: "Abandono",
        falling: "En descenso",
        high: "Máximo",
        highAbbreviation: "Máx",
        labelValueSeparator: ":",
        low: "Mínimo",
        lowAbbreviation: "Mín",
        noData: "No hay datos disponibles",
        open: "Apertura",
        openAbbreviation: "A",
        overall: "Global",
        range: "Rango",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, de ${minimum} a ${maximum}`,
        rising: "En alza",
        runningTotal: "Total acumulado",
        size: "tamaño",
        unchanged: "Sin cambios",
        value: "Valor",
        visualIndicatorClamped: "Indicador visual acotado"
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
            `Saturación ${saturation}%, valor ${value}%`,
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
            `${text}, ${position} de ${total}`,
        noResultsFound: "No se han encontrado resultados",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 resultado disponible" : `${count} resultados disponibles`
    },
    editor: {
        addColumnAfter: "Añadir columna después",
        addColumnBefore: "Añadir columna antes",
        addHorizontalLine: "Añadir línea horizontal",
        addRowAfter: "Añadir fila después",
        addRowBefore: "Añadir fila antes",
        alignCenter: "Centrar texto",
        alignLeft: "Alinear texto a la izquierda",
        alignRight: "Alinear texto a la derecha",
        altText: "Texto alternativo",
        backgroundColor: "Color de fondo",
        bold: "Negrita",
        cancel: "Cancelar",
        codeBlock: "Bloque de código",
        color: "Color",
        deleteColumn: "Eliminar columna",
        deleteRow: "Eliminar fila",
        deleteTable: "Eliminar tabla",
        enterUrl: "Introducir la URL",
        fontSize: "Tamaño de fuente",
        format: "Formato",
        heading: (level: number) => `Encabezado ${level}`,
        heightPx: "Altura (px)",
        imageUrl: "URL de la imagen",
        indent: "Aumentar sangría",
        insert: "Insertar",
        insertImage: "Insertar imagen",
        insertLink: "Insertar enlace",
        insertOrderedList: "Insertar lista numerada",
        insertTable: "Insertar tabla",
        insertTaskList: "Insertar lista de tareas",
        insertUnorderedList: "Insertar lista con viñetas",
        italic: "Cursiva",
        justify: "Justificar",
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
        toggleHeaderRow: "Alternar fila de encabezado",
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
        or: "O",
        startsWith: "Empieza con"
    },
    grid: {
        all: "(Todos)",
        apply: "Aplicar",
        cancel: "Cancelar",
        cancelRowEdit: "Cancelar edición de fila",
        columns: "Columnas",
        columnsSelected: (count: number) =>
            count === 1 ? "1 columna seleccionada" : `${count} columnas seleccionadas`,
        delete: "Eliminar",
        deleteRowConfirmation: "¿Seguro que deseas eliminar esta fila?",
        deleteRowTitle: "¿Eliminar fila?",
        dragColumnHeaderToGroup: "Arrastra el encabezado de una columna aquí para agrupar",
        edit: "Editar",
        editRow: "Editar fila",
        fieldValidationError: "Valor no válido.",
        filterByColumn: (column: string) => `Filtrar por ${column}`,
        filterPlaceholder: "Filtrar...",
        modified: "Modificado",
        moveAsNext: "Mover como siguiente",
        moveAsPrevious: "Mover como anterior",
        moveRow: "Mover fila",
        noData: "No hay datos",
        remove: "Quitar",
        removeRow: "Quitar fila",
        reorderRow: (rowNumber: number) => `Reordenar fila ${rowNumber}`,
        resizeColumn: "Cambiar tamaño de columna",
        rowReorder: "Reordenar fila",
        rowReorderDisabled: "La reordenación de filas está desactivada.",
        rowReorderDisabledEditing: "Termina la edición para reordenar las filas.",
        rowReorderDisabledFiltered: "Limpia los filtros para reordenar las filas.",
        rowReorderDisabledGrouped: "Quita la agrupación para reordenar las filas.",
        rowReorderDisabledSingleRow: "Se necesitan al menos dos filas para reordenarlas.",
        rowReorderDisabledSorted: "Quita la ordenación para reordenar las filas.",
        rowReorderDisabledVirtualScroll:
            "La reordenación de filas no está disponible mientras el desplazamiento virtual está activado.",
        rowReorderKeyboardHint: "Usa Alt más Flecha arriba o Alt más Flecha abajo para mover.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Fila ${fromRowNumber} movida a la posición ${toPosition}.`,
        rowValidationError: "Esta fila contiene errores de validación.",
        save: "Guardar",
        saveRow: "Guardar fila",
        selectAllRows: "Seleccionar todas las filas",
        selectRow: (rowNumber: number) => `Seleccionar fila ${rowNumber}`
    },
    list: {
        noData: "No hay datos"
    },
    listBox: {
        clearSelection: "Limpiar selección",
        moveDown: "Bajar",
        moveUp: "Subir",
        remove: "Quitar",
        transferAllFrom: "Transferir todo desde la otra lista",
        transferAllTo: "Transferir todo a la otra lista",
        transferFrom: "Transferir desde la otra lista",
        transferTo: "Transferir a la otra lista"
    },
    multiSelect: {
        clear: "Limpiar",
        itemsCount: (count: number) => `+ ${count} ${count === 1 ? "elemento" : "elementos"}`
    },
    notification: {
        close: "Cerrar",
        error: "Error",
        info: "Información",
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
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Retroceder 1 página" : `Retroceder ${pages} páginas`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avanzar 1 página" : `Avanzar ${pages} páginas`,
        lastPageLabel: "Última página",
        nextPageLabel: "Página siguiente",
        ofText: "de",
        pageLabel: (page: number) => `Página ${page}`,
        pageSizeLabel: (pageSize: number) => `${pageSize} / página`,
        pageStatus: (page: number, totalPages: number) => `Página ${page} de ${totalPages}`,
        pageText: "Página",
        previousPageLabel: "Página anterior",
        rangeStatus: (start: number, end: number, total: number) =>
            `${start} - ${end} de ${total} ${total === 1 ? "elemento" : "elementos"}`
    },
    rating: {
        notRated: "Sin valoración",
        valueText: (value: number, max: number) => `${value} de ${max}`
    },
    scrollView: {
        carousel: "carrusel",
        nextPage: "Página siguiente",
        page: (current: number) => `Página ${current}`,
        pageOf: (current: number, total: number) => `Página ${current} de ${total}`,
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
        am: "AM",
        amPm: "AM/PM",
        headerHours: "h",
        headerMinutes: "min",
        headerSeconds: "s",
        hours: "Horas",
        minutes: "Minutos",
        now: "Ahora",
        pm: "PM",
        seconds: "Segundos",
        set: "Establecer",
        timeSelector: "Selector de hora"
    },
    treeView: {
        collapse: "Contraer",
        expand: "Expandir",
        filter: "Filtrar",
        filterTree: "Filtrar árbol"
    },
    window: {
        close: "Cerrar",
        closeWindow: "Cerrar ventana",
        maximize: "Maximizar",
        minimize: "Minimizar",
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
        restore: "Restaurar"
    }
} satisfies MonaLocaleMessages;

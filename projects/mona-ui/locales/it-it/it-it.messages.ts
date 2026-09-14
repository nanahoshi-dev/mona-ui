import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const IT_IT_MESSAGES = {
    autoComplete: {
        clear: "Cancella"
    },
    breadcrumb: {
        breadcrumb: "Percorso di navigazione"
    },
    buttonGroup: {
        buttonGroup: "Gruppo di pulsanti"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Calendario, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) => `${start} - ${end}`,
        decadeViewLabel: (start: number, end: number) => `Vista decennio, ${start} - ${end}`,
        goToToday: (formattedDate: string) => `Vai a oggi, ${formattedDate}`,
        nextDecade: "Decennio successivo",
        nextMonth: "Mese successivo",
        nextYear: "Anno successivo",
        previousDecade: "Decennio precedente",
        previousMonth: "Mese precedente",
        previousYear: "Anno precedente",
        switchToDecadeView: (currentYear: string) =>
            `Passa alla vista decennio, attualmente ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Passa alla vista anno, attualmente ${currentMonthAndYear}`,
        today: "Oggi",
        yearCellLabel: (year: number) => `Anno ${year}`,
        yearViewLabel: (year: string) => `Vista anno, ${year}`
    },
    card: {
        actionsLabel: "Azioni della scheda"
    },
    chart: {
        change: "Variazione",
        chart: "Grafico",
        chartLegend: "Legenda del grafico",
        close: "Chiusura",
        closeAbbreviation: "C",
        colorScale: "Scala colori",
        conversion: "Conversione",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}, da ${minimum} a ${maximum}, valore intermedio ${midpoint}`,
        dropOff: "Abbandono",
        falling: "In calo",
        high: "Massimo",
        highAbbreviation: "Max",
        labelValueSeparator: ":",
        low: "Minimo",
        lowAbbreviation: "Min",
        noData: "Nessun dato disponibile",
        open: "Apertura",
        openAbbreviation: "A",
        overall: "Complessivo",
        range: "Intervallo",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, da ${minimum} a ${maximum}`,
        rising: "In rialzo",
        runningTotal: "Totale progressivo",
        size: "dimensione",
        unchanged: "Invariato",
        value: "Valore",
        visualIndicatorClamped: "Indicatore visivo limitato"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Rimuovi ${label}` : "Rimuovi elemento")
    },
    colorGradient: {
        apply: "Applica",
        cancel: "Annulla",
        clearColor: "Cancella colore",
        copyAsHex: "Copia come HEX",
        copyAsRgb: "Copia come RGB",
        copyColor: "Copia colore",
        currentColor: "Colore corrente",
        previousColor: "Colore precedente",
        saturationAndValue: "Saturazione e valore del colore",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturazione ${saturation}%, valore ${value}%`,
        switchColorMode: "Cambia modalità colore"
    },
    colorPalette: {
        color: (color: string) => `Colore: ${color}`,
        colorPalette: "Tavolozza colori"
    },
    colorPicker: {
        clearColor: "Cancella colore",
        colorGradientPicker: "Selettore gradiente di colore",
        colorPalettePicker: "Selettore tavolozza colori",
        colorPicker: "Selettore colore"
    },
    comboBox: {
        clear: "Cancella"
    },
    datePicker: {
        datePicker: "Selettore data",
        openCalendar: "Apri calendario"
    },
    dateTimePicker: {
        calendar: "Calendario",
        cancel: "Annulla",
        date: "Data",
        dateTimePicker: "Selettore data e ora",
        openDateTimePicker: "Apri selettore data e ora",
        set: "Imposta",
        time: "Ora",
        timePicker: "Selettore ora"
    },
    dialog: {
        cancel: "Annulla",
        closeDialog: "Chiudi finestra di dialogo",
        ok: "OK"
    },
    dropdownList: {
        clear: "Cancella"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${position} di ${total}`,
        noResultsFound: "Nessun risultato trovato",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 risultato disponibile" : `${count} risultati disponibili`
    },
    editor: {
        addColumnAfter: "Inserisci colonna dopo",
        addColumnBefore: "Inserisci colonna prima",
        addHorizontalLine: "Inserisci linea orizzontale",
        addRowAfter: "Inserisci riga dopo",
        addRowBefore: "Inserisci riga prima",
        alignCenter: "Allinea al centro",
        alignLeft: "Allinea a sinistra",
        alignRight: "Allinea a destra",
        altText: "Testo alternativo",
        backgroundColor: "Colore di sfondo",
        bold: "Grassetto",
        cancel: "Annulla",
        codeBlock: "Blocco di codice",
        color: "Colore",
        deleteColumn: "Elimina colonna",
        deleteRow: "Elimina riga",
        deleteTable: "Elimina tabella",
        enterUrl: "Inserisci l'URL",
        fontSize: "Dimensione carattere",
        format: "Formattazione",
        heading: (level: number) => `Intestazione ${level}`,
        heightPx: "Altezza (px)",
        imageUrl: "URL immagine",
        indent: "Aumenta rientro",
        insert: "Inserisci",
        insertImage: "Inserisci immagine",
        insertLink: "Inserisci link",
        insertOrderedList: "Inserisci elenco numerato",
        insertTable: "Inserisci tabella",
        insertTaskList: "Inserisci elenco attività",
        insertUnorderedList: "Inserisci elenco puntato",
        italic: "Corsivo",
        justify: "Giustifica",
        mergeCells: "Unisci celle selezionate",
        outdent: "Riduci rientro",
        paragraph: "Paragrafo",
        quotation: "Citazione",
        redo: "Ripeti",
        removeLink: "Rimuovi link",
        selectFontFamily: "Seleziona tipo di carattere",
        selectFontSize: "Seleziona dimensione carattere",
        splitCell: "Dividi cella",
        strikethrough: "Barrato",
        subscript: "Pedice",
        superscript: "Apice",
        toggleHeaderRow: "Attiva/disattiva riga di intestazione",
        underline: "Sottolineato",
        undo: "Annulla",
        widthPx: "Larghezza (px)"
    },
    filter: {
        and: "E",
        apply: "Applica",
        clear: "Cancella",
        contains: "Contiene",
        doesNotContain: "Non contiene",
        endsWith: "Termina con",
        isAfter: "È successivo a",
        isAfterOrEqualTo: "È successivo o uguale a",
        isBefore: "È precedente a",
        isBeforeOrEqualTo: "È precedente o uguale a",
        isEmpty: "È vuoto",
        isEqualTo: "È uguale a",
        isFalse: "È falso",
        isGreaterThan: "È maggiore di",
        isGreaterThanOrEqualTo: "È maggiore o uguale a",
        isLessThan: "È minore di",
        isLessThanOrEqualTo: "È minore o uguale a",
        isNotEmpty: "Non è vuoto",
        isNotEqualTo: "È diverso da",
        isNotNull: "Non è nullo",
        isNotNullOrEmpty: "Non è nullo né vuoto",
        isNull: "È nullo",
        isNullOrEmpty: "È nullo o vuoto",
        isTrue: "È vero",
        or: "O",
        startsWith: "Inizia con"
    },
    grid: {
        all: "(Tutti)",
        apply: "Applica",
        cancel: "Annulla",
        cancelRowEdit: "Annulla modifica della riga",
        columns: "Colonne",
        columnsSelected: (count: number) =>
            count === 1 ? "1 colonna selezionata" : `${count} colonne selezionate`,
        delete: "Elimina",
        deleteRowConfirmation: "Sei sicuro di voler eliminare questo elemento?",
        deleteRowTitle: "Eliminare la riga?",
        dragColumnHeaderToGroup: "Trascina l'intestazione di una colonna qui per raggruppare",
        edit: "Modifica",
        editRow: "Modifica riga",
        fieldValidationError: "Valore non valido.",
        filterByColumn: (column: string) => `Filtra per ${column}`,
        filterPlaceholder: "Filtra...",
        modified: "Modificato",
        moveAsNext: "Sposta come successivo",
        moveAsPrevious: "Sposta come precedente",
        moveRow: "Sposta riga",
        noData: "Nessun dato disponibile",
        remove: "Rimuovi",
        removeRow: "Rimuovi riga",
        reorderRow: (rowNumber: number) => `Riordina riga ${rowNumber}`,
        resizeColumn: "Ridimensiona colonna",
        rowReorder: "Riordina righe",
        rowReorderDisabled: "Il riordinamento delle righe è disabilitato.",
        rowReorderDisabledEditing: "Completa la modifica prima di riordinare le righe.",
        rowReorderDisabledFiltered: "Rimuovi i filtri prima di riordinare le righe.",
        rowReorderDisabledGrouped: "Rimuovi il raggruppamento prima di riordinare le righe.",
        rowReorderDisabledSingleRow: "Sono necessarie almeno due righe per riordinarle.",
        rowReorderDisabledSorted: "Rimuovi l'ordinamento prima di riordinare le righe.",
        rowReorderDisabledVirtualScroll:
            "Il riordinamento delle righe non è disponibile con lo scorrimento virtuale attivo.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Riga ${fromRowNumber} spostata alla posizione ${toPosition}.`,
        rowValidationError: "Questa riga contiene errori di convalida.",
        save: "Salva",
        saveRow: "Salva riga",
        selectAllRows: "Seleziona tutte le righe",
        selectRow: (rowNumber: number) => `Seleziona riga ${rowNumber}`
    },
    list: {
        noData: "Nessun dato disponibile"
    },
    listBox: {
        clearSelection: "Deseleziona tutto",
        moveDown: "Sposta giù",
        moveUp: "Sposta su",
        remove: "Rimuovi",
        transferAllFrom: "Sposta tutto dall'altro elenco",
        transferAllTo: "Sposta tutto nell'altro elenco",
        transferFrom: "Sposta dall'altro elenco",
        transferTo: "Sposta nell'altro elenco"
    },
    multiSelect: {
        clear: "Cancella",
        itemsCount: (count: number) => (count === 1 ? "+ 1 elemento" : `+ ${count} elementi`)
    },
    notification: {
        close: "Chiudi",
        error: "Errore",
        info: "Informazioni",
        success: "Operazione riuscita",
        warning: "Avviso"
    },
    numericTextBox: {
        decrease: "Diminuisci valore",
        increase: "Aumenta valore"
    },
    otpInput: {
        verificationCode: "Codice di verifica"
    },
    pager: {
        firstPageLabel: "Prima pagina",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Torna indietro di 1 pagina" : `Torna indietro di ${pages} pagine`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avanza di 1 pagina" : `Avanza di ${pages} pagine`,
        lastPageLabel: "Ultima pagina",
        nextPageLabel: "Pagina successiva",
        ofText: "di",
        pageLabel: (page: number) => `Pagina ${page}`,
        pageSizeLabel: (pageSize: number) => `${pageSize} per pagina`,
        pageStatus: (page: number, totalPages: number) => `Pagina ${page} di ${totalPages}`,
        pageText: "Pagina",
        previousPageLabel: "Pagina precedente",
        rangeStatus: (start: number, end: number, total: number) =>
            `${start} - ${end} di ${total} ${total === 1 ? "elemento" : "elementi"}`
    },
    rating: {
        notRated: "Nessuna valutazione",
        valueText: (value: number, max: number) => `${value} di ${max}`
    },
    scrollView: {
        carousel: "carosello",
        nextPage: "Pagina successiva",
        page: (current: number) => `Pagina ${current}`,
        pageOf: (current: number, total: number) => `Pagina ${current} di ${total}`,
        previousPage: "Pagina precedente",
        scrollPagerNext: "Scorri in avanti le opzioni del paginatore",
        scrollPagerPrevious: "Scorri indietro le opzioni del paginatore",
        slide: "diapositiva"
    },
    sheet: {
        closeSheet: "Chiudi pannello"
    },
    slider: {
        maximumValue: "Valore massimo",
        minimumValue: "Valore minimo",
        sliderValue: "Valore del cursore"
    },
    spinner: {
        cancel: "Annulla",
        loading: "Caricamento in corso"
    },
    splitButton: {
        menuButtonAriaLabel: "Mostra opzioni del menu",
        splitButton: (text: string) => (text ? `${text}, pulsante con menu` : "Pulsante con menu")
    },
    splitter: {
        collapseDown: "Comprimi pannello inferiore",
        collapseNext: "Comprimi pannello successivo",
        collapsePrevious: "Comprimi pannello precedente",
        collapseUp: "Comprimi pannello superiore",
        resizer: "Divisore pannelli"
    },
    stepper: {
        stepProgress: "Avanzamento dei passaggi",
        stepper: "Avanzamento"
    },
    tabs: {
        closeTab: "Chiudi scheda",
        scrollNext: "Scorri le schede in avanti",
        scrollPrevious: "Scorri le schede indietro"
    },
    textBox: {
        clear: "Cancella"
    },
    timePicker: {
        openTimePicker: "Apri selettore ora",
        timePicker: "Selettore ora"
    },
    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "h",
        headerMinutes: "min",
        headerSeconds: "s",
        hours: "Ore",
        minutes: "Minuti",
        now: "Ora",
        pm: "PM",
        seconds: "Secondi",
        set: "Imposta",
        timeSelector: "Selettore ora"
    },
    treeView: {
        collapse: "Comprimi",
        expand: "Espandi",
        filter: "Filtra",
        filterTree: "Filtra albero"
    },
    window: {
        close: "Chiudi",
        closeWindow: "Chiudi finestra",
        maximize: "Massimizza",
        minimize: "Minimizza",
        moveWindow: "Sposta finestra. Usa i tasti freccia per spostarla.",
        resizeBottom:
            "Ridimensiona la finestra dal bordo inferiore. Usa i tasti freccia per ridimensionarla.",
        resizeBottomLeft:
            "Ridimensiona la finestra dall'angolo inferiore sinistro. Usa i tasti freccia per ridimensionarla.",
        resizeBottomRight:
            "Ridimensiona la finestra dall'angolo inferiore destro. Usa i tasti freccia per ridimensionarla.",
        resizeLeft:
            "Ridimensiona la finestra dal bordo sinistro. Usa i tasti freccia per ridimensionarla.",
        resizeRight:
            "Ridimensiona la finestra dal bordo destro. Usa i tasti freccia per ridimensionarla.",
        resizeTop:
            "Ridimensiona la finestra dal bordo superiore. Usa i tasti freccia per ridimensionarla.",
        resizeTopLeft:
            "Ridimensiona la finestra dall'angolo superiore sinistro. Usa i tasti freccia per ridimensionarla.",
        resizeTopRight:
            "Ridimensiona la finestra dall'angolo superiore destro. Usa i tasti freccia per ridimensionarla.",
        restore: "Ripristina"
    }
} satisfies MonaLocaleMessages;

// Generated from it-it.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "it-IT", options);
}

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
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Vista del decennio, ${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Vai a oggi, ${formattedDate}`,
        nextDecade: "Decennio successivo",
        nextMonth: "Mese successivo",
        nextYear: "Anno successivo",
        previousDecade: "Decennio precedente",
        previousMonth: "Mese precedente",
        previousYear: "Anno precedente",
        switchToDecadeView: (currentYear: string) => `Passa alla vista del decennio, attualmente ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Passa alla vista dell'anno, attualmente ${currentMonthAndYear}`,
        today: "Oggi",
        yearCellLabel: (year: number) => `Anno ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Vista dell'anno, ${year}`
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
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, da ${minimum} a ${maximum}, valore intermedio ${midpoint}`,
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
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, da ${minimum} a ${maximum}`,
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
            `Saturazione ${localizeNumber(saturation)}%, valore ${localizeNumber(value)}%`,
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
            `${text}, ${localizeNumber(position)} di ${localizeNumber(total)}`,
        noResultsFound: "Nessun risultato trovato",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 risultato disponibile" : `${localizeNumber(count)} risultati disponibili`
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
        defaultFontFamily: "Carattere predefinito",
        deleteColumn: "Elimina colonna",
        deleteRow: "Elimina riga",
        deleteTable: "Elimina tabella",
        enterUrl: "Inserisci l'URL",
        fontSize: "Dimensione carattere",
        format: "Formattazione",
        heading: (level: number) => `Intestazione ${localizeNumber(level)}`,
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
        logic: "Combina condizioni",
        operator: "Operatore",
        or: "O",
        secondOperator: "Secondo operatore",
        secondValue: "Secondo valore",
        startsWith: "Inizia con",
        value: "Valore"
    },
    grid: {
        all: "(Tutti)",
        apply: "Applica",
        cancel: "Annulla",
        cancelNewRow: "Annulla nuova riga",
        cancelRowEdit: (rowNumber: number) => `Annulla modifica della riga ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Cancella filtro di ${column}`,
        collapseDetail: (rowNumber: number) => `Nascondi i dettagli della riga ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Raggruppato per ${column}`,
        columnMoved: (column: string, position: number) =>
            `Colonna ${column} spostata in posizione ${localizeNumber(position)}`,
        columns: "Colonne",
        columnsSelected: (count: number) =>
            count === 1 ? "1 colonna selezionata" : `${localizeNumber(count)} colonne selezionate`,
        commandColumnTitle: "Comandi",
        delete: "Elimina",
        deleteRowConfirmation: (rowNumber: number) =>
            `Sei sicuro di voler eliminare la riga ${localizeNumber(rowNumber)}?`,
        deleteRowTitle: "Eliminare la riga?",
        details: "Dettagli",
        dragColumnHeaderToGroup: "Trascina l'intestazione di una colonna qui per raggruppare",
        edit: "Modifica",
        editRow: (rowNumber: number) => `Modifica riga ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Mostra i dettagli della riga ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Valore non valido.",
        filterByColumn: (column: string) => `Filtra per ${column}`,
        filterByColumnFiltered: (column: string) => `Filtra per ${column}, filtrato`,
        filterOperator: (column: string, operator: string) => `Operatore di filtro di ${column}: ${operator}`,
        filterPlaceholder: "Filtra...",
        group: "Gruppo",
        loading: "Caricamento",
        modified: "Modificato",
        moveAsNext: "Sposta dopo",
        moveAsPrevious: "Sposta prima",
        moveRow: "Sposta riga",
        noData: "Nessun dato disponibile",
        remove: "Rimuovi",
        removeRow: (rowNumber: number) => `Rimuovi riga ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `Riordina riga ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Ridimensiona la colonna ${column}`,
        rowReorder: "Riordina righe",
        rowReorderDisabled: "Il riordinamento delle righe è disabilitato.",
        rowReorderDisabledEditing: "Completa la modifica prima di riordinare le righe.",
        rowReorderDisabledFiltered: "Rimuovi i filtri prima di riordinare le righe.",
        rowReorderDisabledGrouped: "Rimuovi il raggruppamento prima di riordinare le righe.",
        rowReorderDisabledServerBinding: "Il riordino delle righe non è disponibile con il binding al server.",
        rowReorderDisabledSingleRow: "Sono necessarie almeno due righe per riordinarle.",
        rowReorderDisabledSorted: "Rimuovi l'ordinamento prima di riordinare le righe.",
        rowReorderDisabledVirtualScroll:
            "Il riordinamento delle righe non è disponibile con lo scorrimento virtuale attivo.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Riga ${localizeNumber(fromRowNumber)} spostata alla posizione ${localizeNumber(toPosition)}.`,
        rowValidationError: "Questa riga contiene errori di convalida.",
        save: "Salva",
        saveNewRow: "Salva nuova riga",
        saveRow: (rowNumber: number) => `Salva riga ${localizeNumber(rowNumber)}`,
        selectAllRows: "Seleziona tutte le righe",
        selectRow: (rowNumber: number) => `Seleziona riga ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Ordine di ordinamento ${localizeNumber(position)}`,
        toolbar: "Barra degli strumenti della tabella"
    },
    list: {
        filterList: "Filtra elenco",
        loading: "Caricamento",
        noData: "Nessun dato disponibile",
        pagerLabel: (list: string) => `Paginazione di ${list}`
    },
    listBox: {
        clearSelection: "Deseleziona tutto",
        itemsMoved: (position: number, total: number) =>
            `Spostato in posizione ${localizeNumber(position)} di ${localizeNumber(total)}`,
        itemsRemoved: (count: number) =>
            count === 1 ? `${localizeNumber(count)} elemento rimosso` : `${localizeNumber(count)} elementi rimossi`,
        itemsTransferred: (count: number, list: string) =>
            count === 1
                ? `${localizeNumber(count)} elemento spostato in ${list}`
                : `${localizeNumber(count)} elementi spostati in ${list}`,
        itemsTransferredToOtherList: (count: number) =>
            count === 1
                ? `${localizeNumber(count)} elemento spostato nell'altro elenco`
                : `${localizeNumber(count)} elementi spostati nell'altro elenco`,
        moveDown: "Sposta giù",
        moveUp: "Sposta su",
        remove: "Rimuovi",
        selectionCleared: "Selezione annullata",
        toolbarLabel: (list: string) => `Azioni per ${list}`,
        transferAllFrom: "Sposta tutto dall'altro elenco",
        transferAllFromList: (list: string) => `Sposta tutto da ${list}`,
        transferAllTo: "Sposta tutto nell'altro elenco",
        transferAllToList: (list: string) => `Sposta tutto in ${list}`,
        transferFrom: "Sposta dall'altro elenco",
        transferFromList: (list: string) => `Sposta da ${list}`,
        transferTo: "Sposta nell'altro elenco",
        transferToList: (list: string) => `Sposta in ${list}`
    },
    multiSelect: {
        clear: "Cancella",
        itemsCount: (count: number) => (count === 1 ? "+ 1 elemento" : `+ ${localizeNumber(count)} elementi`),
        removeMoreItems: (count: number) =>
            count === 1 ? "Rimuovi un altro elemento" : `Rimuovi altri ${localizeNumber(count)} elementi`
    },
    notification: {
        close: "Chiudi",
        error: "Errore",
        info: "Informazioni",
        region: "Notifiche",
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
        itemsPerPageLabel: "Elementi per pagina",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Torna indietro di 1 pagina" : `Torna indietro di ${localizeNumber(pages)} pagine`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avanza di 1 pagina" : `Avanza di ${localizeNumber(pages)} pagine`,
        lastPageLabel: "Ultima pagina",
        nextPageLabel: "Pagina successiva",
        ofText: "di",
        pageInputPrefix: (_totalPages: number) => "Pagina",
        pageInputSuffix: (totalPages: number) => `di ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Pagina ${localizeNumber(page)}`,
        pageSelectLabel: "Pagina",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} per pagina`,
        pageStatus: (page: number, totalPages: number) =>
            `Pagina ${localizeNumber(page)} di ${localizeNumber(totalPages)}`,
        pageText: "Pagina",
        pagerLabel: "Paginazione",
        previousPageLabel: "Pagina precedente",
        rangeStatus: (start: number, end: number, total: number) =>
            total === 1
                ? `${localizeNumber(start)} - ${localizeNumber(end)} di ${localizeNumber(total)} elemento`
                : `${localizeNumber(start)} - ${localizeNumber(end)} di ${localizeNumber(total)} elementi`
    },
    rating: {
        notRated: "Nessuna valutazione",
        valueText: (value: number, max: number) => `${localizeNumber(value)} di ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "carosello",
        nextPage: "Pagina successiva",
        page: (current: number) => `Pagina ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Pagina ${localizeNumber(current)} di ${localizeNumber(total)}`,
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
        menuButtonWithText: (text: string) => `Altre opzioni per ${text}`,
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
        filterLabel: (tree: string) => `Filtra ${tree}`,
        filterTree: "Filtra albero",
        loadError: (node: string) => `Impossibile caricare gli elementi di ${node}`,
        loadingNode: (node: string) => `Caricamento di ${node}`,
        movedAfter: (node: string, target: string) => `${node} spostato dopo ${target}`,
        movedBefore: (node: string, target: string) => `${node} spostato prima di ${target}`,
        movedInto: (node: string, target: string) => `${node} spostato in ${target}`,
        noData: "Nessun dato disponibile",
        noMatches: "Nessun elemento corrispondente",
        results: (count: number) =>
            count === 1 ? `${localizeNumber(count)} risultato` : `${localizeNumber(count)} risultati`,
        retryLoading: (node: string) => `Riprova a caricare ${node}`
    },
    window: {
        close: "Chiudi",
        closeWindow: "Chiudi finestra",
        maximize: "Massimizza",
        minimize: "Minimizza",
        moveOrResizeWindow:
            "Sposta o ridimensiona finestra. Usa i tasti freccia per spostarla, oppure Ctrl e i tasti freccia per ridimensionarla.",
        moveWindow: "Sposta finestra. Usa i tasti freccia per spostarla.",
        resizeBottom: "Ridimensiona la finestra dal bordo inferiore. Usa i tasti freccia per ridimensionarla.",
        resizeBottomLeft:
            "Ridimensiona la finestra dall'angolo inferiore sinistro. Usa i tasti freccia per ridimensionarla.",
        resizeBottomRight:
            "Ridimensiona la finestra dall'angolo inferiore destro. Usa i tasti freccia per ridimensionarla.",
        resizeLeft: "Ridimensiona la finestra dal bordo sinistro. Usa i tasti freccia per ridimensionarla.",
        resizeRight: "Ridimensiona la finestra dal bordo destro. Usa i tasti freccia per ridimensionarla.",
        resizeTop: "Ridimensiona la finestra dal bordo superiore. Usa i tasti freccia per ridimensionarla.",
        resizeTopLeft:
            "Ridimensiona la finestra dall'angolo superiore sinistro. Usa i tasti freccia per ridimensionarla.",
        resizeTopRight:
            "Ridimensiona la finestra dall'angolo superiore destro. Usa i tasti freccia per ridimensionarla.",
        resizeWindow: "Ridimensiona finestra. Usa Ctrl e i tasti freccia per ridimensionarla.",
        restore: "Ripristina"
    }
} satisfies MonaLocaleMessages;

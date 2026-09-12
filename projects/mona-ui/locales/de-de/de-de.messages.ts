import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const DE_DE_MESSAGES = {
    autoComplete: {
        clear: "Leeren"
    },
    breadcrumb: {
        breadcrumb: "Breadcrumb-Navigation"
    },
    buttonGroup: {
        buttonGroup: "Schaltflächengruppe"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Kalender, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) => `${start} bis ${end}`,
        decadeViewLabel: (start: number, end: number) => `Jahrzehntansicht, ${start}–${end}`,
        goToToday: (formattedDate: string) => `Zum heutigen Datum wechseln, ${formattedDate}`,
        nextDecade: "Nächstes Jahrzehnt",
        nextMonth: "Nächster Monat",
        nextYear: "Nächstes Jahr",
        previousDecade: "Vorheriges Jahrzehnt",
        previousMonth: "Vorheriger Monat",
        previousYear: "Vorheriges Jahr",
        switchToDecadeView: (currentYear: string) => `Zur Jahrzehntansicht wechseln, aktuell ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Zur Jahresansicht wechseln, aktuell ${currentMonthAndYear}`,
        today: "Heute",
        yearCellLabel: (year: number) => `Jahr ${year}`,
        yearViewLabel: (year: string) => `Jahresansicht, ${year}`
    },
    card: {
        actionsLabel: "Kartenaktionen"
    },
    chart: {
        change: "Veränderung",
        chart: "Diagramm",
        chartLegend: "Diagrammlegende",
        close: "Schlusskurs",
        closeAbbreviation: "S",
        colorScale: "Farbskala",
        conversion: "Konvertierung",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}, von ${minimum} bis ${maximum}, Mittelpunkt bei ${midpoint}`,
        dropOff: "Abbruch",
        falling: "Fallend",
        high: "Hoch",
        highAbbreviation: "H",
        labelValueSeparator: ":",
        low: "Tief",
        lowAbbreviation: "T",
        noData: "Keine Daten verfügbar",
        open: "Eröffnung",
        openAbbreviation: "E",
        overall: "Gesamt",
        range: "Bereich",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, von ${minimum} bis ${maximum}`,
        rising: "Steigend",
        runningTotal: "Laufende Summe",
        size: "Größe",
        unchanged: "Unverändert",
        value: "Wert",
        visualIndicatorClamped: "Visueller Indikator begrenzt"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `${label} entfernen` : "Element entfernen")
    },
    colorGradient: {
        apply: "Anwenden",
        cancel: "Abbrechen",
        clearColor: "Farbe leeren",
        copyAsHex: "Als HEX kopieren",
        copyAsRgb: "Als RGB kopieren",
        copyColor: "Farbe kopieren",
        currentColor: "Aktuelle Farbe",
        previousColor: "Vorherige Farbe",
        saturationAndValue: "Sättigung und Helligkeit",
        saturationAndValueText: (saturation: number, value: number) =>
            `Sättigung ${saturation} %, Helligkeit ${value} %`,
        switchColorMode: "Farbmodus wechseln"
    },
    colorPalette: {
        color: (color: string) => `Farbe ${color}`,
        colorPalette: "Farbpalette"
    },
    colorPicker: {
        clearColor: "Farbe leeren",
        colorGradientPicker: "Farbverlaufsauswahl",
        colorPalettePicker: "Farbpalettenauswahl",
        colorPicker: "Farbauswahl"
    },
    comboBox: {
        clear: "Leeren"
    },
    datePicker: {
        datePicker: "Datumsauswahl",
        openCalendar: "Kalender öffnen"
    },
    dateTimePicker: {
        calendar: "Kalender",
        cancel: "Abbrechen",
        date: "Datum",
        dateTimePicker: "Datums- und Zeitauswahl",
        openDateTimePicker: "Datums- und Zeitauswahl öffnen",
        set: "Übernehmen",
        time: "Uhrzeit",
        timePicker: "Zeitauswahl"
    },
    dialog: {
        cancel: "Abbrechen",
        closeDialog: "Dialog schließen",
        ok: "OK"
    },
    dropdownList: {
        clear: "Leeren"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${position} von ${total}`,
        noResultsFound: "Keine Ergebnisse gefunden",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 Ergebnis verfügbar" : `${count} Ergebnisse verfügbar`
    },
    editor: {
        addColumnAfter: "Spalte danach einfügen",
        addColumnBefore: "Spalte davor einfügen",
        addHorizontalLine: "Horizontale Linie einfügen",
        addRowAfter: "Zeile danach einfügen",
        addRowBefore: "Zeile davor einfügen",
        alignCenter: "Text zentrieren",
        alignLeft: "Text linksbündig ausrichten",
        alignRight: "Text rechtsbündig ausrichten",
        altText: "Alternativtext",
        backgroundColor: "Hintergrundfarbe",
        bold: "Fett",
        cancel: "Abbrechen",
        codeBlock: "Codeblock",
        color: "Farbe",
        deleteColumn: "Spalte löschen",
        deleteRow: "Zeile löschen",
        deleteTable: "Tabelle löschen",
        enterUrl: "URL eingeben",
        fontSize: "Schriftgröße",
        format: "Format",
        heading: (level: number) => `Überschrift ${level}`,
        heightPx: "Höhe (px)",
        imageUrl: "Bild-URL",
        indent: "Einzug vergrößern",
        insert: "Einfügen",
        insertImage: "Bild einfügen",
        insertLink: "Link einfügen",
        insertOrderedList: "Nummerierte Liste einfügen",
        insertTable: "Tabelle einfügen",
        insertTaskList: "Aufgabenliste einfügen",
        insertUnorderedList: "Aufzählungsliste einfügen",
        italic: "Kursiv",
        justify: "Blocksatz",
        mergeCells: "Ausgewählte Zellen verbinden",
        outdent: "Einzug verkleinern",
        paragraph: "Absatz",
        quotation: "Zitat",
        redo: "Wiederholen",
        removeLink: "Link entfernen",
        selectFontFamily: "Schriftart auswählen",
        selectFontSize: "Schriftgröße auswählen",
        splitCell: "Zelle teilen",
        strikethrough: "Durchgestrichen",
        subscript: "Tiefgestellt",
        superscript: "Hochgestellt",
        toggleHeaderRow: "Kopfzeile umschalten",
        underline: "Unterstrichen",
        undo: "Rückgängig",
        widthPx: "Breite (px)"
    },
    filter: {
        and: "Und",
        apply: "Anwenden",
        clear: "Leeren",
        contains: "Enthält",
        doesNotContain: "Enthält nicht",
        endsWith: "Endet mit",
        isAfter: "Ist nach",
        isAfterOrEqualTo: "Ist am oder nach",
        isBefore: "Ist vor",
        isBeforeOrEqualTo: "Ist am oder vor",
        isEmpty: "Ist leer",
        isEqualTo: "Ist gleich",
        isFalse: "Ist falsch",
        isGreaterThan: "Ist größer als",
        isGreaterThanOrEqualTo: "Ist größer oder gleich",
        isLessThan: "Ist kleiner als",
        isLessThanOrEqualTo: "Ist kleiner oder gleich",
        isNotEmpty: "Ist nicht leer",
        isNotEqualTo: "Ist ungleich",
        isNotNull: "Ist nicht null",
        isNotNullOrEmpty: "Ist weder null noch leer",
        isNull: "Ist null",
        isNullOrEmpty: "Ist null oder leer",
        isTrue: "Ist wahr",
        or: "Oder",
        startsWith: "Beginnt mit"
    },
    grid: {
        all: "(Alle)",
        apply: "Anwenden",
        cancel: "Abbrechen",
        cancelRowEdit: "Zeilenbearbeitung abbrechen",
        columns: "Spalten",
        columnsSelected: (count: number) =>
            count === 1 ? "1 Spalte ausgewählt" : `${count} Spalten ausgewählt`,
        delete: "Löschen",
        deleteRowConfirmation: "Diese Zeile wirklich löschen?",
        deleteRowTitle: "Zeile löschen?",
        dragColumnHeaderToGroup: "Spaltenüberschrift hierher ziehen, um zu gruppieren",
        edit: "Bearbeiten",
        editRow: "Zeile bearbeiten",
        fieldValidationError: "Ungültiger Wert.",
        filterByColumn: (column: string) => `Nach ${column} filtern`,
        filterPlaceholder: "Filtern...",
        modified: "Geändert",
        moveAsNext: "Als Nächstes verschieben",
        moveAsPrevious: "Als Vorheriges verschieben",
        moveRow: "Zeile verschieben",
        noData: "Keine Daten",
        remove: "Entfernen",
        removeRow: "Zeile entfernen",
        reorderRow: (rowNumber: number) => `Zeile ${rowNumber} neu anordnen`,
        resizeColumn: "Spaltengröße ändern",
        rowReorder: "Zeilenanordnung",
        rowReorderDisabled: "Das Neuanordnen von Zeilen ist deaktiviert.",
        rowReorderDisabledEditing: "Bearbeitung abschließen, um Zeilen neu anzuordnen.",
        rowReorderDisabledFiltered: "Filter aufheben, um Zeilen neu anzuordnen.",
        rowReorderDisabledGrouped: "Gruppierung aufheben, um Zeilen neu anzuordnen.",
        rowReorderDisabledSingleRow: "Zum Neuanordnen sind mindestens zwei Zeilen erforderlich.",
        rowReorderDisabledSorted: "Sortierung aufheben, um Zeilen neu anzuordnen.",
        rowReorderDisabledVirtualScroll:
            "Bei aktiviertem virtuellem Scrollen können Zeilen nicht neu angeordnet werden.",
        rowReorderKeyboardHint: "Alt + Pfeil nach oben oder Alt + Pfeil nach unten zum Verschieben verwenden.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Zeile ${fromRowNumber} an Position ${toPosition} verschoben.`,
        rowValidationError: "Diese Zeile enthält Validierungsfehler.",
        save: "Speichern",
        saveRow: "Zeile speichern",
        selectAllRows: "Alle Zeilen auswählen",
        selectRow: (rowNumber: number) => `Zeile ${rowNumber} auswählen`
    },
    list: {
        noData: "Keine Daten"
    },
    listBox: {
        clearSelection: "Auswahl aufheben",
        moveDown: "Nach unten verschieben",
        moveUp: "Nach oben verschieben",
        remove: "Entfernen",
        transferAllFrom: "Alle aus der anderen Liste übertragen",
        transferAllTo: "Alle in die andere Liste übertragen",
        transferFrom: "Aus der anderen Liste übertragen",
        transferTo: "In die andere Liste übertragen"
    },
    multiSelect: {
        clear: "Leeren",
        itemsCount: (count: number) => `+ ${count} ${count === 1 ? "Element" : "Elemente"}`
    },
    notification: {
        close: "Schließen",
        error: "Fehler",
        info: "Information",
        success: "Erfolg",
        warning: "Warnung"
    },
    numericTextBox: {
        decrease: "Wert verringern",
        increase: "Wert erhöhen"
    },
    otpInput: {
        verificationCode: "Bestätigungscode"
    },
    pager: {
        firstPageLabel: "Erste Seite",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Um 1 Seite zurückspringen" : `Um ${pages} Seiten zurückspringen`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Um 1 Seite vorspringen" : `Um ${pages} Seiten vorspringen`,
        lastPageLabel: "Letzte Seite",
        nextPageLabel: "Nächste Seite",
        ofText: "von",
        pageLabel: (page: number) => `Seite ${page}`,
        pageSizeLabel: (pageSize: number) => `${pageSize} pro Seite`,
        pageStatus: (page: number, totalPages: number) => `Seite ${page} von ${totalPages}`,
        pageText: "Seite",
        previousPageLabel: "Vorherige Seite",
        rangeStatus: (start: number, end: number, total: number) =>
            `${start}–${end} von ${total} ${total === 1 ? "Element" : "Elementen"}`
    },
    rating: {
        notRated: "Nicht bewertet",
        valueText: (value: number, max: number) => `${value} von ${max}`
    },
    scrollView: {
        carousel: "Karussell",
        nextPage: "Nächste Seite",
        page: (current: number) => `Seite ${current}`,
        pageOf: (current: number, total: number) => `Seite ${current} von ${total}`,
        previousPage: "Vorherige Seite",
        scrollPagerNext: "Seitennavigation vorwärts scrollen",
        scrollPagerPrevious: "Seitennavigation rückwärts scrollen",
        slide: "Folie"
    },
    sheet: {
        closeSheet: "Bereich schließen"
    },
    slider: {
        maximumValue: "Maximalwert",
        minimumValue: "Minimalwert",
        sliderValue: "Wert des Schiebereglers"
    },
    spinner: {
        cancel: "Abbrechen",
        loading: "Wird geladen"
    },
    splitButton: {
        menuButtonAriaLabel: "Menüoptionen anzeigen",
        splitButton: (text: string) => (text ? `${text}, geteilte Schaltfläche` : "Geteilte Schaltfläche")
    },
    splitter: {
        collapseDown: "Unteren Bereich einklappen",
        collapseNext: "Nächsten Bereich einklappen",
        collapsePrevious: "Vorherigen Bereich einklappen",
        collapseUp: "Oberen Bereich einklappen",
        resizer: "Trennleiste"
    },
    stepper: {
        stepProgress: "Schrittfortschritt",
        stepper: "Schrittanzeige"
    },
    tabs: {
        closeTab: "Registerkarte schließen",
        scrollNext: "Registerkarten vorwärts scrollen",
        scrollPrevious: "Registerkarten rückwärts scrollen"
    },
    textBox: {
        clear: "Leeren"
    },
    timePicker: {
        openTimePicker: "Zeitauswahl öffnen",
        timePicker: "Zeitauswahl"
    },
    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "Std.",
        headerMinutes: "Min.",
        headerSeconds: "Sek.",
        hours: "Stunden",
        minutes: "Minuten",
        now: "Jetzt",
        pm: "PM",
        seconds: "Sekunden",
        set: "Übernehmen",
        timeSelector: "Zeitauswahl"
    },
    treeView: {
        collapse: "Einklappen",
        expand: "Erweitern",
        filter: "Filtern",
        filterTree: "Baum filtern"
    },
    window: {
        close: "Schließen",
        closeWindow: "Fenster schließen",
        maximize: "Maximieren",
        minimize: "Minimieren",
        moveWindow: "Fenster verschieben. Pfeiltasten zum Verschieben verwenden.",
        resizeBottom: "Fenster von unten in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeBottomLeft:
            "Fenster von der unteren linken Ecke in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeBottomRight:
            "Fenster von der unteren rechten Ecke in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeLeft: "Fenster von links in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeRight: "Fenster von rechts in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeTop: "Fenster von oben in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeTopLeft:
            "Fenster von der oberen linken Ecke in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        resizeTopRight:
            "Fenster von der oberen rechten Ecke in der Größe ändern. Pfeiltasten zum Ändern der Größe verwenden.",
        restore: "Wiederherstellen"
    }
} satisfies MonaLocaleMessages;

// Generated from de-de.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "de-DE", options);
}

const PLURAL_RULES = new Intl.PluralRules("de-DE");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const DE_DE_MESSAGES = {
    autoComplete: {
        clear: "Leeren"
    },
    breadcrumb: {
        breadcrumb: "Breadcrumb-Navigation",
        showFullPath: "Vollständigen Pfad anzeigen"
    },
    buttonGroup: {
        buttonGroup: "Schaltflächengruppe"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Kalender, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} bis ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Jahrzehntansicht, ${localizeNumber(start, { useGrouping: false })}–${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Zum heutigen Datum wechseln, ${formattedDate}`,
        nextDecade: "Nächstes Jahrzehnt",
        nextMonth: "Nächster Monat",
        nextYear: "Nächstes Jahr",
        previousDecade: "Vorheriges Jahrzehnt",
        previousMonth: "Vorheriger Monat",
        previousYear: "Vorheriges Jahr",
        switchToDecadeView: (currentYear: string) => `Zur Jahrzehntansicht wechseln, aktuell ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `Zur Jahresansicht wechseln, aktuell ${currentMonthAndYear}`,
        today: "Heute",
        yearCellLabel: (year: number) => `Jahr ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Jahresansicht, ${year}`
    },
    card: {
        actionsLabel: "Kartenaktionen"
    },
    chart: {
        announcementSeparator: ", ",
        brushApplied: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Auswahlbereich angewendet, ${localizeNumber(count)} Punkt`,
                other: () => `Auswahlbereich angewendet, ${localizeNumber(count)} Punkte`
            }),
        brushCleared: "Auswahlbereich entfernt",
        brushRange: (from: string, to: string) => `Auswahlbereich von ${from} bis ${to}`,
        category: "Kategorie",
        categoryFallbackName: (index: number) => `Kategorie ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `Von ${from} bis ${to}.`,
        change: "Veränderung",
        changeValue: (change: string) => `Veränderung ${change}`,
        chart: "Diagramm",
        chartLegend: "Diagrammlegende",
        chartRoleDescription: "Diagramm",
        close: "Schlusskurs",
        closeAbbreviation: "S",
        colorScale: "Farbskala",
        conversion: "Konvertierung",
        conversionOfPrevious: (rate: string) => `Konvertierung ${rate} der vorherigen Stufe`,
        dataTableTruncated: (shown: number, total: number) =>
            `Die ersten ${localizeNumber(shown)} von ${localizeNumber(total)} Zeilen.`,
        decrease: "Abnahme",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `Abnahme ${delta}, laufende Summe ${from} bis ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, von ${minimum} bis ${maximum}, Mittelpunkt bei ${midpoint}`,
        dropOff: "Abbruch",
        dropOffValue: (value: string) => `Abbruch ${value}`,
        falling: "Fallend",
        gaugeRange: (minimum: string, maximum: string) => `Bereich ${minimum} bis ${maximum}`,
        high: "Hoch",
        highAbbreviation: "H",
        increase: "Zunahme",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `Zunahme ${delta}, laufende Summe ${from} bis ${to}`,
        itemDeselected: (item: string) => `${item}, Auswahl aufgehoben`,
        itemFallbackName: (index: number) => `Element ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}, ausgewählt`,
        keyboardHelp:
            "Mit den Pfeiltasten zwischen Datenpunkten wechseln, mit Pos1 und Ende zum ersten und letzten springen, mit Eingabe oder Leertaste aktivieren und mit Escape zurücksetzen.",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}: ${value}`,
        low: "Tief",
        lowAbbreviation: "T",
        noChange: "Keine Veränderung",
        noChangeAnnouncement: (value: string) => `keine Veränderung, laufende Summe ${value}`,
        noData: "Keine Daten verfügbar",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `Eröffnung ${open}, Hoch ${high}, Tief ${low}, Schlusskurs ${close}`,
        open: "Eröffnung",
        openAbbreviation: "E",
        overall: "Gesamt",
        overallConversion: (rate: string) => `Gesamtkonvertierung ${rate}`,
        pannedDown: "Nach unten verschoben",
        pannedLeft: "Nach links verschoben",
        pannedRight: "Nach rechts verschoben",
        pannedUp: "Nach oben verschoben",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} von ${localizeNumber(total)}`,
        range: "Bereich",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, von ${minimum} bis ${maximum}`,
        rangeValue: (from: string, to: string) => `${from} bis ${to}`,
        rising: "Steigend",
        runningTotal: "Laufende Summe",
        seriesFallbackName: (index: number) => `Reihe ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series} ausgeblendet`,
        seriesShown: (series: string) => `${series} eingeblendet`,
        seriesSummary: (count: number, names: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Eine Reihe: ${names}.`,
                other: () => `${localizeNumber(count)} Reihen: ${names}.`
            }),
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}: niedrigster Wert ${minimum}, höchster Wert ${maximum}.`,
        shareOfTotal: (share: string) => `${share} der Gesamtsumme`,
        size: "Größe",
        sizeValue: (size: string) => `Größe ${size}`,
        stackShare: (share: string) => `Stapelanteil ${share}`,
        stageFallbackName: (index: number) => `Stufe ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `Stufe ${localizeNumber(position)} von ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `Schritt ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `Schritt ${localizeNumber(position)} von ${localizeNumber(total)}`,
        subtotal: "Zwischensumme",
        subtotalAnnouncement: (value: string) => `Zwischensumme ${value}`,
        total: "Summe",
        totalAnnouncement: (value: string) => `Summe ${value}`,
        treemapGroup: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Gruppe (${localizeNumber(count)} untergeordnetes Element)`,
                other: () => `Gruppe (${localizeNumber(count)} untergeordnete Elemente)`
            }),
        treemapLeaf: "Blatt",
        unchanged: "Unverändert",
        value: "Wert",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "Ansicht auf Standardbereich zurückgesetzt",
        viewportResetToFull: "Ansicht auf gesamten Bereich zurückgesetzt",
        visualIndicatorClamped: "Visueller Indikator begrenzt",
        zoomedIn: "Vergrößert",
        zoomedOut: "Verkleinert"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `${label} entfernen` : "Element entfernen")
    },
    colorGradient: {
        alpha: "Alphakanal",
        alphaText: (opacity: number) => `Deckkraft ${localizeNumber(opacity)} %`,
        apply: "Anwenden",
        blue: "Blau",
        cancel: "Abbrechen",
        clearColor: "Farbe leeren",
        colorCopied: "Farbe kopiert",
        colorGradient: "Farbverlauf",
        copyAsHex: "Als HEX kopieren",
        copyAsRgb: "Als RGB kopieren",
        copyColor: "Farbe kopieren",
        copyFailed: "Farbe konnte nicht kopiert werden",
        currentColor: "Aktuelle Farbe",
        green: "Grün",
        hexColor: "Hex-Farbe",
        hue: "Farbton",
        previousColor: "Vorherige Farbe",
        red: "Rot",
        saturation: "Sättigung",
        saturationAndValue: "Sättigung und Helligkeit",
        saturationAndValueText: (saturation: number, value: number) =>
            `Sättigung ${localizeNumber(saturation)} %, Helligkeit ${localizeNumber(value)} %`,
        switchColorMode: "Farbmodus wechseln",
        value: "Helligkeit"
    },
    colorPalette: {
        color: (color: string) => `Farbe ${color}`,
        colorPalette: "Farbpalette",
        namedColor: (name: string, color: string) => `${name}, ${color}`
    },
    colorPicker: {
        clearColor: "Farbe leeren",
        colorGradientPicker: "Farbverlaufsauswahl",
        colorPalettePicker: "Farbpalettenauswahl",
        colorPicker: "Farbauswahl",
        noColor: "Keine Farbe"
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
            `${text}, ${localizeNumber(position)} von ${localizeNumber(total)}`,
        noResultsFound: "Keine Ergebnisse gefunden",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 Ergebnis verfügbar" : `${localizeNumber(count)} Ergebnisse verfügbar`
    },
    editor: {
        addColumnAfter: "Spalte danach einfügen",
        addColumnBefore: "Spalte davor einfügen",
        addHorizontalLine: "Horizontale Linie einfügen",
        addRowAfter: "Zeile danach einfügen",
        addRowBefore: "Zeile davor einfügen",
        alignCenter: "Text zentrieren",
        alignEnd: "Text am Ende ausrichten",
        alignLeft: "Text linksbündig ausrichten",
        alignRight: "Text rechtsbündig ausrichten",
        alignStart: "Text am Anfang ausrichten",
        alignmentGroup: "Ausrichtung",
        altText: "Alternativtext",
        apply: "Übernehmen",
        backgroundColor: "Hintergrundfarbe",
        bold: "Fett",
        cancel: "Abbrechen",
        codeBlock: "Codeblock",
        color: "Farbe",
        contentLabel: "Rich-Text-Editor",
        defaultFontFamily: "Standardschrift",
        deleteColumn: "Spalte löschen",
        deleteRow: "Zeile löschen",
        deleteTable: "Tabelle löschen",
        editLink: "Link bearbeiten",
        enterUrl: "URL eingeben",
        fontSize: "Schriftgröße",
        format: "Format",
        heading: (level: number) => `Überschrift ${localizeNumber(level)}`,
        heightPx: "Höhe (px)",
        historyGroup: "Verlauf",
        imageUrl: "Bild-URL",
        indent: "Einzug vergrößern",
        indentGroup: "Einzug",
        insert: "Einfügen",
        insertImage: "Bild einfügen",
        insertLink: "Link einfügen",
        insertOrderedList: "Nummerierte Liste einfügen",
        insertTable: "Tabelle einfügen",
        insertTaskList: "Aufgabenliste einfügen",
        insertUnorderedList: "Aufzählungsliste einfügen",
        invalidUrl: "Geben Sie eine Webadresse, einen mailto:- oder tel:-Link oder einen relativen Pfad ein.",
        italic: "Kursiv",
        justify: "Blocksatz",
        linkGroup: "Verknüpfung",
        listGroup: "Listen",
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
        tableGroup: "Tabelle",
        tableSize: (rows: number, columns: number) =>
            `Zeilen: ${localizeNumber(rows)}, Spalten: ${localizeNumber(columns)}`,
        textStyleGroup: "Textstil",
        toggleHeaderRow: "Kopfzeile umschalten",
        toolbar: "Formatierung",
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
        logic: "Bedingungen verknüpfen",
        operator: "Operator",
        or: "Oder",
        secondOperator: "Zweiter Operator",
        secondValue: "Zweiter Wert",
        startsWith: "Beginnt mit",
        value: "Wert"
    },
    grid: {
        all: "(Alle)",
        apply: "Anwenden",
        cancel: "Abbrechen",
        cancelNewRow: "Neue Zeile verwerfen",
        cancelRowEdit: (rowNumber: number) => `Bearbeitung von Zeile ${localizeNumber(rowNumber)} abbrechen`,
        clearFilter: (column: string) => `Filter für ${column} leeren`,
        collapseDetail: (rowNumber: number) => `Details von Zeile ${localizeNumber(rowNumber)} ausblenden`,
        columnGrouped: (column: string) => `Nach ${column} gruppiert`,
        columnMoved: (column: string, position: number) =>
            `Spalte ${column} an Position ${localizeNumber(position)} verschoben`,
        columns: "Spalten",
        columnsSelected: (count: number) =>
            count === 1 ? "1 Spalte ausgewählt" : `${localizeNumber(count)} Spalten ausgewählt`,
        commandColumnTitle: "Befehle",
        delete: "Löschen",
        deleteRowConfirmation: (rowNumber: number) => `Zeile ${localizeNumber(rowNumber)} wirklich löschen?`,
        deleteRowTitle: "Zeile löschen?",
        details: "Detailansicht",
        dragColumnHeaderToGroup: "Spaltenüberschrift hierher ziehen, um zu gruppieren",
        edit: "Bearbeiten",
        editRow: (rowNumber: number) => `Zeile ${localizeNumber(rowNumber)} bearbeiten`,
        expandDetail: (rowNumber: number) => `Details von Zeile ${localizeNumber(rowNumber)} einblenden`,
        fieldValidationError: "Ungültiger Wert.",
        filterByColumn: (column: string) => `Nach ${column} filtern`,
        filterByColumnFiltered: (column: string) => `Nach ${column} filtern, gefiltert`,
        filterOperator: (column: string, operator: string) => `Filteroperator für ${column}: ${operator}`,
        filterPlaceholder: "Filtern...",
        group: "Gruppe",
        loading: "Wird geladen",
        modified: "Geändert",
        moveAsNext: "Als Nächstes verschieben",
        moveAsPrevious: "Als Vorheriges verschieben",
        moveRow: "Zeile verschieben",
        noData: "Keine Daten",
        remove: "Entfernen",
        removeRow: (rowNumber: number) => `Zeile ${localizeNumber(rowNumber)} entfernen`,
        reorderRow: (rowNumber: number) => `Zeile ${localizeNumber(rowNumber)} neu anordnen`,
        resizeColumn: (column: string) => `Breite von ${column} ändern`,
        rowReorder: "Zeilenanordnung",
        rowReorderDisabled: "Das Neuanordnen von Zeilen ist deaktiviert.",
        rowReorderDisabledEditing: "Bearbeitung abschließen, um Zeilen neu anzuordnen.",
        rowReorderDisabledFiltered: "Filter aufheben, um Zeilen neu anzuordnen.",
        rowReorderDisabledGrouped: "Gruppierung aufheben, um Zeilen neu anzuordnen.",
        rowReorderDisabledServerBinding: "Bei Serverbindung können Zeilen nicht neu angeordnet werden.",
        rowReorderDisabledSingleRow: "Zum Neuanordnen sind mindestens zwei Zeilen erforderlich.",
        rowReorderDisabledSorted: "Sortierung aufheben, um Zeilen neu anzuordnen.",
        rowReorderDisabledVirtualScroll:
            "Bei aktiviertem virtuellem Scrollen können Zeilen nicht neu angeordnet werden.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Alt + Pfeil nach oben oder Alt + Pfeil nach unten zum Verschieben verwenden.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Zeile ${localizeNumber(fromRowNumber)} an Position ${localizeNumber(toPosition)} verschoben.`,
        rowValidationError: "Diese Zeile enthält Validierungsfehler.",
        save: "Speichern",
        saveNewRow: "Neue Zeile speichern",
        saveRow: (rowNumber: number) => `Zeile ${localizeNumber(rowNumber)} speichern`,
        selectAllRows: "Alle Zeilen auswählen",
        selectRow: (rowNumber: number) => `Zeile ${localizeNumber(rowNumber)} auswählen`,
        sortOrder: (position: number) => `Sortierreihenfolge ${localizeNumber(position)}`,
        toolbar: "Tabellen-Symbolleiste"
    },
    label: {
        optional: "Optional"
    },
    list: {
        filterList: "Liste filtern",
        loading: "Wird geladen",
        noData: "Keine Daten",
        pagerLabel: (list: string) => `Seitennavigation für ${list}`
    },
    listBox: {
        clearSelection: "Auswahl aufheben",
        itemsMoved: (position: number, total: number) =>
            `An Position ${localizeNumber(position)} von ${localizeNumber(total)} verschoben`,
        itemsRemoved: (count: number) =>
            count === 1 ? `${localizeNumber(count)} Element entfernt` : `${localizeNumber(count)} Elemente entfernt`,
        itemsTransferred: (count: number, list: string) =>
            count === 1
                ? `${localizeNumber(count)} Element in ${list} übertragen`
                : `${localizeNumber(count)} Elemente in ${list} übertragen`,
        itemsTransferredToOtherList: (count: number) =>
            count === 1
                ? `${localizeNumber(count)} Element in die andere Liste übertragen`
                : `${localizeNumber(count)} Elemente in die andere Liste übertragen`,
        moveDown: "Nach unten verschieben",
        moveUp: "Nach oben verschieben",
        remove: "Entfernen",
        selectionCleared: "Auswahl aufgehoben",
        toolbarLabel: (list: string) => `Aktionen für ${list}`,
        transferAllFrom: "Alle aus der anderen Liste übertragen",
        transferAllFromList: (list: string) => `Alle aus ${list} übertragen`,
        transferAllTo: "Alle in die andere Liste übertragen",
        transferAllToList: (list: string) => `Alle in ${list} übertragen`,
        transferFrom: "Aus der anderen Liste übertragen",
        transferFromList: (list: string) => `Aus ${list} übertragen`,
        transferTo: "In die andere Liste übertragen",
        transferToList: (list: string) => `In ${list} übertragen`
    },
    multiSelect: {
        clear: "Leeren",
        itemsCount: (count: number) =>
            count === 1 ? `+ ${localizeNumber(count)} Element` : `+ ${localizeNumber(count)} Elemente`,
        removeMoreItems: (count: number) =>
            count === 1
                ? `${localizeNumber(count)} weiteres Element entfernen`
                : `${localizeNumber(count)} weitere Elemente entfernen`
    },
    notification: {
        close: "Schließen",
        error: "Fehler",
        info: "Information",
        region: "Benachrichtigungen",
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
        itemsPerPageLabel: "Einträge pro Seite",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Um 1 Seite zurückspringen" : `Um ${localizeNumber(pages)} Seiten zurückspringen`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Um 1 Seite vorspringen" : `Um ${localizeNumber(pages)} Seiten vorspringen`,
        lastPageLabel: "Letzte Seite",
        nextPageLabel: "Nächste Seite",
        ofText: "von",
        pageInputPrefix: (_totalPages: number) => "Seite",
        pageInputSuffix: (totalPages: number) => `von ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Seite ${localizeNumber(page)}`,
        pageSelectLabel: "Seite",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} pro Seite`,
        pageStatus: (page: number, totalPages: number) =>
            `Seite ${localizeNumber(page)} von ${localizeNumber(totalPages)}`,
        pageText: "Seite",
        pagerLabel: "Seitennavigation",
        previousPageLabel: "Vorherige Seite",
        rangeStatus: (start: number, end: number, total: number) =>
            total === 1
                ? `${localizeNumber(start)}–${localizeNumber(end)} von ${localizeNumber(total)} Element`
                : `${localizeNumber(start)}–${localizeNumber(end)} von ${localizeNumber(total)} Elementen`
    },
    progressBar: {
        label: "Fortschritt"
    },
    rating: {
        notRated: "Nicht bewertet",
        valueText: (value: number, max: number) => `${localizeNumber(value)} von ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "Karussell",
        nextPage: "Nächste Seite",
        page: (current: number) => `Seite ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Seite ${localizeNumber(current)} von ${localizeNumber(total)}`,
        pages: "Seiten",
        previousPage: "Vorherige Seite",
        scrollPagerNext: "Seitennavigation vorwärts scrollen",
        scrollPagerPrevious: "Seitennavigation rückwärts scrollen",
        slide: "Folie"
    },
    sheet: {
        closeSheet: "Bereich schließen"
    },
    sidebar: {
        drawerLabel: "Seitenleiste",
        rail: "Seitenleiste ein- oder ausblenden"
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
        menuButtonWithText: (text: string) => `Weitere Optionen für ${text}`,
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
        stepCompleted: "Abgeschlossen",
        stepInvalid: "Enthält Fehler",
        stepPosition: (current: number, total: number) =>
            `Schritt ${localizeNumber(current)} von ${localizeNumber(total)}`,
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
        filterLabel: (tree: string) => `${tree} filtern`,
        filterTree: "Baum filtern",
        loadError: (node: string) => `Die Elemente in ${node} konnten nicht geladen werden`,
        loadingNode: (node: string) => `${node} wird geladen`,
        movedAfter: (node: string, target: string) => `${node} nach ${target} verschoben`,
        movedBefore: (node: string, target: string) => `${node} vor ${target} verschoben`,
        movedInto: (node: string, target: string) => `${node} in ${target} verschoben`,
        noData: "Keine Daten",
        noMatches: "Keine passenden Elemente",
        results: (count: number) =>
            count === 1 ? `${localizeNumber(count)} Ergebnis` : `${localizeNumber(count)} Ergebnisse`,
        retryLoading: (node: string) => `${node} erneut laden`
    },
    window: {
        close: "Schließen",
        closeWindow: "Fenster schließen",
        maximize: "Maximieren",
        minimize: "Minimieren",
        moveOrResizeWindow:
            "Fenster verschieben oder Größe ändern. Pfeiltasten zum Verschieben, Strg und Pfeiltasten zum Ändern der Größe verwenden.",
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
        resizeWindow: "Fenstergröße ändern. Strg und Pfeiltasten zum Ändern der Größe verwenden.",
        restore: "Wiederherstellen"
    }
} satisfies MonaLocaleMessages;

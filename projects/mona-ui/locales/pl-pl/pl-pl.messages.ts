// Generated from pl-pl.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "pl-PL", options);
}

const PLURAL_RULES = new Intl.PluralRules("pl-PL");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const PL_PL_MESSAGES = {
    alert: {
        dismissLabel: (title?: string) => (title ? `Zamknij: ${title}` : "Zamknij alert")
    },
    autoComplete: {
        clear: "Wyczyść"
    },
    avatar: {
        moreLabel: (count: number) => `jeszcze ${localizeNumber(count)}`
    },
    breadcrumb: {
        breadcrumb: "Ścieżka nawigacyjna",
        showFullPath: "Pokaż pełną ścieżkę"
    },
    buttonGroup: {
        buttonGroup: "Grupa przycisków"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Kalendarz, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}–${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Widok dekady, ${localizeNumber(start, { useGrouping: false })}–${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Przejdź do dzisiejszej daty, ${formattedDate}`,
        nextDecade: "Następna dekada",
        nextMonth: "Następny miesiąc",
        nextYear: "Następny rok",
        previousDecade: "Poprzednia dekada",
        previousMonth: "Poprzedni miesiąc",
        previousYear: "Poprzedni rok",
        switchToDecadeView: (currentYear: string) => `Przełącz na widok dekady, bieżący rok: ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Przełącz na widok roku, bieżący miesiąc: ${currentMonthAndYear}`,
        today: "Dzisiaj",
        yearCellLabel: (year: number) => `Rok ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Widok roku, ${year}`
    },
    card: {
        actionsLabel: "Akcje karty"
    },
    chart: {
        announcementSeparator: ", ",
        brushApplied: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Zastosowano zaznaczenie, ${localizeNumber(count)} punkt`,
                few: () => `Zastosowano zaznaczenie, ${localizeNumber(count)} punkty`,
                many: () => `Zastosowano zaznaczenie, ${localizeNumber(count)} punktów`,
                other: () => `Zastosowano zaznaczenie, ${localizeNumber(count)} punktu`
            }),
        brushCleared: "Wyczyszczono zaznaczenie",
        brushRange: (from: string, to: string) => `Zaznaczenie od ${from} do ${to}`,
        category: "Kategoria",
        categoryFallbackName: (index: number) => `Kategoria ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `Od ${from} do ${to}.`,
        change: "Zmiana",
        changeValue: (change: string) => `zmiana ${change}`,
        chart: "Wykres",
        chartLegend: "Legenda wykresu",
        chartRoleDescription: "wykres",
        close: "Zamknięcie",
        closeAbbreviation: "Zamk.",
        colorScale: "Skala kolorów",
        conversion: "Konwersja",
        conversionOfPrevious: (rate: string) => `Konwersja ${rate} względem poprzedniego etapu`,
        dataTableTruncated: (shown: number, total: number) =>
            `Wyświetlono pierwsze wiersze: ${localizeNumber(shown)} z ${localizeNumber(total)}.`,
        decrease: "Spadek",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `spadek o ${delta}, suma narastająca od ${from} do ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, od ${minimum} przez ${midpoint} do ${maximum}`,
        dropOff: "Odpływ",
        dropOffValue: (value: string) => `Odpływ ${value}`,
        falling: "Spada",
        gaugeRange: (minimum: string, maximum: string) => `zakres od ${minimum} do ${maximum}`,
        high: "Maksimum",
        highAbbreviation: "Maks.",
        increase: "Wzrost",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `wzrost o ${delta}, suma narastająca od ${from} do ${to}`,
        itemDeselected: (item: string) => `${item}, odznaczono`,
        itemFallbackName: (index: number) => `Element ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}, zaznaczono`,
        keyboardHelp:
            "Użyj klawiszy strzałek, aby przechodzić między punktami danych, klawiszy Home i End, aby przejść do pierwszego i ostatniego, klawisza Enter lub spacji, aby aktywować, oraz klawisza Escape, aby wyczyścić.",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}: ${value}`,
        low: "Minimum",
        lowAbbreviation: "Min.",
        noChange: "Bez zmian",
        noChangeAnnouncement: (value: string) => `bez zmian, suma narastająca ${value}`,
        noData: "Brak danych",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `Otwarcie ${open}, maksimum ${high}, minimum ${low}, zamknięcie ${close}`,
        open: "Otwarcie",
        openAbbreviation: "Otw.",
        overall: "Łącznie",
        overallConversion: (rate: string) => `Łączna konwersja ${rate}`,
        pannedDown: "Przesunięto w dół",
        pannedLeft: "Przesunięto w lewo",
        pannedRight: "Przesunięto w prawo",
        pannedUp: "Przesunięto w górę",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} z ${localizeNumber(total)}`,
        range: "Zakres",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, od ${minimum} do ${maximum}`,
        rangeValue: (from: string, to: string) => `od ${from} do ${to}`,
        rising: "Rośnie",
        runningTotal: "Suma narastająca",
        seriesFallbackName: (index: number) => `Seria ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series}: ukryto`,
        seriesShown: (series: string) => `${series}: pokazano`,
        seriesSummary: (count: number, names: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Jedna seria: ${names}.`,
                few: () => `${localizeNumber(count)} serie: ${names}.`,
                many: () => `${localizeNumber(count)} serii: ${names}.`,
                other: () => `${localizeNumber(count)} serii: ${names}.`
            }),
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}: minimum ${minimum}, maksimum ${maximum}.`,
        shareOfTotal: (share: string) => `${share} całości`,
        size: "rozmiar",
        sizeValue: (size: string) => `rozmiar ${size}`,
        stackShare: (share: string) => `udział w stosie ${share}`,
        stageFallbackName: (index: number) => `Etap ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `etap ${localizeNumber(position)} z ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `Krok ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `krok ${localizeNumber(position)} z ${localizeNumber(total)}`,
        subtotal: "Suma częściowa",
        subtotalAnnouncement: (value: string) => `suma częściowa ${value}`,
        total: "Suma",
        totalAnnouncement: (value: string) => `suma ${value}`,
        treemapGroup: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Grupa (${localizeNumber(count)} element podrzędny)`,
                few: () => `Grupa (${localizeNumber(count)} elementy podrzędne)`,
                many: () => `Grupa (${localizeNumber(count)} elementów podrzędnych)`,
                other: () => `Grupa (${localizeNumber(count)} elementu podrzędnego)`
            }),
        treemapLeaf: "Liść",
        unchanged: "Bez zmian",
        value: "Wartość",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "Przywrócono domyślny zakres widoku",
        viewportResetToFull: "Przywrócono pełny zakres widoku",
        visualIndicatorClamped: "Wskaźnik wizualny ograniczono do zakresu",
        zoomedIn: "Powiększono",
        zoomedOut: "Pomniejszono"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Usuń ${label}` : "Usuń element")
    },
    colorGradient: {
        alpha: "Kanał alfa",
        alphaText: (opacity: number) => `Nieprzezroczystość ${localizeNumber(opacity)}%`,
        apply: "Zastosuj",
        blue: "Niebieski",
        cancel: "Anuluj",
        clearColor: "Wyczyść kolor",
        colorCopied: "Skopiowano kolor",
        colorGradient: "Gradient kolorów",
        copyAsHex: "Kopiuj jako HEX",
        copyAsRgb: "Kopiuj jako RGB",
        copyColor: "Kopiuj kolor",
        copyFailed: "Nie udało się skopiować koloru",
        currentColor: "Bieżący kolor",
        green: "Zielony",
        hexColor: "Kolor szesnastkowy",
        hue: "Odcień",
        previousColor: "Poprzedni kolor",
        red: "Czerwony",
        saturation: "Nasycenie",
        saturationAndValue: "Nasycenie i jasność koloru",
        saturationAndValueText: (saturation: number, value: number) =>
            `Nasycenie ${localizeNumber(saturation)}%, jasność ${localizeNumber(value)}%`,
        switchColorMode: "Przełącz tryb koloru",
        value: "Jasność"
    },
    colorPalette: {
        color: (color: string) => `Kolor ${color}`,
        colorPalette: "Paleta kolorów",
        namedColor: (name: string, color: string) => `${name}, ${color}`
    },
    colorPicker: {
        clearColor: "Wyczyść kolor",
        colorGradientPicker: "Selektor gradientu kolorów",
        colorPalettePicker: "Selektor palety kolorów",
        colorPicker: "Selektor kolorów",
        noColor: "Brak koloru"
    },
    comboBox: {
        clear: "Wyczyść"
    },
    command: {
        dialogLabel: "Menu poleceń",
        inputLabel: "Wyszukaj polecenia",
        listLabel: "Wyniki",
        loading: "Ładowanie",
        noResults: "Nie znaleziono wyników",
        placeholder: "Wpisz polecenie lub wyszukaj…",
        resultsAvailable: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Dostępny ${localizeNumber(count)} wynik`,
                few: () => `Dostępne ${localizeNumber(count)} wyniki`,
                many: () => `Dostępnych ${localizeNumber(count)} wyników`,
                other: () => `Dostępne ${localizeNumber(count)} wyniku`
            })
    },
    datePicker: {
        datePicker: "Selektor daty",
        openCalendar: "Otwórz kalendarz"
    },
    dateRangePicker: {
        dateRangePicker: "Selektor zakresu dat",
        end: "Data końcowa",
        lastDays: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => "Ostatni dzień",
                few: () => `Ostatnie ${localizeNumber(count)} dni`,
                many: () => `Ostatnie ${localizeNumber(count)} dni`,
                other: () => `Ostatnie ${localizeNumber(count)} dnia`
            }),
        lastMonth: "Poprzedni miesiąc",
        lastWeek: "Poprzedni tydzień",
        lastYear: "Poprzedni rok",
        openCalendar: "Otwórz kalendarz",
        presets: "Szybkie zakresy",
        start: "Data początkowa",
        thisMonth: "Ten miesiąc",
        thisWeek: "Ten tydzień",
        thisYear: "Ten rok",
        today: "Dzisiaj",
        yesterday: "Wczoraj"
    },
    dateTimePicker: {
        calendar: "Kalendarz",
        cancel: "Anuluj",
        date: "Data",
        dateTimePicker: "Selektor daty i godziny",
        openDateTimePicker: "Otwórz selektor daty i godziny",
        set: "Ustaw",
        time: "Godzina",
        timePicker: "Selektor godziny"
    },
    dialog: {
        cancel: "Anuluj",
        closeDialog: "Zamknij okno dialogowe",
        ok: "OK"
    },
    dropdownList: {
        clear: "Wyczyść"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${localizeNumber(position)} z ${localizeNumber(total)}`,
        noResultsFound: "Nie znaleziono wyników",
        resultsAvailable: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Dostępny ${localizeNumber(count)} wynik`,
                few: () => `Dostępne ${localizeNumber(count)} wyniki`,
                many: () => `Dostępnych ${localizeNumber(count)} wyników`,
                other: () => `Dostępne ${localizeNumber(count)} wyniku`
            })
    },
    editor: {
        addColumnAfter: "Dodaj kolumnę za",
        addColumnBefore: "Dodaj kolumnę przed",
        addHorizontalLine: "Dodaj linię poziomą",
        addRowAfter: "Dodaj wiersz poniżej",
        addRowBefore: "Dodaj wiersz powyżej",
        alignCenter: "Wyśrodkuj tekst",
        alignEnd: "Wyrównaj tekst do końca",
        alignLeft: "Wyrównaj tekst do lewej",
        alignRight: "Wyrównaj tekst do prawej",
        alignStart: "Wyrównaj tekst do początku",
        alignmentGroup: "Wyrównanie",
        altText: "Tekst alternatywny",
        apply: "Zastosuj",
        backgroundColor: "Kolor tła",
        bold: "Pogrubienie",
        cancel: "Anuluj",
        codeBlock: "Blok kodu",
        color: "Kolor",
        contentLabel: "Edytor tekstu sformatowanego",
        defaultFontFamily: "Domyślna czcionka",
        deleteColumn: "Usuń kolumnę",
        deleteRow: "Usuń wiersz",
        deleteTable: "Usuń tabelę",
        editLink: "Edytuj link",
        enterUrl: "Wprowadź adres URL",
        fontSize: "Rozmiar czcionki",
        format: "Format",
        heading: (level: number) => `Nagłówek ${localizeNumber(level)}`,
        heightPx: "Wysokość (px)",
        historyGroup: "Historia",
        imageUrl: "Adres URL obrazu",
        indent: "Zwiększ wcięcie",
        indentGroup: "Wcięcia",
        insert: "Wstaw",
        insertImage: "Wstaw obraz",
        insertLink: "Wstaw link",
        insertOrderedList: "Wstaw listę numerowaną",
        insertTable: "Wstaw tabelę",
        insertTaskList: "Wstaw listę zadań",
        insertUnorderedList: "Wstaw listę punktowaną",
        invalidUrl: "Wprowadź adres internetowy, link mailto: lub tel: albo ścieżkę względną.",
        italic: "Kursywa",
        justify: "Wyjustuj",
        linkGroup: "Linki",
        listGroup: "Listy",
        mergeCells: "Scal zaznaczone komórki",
        outdent: "Zmniejsz wcięcie",
        paragraph: "Akapit",
        quotation: "Cytat",
        redo: "Ponów",
        removeLink: "Usuń link",
        selectFontFamily: "Wybierz czcionkę",
        selectFontSize: "Wybierz rozmiar czcionki",
        splitCell: "Podziel komórkę",
        strikethrough: "Przekreślenie",
        subscript: "Indeks dolny",
        superscript: "Indeks górny",
        tableGroup: "Tabela",
        tableSize: (rows: number, columns: number) =>
            `Wiersze: ${localizeNumber(rows)}, kolumny: ${localizeNumber(columns)}`,
        textStyleGroup: "Styl tekstu",
        toggleHeaderRow: "Przełącz wiersz nagłówka",
        toolbar: "Formatowanie",
        underline: "Podkreślenie",
        undo: "Cofnij",
        widthPx: "Szerokość (px)"
    },
    fileUpload: {
        browse: "Przeglądaj pliki",
        browseFile: "Wybierz plik",
        cancel: (name: string) => `Anuluj przesyłanie pliku ${name}`,
        clear: "Wyczyść",
        dropFile: "Przeciągnij plik tutaj",
        dropFiles: "Przeciągnij pliki tutaj",
        dropToAdd: "Upuść, aby dodać",
        fileFailed: (name: string) => `Nie udało się przesłać pliku ${name}.`,
        fileRejected: (name: string, reason: string) => `Nie dodano pliku ${name}. ${reason}`,
        fileRemoved: (name: string) => `Usunięto plik ${name}.`,
        fileTypes: (types: string) => `Typy plików: ${types}`,
        fileUploaded: (name: string) => `Przesłano plik ${name}.`,
        files: "Pliki",
        filesAdded: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Dodano ${localizeNumber(count)} plik.`,
                few: () => `Dodano ${localizeNumber(count)} pliki.`,
                many: () => `Dodano ${localizeNumber(count)} plików.`,
                other: () => `Dodano ${localizeNumber(count)} pliku.`
            }),
        invalidType: "Ten typ pliku nie jest akceptowany.",
        maxFileSize: (size: string) => `Maks. rozmiar pliku: ${size}`,
        maxFiles: (count: number) =>
            `Maksymalnie ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} plik`, few: () => `${localizeNumber(count)} pliki`, many: () => `${localizeNumber(count)} plików`, other: () => `${localizeNumber(count)} pliku` })}`,
        readyToUpload: "Gotowy do przesłania",
        remove: (name: string) => `Usuń plik ${name}`,
        retry: (name: string) => `Ponów przesyłanie pliku ${name}`,
        tooLarge: (size: string) => `Plik jest większy niż ${size}.`,
        tooMany: (count: number) =>
            `Można dodać najwyżej ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} plik`, few: () => `${localizeNumber(count)} pliki`, many: () => `${localizeNumber(count)} plików`, other: () => `${localizeNumber(count)} pliku` })}.`,
        tooSmall: (size: string) => `Plik jest mniejszy niż ${size}.`,
        upload: "Prześlij",
        uploadFailed: "Przesyłanie nie powiodło się.",
        uploaded: "Przesłano",
        uploading: "Przesyłanie"
    },
    filter: {
        and: "I",
        apply: "Zastosuj",
        clear: "Wyczyść",
        contains: "Zawiera",
        doesNotContain: "Nie zawiera",
        endsWith: "Kończy się na",
        isAfter: "Po",
        isAfterOrEqualTo: "Nie wcześniej niż",
        isBefore: "Przed",
        isBeforeOrEqualTo: "Nie później niż",
        isEmpty: "Jest puste",
        isEqualTo: "Jest równe",
        isFalse: "Fałsz",
        isGreaterThan: "Jest większe niż",
        isGreaterThanOrEqualTo: "Jest większe lub równe",
        isLessThan: "Jest mniejsze niż",
        isLessThanOrEqualTo: "Jest mniejsze lub równe",
        isNotEmpty: "Nie jest puste",
        isNotEqualTo: "Nie jest równe",
        isNotNull: "Ma wartość",
        isNotNullOrEmpty: "Ma wartość i nie jest puste",
        isNull: "Brak wartości",
        isNullOrEmpty: "Brak wartości lub puste",
        isTrue: "Prawda",
        logic: "Łączenie warunków",
        operator: "Operator",
        or: "LUB",
        secondOperator: "Drugi operator",
        secondValue: "Druga wartość",
        startsWith: "Zaczyna się od",
        value: "Wartość"
    },
    formField: {
        email: "Wpisz prawidłowy adres e-mail.",
        invalid: "Wpisz prawidłową wartość.",
        max: (max: number) => `Wartość nie może być większa niż ${localizeNumber(max)}.`,
        maxDate: (maxDate: string) => `Data nie może być późniejsza niż ${maxDate}.`,
        maxLength: (maxLength: number) =>
            `Wpisz najwyżej ${plural(PLURAL_RULES.select(maxLength), { one: () => `${localizeNumber(maxLength)} znak`, few: () => `${localizeNumber(maxLength)} znaki`, many: () => `${localizeNumber(maxLength)} znaków`, other: () => `${localizeNumber(maxLength)} znaku` })}.`,
        min: (min: number) => `Wartość nie może być mniejsza niż ${localizeNumber(min)}.`,
        minDate: (minDate: string) => `Data nie może być wcześniejsza niż ${minDate}.`,
        minLength: (minLength: number) =>
            `Wpisz co najmniej ${plural(PLURAL_RULES.select(minLength), { one: () => `${localizeNumber(minLength)} znak`, few: () => `${localizeNumber(minLength)} znaki`, many: () => `${localizeNumber(minLength)} znaków`, other: () => `${localizeNumber(minLength)} znaku` })}.`,
        optional: "Opcjonalnie",
        pattern: "Wpisz wartość w oczekiwanym formacie.",
        required: "To pole jest wymagane."
    },
    grid: {
        all: "(Wszystkie)",
        apply: "Zastosuj",
        cancel: "Anuluj",
        cancelNewRow: "Anuluj nowy wiersz",
        cancelRowEdit: (rowNumber: number) => `Anuluj edycję wiersza ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Wyczyść filtr kolumny ${column}`,
        collapseDetail: (rowNumber: number) => `Zwiń szczegóły wiersza ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Pogrupowano według kolumny ${column}`,
        columnMoved: (column: string, position: number) =>
            `Kolumnę ${column} przeniesiono na pozycję ${localizeNumber(position)}`,
        columns: "Kolumny",
        columnsSelected: (count: number) => `Wybrane kolumny: ${localizeNumber(count)}`,
        commandColumnTitle: "Polecenia",
        delete: "Usuń",
        deleteRowConfirmation: (rowNumber: number) => `Czy na pewno chcesz usunąć wiersz ${localizeNumber(rowNumber)}?`,
        deleteRowTitle: "Usunąć wiersz?",
        details: "Szczegóły",
        dragColumnHeaderToGroup: "Przeciągnij tutaj nagłówek kolumny, aby grupować",
        edit: "Edytuj",
        editRow: (rowNumber: number) => `Edytuj wiersz ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Rozwiń szczegóły wiersza ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Nieprawidłowa wartość.",
        filterByColumn: (column: string) => `Filtruj według kolumny ${column}`,
        filterByColumnFiltered: (column: string) => `Filtruj według kolumny ${column}, przefiltrowano`,
        filterOperator: (column: string, operator: string) => `Operator filtru kolumny ${column}: ${operator}`,
        filterPlaceholder: "Filtruj…",
        group: "Grupa",
        groupOptions: (column: string) => `Opcje grupowania kolumny ${column}`,
        loading: "Ładowanie",
        modified: "Zmodyfikowano",
        moveAsNext: "Przenieś jako następny",
        moveAsPrevious: "Przenieś jako poprzedni",
        moveRow: "Przenieś wiersz",
        noData: "Brak danych",
        remove: "Usuń",
        removeRow: (rowNumber: number) => `Usuń wiersz ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `Zmień kolejność wiersza ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Zmień szerokość kolumny ${column}`,
        rowReorder: "Zmiana kolejności wierszy",
        rowReorderDisabled: "Zmiana kolejności wierszy jest wyłączona.",
        rowReorderDisabledEditing: "Zakończ edycję, aby zmienić kolejność wierszy.",
        rowReorderDisabledFiltered: "Wyczyść filtry, aby zmienić kolejność wierszy.",
        rowReorderDisabledGrouped: "Usuń grupowanie, aby zmienić kolejność wierszy.",
        rowReorderDisabledServerBinding: "Zmiana kolejności wierszy nie jest dostępna przy powiązaniu z serwerem.",
        rowReorderDisabledSingleRow: "Do zmiany kolejności potrzebne są co najmniej dwa wiersze.",
        rowReorderDisabledSorted: "Wyczyść sortowanie, aby zmienić kolejność wierszy.",
        rowReorderDisabledVirtualScroll:
            "Zmiana kolejności wierszy nie jest dostępna przy włączonym przewijaniu wirtualnym.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Użyj Alt + Strzałka w górę lub Alt + Strzałka w dół, aby przenieść.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Przeniesiono wiersz ${localizeNumber(fromRowNumber)} na pozycję ${localizeNumber(toPosition)}.`,
        rowValidationError: "Ten wiersz zawiera błędy walidacji.",
        save: "Zapisz",
        saveNewRow: "Zapisz nowy wiersz",
        saveRow: (rowNumber: number) => `Zapisz wiersz ${localizeNumber(rowNumber)}`,
        selectAllRows: "Zaznacz wszystkie wiersze",
        selectRow: (rowNumber: number) => `Zaznacz wiersz ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Kolejność sortowania ${localizeNumber(position)}`,
        toolbar: "Pasek narzędzi tabeli"
    },
    label: {
        optional: "Opcjonalnie"
    },
    list: {
        filterList: "Filtruj listę",
        loading: "Ładowanie",
        noData: "Brak danych",
        pagerLabel: (list: string) => `Stronicowanie: ${list}`
    },
    listBox: {
        clearSelection: "Wyczyść zaznaczenie",
        itemsMoved: (position: number, total: number) =>
            `Przeniesiono na pozycję ${localizeNumber(position)} z ${localizeNumber(total)}`,
        itemsRemoved: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Usunięto ${localizeNumber(count)} element`,
                few: () => `Usunięto ${localizeNumber(count)} elementy`,
                many: () => `Usunięto ${localizeNumber(count)} elementów`,
                other: () => `Usunięto ${localizeNumber(count)} elementu`
            }),
        itemsTransferred: (count: number, list: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Przeniesiono ${localizeNumber(count)} element do listy „${list}”`,
                few: () => `Przeniesiono ${localizeNumber(count)} elementy do listy „${list}”`,
                many: () => `Przeniesiono ${localizeNumber(count)} elementów do listy „${list}”`,
                other: () => `Przeniesiono ${localizeNumber(count)} elementu do listy „${list}”`
            }),
        itemsTransferredToOtherList: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Przeniesiono ${localizeNumber(count)} element do drugiej listy`,
                few: () => `Przeniesiono ${localizeNumber(count)} elementy do drugiej listy`,
                many: () => `Przeniesiono ${localizeNumber(count)} elementów do drugiej listy`,
                other: () => `Przeniesiono ${localizeNumber(count)} elementu do drugiej listy`
            }),
        moveDown: "Przenieś w dół",
        moveUp: "Przenieś w górę",
        remove: "Usuń",
        selectionCleared: "Wyczyszczono zaznaczenie",
        toolbarLabel: (list: string) => `Akcje: ${list}`,
        transferAllFrom: "Przenieś wszystkie z drugiej listy",
        transferAllFromList: (list: string) => `Przenieś wszystkie z listy „${list}”`,
        transferAllTo: "Przenieś wszystkie do drugiej listy",
        transferAllToList: (list: string) => `Przenieś wszystkie do listy „${list}”`,
        transferFrom: "Przenieś z drugiej listy",
        transferFromList: (list: string) => `Przenieś z listy „${list}”`,
        transferTo: "Przenieś do drugiej listy",
        transferToList: (list: string) => `Przenieś do listy „${list}”`
    },
    multiSelect: {
        clear: "Wyczyść",
        itemsCount: (count: number) =>
            `+ ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} element`, few: () => `${localizeNumber(count)} elementy`, many: () => `${localizeNumber(count)} elementów`, other: () => `${localizeNumber(count)} elementu` })}`,
        removeMoreItems: (count: number) =>
            `Usuń jeszcze ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} element`, few: () => `${localizeNumber(count)} elementy`, many: () => `${localizeNumber(count)} elementów`, other: () => `${localizeNumber(count)} elementu` })}`
    },
    notification: {
        close: "Zamknij",
        error: "Błąd",
        info: "Informacja",
        region: "Powiadomienia",
        success: "Sukces",
        warning: "Ostrzeżenie"
    },
    numericTextBox: {
        decrease: "Zmniejsz wartość",
        increase: "Zwiększ wartość"
    },
    otpInput: {
        verificationCode: "Kod weryfikacyjny"
    },
    pager: {
        firstPageLabel: "Pierwsza strona",
        itemsPerPageLabel: "Elementów na stronie",
        jumpBackwardLabel: (pages: number) =>
            `Przeskocz wstecz o ${plural(PLURAL_RULES.select(pages), { one: () => `${localizeNumber(pages)} stronę`, few: () => `${localizeNumber(pages)} strony`, many: () => `${localizeNumber(pages)} stron`, other: () => `${localizeNumber(pages)} strony` })}`,
        jumpForwardLabel: (pages: number) =>
            `Przeskocz do przodu o ${plural(PLURAL_RULES.select(pages), { one: () => `${localizeNumber(pages)} stronę`, few: () => `${localizeNumber(pages)} strony`, many: () => `${localizeNumber(pages)} stron`, other: () => `${localizeNumber(pages)} strony` })}`,
        lastPageLabel: "Ostatnia strona",
        nextPageLabel: "Następna strona",
        ofText: "z",
        pageInputPrefix: (_totalPages: number) => "Strona",
        pageInputSuffix: (totalPages: number) => `z ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Strona ${localizeNumber(page)}`,
        pageSelectLabel: "Strona",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} na stronę`,
        pageStatus: (page: number, totalPages: number) =>
            `Strona ${localizeNumber(page)} z ${localizeNumber(totalPages)}`,
        pageText: "Strona",
        pagerLabel: "Stronicowanie",
        previousPageLabel: "Poprzednia strona",
        rangeStatus: (start: number, end: number, total: number) =>
            `${localizeNumber(start)}–${localizeNumber(end)} z ${plural(PLURAL_RULES.select(total), { one: () => `${localizeNumber(total)} elementu`, few: () => `${localizeNumber(total)} elementów`, many: () => `${localizeNumber(total)} elementów`, other: () => `${localizeNumber(total)} elementu` })}`
    },
    progressBar: {
        label: "Postęp"
    },
    qrCode: {
        label: "Kod QR"
    },
    rating: {
        notRated: "Brak oceny",
        valueText: (value: number, max: number) => `${localizeNumber(value)} z ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "karuzela",
        nextPage: "Następna strona",
        page: (current: number) => `Strona ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Strona ${localizeNumber(current)} z ${localizeNumber(total)}`,
        pages: "Strony",
        previousPage: "Poprzednia strona",
        scrollPagerNext: "Przewiń listę stron do przodu",
        scrollPagerPrevious: "Przewiń listę stron do tyłu",
        slide: "slajd"
    },
    sheet: {
        closeSheet: "Zamknij panel"
    },
    sidebar: {
        drawerLabel: "Panel boczny",
        rail: "Pokaż lub ukryj panel boczny"
    },
    slider: {
        maximumValue: "Wartość maksymalna",
        minimumValue: "Wartość minimalna",
        sliderValue: "Wartość suwaka"
    },
    spinner: {
        cancel: "Anuluj",
        loading: "Ładowanie"
    },
    splitButton: {
        menuButtonAriaLabel: "Pokaż opcje menu",
        menuButtonWithText: (text: string) => `Więcej opcji: ${text}`,
        splitButton: (text: string) => (text ? `${text}, przycisk dzielony` : "Przycisk dzielony")
    },
    splitter: {
        collapseDown: "Zwiń panel poniżej",
        collapseNext: "Zwiń następny panel",
        collapsePrevious: "Zwiń poprzedni panel",
        collapseUp: "Zwiń panel powyżej",
        resizer: "Rozdzielacz paneli"
    },
    stepper: {
        stepCompleted: "Ukończono",
        stepInvalid: "Zawiera błędy",
        stepPosition: (current: number, total: number) => `Krok ${localizeNumber(current)} z ${localizeNumber(total)}`,
        stepProgress: "Postęp kroków",
        stepper: "Postęp"
    },
    tabs: {
        closeTab: "Zamknij kartę",
        scrollNext: "Przewiń karty do przodu",
        scrollPrevious: "Przewiń karty do tyłu"
    },
    textBox: {
        clear: "Wyczyść"
    },
    timePicker: {
        openTimePicker: "Otwórz selektor godziny",
        timePicker: "Selektor godziny"
    },
    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "godz.",
        headerMinutes: "min",
        headerSeconds: "s",
        hours: "Godziny",
        minutes: "Minuty",
        now: "Teraz",
        pm: "PM",
        seconds: "Sekundy",
        set: "Ustaw",
        timeSelector: "Selektor godziny"
    },
    toolbar: {
        moreLabel: "Więcej"
    },
    treeView: {
        collapse: "Zwiń",
        expand: "Rozwiń",
        filter: "Filtruj",
        filterLabel: (tree: string) => `Filtruj: ${tree}`,
        filterTree: "Filtruj drzewo",
        loadError: (node: string) => `Nie udało się załadować elementów węzła „${node}”`,
        loadingNode: (node: string) => `Ładowanie węzła „${node}”`,
        movedAfter: (node: string, target: string) => `Przeniesiono „${node}” za „${target}”`,
        movedBefore: (node: string, target: string) => `Przeniesiono „${node}” przed „${target}”`,
        movedInto: (node: string, target: string) => `Przeniesiono „${node}” do „${target}”`,
        noData: "Brak danych",
        noMatches: "Brak pasujących elementów",
        results: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `${localizeNumber(count)} wynik`,
                few: () => `${localizeNumber(count)} wyniki`,
                many: () => `${localizeNumber(count)} wyników`,
                other: () => `${localizeNumber(count)} wyniku`
            }),
        retryLoading: (node: string) => `Ponów ładowanie węzła „${node}”`
    },
    window: {
        close: "Zamknij",
        closeWindow: "Zamknij okno",
        maximize: "Maksymalizuj",
        minimize: "Minimalizuj",
        moveOrResizeWindow:
            "Przenieś okno lub zmień jego rozmiar. Użyj klawiszy strzałek, aby przenieść, lub klawisza Ctrl i klawiszy strzałek, aby zmienić rozmiar.",
        moveWindow: "Przenieś okno. Użyj klawiszy strzałek, aby przenieść.",
        resizeBottom: "Zmień rozmiar okna od dołu. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeBottomLeft: "Zmień rozmiar okna od lewego dolnego rogu. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeBottomRight: "Zmień rozmiar okna od prawego dolnego rogu. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeLeft: "Zmień rozmiar okna od lewej. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeRight: "Zmień rozmiar okna od prawej. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeTop: "Zmień rozmiar okna od góry. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeTopLeft: "Zmień rozmiar okna od lewego górnego rogu. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeTopRight: "Zmień rozmiar okna od prawego górnego rogu. Użyj klawiszy strzałek, aby zmienić rozmiar.",
        resizeWindow: "Zmień rozmiar okna. Użyj klawisza Ctrl i klawiszy strzałek, aby zmienić rozmiar.",
        restore: "Przywróć"
    }
} satisfies MonaLocaleMessages;

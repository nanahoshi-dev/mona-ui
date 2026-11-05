// Generated from tr-tr.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "tr-TR", options);
}

export const TR_TR_MESSAGES = {
    autoComplete: {
        clear: "Temizle"
    },
    breadcrumb: {
        breadcrumb: "İçerik haritası"
    },
    buttonGroup: {
        buttonGroup: "Düğme grubu"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Takvim, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `On yıllık görünüm, ${localizeNumber(start, { useGrouping: false })} - ${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Bugüne git, ${formattedDate}`,
        nextDecade: "Sonraki on yıl",
        nextMonth: "Sonraki ay",
        nextYear: "Sonraki yıl",
        previousDecade: "Önceki on yıl",
        previousMonth: "Önceki ay",
        previousYear: "Önceki yıl",
        switchToDecadeView: (currentYear: string) => `On yıllık görünüme geç, şu anda ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `Yıl görünümüne geç, şu anda ${currentMonthAndYear}`,
        today: "Bugün",
        yearCellLabel: (year: number) => `${localizeNumber(year, { useGrouping: false })} yılı`,
        yearViewLabel: (year: string) => `Yıl görünümü, ${year}`
    },
    card: {
        actionsLabel: "Kart işlemleri"
    },
    chart: {
        change: "Değişim",
        chart: "Grafik",
        chartLegend: "Grafik göstergesi",
        close: "Kapanış",
        closeAbbreviation: "K",
        colorScale: "Renk ölçeği",
        conversion: "Dönüşüm",
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, ${minimum} ile ${maximum} arasında, orta değer ${midpoint}`,
        dropOff: "Kayıp",
        falling: "Düşüş",
        high: "En yüksek",
        highAbbreviation: "Y",
        labelValueSeparator: ":",
        low: "En düşük",
        lowAbbreviation: "D",
        noData: "Veri yok",
        open: "Açılış",
        openAbbreviation: "A",
        overall: "Genel",
        range: "Aralık",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, ${minimum} ile ${maximum} arasında`,
        rising: "Yükseliş",
        runningTotal: "Kümülatif toplam",
        size: "boyut",
        unchanged: "Değişmedi",
        value: "Değer",
        visualIndicatorClamped: "Görsel gösterge sınırlandı"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `${label} öğesini kaldır` : "Öğeyi kaldır")
    },
    colorGradient: {
        apply: "Uygula",
        cancel: "İptal",
        clearColor: "Rengi temizle",
        copyAsHex: "HEX olarak kopyala",
        copyAsRgb: "RGB olarak kopyala",
        copyColor: "Rengi kopyala",
        currentColor: "Geçerli renk",
        previousColor: "Önceki renk",
        saturationAndValue: "Renk doygunluğu ve değeri",
        saturationAndValueText: (saturation: number, value: number) =>
            `Doygunluk %${localizeNumber(saturation)}, değer %${localizeNumber(value)}`,
        switchColorMode: "Renk modunu değiştir"
    },
    colorPalette: {
        color: (color: string) => `Renk: ${color}`,
        colorPalette: "Renk paleti"
    },
    colorPicker: {
        clearColor: "Rengi temizle",
        colorGradientPicker: "Renk geçişi seçici",
        colorPalettePicker: "Renk paleti seçici",
        colorPicker: "Renk seçici"
    },
    comboBox: {
        clear: "Temizle"
    },
    datePicker: {
        datePicker: "Tarih seçici",
        openCalendar: "Takvimi aç"
    },
    dateTimePicker: {
        calendar: "Takvim",
        cancel: "İptal",
        date: "Tarih",
        dateTimePicker: "Tarih ve saat seçici",
        openDateTimePicker: "Tarih ve saat seçiciyi aç",
        set: "Ayarla",
        time: "Saat",
        timePicker: "Saat seçici"
    },
    dialog: {
        cancel: "İptal",
        closeDialog: "İletişim kutusunu kapat",
        ok: "Tamam"
    },
    dropdownList: {
        clear: "Temizle"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${localizeNumber(total)} öğeden ${localizeNumber(position)}.`,
        noResultsFound: "Sonuç bulunamadı",
        resultsAvailable: (count: number) => `${localizeNumber(count)} sonuç bulundu`
    },
    editor: {
        addColumnAfter: "Sonrasına sütun ekle",
        addColumnBefore: "Öncesine sütun ekle",
        addHorizontalLine: "Yatay çizgi ekle",
        addRowAfter: "Sonrasına satır ekle",
        addRowBefore: "Öncesine satır ekle",
        alignCenter: "Ortala",
        alignLeft: "Sola hizala",
        alignRight: "Sağa hizala",
        altText: "Alternatif metin",
        backgroundColor: "Arka plan rengi",
        bold: "Kalın",
        cancel: "İptal",
        codeBlock: "Kod bloğu",
        color: "Renk",
        deleteColumn: "Sütunu sil",
        deleteRow: "Satırı sil",
        deleteTable: "Tabloyu sil",
        enterUrl: "URL'yi gir",
        fontSize: "Yazı tipi boyutu",
        format: "Biçim",
        heading: (level: number) => `Başlık ${localizeNumber(level)}`,
        heightPx: "Yükseklik (px)",
        imageUrl: "Görsel URL'si",
        indent: "Girintiyi artır",
        insert: "Ekle",
        insertImage: "Görsel ekle",
        insertLink: "Bağlantı ekle",
        insertOrderedList: "Numaralı liste ekle",
        insertTable: "Tablo ekle",
        insertTaskList: "Görev listesi ekle",
        insertUnorderedList: "Madde işaretli liste ekle",
        italic: "İtalik",
        justify: "İki yana yasla",
        mergeCells: "Seçili hücreleri birleştir",
        outdent: "Girintiyi azalt",
        paragraph: "Paragraf",
        quotation: "Alıntı",
        redo: "Yinele",
        removeLink: "Bağlantıyı kaldır",
        selectFontFamily: "Yazı tipi ailesini seç",
        selectFontSize: "Yazı tipi boyutunu seç",
        splitCell: "Hücreyi böl",
        strikethrough: "Üstü çizili",
        subscript: "Alt simge",
        superscript: "Üst simge",
        toggleHeaderRow: "Başlık satırını aç/kapat",
        underline: "Altı çizili",
        undo: "Geri al",
        widthPx: "Genişlik (px)"
    },
    filter: {
        and: "Ve",
        apply: "Uygula",
        clear: "Temizle",
        contains: "İçerir",
        doesNotContain: "İçermez",
        endsWith: "İle biter",
        isAfter: "Daha sonra",
        isAfterOrEqualTo: "Eşit veya daha sonra",
        isBefore: "Daha önce",
        isBeforeOrEqualTo: "Eşit veya daha önce",
        isEmpty: "Boştur",
        isEqualTo: "Eşittir",
        isFalse: "Yanlıştır",
        isGreaterThan: "Büyüktür",
        isGreaterThanOrEqualTo: "Büyük veya eşittir",
        isLessThan: "Küçüktür",
        isLessThanOrEqualTo: "Küçük veya eşittir",
        isNotEmpty: "Boş değildir",
        isNotEqualTo: "Eşit değildir",
        isNotNull: "Null değildir",
        isNotNullOrEmpty: "Null veya boş değildir",
        isNull: "Null'dır",
        isNullOrEmpty: "Null veya boştur",
        isTrue: "Doğrudur",
        logic: "Koşulları birleştir",
        operator: "İşleç",
        or: "Veya",
        secondOperator: "İkinci işleç",
        secondValue: "İkinci değer",
        startsWith: "İle başlar",
        value: "Değer"
    },
    grid: {
        all: "(Tümü)",
        apply: "Uygula",
        cancel: "İptal",
        cancelNewRow: "Yeni satırı iptal et",
        cancelRowEdit: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırın düzenlenmesini iptal et`,
        clearFilter: (column: string) => `${column} sütununun filtresini temizle`,
        collapseDetail: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırın ayrıntılarını daralt`,
        columnGrouped: (column: string) => `${column} ölçütüne göre gruplandı`,
        columnMoved: (column: string, position: number) => `${column} ${localizeNumber(position)}. konuma taşındı`,
        columns: "Sütunlar",
        columnsSelected: (count: number) => `${localizeNumber(count)} sütun seçildi`,
        commandColumnTitle: "Komutlar",
        delete: "Sil",
        deleteRowConfirmation: (rowNumber: number) =>
            `${localizeNumber(rowNumber)}. satırı silmek istediğinizden emin misiniz?`,
        deleteRowTitle: "Satır silinsin mi?",
        details: "Ayrıntılar",
        dragColumnHeaderToGroup: "Gruplamak için sütun başlığını buraya sürükleyin",
        edit: "Düzenle",
        editRow: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırı düzenle`,
        expandDetail: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırın ayrıntılarını genişlet`,
        fieldValidationError: "Geçersiz değer.",
        filterByColumn: (column: string) => `${column} sütununa göre filtrele`,
        filterByColumnFiltered: (column: string) => `${column} sütununa göre filtrele, filtrelendi`,
        filterOperator: (column: string, operator: string) => `${column} sütunu filtre işleci: ${operator}`,
        filterPlaceholder: "Filtrele...",
        group: "Grup",
        loading: "Yükleniyor",
        modified: "Değiştirildi",
        moveAsNext: "Sonrasına taşı",
        moveAsPrevious: "Öncesine taşı",
        moveRow: "Satırı taşı",
        noData: "Veri yok",
        remove: "Kaldır",
        removeRow: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırı kaldır`,
        reorderRow: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırı yeniden sırala`,
        resizeColumn: (column: string) => `${column} sütununu yeniden boyutlandır`,
        rowReorder: "Satırları yeniden sırala",
        rowReorderDisabled: "Satırları yeniden sıralama devre dışı.",
        rowReorderDisabledEditing: "Satırları yeniden sıralamadan önce düzenlemeyi tamamlayın.",
        rowReorderDisabledFiltered: "Satırları yeniden sıralamadan önce filtreleri kaldırın.",
        rowReorderDisabledGrouped: "Satırları yeniden sıralamadan önce gruplamayı kaldırın.",
        rowReorderDisabledServerBinding: "Sunucu bağlaması etkinken satırlar yeniden sıralanamaz.",
        rowReorderDisabledSingleRow: "Yeniden sıralamak için en az iki satır gerekir.",
        rowReorderDisabledSorted: "Satırları yeniden sıralamadan önce sıralamayı kaldırın.",
        rowReorderDisabledVirtualScroll: "Sanal kaydırma etkinken satırlar yeniden sıralanamaz.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `${localizeNumber(fromRowNumber)}. satır ${localizeNumber(toPosition)}. konuma taşındı.`,
        rowValidationError: "Bu satırda doğrulama hataları var.",
        save: "Kaydet",
        saveNewRow: "Yeni satırı kaydet",
        saveRow: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırı kaydet`,
        selectAllRows: "Tüm satırları seç",
        selectRow: (rowNumber: number) => `${localizeNumber(rowNumber)}. satırı seç`,
        sortOrder: (position: number) => `Sıralama düzeni ${localizeNumber(position)}`,
        toolbar: "Tablo araç çubuğu"
    },
    list: {
        filterList: "Listeyi filtrele",
        loading: "Yükleniyor",
        noData: "Veri yok",
        pagerLabel: (list: string) => `${list} sayfalandırması`
    },
    listBox: {
        clearSelection: "Tüm seçimleri kaldır",
        itemsMoved: (position: number, total: number) =>
            `${localizeNumber(total)} içinde ${localizeNumber(position)}. konuma taşındı`,
        itemsRemoved: (count: number) => `${localizeNumber(count)} öğe kaldırıldı`,
        itemsTransferred: (count: number, list: string) => `${localizeNumber(count)} öğe ${list} listesine taşındı`,
        itemsTransferredToOtherList: (count: number) => `${localizeNumber(count)} öğe diğer listeye taşındı`,
        moveDown: "Aşağı taşı",
        moveUp: "Yukarı taşı",
        remove: "Kaldır",
        selectionCleared: "Seçim kaldırıldı",
        toolbarLabel: (list: string) => `${list} işlemleri`,
        transferAllFrom: "Tümünü diğer listeden taşı",
        transferAllFromList: (list: string) => `Tümünü ${list} listesinden taşı`,
        transferAllTo: "Tümünü diğer listeye taşı",
        transferAllToList: (list: string) => `Tümünü ${list} listesine taşı`,
        transferFrom: "Diğer listeden taşı",
        transferFromList: (list: string) => `${list} listesinden taşı`,
        transferTo: "Diğer listeye taşı",
        transferToList: (list: string) => `${list} listesine taşı`
    },
    multiSelect: {
        clear: "Temizle",
        itemsCount: (count: number) => `+ ${localizeNumber(count)} öğe`,
        removeMoreItems: (count: number) => `Diğer ${localizeNumber(count)} öğeyi kaldır`
    },
    notification: {
        close: "Kapat",
        error: "Hata",
        info: "Bilgi",
        success: "Başarılı",
        warning: "Uyarı"
    },
    numericTextBox: {
        decrease: "Değeri azalt",
        increase: "Değeri artır"
    },
    otpInput: {
        verificationCode: "Doğrulama kodu"
    },
    pager: {
        firstPageLabel: "İlk sayfa",
        itemsPerPageLabel: "Sayfa başına öğe",
        jumpBackwardLabel: (pages: number) => `${localizeNumber(pages)} sayfa geri git`,
        jumpForwardLabel: (pages: number) => `${localizeNumber(pages)} sayfa ileri git`,
        lastPageLabel: "Son sayfa",
        nextPageLabel: "Sonraki sayfa",
        ofText: "/",
        pageInputPrefix: (_totalPages: number) => "Sayfa",
        pageInputSuffix: (totalPages: number) => `/ ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `${localizeNumber(page)}. sayfa`,
        pageSelectLabel: "Sayfa",
        pageSizeLabel: (pageSize: number) => `Sayfa başına ${localizeNumber(pageSize)}`,
        pageStatus: (page: number, totalPages: number) =>
            `Sayfa ${localizeNumber(page)} / ${localizeNumber(totalPages)}`,
        pageText: "Sayfa",
        pagerLabel: "Sayfalandırma",
        previousPageLabel: "Önceki sayfa",
        rangeStatus: (start: number, end: number, total: number) =>
            `${localizeNumber(start)} - ${localizeNumber(end)} / ${localizeNumber(total)} öğe`
    },
    rating: {
        notRated: "Değerlendirilmedi",
        valueText: (value: number, max: number) => `${localizeNumber(max)} üzerinden ${localizeNumber(value)}`
    },
    scrollView: {
        carousel: "atlıkarınca",
        nextPage: "Sonraki sayfa",
        page: (current: number) => `${localizeNumber(current)}. sayfa`,
        pageOf: (current: number, total: number) => `Sayfa ${localizeNumber(current)} / ${localizeNumber(total)}`,
        previousPage: "Önceki sayfa",
        scrollPagerNext: "Sayfalama seçeneklerini ileri kaydır",
        scrollPagerPrevious: "Sayfalama seçeneklerini geri kaydır",
        slide: "slayt"
    },
    sheet: {
        closeSheet: "Paneli kapat"
    },
    slider: {
        maximumValue: "Maksimum değer",
        minimumValue: "Minimum değer",
        sliderValue: "Kaydırıcı değeri"
    },
    spinner: {
        cancel: "İptal",
        loading: "Yükleniyor"
    },
    splitButton: {
        menuButtonAriaLabel: "Menü seçeneklerini göster",
        menuButtonWithText: (text: string) => `Diğer ${text} seçenekleri`,
        splitButton: (text: string) => (text ? `${text}, bölünmüş düğme` : "Bölünmüş düğme")
    },
    splitter: {
        collapseDown: "Alt paneli daralt",
        collapseNext: "Sonraki paneli daralt",
        collapsePrevious: "Önceki paneli daralt",
        collapseUp: "Üst paneli daralt",
        resizer: "Panel ayırıcı"
    },
    stepper: {
        stepProgress: "Adım ilerlemesi",
        stepper: "Adımlar"
    },
    tabs: {
        closeTab: "Sekmeyi kapat",
        scrollNext: "Sekmeleri ileri kaydır",
        scrollPrevious: "Sekmeleri geri kaydır"
    },
    textBox: {
        clear: "Temizle"
    },
    timePicker: {
        openTimePicker: "Saat seçiciyi aç",
        timePicker: "Saat seçici"
    },
    timeSelector: {
        am: "ÖÖ",
        amPm: "ÖÖ/ÖS",
        headerHours: "sa",
        headerMinutes: "dk",
        headerSeconds: "sn",
        hours: "Saat",
        minutes: "Dakika",
        now: "Şimdi",
        pm: "ÖS",
        seconds: "Saniye",
        set: "Ayarla",
        timeSelector: "Saat seçici"
    },
    treeView: {
        collapse: "Daralt",
        expand: "Genişlet",
        filter: "Filtrele",
        filterLabel: (tree: string) => `${tree} filtrele`,
        filterTree: "Ağacı filtrele",
        loadError: (node: string) => `${node} içindeki öğeler yüklenemedi`,
        loadingNode: (node: string) => `${node} yükleniyor`,
        movedAfter: (node: string, target: string) => `${node}, ${target} öğesinden sonraya taşındı`,
        movedBefore: (node: string, target: string) => `${node}, ${target} öğesinden önceye taşındı`,
        movedInto: (node: string, target: string) => `${node}, ${target} içine taşındı`,
        noData: "Veri yok",
        noMatches: "Eşleşen öğe yok",
        results: (count: number) => `${localizeNumber(count)} sonuç`,
        retryLoading: (node: string) => `${node} öğesini yeniden yüklemeyi dene`
    },
    window: {
        close: "Kapat",
        closeWindow: "Pencereyi kapat",
        maximize: "Ekranı kapla",
        minimize: "Simge durumuna küçült",
        moveWindow: "Pencereyi taşı. Taşımak için ok tuşlarını kullanın.",
        resizeBottom:
            "Pencereyi alt kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeBottomLeft:
            "Pencereyi sol alt köşeden yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeBottomRight:
            "Pencereyi sağ alt köşeden yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeLeft: "Pencereyi sol kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeRight: "Pencereyi sağ kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeTop: "Pencereyi üst kenardan yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeTopLeft:
            "Pencereyi sol üst köşeden yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        resizeTopRight:
            "Pencereyi sağ üst köşeden yeniden boyutlandırın. Yeniden boyutlandırmak için ok tuşlarını kullanın.",
        restore: "Geri yükle"
    }
} satisfies MonaLocaleMessages;

// Generated from ar-sa.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "ar-SA", options);
}

const PLURAL_RULES = new Intl.PluralRules("ar-SA");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const AR_SA_MESSAGES = {
    autoComplete: {
        clear: "مسح"
    },
    breadcrumb: {
        breadcrumb: "مسار التنقل",
        showFullPath: "إظهار المسار الكامل"
    },
    buttonGroup: {
        buttonGroup: "مجموعة أزرار"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `تقويم ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `من ${localizeNumber(start, { useGrouping: false })} إلى ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `عرض العقد، من ${localizeNumber(start, { useGrouping: false })} إلى ${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `الانتقال إلى اليوم (${formattedDate})`,
        nextDecade: "العقد التالي",
        nextMonth: "الشهر التالي",
        nextYear: "السنة التالية",
        previousDecade: "العقد السابق",
        previousMonth: "الشهر السابق",
        previousYear: "السنة السابقة",
        switchToDecadeView: (currentYear: string) => `التبديل إلى عرض العقد. السنة الحالية ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `التبديل إلى عرض السنة. الحالي ${currentMonthAndYear}`,
        today: "اليوم",
        yearCellLabel: (year: number) => `السنة ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `عرض السنة، ${year}`
    },
    card: {
        actionsLabel: "إجراءات البطاقة"
    },
    chart: {
        announcementSeparator: "، ",
        brushApplied: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                zero: () => "تم تطبيق التحديد، بلا نقاط",
                one: () => "تم تطبيق التحديد، نقطة واحدة",
                two: () => "تم تطبيق التحديد، نقطتان",
                few: () => `تم تطبيق التحديد، ${localizeNumber(count)} نقاط`,
                many: () => `تم تطبيق التحديد، ${localizeNumber(count)} نقطة`,
                other: () => `تم تطبيق التحديد، ${localizeNumber(count)} نقطة`
            }),
        brushCleared: "تم مسح التحديد",
        brushRange: (from: string, to: string) => `التحديد من ${from} إلى ${to}`,
        category: "الفئة",
        categoryFallbackName: (index: number) => `الفئة ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `من ${from} إلى ${to}.`,
        change: "التغير",
        changeValue: (change: string) => `التغير ${change}`,
        chart: "مخطط",
        chartLegend: "وسيلة إيضاح المخطط",
        chartRoleDescription: "مخطط",
        close: "الإغلاق",
        closeAbbreviation: "إ",
        colorScale: "مقياس الألوان",
        conversion: "التحويل",
        conversionOfPrevious: (rate: string) => `التحويل ${rate} من المرحلة السابقة`,
        dataTableTruncated: (shown: number, total: number) =>
            `عرض أول ${localizeNumber(shown)} من ${localizeNumber(total)} صف.`,
        decrease: "نقصان",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `نقصان ${delta}، المجموع التراكمي من ${from} إلى ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}، ${minimum} – ${midpoint} – ${maximum}`,
        dropOff: "الانخفاض",
        dropOffValue: (value: string) => `الانخفاض ${value}`,
        falling: "هبوط",
        gaugeRange: (minimum: string, maximum: string) => `النطاق من ${minimum} إلى ${maximum}`,
        high: "الأعلى",
        highAbbreviation: "ع",
        increase: "زيادة",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `زيادة ${delta}، المجموع التراكمي من ${from} إلى ${to}`,
        itemDeselected: (item: string) => `${item}، تم إلغاء التحديد`,
        itemFallbackName: (index: number) => `العنصر ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}، محدد`,
        keyboardHelp:
            "استخدم مفاتيح الأسهم للتنقل بين نقاط البيانات، وHome وEnd للانتقال إلى الأولى والأخيرة، وEnter أو المسافة للتفعيل، وEscape للمسح.",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}: ${value}`,
        low: "الأدنى",
        lowAbbreviation: "د",
        noChange: "بلا تغيير",
        noChangeAnnouncement: (value: string) => `بلا تغيير، المجموع التراكمي ${value}`,
        noData: "لا توجد بيانات متاحة",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `الافتتاح ${open}، الأعلى ${high}، الأدنى ${low}، الإغلاق ${close}`,
        open: "الافتتاح",
        openAbbreviation: "ا",
        overall: "الإجمالي",
        overallConversion: (rate: string) => `التحويل الإجمالي ${rate}`,
        pannedDown: "تم التحريك لأسفل",
        pannedLeft: "تم التحريك لليسار",
        pannedRight: "تم التحريك لليمين",
        pannedUp: "تم التحريك لأعلى",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} من ${localizeNumber(total)}`,
        range: "النطاق",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}، ${minimum}–${maximum}`,
        rangeValue: (from: string, to: string) => `من ${from} إلى ${to}`,
        rising: "صعود",
        runningTotal: "المجموع التراكمي",
        seriesFallbackName: (index: number) => `السلسلة ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `تم إخفاء ${series}`,
        seriesShown: (series: string) => `تم إظهار ${series}`,
        seriesSummary: (count: number, names: string) =>
            plural(PLURAL_RULES.select(count), {
                zero: () => "لا توجد سلاسل.",
                one: () => `سلسلة واحدة: ${names}.`,
                two: () => `سلسلتان: ${names}.`,
                few: () => `${localizeNumber(count)} سلاسل: ${names}.`,
                many: () => `${localizeNumber(count)} سلسلة: ${names}.`,
                other: () => `${localizeNumber(count)} سلسلة: ${names}.`
            }),
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}: الأدنى ${minimum}، الأعلى ${maximum}.`,
        shareOfTotal: (share: string) => `${share} من الإجمالي`,
        size: "الحجم",
        sizeValue: (size: string) => `الحجم ${size}`,
        stackShare: (share: string) => `الحصة في المكدس ${share}`,
        stageFallbackName: (index: number) => `المرحلة ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `المرحلة ${localizeNumber(position)} من ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `الخطوة ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `الخطوة ${localizeNumber(position)} من ${localizeNumber(total)}`,
        subtotal: "الإجمالي الفرعي",
        subtotalAnnouncement: (value: string) => `الإجمالي الفرعي ${value}`,
        total: "الإجمالي",
        totalAnnouncement: (value: string) => `الإجمالي ${value}`,
        treemapGroup: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                zero: () => "مجموعة (بلا عناصر فرعية)",
                one: () => "مجموعة (عنصر فرعي واحد)",
                two: () => "مجموعة (عنصران فرعيان)",
                few: () => `مجموعة (${localizeNumber(count)} عناصر فرعية)`,
                many: () => `مجموعة (${localizeNumber(count)} عنصرًا فرعيًا)`,
                other: () => `مجموعة (${localizeNumber(count)} عنصر فرعي)`
            }),
        treemapLeaf: "ورقة",
        unchanged: "دون تغيير",
        value: "القيمة",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "تمت إعادة تعيين العرض إلى النطاق الافتراضي",
        viewportResetToFull: "تمت إعادة تعيين العرض إلى النطاق الكامل",
        visualIndicatorClamped: "تم تقييد المؤشر المرئي",
        zoomedIn: "تم التكبير",
        zoomedOut: "تم التصغير"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `حذف ${label}` : "حذف العنصر")
    },
    colorGradient: {
        alpha: "قناة ألفا",
        alphaText: (opacity: number) => `العتامة ${localizeNumber(opacity)}٪`,
        apply: "تطبيق",
        blue: "الأزرق",
        cancel: "إلغاء",
        clearColor: "مسح اللون",
        colorCopied: "تم نسخ اللون",
        colorGradient: "تدرج الألوان",
        copyAsHex: "نسخ بصيغة HEX",
        copyAsRgb: "نسخ بصيغة RGB",
        copyColor: "نسخ اللون",
        copyFailed: "تعذر نسخ اللون",
        currentColor: "اللون الحالي",
        green: "الأخضر",
        hexColor: "اللون بالنظام الست عشري",
        hue: "درجة اللون",
        previousColor: "اللون السابق",
        red: "الأحمر",
        saturation: "التشبع",
        saturationAndValue: "التشبع والقيمة",
        saturationAndValueText: (saturation: number, value: number) =>
            `التشبع ${localizeNumber(saturation)}٪، القيمة ${localizeNumber(value)}٪`,
        switchColorMode: "تبديل وضع اللون",
        value: "القيمة"
    },
    colorPalette: {
        color: (color: string) => `اللون: ${color}`,
        colorPalette: "لوحة الألوان",
        namedColor: (name: string, color: string) => `${name}، ${color}`
    },
    colorPicker: {
        clearColor: "مسح اللون",
        colorGradientPicker: "منتقي تدرج الألوان",
        colorPalettePicker: "منتقي لوحة الألوان",
        colorPicker: "منتقي الألوان",
        noColor: "بلا لون"
    },
    comboBox: {
        clear: "مسح"
    },
    datePicker: {
        datePicker: "منتقي التاريخ",
        openCalendar: "فتح التقويم"
    },
    dateTimePicker: {
        calendar: "التقويم",
        cancel: "إلغاء",
        date: "التاريخ",
        dateTimePicker: "منتقي التاريخ والوقت",
        openDateTimePicker: "فتح منتقي التاريخ والوقت",
        set: "تعيين",
        time: "الوقت",
        timePicker: "منتقي الوقت"
    },
    dialog: {
        cancel: "إلغاء",
        closeDialog: "إغلاق مربع الحوار",
        ok: "موافق"
    },
    dropdownList: {
        clear: "مسح"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}، العنصر ${localizeNumber(position)} من ${localizeNumber(total)}`,
        noResultsFound: "لم يتم العثور على نتائج",
        resultsAvailable: (count: number) => `عدد النتائج المتاحة: ${localizeNumber(count)}`
    },
    editor: {
        addColumnAfter: "إدراج عمود بعد",
        addColumnBefore: "إدراج عمود قبل",
        addHorizontalLine: "إدراج خط أفقي",
        addRowAfter: "إدراج صف بعد",
        addRowBefore: "إدراج صف قبل",
        alignCenter: "توسيط",
        alignEnd: "محاذاة النص إلى النهاية",
        alignLeft: "محاذاة إلى اليسار",
        alignRight: "محاذاة إلى اليمين",
        alignStart: "محاذاة النص إلى البداية",
        alignmentGroup: "المحاذاة",
        altText: "نص بديل",
        apply: "تطبيق",
        backgroundColor: "لون الخلفية",
        bold: "عريض",
        cancel: "إلغاء",
        codeBlock: "كتلة تعليمات برمجية",
        color: "لون",
        contentLabel: "محرر النص المنسق",
        defaultFontFamily: "الخط الافتراضي",
        deleteColumn: "حذف العمود",
        deleteRow: "حذف الصف",
        deleteTable: "حذف الجدول",
        editLink: "تعديل الرابط",
        enterUrl: "إدخال عنوان URL",
        fontSize: "حجم الخط",
        format: "تنسيق",
        heading: (level: number) => `العنوان ${localizeNumber(level)}`,
        heightPx: "الارتفاع (px)",
        historyGroup: "السجل",
        imageUrl: "عنوان URL للصورة",
        indent: "زيادة المسافة البادئة",
        indentGroup: "المسافة البادئة",
        insert: "إدراج",
        insertImage: "إدراج صورة",
        insertLink: "إدراج رابط",
        insertOrderedList: "إدراج قائمة مرقمة",
        insertTable: "إدراج جدول",
        insertTaskList: "إدراج قائمة مهام",
        insertUnorderedList: "إدراج قائمة نقطية",
        invalidUrl: "أدخل عنوان ويب أو رابط mailto: أو tel: أو مسارًا نسبيًا.",
        italic: "مائل",
        justify: "ضبط",
        linkGroup: "الرابط",
        listGroup: "القوائم",
        mergeCells: "دمج الخلايا المحددة",
        outdent: "تقليل المسافة البادئة",
        paragraph: "فقرة",
        quotation: "اقتباس",
        redo: "إعادة",
        removeLink: "إزالة الرابط",
        selectFontFamily: "اختيار الخط",
        selectFontSize: "اختيار حجم الخط",
        splitCell: "تقسيم الخلية",
        strikethrough: "يتوسطه خط",
        subscript: "منخفض",
        superscript: "مرتفع",
        tableGroup: "الجدول",
        tableSize: (rows: number, columns: number) =>
            `الصفوف: ${localizeNumber(rows)}، الأعمدة: ${localizeNumber(columns)}`,
        textStyleGroup: "نمط النص",
        toggleHeaderRow: "تبديل صف الرأس",
        toolbar: "التنسيق",
        underline: "تسطير",
        undo: "تراجع",
        widthPx: "العرض (px)"
    },
    filter: {
        and: "و",
        apply: "تطبيق",
        clear: "مسح",
        contains: "يحتوي على",
        doesNotContain: "لا يحتوي على",
        endsWith: "ينتهي بـ",
        isAfter: "بعد",
        isAfterOrEqualTo: "بعد أو يساوي",
        isBefore: "قبل",
        isBeforeOrEqualTo: "قبل أو يساوي",
        isEmpty: "فارغ",
        isEqualTo: "يساوي",
        isFalse: "خطأ",
        isGreaterThan: "أكبر من",
        isGreaterThanOrEqualTo: "أكبر من أو يساوي",
        isLessThan: "أقل من",
        isLessThanOrEqualTo: "أقل من أو يساوي",
        isNotEmpty: "غير فارغ",
        isNotEqualTo: "لا يساوي",
        isNotNull: "القيمة غير خالية",
        isNotNullOrEmpty: "القيمة غير خالية وغير فارغة",
        isNull: "القيمة خالية",
        isNullOrEmpty: "القيمة خالية أو فارغة",
        isTrue: "صحيح",
        logic: "دمج الشروط",
        operator: "عامل التصفية",
        or: "أو",
        secondOperator: "عامل التصفية الثاني",
        secondValue: "القيمة الثانية",
        startsWith: "يبدأ بـ",
        value: "القيمة"
    },
    grid: {
        all: "(الكل)",
        apply: "تطبيق",
        cancel: "إلغاء",
        cancelNewRow: "إلغاء الصف الجديد",
        cancelRowEdit: (rowNumber: number) => `إلغاء تحرير الصف ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `مسح تصفية ${column}`,
        collapseDetail: (rowNumber: number) => `طي تفاصيل الصف ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `تم التجميع حسب ${column}`,
        columnMoved: (column: string, position: number) => `تم نقل ${column} إلى الموضع ${localizeNumber(position)}`,
        columns: "الأعمدة",
        columnsSelected: (count: number) => `عدد الأعمدة المحددة: ${localizeNumber(count)}`,
        commandColumnTitle: "الأوامر",
        delete: "حذف",
        deleteRowConfirmation: (rowNumber: number) => `هل تريد حذف الصف ${localizeNumber(rowNumber)}؟`,
        deleteRowTitle: "حذف الصف؟",
        details: "التفاصيل",
        dragColumnHeaderToGroup: "اسحب رأس العمود إلى هنا للتجميع",
        edit: "تحرير",
        editRow: (rowNumber: number) => `تحرير الصف ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `توسيع تفاصيل الصف ${localizeNumber(rowNumber)}`,
        fieldValidationError: "قيمة غير صالحة.",
        filterByColumn: (column: string) => `التصفية حسب: ${column}`,
        filterByColumnFiltered: (column: string) => `التصفية حسب: ${column}، مُصفّى`,
        filterOperator: (column: string, operator: string) => `عامل تصفية ${column}: ${operator}`,
        filterPlaceholder: "تصفية…",
        group: "مجموعة",
        groupOptions: (column: string) => `خيارات مجموعة ${column}`,
        loading: "جارٍ التحميل",
        modified: "تم التعديل",
        moveAsNext: "نقل كعنصر تالٍ",
        moveAsPrevious: "نقل كعنصر سابق",
        moveRow: "نقل الصف",
        noData: "لا توجد بيانات",
        remove: "إزالة",
        removeRow: (rowNumber: number) => `إزالة الصف ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `إعادة ترتيب الصف ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `تغيير عرض العمود ${column}`,
        rowReorder: "إعادة ترتيب الصفوف",
        rowReorderDisabled: "إعادة ترتيب الصفوف غير متاح.",
        rowReorderDisabledEditing: "أكمل التحرير قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledFiltered: "امسح التصفية قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledGrouped: "ألغِ التجميع قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledServerBinding: "لا يمكن إعادة ترتيب الصفوف مع ربط الخادم.",
        rowReorderDisabledSingleRow: "يلزم صفّان على الأقل لإعادة ترتيب الصفوف.",
        rowReorderDisabledSorted: "ألغِ الفرز قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledVirtualScroll: "لا يمكن إعادة ترتيب الصفوف أثناء استخدام التمرير الافتراضي.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `تم نقل الصف ${localizeNumber(fromRowNumber)} إلى الموضع ${localizeNumber(toPosition)}.`,
        rowValidationError: "توجد أخطاء تحقق في هذا الصف.",
        save: "حفظ",
        saveNewRow: "حفظ الصف الجديد",
        saveRow: (rowNumber: number) => `حفظ الصف ${localizeNumber(rowNumber)}`,
        selectAllRows: "تحديد كل الصفوف",
        selectRow: (rowNumber: number) => `تحديد الصف ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `ترتيب الفرز ${localizeNumber(position)}`,
        toolbar: "شريط أدوات الجدول"
    },
    label: {
        optional: "اختياري"
    },
    list: {
        filterList: "تصفية القائمة",
        loading: "جارٍ التحميل",
        noData: "لا توجد بيانات",
        pagerLabel: (list: string) => `ترقيم صفحات ${list}`
    },
    listBox: {
        clearSelection: "إلغاء التحديد",
        itemsMoved: (position: number, total: number) =>
            `تم النقل إلى الموضع ${localizeNumber(position)} من ${localizeNumber(total)}`,
        itemsRemoved: (count: number) => `عدد العناصر التي تمت إزالتها: ${localizeNumber(count)}`,
        itemsTransferred: (count: number, list: string) => `عدد العناصر المنقولة إلى ${list}: ${localizeNumber(count)}`,
        itemsTransferredToOtherList: (count: number) =>
            `عدد العناصر المنقولة إلى القائمة الأخرى: ${localizeNumber(count)}`,
        moveDown: "تحريك لأسفل",
        moveUp: "تحريك لأعلى",
        remove: "إزالة",
        selectionCleared: "تم إلغاء التحديد",
        toolbarLabel: (list: string) => `إجراءات ${list}`,
        transferAllFrom: "نقل الكل من القائمة الأخرى",
        transferAllFromList: (list: string) => `نقل الكل من ${list}`,
        transferAllTo: "نقل الكل إلى القائمة الأخرى",
        transferAllToList: (list: string) => `نقل الكل إلى ${list}`,
        transferFrom: "نقل من القائمة الأخرى",
        transferFromList: (list: string) => `نقل من ${list}`,
        transferTo: "نقل إلى القائمة الأخرى",
        transferToList: (list: string) => `نقل إلى ${list}`
    },
    multiSelect: {
        clear: "مسح",
        itemsCount: (count: number) => `+ ${localizeNumber(count)}`,
        removeMoreItems: (count: number) => `حذف العناصر الإضافية (${localizeNumber(count)})`
    },
    notification: {
        close: "إغلاق",
        error: "خطأ",
        info: "معلومات",
        region: "الإشعارات",
        success: "نجاح",
        warning: "تحذير"
    },
    numericTextBox: {
        decrease: "تقليل القيمة",
        increase: "زيادة القيمة"
    },
    otpInput: {
        verificationCode: "رمز التحقق"
    },
    pager: {
        firstPageLabel: "الصفحة الأولى",
        itemsPerPageLabel: "عدد العناصر في الصفحة",
        jumpBackwardLabel: (pages: number) =>
            `للخلف: ${plural(PLURAL_RULES.select(pages), { zero: () => `${localizeNumber(pages)} صفحات`, one: () => "صفحة واحدة", two: () => "صفحتان", few: () => `${localizeNumber(pages)} صفحات`, many: () => `${localizeNumber(pages)} صفحة`, other: () => `${localizeNumber(pages)} صفحة` })}`,
        jumpForwardLabel: (pages: number) =>
            `للأمام: ${plural(PLURAL_RULES.select(pages), { zero: () => `${localizeNumber(pages)} صفحات`, one: () => "صفحة واحدة", two: () => "صفحتان", few: () => `${localizeNumber(pages)} صفحات`, many: () => `${localizeNumber(pages)} صفحة`, other: () => `${localizeNumber(pages)} صفحة` })}`,
        lastPageLabel: "الصفحة الأخيرة",
        nextPageLabel: "الصفحة التالية",
        ofText: "من",
        pageInputPrefix: (_totalPages: number) => "الصفحة",
        pageInputSuffix: (totalPages: number) => `من ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `الصفحة ${localizeNumber(page)}`,
        pageSelectLabel: "الصفحة",
        pageSizeLabel: (pageSize: number) => `عدد العناصر في الصفحة: ${localizeNumber(pageSize)}`,
        pageStatus: (page: number, totalPages: number) =>
            `الصفحة ${localizeNumber(page)} من ${localizeNumber(totalPages)}`,
        pageText: "الصفحة",
        pagerLabel: "ترقيم الصفحات",
        previousPageLabel: "الصفحة السابقة",
        rangeStatus: (start: number, end: number, total: number) =>
            `${localizeNumber(start)}–${localizeNumber(end)} من ${localizeNumber(total)}`
    },
    progressBar: {
        label: "التقدم"
    },
    rating: {
        notRated: "غير مقيّم",
        valueText: (value: number, max: number) => `${localizeNumber(value)} من ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "دوّار",
        nextPage: "الصفحة التالية",
        page: (current: number) => `الصفحة ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `الصفحة ${localizeNumber(current)} من ${localizeNumber(total)}`,
        pages: "الصفحات",
        previousPage: "الصفحة السابقة",
        scrollPagerNext: "تمرير مؤشر الصفحات إلى التالي",
        scrollPagerPrevious: "تمرير مؤشر الصفحات إلى السابق",
        slide: "شريحة"
    },
    sheet: {
        closeSheet: "إغلاق اللوحة"
    },
    sidebar: {
        drawerLabel: "الشريط الجانبي",
        rail: "إظهار الشريط الجانبي أو إخفاؤه"
    },
    slider: {
        maximumValue: "الحد الأقصى",
        minimumValue: "الحد الأدنى",
        sliderValue: "قيمة شريط التمرير"
    },
    spinner: {
        cancel: "إلغاء",
        loading: "جارٍ التحميل"
    },
    splitButton: {
        menuButtonAriaLabel: "عرض خيارات القائمة",
        menuButtonWithText: (text: string) => `مزيد من خيارات ${text}`,
        splitButton: (text: string) => (text ? `${text}، زر تقسيم` : "زر تقسيم")
    },
    splitter: {
        collapseDown: "طي الجزء السفلي",
        collapseNext: "طي الجزء التالي",
        collapsePrevious: "طي الجزء السابق",
        collapseUp: "طي الجزء العلوي",
        resizer: "مقبض تغيير الحجم"
    },
    stepper: {
        stepCompleted: "مكتملة",
        stepInvalid: "بها أخطاء",
        stepPosition: (current: number, total: number) =>
            `الخطوة ${localizeNumber(current)} من ${localizeNumber(total)}`,
        stepProgress: "تقدم الخطوات",
        stepper: "مؤشر الخطوات"
    },
    tabs: {
        closeTab: "إغلاق علامة التبويب",
        scrollNext: "التمرير إلى علامة التبويب التالية",
        scrollPrevious: "التمرير إلى علامة التبويب السابقة"
    },
    textBox: {
        clear: "مسح"
    },
    timePicker: {
        openTimePicker: "فتح منتقي الوقت",
        timePicker: "منتقي الوقت"
    },
    timeSelector: {
        am: "ص",
        amPm: "ص/م",
        headerHours: "الساعات",
        headerMinutes: "الدقائق",
        headerSeconds: "الثواني",
        hours: "الساعات",
        minutes: "الدقائق",
        now: "الآن",
        pm: "م",
        seconds: "الثواني",
        set: "تعيين",
        timeSelector: "منتقي الوقت"
    },
    treeView: {
        collapse: "طي",
        expand: "توسيع",
        filter: "تصفية:",
        filterLabel: (tree: string) => `تصفية: ${tree}`,
        filterTree: "تصفية طريقة عرض الشجرة",
        loadError: (node: string) => `تعذّر تحميل عناصر ${node}`,
        loadingNode: (node: string) => `جارٍ تحميل ${node}`,
        movedAfter: (node: string, target: string) => `تم نقل ${node} بعد ${target}`,
        movedBefore: (node: string, target: string) => `تم نقل ${node} قبل ${target}`,
        movedInto: (node: string, target: string) => `تم نقل ${node} إلى داخل ${target}`,
        noData: "لا توجد بيانات",
        noMatches: "لا توجد عناصر مطابقة",
        results: (count: number) => `عدد النتائج: ${localizeNumber(count)}`,
        retryLoading: (node: string) => `إعادة محاولة تحميل ${node}`
    },
    window: {
        close: "إغلاق",
        closeWindow: "إغلاق النافذة",
        maximize: "تكبير",
        minimize: "تصغير",
        moveOrResizeWindow:
            "نقل النافذة أو تغيير حجمها. استخدم مفاتيح الأسهم للتحريك، أو Ctrl مع مفاتيح الأسهم لتغيير الحجم.",
        moveWindow: "نقل النافذة. استخدم مفاتيح الأسهم للتحريك.",
        resizeBottom: "تغيير حجم النافذة من الأسفل. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeBottomLeft: "تغيير حجم النافذة من الزاوية السفلية اليسرى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeBottomRight: "تغيير حجم النافذة من الزاوية السفلية اليمنى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeLeft: "تغيير حجم النافذة من اليسار. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeRight: "تغيير حجم النافذة من اليمين. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeTop: "تغيير حجم النافذة من الأعلى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeTopLeft: "تغيير حجم النافذة من الزاوية العلوية اليسرى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeTopRight: "تغيير حجم النافذة من الزاوية العلوية اليمنى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeWindow: "تغيير حجم النافذة. استخدم Ctrl مع مفاتيح الأسهم لتغيير الحجم.",
        restore: "استعادة"
    }
} satisfies MonaLocaleMessages;

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
        breadcrumb: "مسار التنقل"
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
        change: "التغير",
        chart: "مخطط",
        chartLegend: "وسيلة إيضاح المخطط",
        close: "الإغلاق",
        closeAbbreviation: "إ",
        colorScale: "مقياس الألوان",
        conversion: "التحويل",
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}، ${minimum} – ${midpoint} – ${maximum}`,
        dropOff: "الانخفاض",
        falling: "هبوط",
        high: "الأعلى",
        highAbbreviation: "ع",
        labelValueSeparator: ":",
        low: "الأدنى",
        lowAbbreviation: "د",
        noData: "لا توجد بيانات متاحة",
        open: "الافتتاح",
        openAbbreviation: "ا",
        overall: "الإجمالي",
        range: "النطاق",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}، ${minimum}–${maximum}`,
        rising: "صعود",
        runningTotal: "المجموع التراكمي",
        size: "الحجم",
        unchanged: "دون تغيير",
        value: "القيمة",
        visualIndicatorClamped: "تم تقييد المؤشر المرئي"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `حذف ${label}` : "حذف العنصر")
    },
    colorGradient: {
        apply: "تطبيق",
        cancel: "إلغاء",
        clearColor: "مسح اللون",
        copyAsHex: "نسخ بصيغة HEX",
        copyAsRgb: "نسخ بصيغة RGB",
        copyColor: "نسخ اللون",
        currentColor: "اللون الحالي",
        previousColor: "اللون السابق",
        saturationAndValue: "التشبع والقيمة",
        saturationAndValueText: (saturation: number, value: number) =>
            `التشبع ${localizeNumber(saturation)}٪، القيمة ${localizeNumber(value)}٪`,
        switchColorMode: "تبديل وضع اللون"
    },
    colorPalette: {
        color: (color: string) => `اللون: ${color}`,
        colorPalette: "لوحة الألوان"
    },
    colorPicker: {
        clearColor: "مسح اللون",
        colorGradientPicker: "منتقي تدرج الألوان",
        colorPalettePicker: "منتقي لوحة الألوان",
        colorPicker: "منتقي الألوان"
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
        alignLeft: "محاذاة إلى اليسار",
        alignRight: "محاذاة إلى اليمين",
        altText: "نص بديل",
        backgroundColor: "لون الخلفية",
        bold: "عريض",
        cancel: "إلغاء",
        codeBlock: "كتلة تعليمات برمجية",
        color: "لون",
        deleteColumn: "حذف العمود",
        deleteRow: "حذف الصف",
        deleteTable: "حذف الجدول",
        enterUrl: "إدخال عنوان URL",
        fontSize: "حجم الخط",
        format: "تنسيق",
        heading: (level: number) => `العنوان ${localizeNumber(level)}`,
        heightPx: "الارتفاع (px)",
        imageUrl: "عنوان URL للصورة",
        indent: "زيادة المسافة البادئة",
        insert: "إدراج",
        insertImage: "إدراج صورة",
        insertLink: "إدراج رابط",
        insertOrderedList: "إدراج قائمة مرقمة",
        insertTable: "إدراج جدول",
        insertTaskList: "إدراج قائمة مهام",
        insertUnorderedList: "إدراج قائمة نقطية",
        italic: "مائل",
        justify: "ضبط",
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
        toggleHeaderRow: "تبديل صف الرأس",
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
        or: "أو",
        startsWith: "يبدأ بـ"
    },
    grid: {
        all: "(الكل)",
        apply: "تطبيق",
        cancel: "إلغاء",
        cancelNewRow: "إلغاء الصف الجديد",
        cancelRowEdit: (rowNumber: number) => `إلغاء تحرير الصف ${localizeNumber(rowNumber)}`,
        collapseDetail: (rowNumber: number) => `طي تفاصيل الصف ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `تم التجميع حسب ${column}`,
        columnMoved: (column: string, position: number) => `تم نقل ${column} إلى الموضع ${localizeNumber(position)}`,
        columns: "الأعمدة",
        columnsSelected: (count: number) => `عدد الأعمدة المحددة: ${localizeNumber(count)}`,
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
        filterPlaceholder: "تصفية…",
        group: "مجموعة",
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
    list: {
        filterList: "تصفية القائمة",
        noData: "لا توجد بيانات"
    },
    listBox: {
        clearSelection: "إلغاء التحديد",
        moveDown: "تحريك لأسفل",
        moveUp: "تحريك لأعلى",
        remove: "إزالة",
        transferAllFrom: "نقل الكل من القائمة الأخرى",
        transferAllTo: "نقل الكل إلى القائمة الأخرى",
        transferFrom: "نقل من القائمة الأخرى",
        transferTo: "نقل إلى القائمة الأخرى"
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
    rating: {
        notRated: "غير مقيّم",
        valueText: (value: number, max: number) => `${localizeNumber(value)} من ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "دوّار",
        nextPage: "الصفحة التالية",
        page: (current: number) => `الصفحة ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `الصفحة ${localizeNumber(current)} من ${localizeNumber(total)}`,
        previousPage: "الصفحة السابقة",
        scrollPagerNext: "تمرير مؤشر الصفحات إلى التالي",
        scrollPagerPrevious: "تمرير مؤشر الصفحات إلى السابق",
        slide: "شريحة"
    },
    sheet: {
        closeSheet: "إغلاق اللوحة"
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
        filterTree: "تصفية طريقة عرض الشجرة"
    },
    window: {
        close: "إغلاق",
        closeWindow: "إغلاق النافذة",
        maximize: "تكبير",
        minimize: "تصغير",
        moveWindow: "نقل النافذة. استخدم مفاتيح الأسهم للتحريك.",
        resizeBottom: "تغيير حجم النافذة من الأسفل. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeBottomLeft: "تغيير حجم النافذة من الزاوية السفلية اليسرى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeBottomRight: "تغيير حجم النافذة من الزاوية السفلية اليمنى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeLeft: "تغيير حجم النافذة من اليسار. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeRight: "تغيير حجم النافذة من اليمين. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeTop: "تغيير حجم النافذة من الأعلى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeTopLeft: "تغيير حجم النافذة من الزاوية العلوية اليسرى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        resizeTopRight: "تغيير حجم النافذة من الزاوية العلوية اليمنى. استخدم مفاتيح الأسهم لتغيير الحجم.",
        restore: "استعادة"
    }
} satisfies MonaLocaleMessages;

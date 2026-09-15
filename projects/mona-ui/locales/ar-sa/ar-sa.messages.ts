import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

const AR_SA_INTEGER_FORMATTER = new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
    useGrouping: false
});

function formatInteger(value: number): string {
    return AR_SA_INTEGER_FORMATTER.format(value);
}

const AR_SA_PLURAL_RULES = new Intl.PluralRules("ar-SA");

function formatPageCount(pages: number): string {
    const category = AR_SA_PLURAL_RULES.select(pages);
    switch (category) {
        case "zero":
            return `${formatInteger(pages)} صفحات`;
        case "one":
            return "صفحة واحدة";
        case "two":
            return "صفحتان";
        case "few":
            return `${formatInteger(pages)} صفحات`;
        case "many":
        case "other":
            return `${formatInteger(pages)} صفحة`;
    }
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
        decadeRange: (start: number, end: number) => `من ${formatInteger(start)} إلى ${formatInteger(end)}`,
        decadeViewLabel: (start: number, end: number) =>
            `عرض العقد، من ${formatInteger(start)} إلى ${formatInteger(end)}`,
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
        yearCellLabel: (year: number) => `السنة ${formatInteger(year)}`,
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
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}، ${minimum} – ${midpoint} – ${maximum}`,
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
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}، ${minimum}–${maximum}`,
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
            `التشبع ${formatInteger(saturation)}٪، القيمة ${formatInteger(value)}٪`,
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
            `${text}، العنصر ${formatInteger(position)} من ${formatInteger(total)}`,
        noResultsFound: "لم يتم العثور على نتائج",
        resultsAvailable: (count: number) => `عدد النتائج المتاحة: ${formatInteger(count)}`
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
        heading: (level: number) => `العنوان ${formatInteger(level)}`,
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
        cancelRowEdit: "إلغاء تحرير الصف",
        columns: "الأعمدة",
        columnsSelected: (count: number) => `عدد الأعمدة المحددة: ${formatInteger(count)}`,
        delete: "حذف",
        deleteRowConfirmation: "هل تريد حذف هذا العنصر؟",
        deleteRowTitle: "حذف الصف؟",
        dragColumnHeaderToGroup: "اسحب رأس العمود إلى هنا للتجميع",
        edit: "تحرير",
        editRow: "تحرير الصف",
        fieldValidationError: "قيمة غير صالحة.",
        filterByColumn: (column: string) => `التصفية حسب: ${column}`,
        filterPlaceholder: "تصفية…",
        modified: "تم التعديل",
        moveAsNext: "نقل كعنصر تالٍ",
        moveAsPrevious: "نقل كعنصر سابق",
        moveRow: "نقل الصف",
        noData: "لا توجد بيانات",
        remove: "إزالة",
        removeRow: "إزالة الصف",
        reorderRow: (rowNumber: number) => `إعادة ترتيب الصف ${formatInteger(rowNumber)}`,
        resizeColumn: "تغيير عرض العمود",
        rowReorder: "إعادة ترتيب الصفوف",
        rowReorderDisabled: "إعادة ترتيب الصفوف غير متاح.",
        rowReorderDisabledEditing: "أكمل التحرير قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledFiltered: "امسح التصفية قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledGrouped: "ألغِ التجميع قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledSingleRow: "يلزم صفّان على الأقل لإعادة ترتيب الصفوف.",
        rowReorderDisabledSorted: "ألغِ الفرز قبل إعادة ترتيب الصفوف.",
        rowReorderDisabledVirtualScroll: "لا يمكن إعادة ترتيب الصفوف أثناء استخدام التمرير الافتراضي.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `تم نقل الصف ${formatInteger(fromRowNumber)} إلى الموضع ${formatInteger(toPosition)}.`,
        rowValidationError: "توجد أخطاء تحقق في هذا الصف.",
        save: "حفظ",
        saveRow: "حفظ الصف",
        selectAllRows: "تحديد كل الصفوف",
        selectRow: (rowNumber: number) => `تحديد الصف ${formatInteger(rowNumber)}`
    },
    list: {
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
        itemsCount: (count: number) => `+ ${formatInteger(count)}`
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
        jumpBackwardLabel: (pages: number) => `للخلف: ${formatPageCount(pages)}`,
        jumpForwardLabel: (pages: number) => `للأمام: ${formatPageCount(pages)}`,
        lastPageLabel: "الصفحة الأخيرة",
        nextPageLabel: "الصفحة التالية",
        ofText: "من",
        pageLabel: (page: number) => `الصفحة ${formatInteger(page)}`,
        pageSizeLabel: (pageSize: number) => `عدد العناصر في الصفحة: ${formatInteger(pageSize)}`,
        pageStatus: (page: number, totalPages: number) =>
            `الصفحة ${formatInteger(page)} من ${formatInteger(totalPages)}`,
        pageText: "الصفحة",
        previousPageLabel: "الصفحة السابقة",
        rangeStatus: (start: number, end: number, total: number) =>
            `${formatInteger(start)}–${formatInteger(end)} من ${formatInteger(total)}`
    },
    rating: {
        notRated: "غير مقيّم",
        valueText: (value: number, max: number) => `${formatInteger(value)} من ${formatInteger(max)}`
    },
    scrollView: {
        carousel: "دوّار",
        nextPage: "الصفحة التالية",
        page: (current: number) => `الصفحة ${formatInteger(current)}`,
        pageOf: (current: number, total: number) =>
            `الصفحة ${formatInteger(current)} من ${formatInteger(total)}`,
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
        splitButton: (text?: string) => (text ? `${text}، زر تقسيم` : "زر تقسيم")
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

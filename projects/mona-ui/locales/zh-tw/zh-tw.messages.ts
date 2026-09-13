import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const ZH_TW_MESSAGES = {
    autoComplete: {
        clear: "清除"
    },
    breadcrumb: {
        breadcrumb: "階層連結導航"
    },
    buttonGroup: {
        buttonGroup: "按鈕群組"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `${formattedMonthAndYear}行事曆`,
        decadeRange: (start: number, end: number) => `${start}年至${end}年`,
        decadeViewLabel: (start: number, end: number) => `${start}年至${end}年十年檢視`,
        goToToday: (formattedDate: string) => `移至今天（${formattedDate}）`,
        nextDecade: "下個十年",
        nextMonth: "下個月",
        nextYear: "下一年",
        previousDecade: "上個十年",
        previousMonth: "上個月",
        previousYear: "上一年",
        switchToDecadeView: (currentYear: string) => `切換至十年檢視，目前為${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `切換至年份檢視，目前為${currentMonthAndYear}`,
        today: "今天",
        yearCellLabel: (year: number) => `${year}年`,
        yearViewLabel: (year: string) => `年份檢視，${year}`
    },
    card: {
        actionsLabel: "卡片動作"
    },
    chart: {
        change: "變動",
        chart: "圖表",
        chartLegend: "圖例",
        close: "收盤價",
        closeAbbreviation: "收",
        colorScale: "色標",
        conversion: "轉換",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}，${minimum} 至 ${midpoint} 至 ${maximum}`,
        dropOff: "流失",
        falling: "下跌",
        high: "最高價",
        highAbbreviation: "高",
        labelValueSeparator: ":",
        low: "最低價",
        lowAbbreviation: "低",
        noData: "沒有可用資料",
        open: "開盤價",
        openAbbreviation: "開",
        overall: "整體",
        range: "範圍",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}，${minimum} 至 ${maximum}`,
        rising: "上漲",
        runningTotal: "累計",
        size: "大小",
        unchanged: "持平",
        value: "數值",
        visualIndicatorClamped: "視覺指示器已達極限"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `移除${label}` : "移除項目")
    },
    colorGradient: {
        apply: "套用",
        cancel: "取消",
        clearColor: "清除顏色",
        copyAsHex: "複製為 HEX",
        copyAsRgb: "複製為 RGB",
        copyColor: "複製顏色",
        currentColor: "目前顏色",
        previousColor: "先前顏色",
        saturationAndValue: "飽和度與明度",
        saturationAndValueText: (saturation: number, value: number) =>
            `飽和度${saturation}%，明度${value}%`,
        switchColorMode: "切換色彩模式"
    },
    colorPalette: {
        color: (color: string) => `顏色: ${color}`,
        colorPalette: "調色盤"
    },
    colorPicker: {
        clearColor: "清除顏色",
        colorGradientPicker: "漸層色彩選取器",
        colorPalettePicker: "調色盤選取器",
        colorPicker: "色彩選取器"
    },
    comboBox: {
        clear: "清除"
    },
    datePicker: {
        datePicker: "日期選取器",
        openCalendar: "開啟行事曆"
    },
    dateTimePicker: {
        calendar: "行事曆",
        cancel: "取消",
        date: "日期",
        dateTimePicker: "日期時間選取器",
        openDateTimePicker: "開啟日期時間選取器",
        set: "設定",
        time: "時間",
        timePicker: "時間選取器"
    },
    dialog: {
        cancel: "取消",
        closeDialog: "關閉對話方塊",
        ok: "確定"
    },
    dropdownList: {
        clear: "清除"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}，第 ${position} 項（共 ${total} 項）`,
        noResultsFound: "找不到結果",
        resultsAvailable: (count: number) => `有 ${count} 個可用結果`
    },
    editor: {
        addColumnAfter: "在後方插入欄",
        addColumnBefore: "在前方插入欄",
        addHorizontalLine: "插入水平線",
        addRowAfter: "在後方插入列",
        addRowBefore: "在前方插入列",
        alignCenter: "置中對齊",
        alignLeft: "靠左對齊",
        alignRight: "靠右對齊",
        altText: "替代文字",
        backgroundColor: "背景顏色",
        bold: "粗體",
        cancel: "取消",
        codeBlock: "程式碼區塊",
        color: "顏色",
        deleteColumn: "刪除欄",
        deleteRow: "刪除列",
        deleteTable: "刪除表格",
        enterUrl: "輸入 URL",
        fontSize: "字型大小",
        format: "格式",
        heading: (level: number) => `標題 ${level}`,
        heightPx: "高度 (px)",
        imageUrl: "圖片 URL",
        indent: "增加縮排",
        insert: "插入",
        insertImage: "插入圖片",
        insertLink: "插入連結",
        insertOrderedList: "插入編號清單",
        insertTable: "插入表格",
        insertTaskList: "插入工作清單",
        insertUnorderedList: "插入項目符號清單",
        italic: "斜體",
        justify: "左右對齊",
        mergeCells: "合併選取的儲存格",
        outdent: "減少縮排",
        paragraph: "段落",
        quotation: "引用",
        redo: "重做",
        removeLink: "移除連結",
        selectFontFamily: "選取字型",
        selectFontSize: "選取字型大小",
        splitCell: "分割儲存格",
        strikethrough: "刪除線",
        subscript: "下標",
        superscript: "上標",
        toggleHeaderRow: "切換標題列",
        underline: "底線",
        undo: "復原",
        widthPx: "寬度 (px)"
    },
    filter: {
        and: "且",
        apply: "套用",
        clear: "清除",
        contains: "包含",
        doesNotContain: "不包含",
        endsWith: "結尾為",
        isAfter: "晚於",
        isAfterOrEqualTo: "晚於或等於",
        isBefore: "早於",
        isBeforeOrEqualTo: "早於或等於",
        isEmpty: "為空",
        isEqualTo: "等於",
        isFalse: "為假",
        isGreaterThan: "大於",
        isGreaterThanOrEqualTo: "大於或等於",
        isLessThan: "小於",
        isLessThanOrEqualTo: "小於或等於",
        isNotEmpty: "不為空",
        isNotEqualTo: "不等於",
        isNotNull: "不為 Null",
        isNotNullOrEmpty: "不為 Null 且不為空",
        isNull: "為 Null",
        isNullOrEmpty: "為 Null 或為空",
        isTrue: "為真",
        or: "或",
        startsWith: "開頭為"
    },
    grid: {
        all: "(全部)",
        apply: "套用",
        cancel: "取消",
        cancelRowEdit: "取消編輯資料列",
        columns: "欄",
        columnsSelected: (count: number) => `已選取 ${count} 欄`,
        delete: "刪除",
        deleteRowConfirmation: "確定要刪除此項目嗎？",
        deleteRowTitle: "刪除資料列？",
        dragColumnHeaderToGroup: "拖曳欄位標題至此進行群組",
        edit: "編輯",
        editRow: "編輯資料列",
        fieldValidationError: "無效值。",
        filterByColumn: (column: string) => `依 ${column} 篩選`,
        filterPlaceholder: "篩選…",
        modified: "已修改",
        moveAsNext: "移至下一項",
        moveAsPrevious: "移至上一項",
        moveRow: "移動資料列",
        noData: "沒有資料",
        remove: "移除",
        removeRow: "移除資料列",
        reorderRow: (rowNumber: number) => `重新排列第 ${rowNumber} 列`,
        resizeColumn: "調整欄寬",
        rowReorder: "資料列重新排序",
        rowReorderDisabled: "資料列重新排序已停用。",
        rowReorderDisabledEditing: "請完成編輯後再重新排列資料列。",
        rowReorderDisabledFiltered: "請清除篩選後再重新排列資料列。",
        rowReorderDisabledGrouped: "請清除群組後再重新排列資料列。",
        rowReorderDisabledSingleRow: "至少需要兩列才能重新排序。",
        rowReorderDisabledSorted: "請清除排序後再重新排列資料列。",
        rowReorderDisabledVirtualScroll: "啟用虛擬捲動時無法重新排列資料列。",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}。${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "使用 Alt + 向上鍵或 Alt + 向下鍵移動。",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `已將第 ${fromRowNumber} 列移至位置 ${toPosition}。`,
        rowValidationError: "此資料列存在驗證錯誤。",
        save: "儲存",
        saveRow: "儲存資料列",
        selectAllRows: "選取所有資料列",
        selectRow: (rowNumber: number) => `選取第 ${rowNumber} 列`
    },
    list: {
        noData: "沒有資料"
    },
    listBox: {
        clearSelection: "清除選取",
        moveDown: "向下移動",
        moveUp: "向上移動",
        remove: "移除",
        transferAllFrom: "從另一清單全部移入",
        transferAllTo: "全部移至另一清單",
        transferFrom: "從另一清單移入",
        transferTo: "移至另一清單"
    },
    multiSelect: {
        clear: "清除",
        itemsCount: (count: number) => `+ ${count} 項`
    },
    notification: {
        close: "關閉",
        error: "錯誤",
        info: "資訊",
        success: "成功",
        warning: "警告"
    },
    numericTextBox: {
        decrease: "減少數值",
        increase: "增加數值"
    },
    otpInput: {
        verificationCode: "驗證碼"
    },
    pager: {
        firstPageLabel: "第一頁",
        jumpBackwardLabel: (pages: number) => `後退 ${pages} 頁`,
        jumpForwardLabel: (pages: number) => `前進 ${pages} 頁`,
        lastPageLabel: "最後一頁",
        nextPageLabel: "下一頁",
        ofText: "/",
        pageLabel: (page: number) => `第 ${page} 頁`,
        pageSizeLabel: (pageSize: number) => `每頁 ${pageSize} 筆`,
        pageStatus: (page: number, totalPages: number) => `第 ${page} 頁，共 ${totalPages} 頁`,
        pageText: "頁",
        previousPageLabel: "上一頁",
        rangeStatus: (start: number, end: number, total: number) =>
            `第 ${start} - ${end} 項，共 ${total} 項`
    },
    rating: {
        notRated: "未評分",
        valueText: (value: number, max: number) => `第 ${value} 級，共 ${max} 級`
    },
    scrollView: {
        carousel: "輪播",
        nextPage: "下一頁",
        page: (current: number) => `第 ${current} 頁`,
        pageOf: (current: number, total: number) => `第 ${current} 頁，共 ${total} 頁`,
        previousPage: "上一頁",
        scrollPagerNext: "向後捲動分頁器",
        scrollPagerPrevious: "向前捲動分頁器",
        slide: "投影片"
    },
    sheet: {
        closeSheet: "關閉面板"
    },
    slider: {
        maximumValue: "最大值",
        minimumValue: "最小值",
        sliderValue: "滑桿數值"
    },
    spinner: {
        cancel: "取消",
        loading: "載入中"
    },
    splitButton: {
        menuButtonAriaLabel: "顯示選單選項",
        splitButton: (text: string) => (text ? `${text}，分割按鈕` : "分割按鈕")
    },
    splitter: {
        collapseDown: "摺疊下方窗格",
        collapseNext: "摺疊下一個窗格",
        collapsePrevious: "摺疊上一個窗格",
        collapseUp: "摺疊上方窗格",
        resizer: "調整大小控點"
    },
    stepper: {
        stepProgress: "步驟進度",
        stepper: "步驟指示器"
    },
    tabs: {
        closeTab: "關閉分頁",
        scrollNext: "向後捲動分頁",
        scrollPrevious: "向前捲動分頁"
    },
    textBox: {
        clear: "清除"
    },
    timePicker: {
        openTimePicker: "開啟時間選取器",
        timePicker: "時間選取器"
    },
    timeSelector: {
        am: "上午",
        amPm: "上午/下午",
        headerHours: "時",
        headerMinutes: "分",
        headerSeconds: "秒",
        hours: "小時",
        minutes: "分鐘",
        now: "目前時間",
        pm: "下午",
        seconds: "秒",
        set: "設定",
        timeSelector: "時間選取器"
    },
    treeView: {
        collapse: "摺疊",
        expand: "展開",
        filter: "篩選",
        filterTree: "篩選樹狀圖"
    },
    window: {
        close: "關閉",
        closeWindow: "關閉視窗",
        maximize: "最大化",
        minimize: "最小化",
        moveWindow: "移動視窗。使用方向鍵移動。",
        resizeBottom: "從底部調整視窗大小。使用方向鍵調整大小。",
        resizeBottomLeft: "從左下角調整視窗大小。使用方向鍵調整大小。",
        resizeBottomRight: "從右下角調整視窗大小。使用方向鍵調整大小。",
        resizeLeft: "從左側調整視窗大小。使用方向鍵調整大小。",
        resizeRight: "從右側調整視窗大小。使用方向鍵調整大小。",
        resizeTop: "從頂部調整視窗大小。使用方向鍵調整大小。",
        resizeTopLeft: "從左上角調整視窗大小。使用方向鍵調整大小。",
        resizeTopRight: "從右上角調整視窗大小。使用方向鍵調整大小。",
        restore: "還原"
    }
} satisfies MonaLocaleMessages;

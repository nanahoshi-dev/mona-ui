// Generated from zh-tw.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "zh-TW", options);
}

export const ZH_TW_MESSAGES = {
    autoComplete: {
        clear: "清除"
    },
    breadcrumb: {
        breadcrumb: "階層連結導航",
        showFullPath: "顯示完整路徑"
    },
    buttonGroup: {
        buttonGroup: "按鈕群組"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `${formattedMonthAndYear}行事曆`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}年至${localizeNumber(end, { useGrouping: false })}年`,
        decadeViewLabel: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}年至${localizeNumber(end, { useGrouping: false })}年十年檢視`,
        goToToday: (formattedDate: string) => `移至今天（${formattedDate}）`,
        nextDecade: "下個十年",
        nextMonth: "下個月",
        nextYear: "下一年",
        previousDecade: "上個十年",
        previousMonth: "上個月",
        previousYear: "上一年",
        switchToDecadeView: (currentYear: string) => `切換至十年檢視，目前為${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `切換至年份檢視，目前為${currentMonthAndYear}`,
        today: "今天",
        yearCellLabel: (year: number) => `${localizeNumber(year, { useGrouping: false })}年`,
        yearViewLabel: (year: string) => `年份檢視，${year}`
    },
    card: {
        actionsLabel: "卡片動作"
    },
    chart: {
        announcementSeparator: "，",
        brushApplied: (count: number) => `已套用框選，${localizeNumber(count)} 個點`,
        brushCleared: "已清除框選",
        brushRange: (from: string, to: string) => `框選 ${from} 至 ${to}`,
        category: "類別",
        categoryFallbackName: (index: number) => `類別 ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `從 ${from} 到 ${to}。`,
        change: "變動",
        changeValue: (change: string) => `變動 ${change}`,
        chart: "圖表",
        chartLegend: "圖例",
        chartRoleDescription: "圖表",
        close: "收盤價",
        closeAbbreviation: "收",
        colorScale: "色標",
        conversion: "轉換",
        conversionOfPrevious: (rate: string) => `相對上一階段的轉換率 ${rate}`,
        dataTableTruncated: (shown: number, total: number) =>
            `顯示 ${localizeNumber(total)} 列中的前 ${localizeNumber(shown)} 列。`,
        decrease: "減少",
        decreaseAnnouncement: (delta: string, from: string, to: string) => `減少 ${delta}，累計從 ${from} 到 ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}，${minimum} 至 ${midpoint} 至 ${maximum}`,
        dropOff: "流失",
        dropOffValue: (value: string) => `流失 ${value}`,
        falling: "下跌",
        gaugeRange: (minimum: string, maximum: string) => `範圍 ${minimum} 至 ${maximum}`,
        high: "最高價",
        highAbbreviation: "高",
        increase: "增加",
        increaseAnnouncement: (delta: string, from: string, to: string) => `增加 ${delta}，累計從 ${from} 到 ${to}`,
        itemDeselected: (item: string) => `${item}，已取消選取`,
        itemFallbackName: (index: number) => `項目 ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}，已選取`,
        keyboardHelp: "使用方向鍵在資料點之間移動，Home 和 End 跳到第一個和最後一個，Enter 或空白鍵啟用，Escape 清除。",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}：${value}`,
        low: "最低價",
        lowAbbreviation: "低",
        noChange: "無變化",
        noChangeAnnouncement: (value: string) => `無變化，累計 ${value}`,
        noData: "沒有可用資料",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `開盤價 ${open}，最高價 ${high}，最低價 ${low}，收盤價 ${close}`,
        open: "開盤價",
        openAbbreviation: "開",
        overall: "整體",
        overallConversion: (rate: string) => `整體轉換率 ${rate}`,
        pannedDown: "已向下平移",
        pannedLeft: "已向左平移",
        pannedRight: "已向右平移",
        pannedUp: "已向上平移",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) =>
            `第 ${localizeNumber(position)} 個，共 ${localizeNumber(total)} 個`,
        range: "範圍",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}，${minimum} 至 ${maximum}`,
        rangeValue: (from: string, to: string) => `${from} 至 ${to}`,
        rising: "上漲",
        runningTotal: "累計",
        seriesFallbackName: (index: number) => `數列 ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `已隱藏${series}`,
        seriesShown: (series: string) => `已顯示${series}`,
        seriesSummary: (count: number, names: string) => `${localizeNumber(count)} 個數列：${names}。`,
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}：最低 ${minimum}，最高 ${maximum}。`,
        shareOfTotal: (share: string) => `佔總計的 ${share}`,
        size: "大小",
        sizeValue: (size: string) => `大小 ${size}`,
        stackShare: (share: string) => `堆疊占比 ${share}`,
        stageFallbackName: (index: number) => `階段 ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `第 ${localizeNumber(position)} 階段，共 ${localizeNumber(total)} 個`,
        stepFallbackName: (index: number) => `步驟 ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `第 ${localizeNumber(position)} 步，共 ${localizeNumber(total)} 步`,
        subtotal: "小計",
        subtotalAnnouncement: (value: string) => `小計 ${value}`,
        total: "總計",
        totalAnnouncement: (value: string) => `總計 ${value}`,
        treemapGroup: (count: number) => `群組（${localizeNumber(count)} 個子項目）`,
        treemapLeaf: "葉節點",
        unchanged: "持平",
        value: "數值",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "檢視已重設為預設範圍",
        viewportResetToFull: "檢視已重設為完整範圍",
        visualIndicatorClamped: "視覺指示器已達極限",
        zoomedIn: "已放大",
        zoomedOut: "已縮小"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `移除${label}` : "移除項目")
    },
    colorGradient: {
        alpha: "透明通道",
        alphaText: (opacity: number) => `不透明度${localizeNumber(opacity)}%`,
        apply: "套用",
        blue: "藍色",
        cancel: "取消",
        clearColor: "清除顏色",
        colorCopied: "已複製顏色",
        colorGradient: "色彩漸層",
        copyAsHex: "複製為 HEX",
        copyAsRgb: "複製為 RGB",
        copyColor: "複製顏色",
        copyFailed: "無法複製顏色",
        currentColor: "目前顏色",
        green: "綠色",
        hexColor: "十六進位色彩",
        hue: "色相",
        previousColor: "先前顏色",
        red: "紅色",
        saturation: "飽和度",
        saturationAndValue: "飽和度與明度",
        saturationAndValueText: (saturation: number, value: number) =>
            `飽和度${localizeNumber(saturation)}%，明度${localizeNumber(value)}%`,
        switchColorMode: "切換色彩模式",
        value: "明度"
    },
    colorPalette: {
        color: (color: string) => `顏色: ${color}`,
        colorPalette: "調色盤",
        namedColor: (name: string, color: string) => `${name}，${color}`
    },
    colorPicker: {
        clearColor: "清除顏色",
        colorGradientPicker: "漸層色彩選取器",
        colorPalettePicker: "調色盤選取器",
        colorPicker: "色彩選取器",
        noColor: "無色彩"
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
            `${text}，第 ${localizeNumber(position)} 項（共 ${localizeNumber(total)} 項）`,
        noResultsFound: "找不到結果",
        resultsAvailable: (count: number) => `有 ${localizeNumber(count)} 個可用結果`
    },
    editor: {
        addColumnAfter: "在後方插入欄",
        addColumnBefore: "在前方插入欄",
        addHorizontalLine: "插入水平線",
        addRowAfter: "在後方插入列",
        addRowBefore: "在前方插入列",
        alignCenter: "置中對齊",
        alignEnd: "文字末端對齊",
        alignLeft: "靠左對齊",
        alignRight: "靠右對齊",
        alignStart: "文字起始端對齊",
        alignmentGroup: "對齊",
        altText: "替代文字",
        apply: "套用",
        backgroundColor: "背景顏色",
        bold: "粗體",
        cancel: "取消",
        codeBlock: "程式碼區塊",
        color: "顏色",
        contentLabel: "富文字編輯器",
        defaultFontFamily: "預設字型",
        deleteColumn: "刪除欄",
        deleteRow: "刪除列",
        deleteTable: "刪除表格",
        editLink: "編輯連結",
        enterUrl: "輸入 URL",
        fontSize: "字型大小",
        format: "格式",
        heading: (level: number) => `標題 ${localizeNumber(level)}`,
        heightPx: "高度 (px)",
        historyGroup: "歷程記錄",
        imageUrl: "圖片 URL",
        indent: "增加縮排",
        indentGroup: "縮排",
        insert: "插入",
        insertImage: "插入圖片",
        insertLink: "插入連結",
        insertOrderedList: "插入編號清單",
        insertTable: "插入表格",
        insertTaskList: "插入工作清單",
        insertUnorderedList: "插入項目符號清單",
        invalidUrl: "請輸入網址、mailto: 或 tel: 連結，或相對路徑。",
        italic: "斜體",
        justify: "左右對齊",
        linkGroup: "連結",
        listGroup: "清單",
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
        tableGroup: "表格",
        tableSize: (rows: number, columns: number) => `列：${localizeNumber(rows)}，欄：${localizeNumber(columns)}`,
        textStyleGroup: "文字樣式",
        toggleHeaderRow: "切換標題列",
        toolbar: "格式設定",
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
        logic: "組合條件",
        operator: "運算子",
        or: "或",
        secondOperator: "第二個運算子",
        secondValue: "第二個值",
        startsWith: "開頭為",
        value: "值"
    },
    grid: {
        all: "(全部)",
        apply: "套用",
        cancel: "取消",
        cancelNewRow: "取消新資料列",
        cancelRowEdit: (rowNumber: number) => `取消編輯第 ${localizeNumber(rowNumber)} 個資料列`,
        clearFilter: (column: string) => `清除 ${column} 的篩選`,
        collapseDetail: (rowNumber: number) => `收合第 ${localizeNumber(rowNumber)} 列的詳細資料`,
        columnGrouped: (column: string) => `已依 ${column} 分組`,
        columnMoved: (column: string, position: number) => `${column} 已移至第 ${localizeNumber(position)} 位`,
        columns: "欄",
        columnsSelected: (count: number) => `已選取 ${localizeNumber(count)} 欄`,
        commandColumnTitle: "命令",
        delete: "刪除",
        deleteRowConfirmation: (rowNumber: number) => `確定要刪除第 ${localizeNumber(rowNumber)} 個資料列嗎？`,
        deleteRowTitle: "刪除資料列？",
        details: "詳細資料",
        dragColumnHeaderToGroup: "拖曳欄位標題至此進行群組",
        edit: "編輯",
        editRow: (rowNumber: number) => `編輯第 ${localizeNumber(rowNumber)} 個資料列`,
        expandDetail: (rowNumber: number) => `展開第 ${localizeNumber(rowNumber)} 列的詳細資料`,
        fieldValidationError: "無效值。",
        filterByColumn: (column: string) => `依 ${column} 篩選`,
        filterByColumnFiltered: (column: string) => `依 ${column} 篩選（已篩選）`,
        filterOperator: (column: string, operator: string) => `${column} 的篩選運算子：${operator}`,
        filterPlaceholder: "篩選…",
        group: "群組",
        loading: "載入中",
        modified: "已修改",
        moveAsNext: "移至下一項",
        moveAsPrevious: "移至上一項",
        moveRow: "移動資料列",
        noData: "沒有資料",
        remove: "移除",
        removeRow: (rowNumber: number) => `移除第 ${localizeNumber(rowNumber)} 個資料列`,
        reorderRow: (rowNumber: number) => `重新排列第 ${localizeNumber(rowNumber)} 個資料列`,
        resizeColumn: (column: string) => `調整 ${column} 欄寬`,
        rowReorder: "資料列重新排序",
        rowReorderDisabled: "資料列重新排序已停用。",
        rowReorderDisabledEditing: "請完成編輯後再重新排列資料列。",
        rowReorderDisabledFiltered: "請清除篩選後再重新排列資料列。",
        rowReorderDisabledGrouped: "請清除群組後再重新排列資料列。",
        rowReorderDisabledServerBinding: "伺服器繫結時無法重新排列資料列。",
        rowReorderDisabledSingleRow: "至少需要兩個資料列才能重新排序。",
        rowReorderDisabledSorted: "請清除排序後再重新排列資料列。",
        rowReorderDisabledVirtualScroll: "啟用虛擬捲動時無法重新排列資料列。",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}。${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "使用 Alt + 向上鍵或 Alt + 向下鍵移動。",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `已將第 ${localizeNumber(fromRowNumber)} 個資料列移至位置 ${localizeNumber(toPosition)}。`,
        rowValidationError: "此資料列存在驗證錯誤。",
        save: "儲存",
        saveNewRow: "儲存新資料列",
        saveRow: (rowNumber: number) => `儲存第 ${localizeNumber(rowNumber)} 個資料列`,
        selectAllRows: "選取所有資料列",
        selectRow: (rowNumber: number) => `選取第 ${localizeNumber(rowNumber)} 個資料列`,
        sortOrder: (position: number) => `排序順序 ${localizeNumber(position)}`,
        toolbar: "表格工具列"
    },
    label: {
        optional: "選填"
    },
    list: {
        filterList: "篩選清單",
        loading: "載入中",
        noData: "沒有資料",
        pagerLabel: (list: string) => `${list}分頁`
    },
    listBox: {
        clearSelection: "清除選取",
        itemsMoved: (position: number, total: number) =>
            `已移至第 ${localizeNumber(position)} 位，共 ${localizeNumber(total)} 位`,
        itemsRemoved: (count: number) => `已移除 ${localizeNumber(count)} 項`,
        itemsTransferred: (count: number, list: string) => `已將 ${localizeNumber(count)} 項移至${list}`,
        itemsTransferredToOtherList: (count: number) => `已將 ${localizeNumber(count)} 項移至另一清單`,
        moveDown: "向下移動",
        moveUp: "向上移動",
        remove: "移除",
        selectionCleared: "已清除選取",
        toolbarLabel: (list: string) => `${list}操作`,
        transferAllFrom: "從另一清單全部移入",
        transferAllFromList: (list: string) => `從${list}全部移入`,
        transferAllTo: "全部移至另一清單",
        transferAllToList: (list: string) => `全部移至${list}`,
        transferFrom: "從另一清單移入",
        transferFromList: (list: string) => `從${list}移入`,
        transferTo: "移至另一清單",
        transferToList: (list: string) => `移至${list}`
    },
    multiSelect: {
        clear: "清除",
        itemsCount: (count: number) => `+ ${localizeNumber(count)} 項`,
        removeMoreItems: (count: number) => `移除其餘 ${localizeNumber(count)} 項`
    },
    notification: {
        close: "關閉",
        error: "錯誤",
        info: "資訊",
        region: "通知",
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
        itemsPerPageLabel: "每頁筆數",
        jumpBackwardLabel: (pages: number) => `後退 ${localizeNumber(pages)} 頁`,
        jumpForwardLabel: (pages: number) => `前進 ${localizeNumber(pages)} 頁`,
        lastPageLabel: "最後一頁",
        nextPageLabel: "下一頁",
        ofText: "/",
        pageInputPrefix: (_totalPages: number) => "第",
        pageInputSuffix: (totalPages: number) => `頁，共 ${localizeNumber(totalPages)} 頁`,
        pageLabel: (page: number) => `第 ${localizeNumber(page)} 頁`,
        pageSelectLabel: "頁",
        pageSizeLabel: (pageSize: number) => `每頁 ${localizeNumber(pageSize)} 筆`,
        pageStatus: (page: number, totalPages: number) =>
            `第 ${localizeNumber(page)} 頁，共 ${localizeNumber(totalPages)} 頁`,
        pageText: "頁",
        pagerLabel: "分頁",
        previousPageLabel: "上一頁",
        rangeStatus: (start: number, end: number, total: number) =>
            `第 ${localizeNumber(start)} - ${localizeNumber(end)} 項，共 ${localizeNumber(total)} 項`
    },
    progressBar: {
        label: "進度"
    },
    rating: {
        notRated: "未評分",
        valueText: (value: number, max: number) => `第 ${localizeNumber(value)} 級，共 ${localizeNumber(max)} 級`
    },
    scrollView: {
        carousel: "輪播",
        nextPage: "下一頁",
        page: (current: number) => `第 ${localizeNumber(current)} 頁`,
        pageOf: (current: number, total: number) => `第 ${localizeNumber(current)} 頁，共 ${localizeNumber(total)} 頁`,
        pages: "頁面",
        previousPage: "上一頁",
        scrollPagerNext: "向後捲動分頁器",
        scrollPagerPrevious: "向前捲動分頁器",
        slide: "投影片"
    },
    sheet: {
        closeSheet: "關閉面板"
    },
    sidebar: {
        drawerLabel: "側邊欄",
        rail: "顯示或隱藏側邊欄"
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
        menuButtonWithText: (text: string) => `更多${text}選項`,
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
        stepCompleted: "已完成",
        stepInvalid: "有錯誤",
        stepPosition: (current: number, total: number) =>
            `第 ${localizeNumber(current)} 步，共 ${localizeNumber(total)} 步`,
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
        filterLabel: (tree: string) => `篩選${tree}`,
        filterTree: "篩選樹狀檢視",
        loadError: (node: string) => `無法載入${node}中的項目`,
        loadingNode: (node: string) => `正在載入${node}`,
        movedAfter: (node: string, target: string) => `已將 ${node} 移到 ${target} 之後`,
        movedBefore: (node: string, target: string) => `已將 ${node} 移到 ${target} 之前`,
        movedInto: (node: string, target: string) => `已將 ${node} 移入 ${target}`,
        noData: "沒有資料",
        noMatches: "沒有符合的項目",
        results: (count: number) => `${localizeNumber(count)} 個結果`,
        retryLoading: (node: string) => `重試載入${node}`
    },
    window: {
        close: "關閉",
        closeWindow: "關閉視窗",
        maximize: "最大化",
        minimize: "最小化",
        moveOrResizeWindow: "移動或調整視窗大小。使用方向鍵移動，或使用 Ctrl 加方向鍵調整大小。",
        moveWindow: "移動視窗。使用方向鍵移動。",
        resizeBottom: "從底部調整視窗大小。使用方向鍵調整大小。",
        resizeBottomLeft: "從左下角調整視窗大小。使用方向鍵調整大小。",
        resizeBottomRight: "從右下角調整視窗大小。使用方向鍵調整大小。",
        resizeLeft: "從左側調整視窗大小。使用方向鍵調整大小。",
        resizeRight: "從右側調整視窗大小。使用方向鍵調整大小。",
        resizeTop: "從頂部調整視窗大小。使用方向鍵調整大小。",
        resizeTopLeft: "從左上角調整視窗大小。使用方向鍵調整大小。",
        resizeTopRight: "從右上角調整視窗大小。使用方向鍵調整大小。",
        resizeWindow: "調整視窗大小。使用 Ctrl 加方向鍵調整大小。",
        restore: "還原"
    }
} satisfies MonaLocaleMessages;

// Generated from zh-cn.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "zh-CN", options);
}

export const ZH_CN_MESSAGES = {
    autoComplete: {
        clear: "清除"
    },
    breadcrumb: {
        breadcrumb: "面包屑导航"
    },
    buttonGroup: {
        buttonGroup: "按钮组"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `${formattedMonthAndYear}日历`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}年至${localizeNumber(end, { useGrouping: false })}年`,
        decadeViewLabel: (start: number, end: number) =>
            `十年视图，${localizeNumber(start, { useGrouping: false })}年至${localizeNumber(end, { useGrouping: false })}年`,
        goToToday: (formattedDate: string) => `转到今天（${formattedDate}）`,
        nextDecade: "下一个十年",
        nextMonth: "下个月",
        nextYear: "下一年",
        previousDecade: "上一个十年",
        previousMonth: "上个月",
        previousYear: "上一年",
        switchToDecadeView: (currentYear: string) => `切换到十年视图，当前为${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `切换到年视图，当前为${currentMonthAndYear}`,
        today: "今天",
        yearCellLabel: (year: number) => `${localizeNumber(year, { useGrouping: false })}年`,
        yearViewLabel: (year: string) => `年视图，${year}`
    },
    card: {
        actionsLabel: "卡片操作"
    },
    chart: {
        change: "变动",
        chart: "图表",
        chartLegend: "图例",
        close: "收盘价",
        closeAbbreviation: "收",
        colorScale: "色标",
        conversion: "转化",
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}，${minimum} 至 ${midpoint} 至 ${maximum}`,
        dropOff: "流失",
        falling: "下跌",
        high: "最高价",
        highAbbreviation: "高",
        labelValueSeparator: ":",
        low: "最低价",
        lowAbbreviation: "低",
        noData: "没有可用数据",
        open: "开盘价",
        openAbbreviation: "开",
        overall: "总体",
        range: "范围",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}，${minimum} 至 ${maximum}`,
        rising: "上涨",
        runningTotal: "累计",
        size: "大小",
        unchanged: "持平",
        value: "数值",
        visualIndicatorClamped: "视觉指示器已被限制"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `删除${label}` : "删除项目")
    },
    colorGradient: {
        apply: "应用",
        cancel: "取消",
        clearColor: "清除颜色",
        copyAsHex: "复制为 HEX",
        copyAsRgb: "复制为 RGB",
        copyColor: "复制颜色",
        currentColor: "当前颜色",
        previousColor: "先前颜色",
        saturationAndValue: "饱和度与明度",
        saturationAndValueText: (saturation: number, value: number) =>
            `饱和度${localizeNumber(saturation)}%，明度${localizeNumber(value)}%`,
        switchColorMode: "切换颜色模式"
    },
    colorPalette: {
        color: (color: string) => `颜色: ${color}`,
        colorPalette: "调色板"
    },
    colorPicker: {
        clearColor: "清除颜色",
        colorGradientPicker: "渐变颜色选择器",
        colorPalettePicker: "调色板选择器",
        colorPicker: "颜色选择器"
    },
    comboBox: {
        clear: "清除"
    },
    datePicker: {
        datePicker: "日期选择器",
        openCalendar: "打开日历"
    },
    dateTimePicker: {
        calendar: "日历",
        cancel: "取消",
        date: "日期",
        dateTimePicker: "日期时间选择器",
        openDateTimePicker: "打开日期时间选择器",
        set: "设置",
        time: "时间",
        timePicker: "时间选择器"
    },
    dialog: {
        cancel: "取消",
        closeDialog: "关闭对话框",
        ok: "确定"
    },
    dropdownList: {
        clear: "清除"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}，第 ${localizeNumber(position)} 项（共 ${localizeNumber(total)} 项）`,
        noResultsFound: "未找到结果",
        resultsAvailable: (count: number) => `有 ${localizeNumber(count)} 条可用结果`
    },
    editor: {
        addColumnAfter: "在后方插入列",
        addColumnBefore: "在前方插入列",
        addHorizontalLine: "插入水平线",
        addRowAfter: "在后方插入行",
        addRowBefore: "在前方插入行",
        alignCenter: "居中对齐",
        alignLeft: "左对齐",
        alignRight: "右对齐",
        altText: "替代文本",
        backgroundColor: "背景颜色",
        bold: "粗体",
        cancel: "取消",
        codeBlock: "代码块",
        color: "颜色",
        deleteColumn: "删除列",
        deleteRow: "删除行",
        deleteTable: "删除表格",
        enterUrl: "输入 URL",
        fontSize: "字号",
        format: "格式",
        heading: (level: number) => `标题 ${localizeNumber(level)}`,
        heightPx: "高度 (px)",
        imageUrl: "图片 URL",
        indent: "增加缩进",
        insert: "插入",
        insertImage: "插入图片",
        insertLink: "插入链接",
        insertOrderedList: "插入有序列表",
        insertTable: "插入表格",
        insertTaskList: "插入任务列表",
        insertUnorderedList: "插入无序列表",
        italic: "斜体",
        justify: "两端对齐",
        mergeCells: "合并所选单元格",
        outdent: "减少缩进",
        paragraph: "段落",
        quotation: "引用",
        redo: "重做",
        removeLink: "移除链接",
        selectFontFamily: "选择字体",
        selectFontSize: "选择字号",
        splitCell: "拆分单元格",
        strikethrough: "删除线",
        subscript: "下标",
        superscript: "上标",
        toggleHeaderRow: "切换标题行",
        underline: "下划线",
        undo: "撤销",
        widthPx: "宽度 (px)"
    },
    filter: {
        and: "与",
        apply: "应用",
        clear: "清除",
        contains: "包含",
        doesNotContain: "不包含",
        endsWith: "结尾为",
        isAfter: "晚于",
        isAfterOrEqualTo: "晚于或等于",
        isBefore: "早于",
        isBeforeOrEqualTo: "早于或等于",
        isEmpty: "为空",
        isEqualTo: "等于",
        isFalse: "为假",
        isGreaterThan: "大于",
        isGreaterThanOrEqualTo: "大于或等于",
        isLessThan: "小于",
        isLessThanOrEqualTo: "小于或等于",
        isNotEmpty: "不为空",
        isNotEqualTo: "不等于",
        isNotNull: "不为 Null",
        isNotNullOrEmpty: "不为 Null 且不为空",
        isNull: "为 Null",
        isNullOrEmpty: "为 Null 或为空",
        isTrue: "为真",
        logic: "组合条件",
        operator: "运算符",
        or: "或",
        secondOperator: "第二个运算符",
        secondValue: "第二个值",
        startsWith: "开头为",
        value: "值"
    },
    grid: {
        all: "(全部)",
        apply: "应用",
        cancel: "取消",
        cancelNewRow: "取消新行",
        cancelRowEdit: (rowNumber: number) => `取消编辑第 ${localizeNumber(rowNumber)} 行`,
        clearFilter: (column: string) => `清除 ${column} 的筛选`,
        collapseDetail: (rowNumber: number) => `收起第 ${localizeNumber(rowNumber)} 行的详细信息`,
        columnGrouped: (column: string) => `已按 ${column} 分组`,
        columnMoved: (column: string, position: number) => `${column} 已移至第 ${localizeNumber(position)} 位`,
        columns: "列",
        columnsSelected: (count: number) => `已选择 ${localizeNumber(count)} 列`,
        commandColumnTitle: "命令",
        delete: "删除",
        deleteRowConfirmation: (rowNumber: number) => `确定要删除第 ${localizeNumber(rowNumber)} 行吗？`,
        deleteRowTitle: "删除行？",
        details: "详细信息",
        dragColumnHeaderToGroup: "拖动列标题到此处进行分组",
        edit: "编辑",
        editRow: (rowNumber: number) => `编辑第 ${localizeNumber(rowNumber)} 行`,
        expandDetail: (rowNumber: number) => `展开第 ${localizeNumber(rowNumber)} 行的详细信息`,
        fieldValidationError: "无效值。",
        filterByColumn: (column: string) => `按 ${column} 筛选`,
        filterByColumnFiltered: (column: string) => `按 ${column} 筛选（已筛选）`,
        filterOperator: (column: string, operator: string) => `${column} 的筛选运算符：${operator}`,
        filterPlaceholder: "筛选…",
        group: "分组",
        loading: "正在加载",
        modified: "已修改",
        moveAsNext: "移至下一项",
        moveAsPrevious: "移至上一项",
        moveRow: "移动行",
        noData: "没有数据",
        remove: "移除",
        removeRow: (rowNumber: number) => `移除第 ${localizeNumber(rowNumber)} 行`,
        reorderRow: (rowNumber: number) => `重新排列第 ${localizeNumber(rowNumber)} 行`,
        resizeColumn: (column: string) => `调整 ${column} 列宽`,
        rowReorder: "行重新排序",
        rowReorderDisabled: "行重新排序已禁用。",
        rowReorderDisabledEditing: "请完成编辑后再重新排列行。",
        rowReorderDisabledFiltered: "请清除筛选后再重新排列行。",
        rowReorderDisabledGrouped: "请清除分组后再重新排列行。",
        rowReorderDisabledServerBinding: "服务器绑定时无法重新排列行。",
        rowReorderDisabledSingleRow: "至少需要两行才能重新排列。",
        rowReorderDisabledSorted: "请清除排序后再重新排列行。",
        rowReorderDisabledVirtualScroll: "启用虚拟滚动时无法重新排列行。",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}。${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "使用 Alt + 向上键或 Alt + 向下键移动。",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `已将第 ${localizeNumber(fromRowNumber)} 行移动到位置 ${localizeNumber(toPosition)}。`,
        rowValidationError: "此行存在验证错误。",
        save: "保存",
        saveNewRow: "保存新行",
        saveRow: (rowNumber: number) => `保存第 ${localizeNumber(rowNumber)} 行`,
        selectAllRows: "选择所有行",
        selectRow: (rowNumber: number) => `选择第 ${localizeNumber(rowNumber)} 行`,
        sortOrder: (position: number) => `排序顺序 ${localizeNumber(position)}`,
        toolbar: "表格工具栏"
    },
    list: {
        filterList: "筛选列表",
        loading: "正在加载",
        noData: "没有数据",
        pagerLabel: (list: string) => `${list}分页`
    },
    listBox: {
        clearSelection: "清除选择",
        itemsMoved: (position: number, total: number) =>
            `已移至第 ${localizeNumber(position)} 位，共 ${localizeNumber(total)} 位`,
        itemsRemoved: (count: number) => `已移除 ${localizeNumber(count)} 项`,
        itemsTransferred: (count: number, list: string) => `已将 ${localizeNumber(count)} 项移至${list}`,
        itemsTransferredToOtherList: (count: number) => `已将 ${localizeNumber(count)} 项移至另一列表`,
        moveDown: "向下移动",
        moveUp: "向上移动",
        remove: "移除",
        selectionCleared: "已清除选择",
        toolbarLabel: (list: string) => `${list}操作`,
        transferAllFrom: "从另一列表全部移入",
        transferAllFromList: (list: string) => `从${list}全部移入`,
        transferAllTo: "全部移至另一列表",
        transferAllToList: (list: string) => `全部移至${list}`,
        transferFrom: "从另一列表移入",
        transferFromList: (list: string) => `从${list}移入`,
        transferTo: "移至另一列表",
        transferToList: (list: string) => `移至${list}`
    },
    multiSelect: {
        clear: "清除",
        itemsCount: (count: number) => `+ ${localizeNumber(count)} 项`,
        removeMoreItems: (count: number) => `删除其余 ${localizeNumber(count)} 项`
    },
    notification: {
        close: "关闭",
        error: "错误",
        info: "信息",
        success: "成功",
        warning: "警告"
    },
    numericTextBox: {
        decrease: "减少数值",
        increase: "增加数值"
    },
    otpInput: {
        verificationCode: "验证码"
    },
    pager: {
        firstPageLabel: "第一页",
        itemsPerPageLabel: "每页条数",
        jumpBackwardLabel: (pages: number) => `后退 ${localizeNumber(pages)} 页`,
        jumpForwardLabel: (pages: number) => `前进 ${localizeNumber(pages)} 页`,
        lastPageLabel: "最后一页",
        nextPageLabel: "下一页",
        ofText: "/",
        pageInputPrefix: (_totalPages: number) => "第",
        pageInputSuffix: (totalPages: number) => `页，共 ${localizeNumber(totalPages)} 页`,
        pageLabel: (page: number) => `第 ${localizeNumber(page)} 页`,
        pageSelectLabel: "页",
        pageSizeLabel: (pageSize: number) => `每页 ${localizeNumber(pageSize)} 条`,
        pageStatus: (page: number, totalPages: number) =>
            `第 ${localizeNumber(page)} 页，共 ${localizeNumber(totalPages)} 页`,
        pageText: "页",
        pagerLabel: "分页",
        previousPageLabel: "上一页",
        rangeStatus: (start: number, end: number, total: number) =>
            `第 ${localizeNumber(start)} - ${localizeNumber(end)} 项，共 ${localizeNumber(total)} 项`
    },
    rating: {
        notRated: "未评分",
        valueText: (value: number, max: number) => `第 ${localizeNumber(value)} 级，共 ${localizeNumber(max)} 级`
    },
    scrollView: {
        carousel: "轮播",
        nextPage: "下一页",
        page: (current: number) => `第 ${localizeNumber(current)} 页`,
        pageOf: (current: number, total: number) => `第 ${localizeNumber(current)} 页，共 ${localizeNumber(total)} 页`,
        previousPage: "上一页",
        scrollPagerNext: "向后滚动分页器",
        scrollPagerPrevious: "向前滚动分页器",
        slide: "幻灯片"
    },
    sheet: {
        closeSheet: "关闭面板"
    },
    slider: {
        maximumValue: "最大值",
        minimumValue: "最小值",
        sliderValue: "滑块数值"
    },
    spinner: {
        cancel: "取消",
        loading: "加载中"
    },
    splitButton: {
        menuButtonAriaLabel: "显示菜单选项",
        menuButtonWithText: (text: string) => `更多${text}选项`,
        splitButton: (text: string) => (text ? `${text}，拆分按钮` : "拆分按钮")
    },
    splitter: {
        collapseDown: "折叠下方窗格",
        collapseNext: "折叠下一个窗格",
        collapsePrevious: "折叠上一个窗格",
        collapseUp: "折叠上方窗格",
        resizer: "调整大小手柄"
    },
    stepper: {
        stepProgress: "步骤进度",
        stepper: "步骤指示器"
    },
    tabs: {
        closeTab: "关闭标签页",
        scrollNext: "向后滚动标签页",
        scrollPrevious: "向前滚动标签页"
    },
    textBox: {
        clear: "清除"
    },
    timePicker: {
        openTimePicker: "打开时间选择器",
        timePicker: "时间选择器"
    },
    timeSelector: {
        am: "上午",
        amPm: "上午/下午",
        headerHours: "时",
        headerMinutes: "分",
        headerSeconds: "秒",
        hours: "小时",
        minutes: "分钟",
        now: "当前时间",
        pm: "下午",
        seconds: "秒",
        set: "设置",
        timeSelector: "时间选择器"
    },
    treeView: {
        collapse: "折叠",
        expand: "展开",
        filter: "筛选",
        filterLabel: (tree: string) => `筛选${tree}`,
        filterTree: "筛选树",
        loadError: (node: string) => `无法加载${node}中的项目`,
        loadingNode: (node: string) => `正在加载${node}`,
        movedAfter: (node: string, target: string) => `已将 ${node} 移到 ${target} 之后`,
        movedBefore: (node: string, target: string) => `已将 ${node} 移到 ${target} 之前`,
        movedInto: (node: string, target: string) => `已将 ${node} 移入 ${target}`,
        noData: "没有数据",
        noMatches: "没有匹配的项目",
        results: (count: number) => `${localizeNumber(count)} 个结果`,
        retryLoading: (node: string) => `重试加载${node}`
    },
    window: {
        close: "关闭",
        closeWindow: "关闭窗口",
        maximize: "最大化",
        minimize: "最小化",
        moveOrResizeWindow: "移动或调整窗口大小。使用方向键移动，或使用 Ctrl 加方向键调整大小。",
        moveWindow: "移动窗口。使用方向键移动。",
        resizeBottom: "从底部调整窗口大小。使用方向键调整大小。",
        resizeBottomLeft: "从左下角调整窗口大小。使用方向键调整大小。",
        resizeBottomRight: "从右下角调整窗口大小。使用方向键调整大小。",
        resizeLeft: "从左侧调整窗口大小。使用方向键调整大小。",
        resizeRight: "从右侧调整窗口大小。使用方向键调整大小。",
        resizeTop: "从顶部调整窗口大小。使用方向键调整大小。",
        resizeTopLeft: "从左上角调整窗口大小。使用方向键调整大小。",
        resizeTopRight: "从右上角调整窗口大小。使用方向键调整大小。",
        resizeWindow: "调整窗口大小。使用 Ctrl 加方向键调整大小。",
        restore: "还原"
    }
} satisfies MonaLocaleMessages;

import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const JA_JP_MESSAGES = {
    autoComplete: {
        clear: "クリア"
    },
    breadcrumb: {
        breadcrumb: "パンくずリスト"
    },
    buttonGroup: {
        buttonGroup: "ボタングループ"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `${formattedMonthAndYear}のカレンダー`,
        decadeRange: (start: number, end: number) => `${start}年～${end}年`,
        decadeViewLabel: (start: number, end: number) => `${start}年から${end}年までの10年表示`,
        goToToday: (formattedDate: string) => `今日（${formattedDate}）に移動`,
        nextDecade: "次の10年間",
        nextMonth: "次の月",
        nextYear: "次の年",
        previousDecade: "前の10年間",
        previousMonth: "前の月",
        previousYear: "前の年",
        switchToDecadeView: (currentYear: string) => `10年表示に切り替える。現在は${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `年表示に切り替える。現在は${currentMonthAndYear}`,
        today: "今日",
        yearCellLabel: (year: number) => `${year}年`,
        yearViewLabel: (year: string) => `年表示、${year}`
    },
    card: {
        actionsLabel: "カードのアクション"
    },
    chart: {
        change: "変化",
        chart: "チャート",
        chartLegend: "凡例",
        close: "終値",
        closeAbbreviation: "終",
        colorScale: "カラースケール",
        conversion: "コンバージョン",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}、${minimum}から${maximum}まで、中間点${midpoint}`,
        dropOff: "離脱",
        falling: "下降",
        high: "高値",
        highAbbreviation: "高",
        labelValueSeparator: ":",
        low: "安値",
        lowAbbreviation: "安",
        noData: "データがありません",
        open: "始値",
        openAbbreviation: "始",
        overall: "全体",
        range: "範囲",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}、${minimum}から${maximum}まで`,
        rising: "上昇",
        runningTotal: "累計",
        size: "サイズ",
        unchanged: "変化なし",
        value: "値",
        visualIndicatorClamped: "視覚インジケーターが制限されています"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `${label}を削除` : "項目を削除")
    },
    colorGradient: {
        apply: "適用",
        cancel: "キャンセル",
        clearColor: "色をクリア",
        copyAsHex: "HEXとしてコピー",
        copyAsRgb: "RGBとしてコピー",
        copyColor: "色をコピー",
        currentColor: "現在の色",
        previousColor: "前の色",
        saturationAndValue: "彩度と明度",
        saturationAndValueText: (saturation: number, value: number) =>
            `彩度${saturation}%、明度${value}%`,
        switchColorMode: "カラーモードを切り替え"
    },
    colorPalette: {
        color: (color: string) => `色: ${color}`,
        colorPalette: "カラーパレット"
    },
    colorPicker: {
        clearColor: "色をクリア",
        colorGradientPicker: "カラーグラデーションピッカー",
        colorPalettePicker: "カラーパレットピッカー",
        colorPicker: "カラーピッカー"
    },
    comboBox: {
        clear: "クリア"
    },
    datePicker: {
        datePicker: "日付選択",
        openCalendar: "カレンダーを開く"
    },
    dateTimePicker: {
        calendar: "カレンダー",
        cancel: "キャンセル",
        date: "日付",
        dateTimePicker: "日時選択",
        openDateTimePicker: "日時選択を開く",
        set: "設定",
        time: "時刻",
        timePicker: "時刻選択"
    },
    dialog: {
        cancel: "キャンセル",
        closeDialog: "ダイアログを閉じる",
        ok: "OK"
    },
    dropdownList: {
        clear: "クリア"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}、${total}件中${position}件目`,
        noResultsFound: "結果が見つかりません",
        resultsAvailable: (count: number) => `${count}件の結果があります`
    },
    editor: {
        addColumnAfter: "後に列を挿入",
        addColumnBefore: "前に列を挿入",
        addHorizontalLine: "水平線を挿入",
        addRowAfter: "後に行を挿入",
        addRowBefore: "前に行を挿入",
        alignCenter: "中央揃え",
        alignLeft: "左揃え",
        alignRight: "右揃え",
        altText: "代替テキスト",
        backgroundColor: "背景色",
        bold: "太字",
        cancel: "キャンセル",
        codeBlock: "コードブロック",
        color: "色",
        deleteColumn: "列を削除",
        deleteRow: "行を削除",
        deleteTable: "表を削除",
        enterUrl: "URLを入力",
        fontSize: "フォントサイズ",
        format: "書式",
        heading: (level: number) => `見出し${level}`,
        heightPx: "高さ (px)",
        imageUrl: "画像URL",
        indent: "インデントを増やす",
        insert: "挿入",
        insertImage: "画像を挿入",
        insertLink: "リンクを挿入",
        insertOrderedList: "番号付きリストを挿入",
        insertTable: "表を挿入",
        insertTaskList: "タスクリストを挿入",
        insertUnorderedList: "箇条書きを挿入",
        italic: "斜体",
        justify: "両端揃え",
        mergeCells: "選択したセルを結合",
        outdent: "インデントを減らす",
        paragraph: "段落",
        quotation: "引用",
        redo: "やり直す",
        removeLink: "リンクを削除",
        selectFontFamily: "フォントを選択",
        selectFontSize: "フォントサイズを選択",
        splitCell: "セルを分割",
        strikethrough: "取り消し線",
        subscript: "下付き",
        superscript: "上付き",
        toggleHeaderRow: "ヘッダー行の切り替え",
        underline: "下線",
        undo: "元に戻す",
        widthPx: "幅 (px)"
    },
    filter: {
        and: "かつ",
        apply: "適用",
        clear: "クリア",
        contains: "含む",
        doesNotContain: "含まない",
        endsWith: "で終わる",
        isAfter: "より後",
        isAfterOrEqualTo: "以降",
        isBefore: "より前",
        isBeforeOrEqualTo: "以前",
        isEmpty: "空である",
        isEqualTo: "等しい",
        isFalse: "false である",
        isGreaterThan: "より大きい",
        isGreaterThanOrEqualTo: "以上",
        isLessThan: "より小さい",
        isLessThanOrEqualTo: "以下",
        isNotEmpty: "空ではない",
        isNotEqualTo: "等しくない",
        isNotNull: "null ではない",
        isNotNullOrEmpty: "null でも空でもない",
        isNull: "null である",
        isNullOrEmpty: "null または空である",
        isTrue: "true である",
        or: "または",
        startsWith: "で始まる"
    },
    grid: {
        all: "(すべて)",
        apply: "適用",
        cancel: "キャンセル",
        cancelRowEdit: "行の編集をキャンセル",
        columns: "列",
        columnsSelected: (count: number) => `${count}列を選択中`,
        delete: "削除",
        deleteRowConfirmation: "この行を削除しますか？",
        deleteRowTitle: "行を削除",
        dragColumnHeaderToGroup: "グループ化するには列ヘッダーをここにドラッグします",
        edit: "編集",
        editRow: "行を編集",
        fieldValidationError: "値が無効です。",
        filterByColumn: (column: string) => `${column}でフィルター`,
        filterPlaceholder: "フィルター...",
        modified: "変更済み",
        moveAsNext: "次へ移動",
        moveAsPrevious: "前へ移動",
        moveRow: "行を移動",
        noData: "データがありません",
        remove: "削除",
        removeRow: "行を削除",
        reorderRow: (rowNumber: number) => `${rowNumber}行目を並べ替え`,
        resizeColumn: "列のサイズを変更",
        rowReorder: "行の並べ替え",
        rowReorderDisabled: "行の並べ替えは無効です。",
        rowReorderDisabledEditing: "行を並べ替える前に編集を完了してください。",
        rowReorderDisabledFiltered: "行を並べ替える前にフィルターを解除してください。",
        rowReorderDisabledGrouped: "行を並べ替える前にグループ化を解除してください。",
        rowReorderDisabledSingleRow: "行を並べ替えるには2行以上必要です。",
        rowReorderDisabledSorted: "行を並べ替える前に並び替えを解除してください。",
        rowReorderDisabledVirtualScroll:
            "仮想スクロールが有効な場合、行の並べ替えは使用できません。",
        rowReorderKeyboardHint:
            "Alt + 上矢印または Alt + 下矢印で行を移動します。",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `${fromRowNumber}行目を${toPosition}番目の位置に移動しました。`,
        rowValidationError: "この行には入力エラーがあります。",
        save: "保存",
        saveRow: "行を保存",
        selectAllRows: "すべての行を選択",
        selectRow: (rowNumber: number) => `${rowNumber}行目を選択`
    },
    list: {
        noData: "データがありません"
    },
    listBox: {
        clearSelection: "選択をクリア",
        moveDown: "下へ移動",
        moveUp: "上へ移動",
        remove: "削除",
        transferAllFrom: "すべてをもう一方のリストから移動",
        transferAllTo: "すべてをもう一方のリストへ移動",
        transferFrom: "もう一方のリストから移動",
        transferTo: "もう一方のリストへ移動"
    },
    multiSelect: {
        clear: "クリア",
        itemsCount: (count: number) => `+ ${count}件`
    },
    notification: {
        close: "閉じる",
        error: "エラー",
        info: "情報",
        success: "成功",
        warning: "警告"
    },
    numericTextBox: {
        decrease: "値を減らす",
        increase: "値を増やす"
    },
    otpInput: {
        verificationCode: "確認コード"
    },
    pager: {
        firstPageLabel: "最初のページ",
        jumpBackwardLabel: (pages: number) => `${pages}ページ戻る`,
        jumpForwardLabel: (pages: number) => `${pages}ページ進む`,
        lastPageLabel: "最後のページ",
        nextPageLabel: "次のページ",
        ofText: "/",
        pageLabel: (page: number) => `${page}ページ`,
        pageSizeLabel: (pageSize: number) => `1ページあたり${pageSize}件`,
        pageStatus: (page: number, totalPages: number) => `${totalPages}ページ中${page}ページ`,
        pageText: "ページ",
        previousPageLabel: "前のページ",
        rangeStatus: (start: number, end: number, total: number) =>
            `全${total}件中${start}～${end}件`
    },
    rating: {
        notRated: "未評価",
        valueText: (value: number, max: number) => `${max}段階中${value}`
    },
    scrollView: {
        carousel: "カルーセル",
        nextPage: "次のページ",
        page: (current: number) => `${current}ページ`,
        pageOf: (current: number, total: number) => `${total}ページ中${current}ページ`,
        previousPage: "前のページ",
        scrollPagerNext: "ページャーを次へスクロール",
        scrollPagerPrevious: "ページャーを前へスクロール",
        slide: "スライド"
    },
    sheet: {
        closeSheet: "シートを閉じる"
    },
    slider: {
        maximumValue: "最大値",
        minimumValue: "最小値",
        sliderValue: "スライダーの値"
    },
    spinner: {
        cancel: "キャンセル",
        loading: "読み込み中"
    },
    splitButton: {
        menuButtonAriaLabel: "メニューオプションを表示",
        splitButton: (text: string) => (text ? `${text}、分割ボタン` : "分割ボタン")
    },
    splitter: {
        collapseDown: "下のペインを折りたたむ",
        collapseNext: "次のペインを折りたたむ",
        collapsePrevious: "前のペインを折りたたむ",
        collapseUp: "上のペインを折りたたむ",
        resizer: "サイズ変更ハンドル"
    },
    stepper: {
        stepProgress: "ステップの進行状況",
        stepper: "ステップ表示"
    },
    tabs: {
        closeTab: "タブを閉じる",
        scrollNext: "タブを次へスクロール",
        scrollPrevious: "タブを前へスクロール"
    },
    textBox: {
        clear: "クリア"
    },
    timePicker: {
        openTimePicker: "時刻選択を開く",
        timePicker: "時刻選択"
    },
    timeSelector: {
        am: "午前",
        amPm: "午前/午後",
        headerHours: "時",
        headerMinutes: "分",
        headerSeconds: "秒",
        hours: "時",
        minutes: "分",
        now: "現在時刻",
        pm: "午後",
        seconds: "秒",
        set: "設定",
        timeSelector: "時刻選択"
    },
    treeView: {
        collapse: "折りたたむ",
        expand: "展開",
        filter: "フィルター",
        filterTree: "ツリーをフィルター"
    },
    window: {
        close: "閉じる",
        closeWindow: "ウィンドウを閉じる",
        maximize: "最大化",
        minimize: "最小化",
        moveWindow: "ウィンドウを移動。矢印キーで移動します。",
        resizeBottom: "下辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeBottomLeft:
            "左下隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeBottomRight:
            "右下隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeLeft: "左辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeRight: "右辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeTop: "上辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeTopLeft:
            "左上隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeTopRight:
            "右上隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        restore: "元のサイズに戻す"
    }
} satisfies MonaLocaleMessages;

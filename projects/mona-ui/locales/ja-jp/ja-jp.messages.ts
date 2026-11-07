// Generated from ja-jp.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "ja-JP", options);
}

export const JA_JP_MESSAGES = {
    autoComplete: {
        clear: "クリア"
    },
    breadcrumb: {
        breadcrumb: "パンくずリスト",
        showFullPath: "パス全体を表示"
    },
    buttonGroup: {
        buttonGroup: "ボタングループ"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `${formattedMonthAndYear}のカレンダー`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}年～${localizeNumber(end, { useGrouping: false })}年`,
        decadeViewLabel: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}年から${localizeNumber(end, { useGrouping: false })}年までの10年表示`,
        goToToday: (formattedDate: string) => `今日（${formattedDate}）に移動`,
        nextDecade: "次の10年間",
        nextMonth: "次の月",
        nextYear: "次の年",
        previousDecade: "前の10年間",
        previousMonth: "前の月",
        previousYear: "前の年",
        switchToDecadeView: (currentYear: string) => `10年表示に切り替える。現在は${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) => `年表示に切り替える。現在は${currentMonthAndYear}`,
        today: "今日",
        yearCellLabel: (year: number) => `${localizeNumber(year, { useGrouping: false })}年`,
        yearViewLabel: (year: string) => `年表示、${year}`
    },
    card: {
        actionsLabel: "カードのアクション"
    },
    chart: {
        announcementSeparator: "、",
        brushApplied: (count: number) => `範囲選択を適用しました、${localizeNumber(count)} 点`,
        brushCleared: "範囲選択を解除しました",
        brushRange: (from: string, to: string) => `${from} から ${to} までを範囲選択`,
        category: "カテゴリ",
        categoryFallbackName: (index: number) => `カテゴリ ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `${from} から ${to} まで。`,
        change: "変化",
        changeValue: (change: string) => `変化 ${change}`,
        chart: "チャート",
        chartLegend: "凡例",
        chartRoleDescription: "グラフ",
        close: "終値",
        closeAbbreviation: "終",
        colorScale: "カラースケール",
        conversion: "コンバージョン",
        conversionOfPrevious: (rate: string) => `前の段階からのコンバージョン ${rate}`,
        dataTableTruncated: (shown: number, total: number) =>
            `${localizeNumber(total)} 行のうち最初の ${localizeNumber(shown)} 行を表示しています。`,
        decrease: "減少",
        decreaseAnnouncement: (delta: string, from: string, to: string) => `減少 ${delta}、累計 ${from} から ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}、${minimum}から${maximum}まで、中間点${midpoint}`,
        dropOff: "離脱",
        dropOffValue: (value: string) => `離脱 ${value}`,
        falling: "下降",
        gaugeRange: (minimum: string, maximum: string) => `範囲 ${minimum} から ${maximum}`,
        high: "高値",
        highAbbreviation: "高",
        increase: "増加",
        increaseAnnouncement: (delta: string, from: string, to: string) => `増加 ${delta}、累計 ${from} から ${to}`,
        itemDeselected: (item: string) => `${item}、選択解除`,
        itemFallbackName: (index: number) => `項目 ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}、選択済み`,
        keyboardHelp:
            "矢印キーでデータポイント間を移動、Home と End で最初と最後に移動、Enter または Space で実行、Escape でクリアします。",
        labelValueSeparator: ":",
        labeledValue: (label: string, value: string) => `${label}：${value}`,
        low: "安値",
        lowAbbreviation: "安",
        noChange: "変化なし",
        noChangeAnnouncement: (value: string) => `変化なし、累計 ${value}`,
        noData: "データがありません",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `始値 ${open}、高値 ${high}、安値 ${low}、終値 ${close}`,
        open: "始値",
        openAbbreviation: "始",
        overall: "全体",
        overallConversion: (rate: string) => `全体のコンバージョン ${rate}`,
        pannedDown: "下に移動しました",
        pannedLeft: "左に移動しました",
        pannedRight: "右に移動しました",
        pannedUp: "上に移動しました",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)}/${localizeNumber(total)}`,
        range: "範囲",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}、${minimum}から${maximum}まで`,
        rangeValue: (from: string, to: string) => `${from} から ${to}`,
        rising: "上昇",
        runningTotal: "累計",
        seriesFallbackName: (index: number) => `系列 ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series} を非表示`,
        seriesShown: (series: string) => `${series} を表示`,
        seriesSummary: (count: number, names: string) => `${localizeNumber(count)} 系列：${names}。`,
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}：最小 ${minimum}、最大 ${maximum}。`,
        shareOfTotal: (share: string) => `合計の ${share}`,
        size: "サイズ",
        sizeValue: (size: string) => `サイズ ${size}`,
        stackShare: (share: string) => `積み上げ比率 ${share}`,
        stageFallbackName: (index: number) => `段階 ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) => `段階 ${localizeNumber(position)}/${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `ステップ ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `ステップ ${localizeNumber(position)}/${localizeNumber(total)}`,
        subtotal: "小計",
        subtotalAnnouncement: (value: string) => `小計 ${value}`,
        total: "合計",
        totalAnnouncement: (value: string) => `合計 ${value}`,
        treemapGroup: (count: number) => `グループ (子 ${localizeNumber(count)} 個)`,
        treemapLeaf: "リーフ",
        unchanged: "変化なし",
        value: "値",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "表示範囲を既定の範囲にリセットしました",
        viewportResetToFull: "表示範囲を全範囲にリセットしました",
        visualIndicatorClamped: "視覚インジケーターが制限されています",
        zoomedIn: "拡大しました",
        zoomedOut: "縮小しました"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `${label}を削除` : "項目を削除")
    },
    colorGradient: {
        alpha: "アルファ",
        alphaText: (opacity: number) => `不透明度${localizeNumber(opacity)}%`,
        apply: "適用",
        blue: "青",
        cancel: "キャンセル",
        clearColor: "色をクリア",
        colorCopied: "色をコピーしました",
        colorGradient: "カラーグラデーション",
        copyAsHex: "HEXとしてコピー",
        copyAsRgb: "RGBとしてコピー",
        copyColor: "色をコピー",
        copyFailed: "色をコピーできませんでした",
        currentColor: "現在の色",
        green: "緑",
        hexColor: "16進カラー",
        hue: "色相",
        previousColor: "前の色",
        red: "赤",
        saturation: "彩度",
        saturationAndValue: "彩度と明度",
        saturationAndValueText: (saturation: number, value: number) =>
            `彩度${localizeNumber(saturation)}%、明度${localizeNumber(value)}%`,
        switchColorMode: "カラーモードを切り替え",
        value: "明度"
    },
    colorPalette: {
        color: (color: string) => `色: ${color}`,
        colorPalette: "カラーパレット",
        namedColor: (name: string, color: string) => `${name}、${color}`
    },
    colorPicker: {
        clearColor: "色をクリア",
        colorGradientPicker: "カラーグラデーションピッカー",
        colorPalettePicker: "カラーパレットピッカー",
        colorPicker: "カラーピッカー",
        noColor: "色なし"
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
            `${text}、${localizeNumber(total)}件中${localizeNumber(position)}件目`,
        noResultsFound: "結果が見つかりません",
        resultsAvailable: (count: number) => `${localizeNumber(count)}件の結果があります`
    },
    editor: {
        addColumnAfter: "後に列を挿入",
        addColumnBefore: "前に列を挿入",
        addHorizontalLine: "水平線を挿入",
        addRowAfter: "後に行を挿入",
        addRowBefore: "前に行を挿入",
        alignCenter: "中央揃え",
        alignEnd: "テキストを末尾揃え",
        alignLeft: "左揃え",
        alignRight: "右揃え",
        alignStart: "テキストを先頭揃え",
        alignmentGroup: "配置",
        altText: "代替テキスト",
        apply: "適用",
        backgroundColor: "背景色",
        bold: "太字",
        cancel: "キャンセル",
        codeBlock: "コードブロック",
        color: "色",
        contentLabel: "リッチテキストエディター",
        defaultFontFamily: "既定のフォント",
        deleteColumn: "列を削除",
        deleteRow: "行を削除",
        deleteTable: "表を削除",
        editLink: "リンクを編集",
        enterUrl: "URLを入力",
        fontSize: "フォントサイズ",
        format: "書式",
        heading: (level: number) => `見出し${localizeNumber(level)}`,
        heightPx: "高さ (px)",
        historyGroup: "履歴",
        imageUrl: "画像URL",
        indent: "インデントを増やす",
        indentGroup: "インデント",
        insert: "挿入",
        insertImage: "画像を挿入",
        insertLink: "リンクを挿入",
        insertOrderedList: "番号付きリストを挿入",
        insertTable: "表を挿入",
        insertTaskList: "タスクリストを挿入",
        insertUnorderedList: "箇条書きを挿入",
        invalidUrl: "Web アドレス、mailto: または tel: のリンク、または相対パスを入力してください。",
        italic: "斜体",
        justify: "両端揃え",
        linkGroup: "リンク",
        listGroup: "リスト",
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
        tableGroup: "表",
        tableSize: (rows: number, columns: number) => `行: ${localizeNumber(rows)}、列: ${localizeNumber(columns)}`,
        textStyleGroup: "文字スタイル",
        toggleHeaderRow: "ヘッダー行の切り替え",
        toolbar: "書式設定",
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
        logic: "条件の結合",
        operator: "演算子",
        or: "または",
        secondOperator: "2番目の演算子",
        secondValue: "2番目の値",
        startsWith: "で始まる",
        value: "値"
    },
    grid: {
        all: "(すべて)",
        apply: "適用",
        cancel: "キャンセル",
        cancelNewRow: "新しい行を破棄",
        cancelRowEdit: (rowNumber: number) => `${localizeNumber(rowNumber)}行目の編集をキャンセル`,
        clearFilter: (column: string) => `${column}のフィルターをクリア`,
        collapseDetail: (rowNumber: number) => `${localizeNumber(rowNumber)}行目の詳細を折りたたむ`,
        columnGrouped: (column: string) => `${column} でグループ化しました`,
        columnMoved: (column: string, position: number) =>
            `${column} を ${localizeNumber(position)} 番目に移動しました`,
        columns: "列",
        columnsSelected: (count: number) => `${localizeNumber(count)}列を選択中`,
        commandColumnTitle: "コマンド",
        delete: "削除",
        deleteRowConfirmation: (rowNumber: number) => `${localizeNumber(rowNumber)}行目を削除しますか？`,
        deleteRowTitle: "行を削除",
        details: "詳細",
        dragColumnHeaderToGroup: "グループ化するには列ヘッダーをここにドラッグします",
        edit: "編集",
        editRow: (rowNumber: number) => `${localizeNumber(rowNumber)}行目を編集`,
        expandDetail: (rowNumber: number) => `${localizeNumber(rowNumber)}行目の詳細を展開`,
        fieldValidationError: "値が無効です。",
        filterByColumn: (column: string) => `${column}でフィルター`,
        filterByColumnFiltered: (column: string) => `${column}でフィルター（適用中）`,
        filterOperator: (column: string, operator: string) => `${column}のフィルター演算子: ${operator}`,
        filterPlaceholder: "フィルター...",
        group: "グループ",
        groupOptions: (column: string) => `${column} のグループオプション`,
        loading: "読み込み中",
        modified: "変更済み",
        moveAsNext: "次へ移動",
        moveAsPrevious: "前へ移動",
        moveRow: "行を移動",
        noData: "データがありません",
        remove: "削除",
        removeRow: (rowNumber: number) => `${localizeNumber(rowNumber)}行目を削除`,
        reorderRow: (rowNumber: number) => `${localizeNumber(rowNumber)}行目を並べ替え`,
        resizeColumn: (column: string) => `${column} 列のサイズを変更`,
        rowReorder: "行の並べ替え",
        rowReorderDisabled: "行の並べ替えは無効です。",
        rowReorderDisabledEditing: "行を並べ替える前に編集を完了してください。",
        rowReorderDisabledFiltered: "行を並べ替える前にフィルターを解除してください。",
        rowReorderDisabledGrouped: "行を並べ替える前にグループ化を解除してください。",
        rowReorderDisabledServerBinding: "サーバーバインディングでは行を並べ替えられません。",
        rowReorderDisabledSingleRow: "行を並べ替えるには2行以上必要です。",
        rowReorderDisabledSorted: "行を並べ替える前にソートを解除してください。",
        rowReorderDisabledVirtualScroll: "仮想スクロールが有効な場合、行の並べ替えは使用できません。",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}。${keyboardHint}${disabledReason ?? ""}`,
        rowReorderKeyboardHint: "Alt + 上矢印または Alt + 下矢印で行を移動します。",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `${localizeNumber(fromRowNumber)}行目を${localizeNumber(toPosition)}番目の位置に移動しました。`,
        rowValidationError: "この行には入力エラーがあります。",
        save: "保存",
        saveNewRow: "新しい行を保存",
        saveRow: (rowNumber: number) => `${localizeNumber(rowNumber)}行目を保存`,
        selectAllRows: "すべての行を選択",
        selectRow: (rowNumber: number) => `${localizeNumber(rowNumber)}行目を選択`,
        sortOrder: (position: number) => `並べ替え順 ${localizeNumber(position)}`,
        toolbar: "表のツールバー"
    },
    label: {
        optional: "任意"
    },
    list: {
        filterList: "リストをフィルター",
        loading: "読み込み中",
        noData: "データがありません",
        pagerLabel: (list: string) => `${list}のページ送り`
    },
    listBox: {
        clearSelection: "選択をクリア",
        itemsMoved: (position: number, total: number) =>
            `${localizeNumber(total)}件中${localizeNumber(position)}番目に移動しました`,
        itemsRemoved: (count: number) => `${localizeNumber(count)}件を削除しました`,
        itemsTransferred: (count: number, list: string) => `${localizeNumber(count)}件を${list}へ移動しました`,
        itemsTransferredToOtherList: (count: number) => `${localizeNumber(count)}件をもう一方のリストへ移動しました`,
        moveDown: "下へ移動",
        moveUp: "上へ移動",
        remove: "削除",
        selectionCleared: "選択をクリアしました",
        toolbarLabel: (list: string) => `${list}の操作`,
        transferAllFrom: "すべてをもう一方のリストから移動",
        transferAllFromList: (list: string) => `すべてを${list}から移動`,
        transferAllTo: "すべてをもう一方のリストへ移動",
        transferAllToList: (list: string) => `すべてを${list}へ移動`,
        transferFrom: "もう一方のリストから移動",
        transferFromList: (list: string) => `${list}から移動`,
        transferTo: "もう一方のリストへ移動",
        transferToList: (list: string) => `${list}へ移動`
    },
    multiSelect: {
        clear: "クリア",
        itemsCount: (count: number) => `+ ${localizeNumber(count)}件`,
        removeMoreItems: (count: number) => `他の${localizeNumber(count)}件を削除`
    },
    notification: {
        close: "閉じる",
        error: "エラー",
        info: "情報",
        region: "通知",
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
        itemsPerPageLabel: "1ページあたりの件数",
        jumpBackwardLabel: (pages: number) => `${localizeNumber(pages)}ページ戻る`,
        jumpForwardLabel: (pages: number) => `${localizeNumber(pages)}ページ進む`,
        lastPageLabel: "最後のページ",
        nextPageLabel: "次のページ",
        ofText: "/",
        pageInputPrefix: (totalPages: number) => `${localizeNumber(totalPages)}ページ中`,
        pageInputSuffix: (_totalPages: number) => "ページ",
        pageLabel: (page: number) => `${localizeNumber(page)}ページ`,
        pageSelectLabel: "ページ",
        pageSizeLabel: (pageSize: number) => `1ページあたり${localizeNumber(pageSize)}件`,
        pageStatus: (page: number, totalPages: number) =>
            `${localizeNumber(totalPages)}ページ中${localizeNumber(page)}ページ`,
        pageText: "ページ",
        pagerLabel: "ページ送り",
        previousPageLabel: "前のページ",
        rangeStatus: (start: number, end: number, total: number) =>
            `全${localizeNumber(total)}件中${localizeNumber(start)}～${localizeNumber(end)}件`
    },
    progressBar: {
        label: "進行状況"
    },
    rating: {
        notRated: "未評価",
        valueText: (value: number, max: number) => `${localizeNumber(max)}段階中${localizeNumber(value)}`
    },
    scrollView: {
        carousel: "カルーセル",
        nextPage: "次のページ",
        page: (current: number) => `${localizeNumber(current)}ページ`,
        pageOf: (current: number, total: number) => `${localizeNumber(total)}ページ中${localizeNumber(current)}ページ`,
        pages: "ページ",
        previousPage: "前のページ",
        scrollPagerNext: "ページャーを次へスクロール",
        scrollPagerPrevious: "ページャーを前へスクロール",
        slide: "スライド"
    },
    sheet: {
        closeSheet: "シートを閉じる"
    },
    sidebar: {
        drawerLabel: "サイドバー",
        rail: "サイドバーの表示を切り替え"
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
        menuButtonWithText: (text: string) => `${text}のその他のオプション`,
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
        stepCompleted: "完了",
        stepInvalid: "エラーあり",
        stepPosition: (current: number, total: number) =>
            `ステップ ${localizeNumber(current)}/${localizeNumber(total)}`,
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
        filterLabel: (tree: string) => `${tree}をフィルター`,
        filterTree: "ツリーをフィルター",
        loadError: (node: string) => `${node}の項目を読み込めませんでした`,
        loadingNode: (node: string) => `${node}を読み込み中`,
        movedAfter: (node: string, target: string) => `${node} を ${target} の後に移動しました`,
        movedBefore: (node: string, target: string) => `${node} を ${target} の前に移動しました`,
        movedInto: (node: string, target: string) => `${node} を ${target} の中に移動しました`,
        noData: "データがありません",
        noMatches: "一致する項目はありません",
        results: (count: number) => `${localizeNumber(count)}件の結果`,
        retryLoading: (node: string) => `${node}の読み込みを再試行`
    },
    window: {
        close: "閉じる",
        closeWindow: "ウィンドウを閉じる",
        maximize: "最大化",
        minimize: "最小化",
        moveOrResizeWindow:
            "ウィンドウを移動またはサイズ変更。矢印キーで移動し、Ctrl キーと矢印キーでサイズを変更します。",
        moveWindow: "ウィンドウを移動。矢印キーで移動します。",
        resizeBottom: "下辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeBottomLeft: "左下隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeBottomRight: "右下隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeLeft: "左辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeRight: "右辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeTop: "上辺からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeTopLeft: "左上隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeTopRight: "右上隅からウィンドウのサイズを変更。矢印キーでサイズを変更します。",
        resizeWindow: "ウィンドウのサイズを変更。Ctrl キーと矢印キーでサイズを変更します。",
        restore: "元のサイズに戻す"
    }
} satisfies MonaLocaleMessages;

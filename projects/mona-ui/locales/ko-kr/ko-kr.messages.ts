import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const KO_KR_MESSAGES = {
    autoComplete: {
        clear: "지우기"
    },
    breadcrumb: {
        breadcrumb: "이동 경로"
    },
    buttonGroup: {
        buttonGroup: "버튼 그룹"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `${formattedMonthAndYear} 달력`,
        decadeRange: (start: number, end: number) => `${start}년~${end}년`,
        decadeViewLabel: (start: number, end: number) => `10년 보기, ${start}년~${end}년`,
        goToToday: (formattedDate: string) => `오늘로 이동 (${formattedDate})`,
        nextDecade: "다음 10년",
        nextMonth: "다음 달",
        nextYear: "다음 연도",
        previousDecade: "이전 10년",
        previousMonth: "이전 달",
        previousYear: "이전 연도",
        switchToDecadeView: (currentYear: string) => `10년 보기로 전환. 현재 ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `연도 보기로 전환. 현재 ${currentMonthAndYear}`,
        today: "오늘",
        yearCellLabel: (year: number) => `${year}년`,
        yearViewLabel: (year: string) => `연도 보기, ${year}`
    },
    card: {
        actionsLabel: "카드 작업"
    },
    chart: {
        change: "변동",
        chart: "차트",
        chartLegend: "차트 범례",
        close: "종가",
        closeAbbreviation: "종",
        colorScale: "색상 스케일",
        conversion: "전환",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}, ${minimum} ~ ${midpoint} ~ ${maximum}`,
        dropOff: "이탈",
        falling: "하락",
        high: "고가",
        highAbbreviation: "고",
        labelValueSeparator: ":",
        low: "저가",
        lowAbbreviation: "저",
        noData: "사용 가능한 데이터 없음",
        open: "시가",
        openAbbreviation: "시",
        overall: "전체",
        range: "범위",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, ${minimum}~${maximum}`,
        rising: "상승",
        runningTotal: "누계",
        size: "크기",
        unchanged: "변동 없음",
        value: "값",
        visualIndicatorClamped: "시각 표시기가 제한됨"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `${label} 삭제` : "항목 삭제")
    },
    colorGradient: {
        apply: "적용",
        cancel: "취소",
        clearColor: "색상 지우기",
        copyAsHex: "HEX로 복사",
        copyAsRgb: "RGB로 복사",
        copyColor: "색상 복사",
        currentColor: "현재 색상",
        previousColor: "이전 색상",
        saturationAndValue: "채도 및 명도",
        saturationAndValueText: (saturation: number, value: number) =>
            `채도 ${saturation}%, 명도 ${value}%`,
        switchColorMode: "색상 모드 전환"
    },
    colorPalette: {
        color: (color: string) => `색상: ${color}`,
        colorPalette: "색상표"
    },
    colorPicker: {
        clearColor: "색상 지우기",
        colorGradientPicker: "그라데이션 색상 선택기",
        colorPalettePicker: "색상표 선택기",
        colorPicker: "색상 선택기"
    },
    comboBox: {
        clear: "지우기"
    },
    datePicker: {
        datePicker: "날짜 선택기",
        openCalendar: "달력 열기"
    },
    dateTimePicker: {
        calendar: "달력",
        cancel: "취소",
        date: "날짜",
        dateTimePicker: "날짜/시간 선택기",
        openDateTimePicker: "날짜/시간 선택기 열기",
        set: "설정",
        time: "시간",
        timePicker: "시간 선택기"
    },
    dialog: {
        cancel: "취소",
        closeDialog: "대화 상자 닫기",
        ok: "확인"
    },
    dropdownList: {
        clear: "지우기"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${total}개 중 ${position}번째`,
        noResultsFound: "결과를 찾을 수 없습니다",
        resultsAvailable: (count: number) => `사용 가능한 결과 ${count}개`
    },
    editor: {
        addColumnAfter: "뒤에 열 삽입",
        addColumnBefore: "앞에 열 삽입",
        addHorizontalLine: "가로선 삽입",
        addRowAfter: "뒤에 행 삽입",
        addRowBefore: "앞에 행 삽입",
        alignCenter: "가운데 맞춤",
        alignLeft: "왼쪽 맞춤",
        alignRight: "오른쪽 맞춤",
        altText: "대체 텍스트",
        backgroundColor: "배경색",
        bold: "굵게",
        cancel: "취소",
        codeBlock: "코드 블록",
        color: "색상",
        deleteColumn: "열 삭제",
        deleteRow: "행 삭제",
        deleteTable: "표 삭제",
        enterUrl: "URL 입력",
        fontSize: "글꼴 크기",
        format: "서식",
        heading: (level: number) => `제목 ${level}`,
        heightPx: "높이 (px)",
        imageUrl: "이미지 URL",
        indent: "들여쓰기",
        insert: "삽입",
        insertImage: "이미지 삽입",
        insertLink: "링크 삽입",
        insertOrderedList: "번호 매기기 목록 삽입",
        insertTable: "표 삽입",
        insertTaskList: "작업 목록 삽입",
        insertUnorderedList: "글머리 기호 목록 삽입",
        italic: "기울임꼴",
        justify: "양쪽 맞춤",
        mergeCells: "선택한 셀 병합",
        outdent: "내어쓰기",
        paragraph: "단락",
        quotation: "인용",
        redo: "다시 실행",
        removeLink: "링크 제거",
        selectFontFamily: "글꼴 선택",
        selectFontSize: "글꼴 크기 선택",
        splitCell: "셀 분할",
        strikethrough: "취소선",
        subscript: "아래 첨자",
        superscript: "위 첨자",
        toggleHeaderRow: "헤더 행 전환",
        underline: "밑줄",
        undo: "실행 취소",
        widthPx: "너비 (px)"
    },
    filter: {
        and: "그리고",
        apply: "적용",
        clear: "지우기",
        contains: "포함",
        doesNotContain: "포함하지 않음",
        endsWith: "다음으로 끝남",
        isAfter: "보다 이후",
        isAfterOrEqualTo: "이후 또는 같음",
        isBefore: "보다 이전",
        isBeforeOrEqualTo: "이전 또는 같음",
        isEmpty: "비어 있음",
        isEqualTo: "같음",
        isFalse: "거짓",
        isGreaterThan: "보다 큼",
        isGreaterThanOrEqualTo: "크거나 같음",
        isLessThan: "보다 작음",
        isLessThanOrEqualTo: "작거나 같음",
        isNotEmpty: "비어 있지 않음",
        isNotEqualTo: "같지 않음",
        isNotNull: "null 아님",
        isNotNullOrEmpty: "null 또는 비어 있지 않음",
        isNull: "null",
        isNullOrEmpty: "null 또는 비어 있음",
        isTrue: "참",
        or: "또는",
        startsWith: "다음으로 시작"
    },
    grid: {
        all: "(모두)",
        apply: "적용",
        cancel: "취소",
        cancelRowEdit: "행 편집 취소",
        columns: "열",
        columnsSelected: (count: number) => `선택한 열: ${count}개`,
        delete: "삭제",
        deleteRowConfirmation: "이 항목을 삭제하시겠습니까?",
        deleteRowTitle: "행 삭제?",
        dragColumnHeaderToGroup: "열 머리글을 여기에 끌어놓아 그룹화하세요",
        edit: "편집",
        editRow: "행 편집",
        fieldValidationError: "유효하지 않은 값입니다.",
        filterByColumn: (column: string) => `필터 기준: ${column}`,
        filterPlaceholder: "필터…",
        modified: "수정됨",
        moveAsNext: "다음 항목으로 이동",
        moveAsPrevious: "이전 항목으로 이동",
        moveRow: "행 이동",
        noData: "데이터 없음",
        remove: "제거",
        removeRow: "행 제거",
        reorderRow: (rowNumber: number) => `${rowNumber}행 순서 변경`,
        resizeColumn: "열 너비 조정",
        rowReorder: "행 순서 변경",
        rowReorderDisabled: "행 순서 변경을 사용할 수 없습니다.",
        rowReorderDisabledEditing: "편집을 완료한 후 행 순서를 변경하세요.",
        rowReorderDisabledFiltered: "필터를 지운 후 행 순서를 변경하세요.",
        rowReorderDisabledGrouped: "그룹화를 해제한 후 행 순서를 변경하세요.",
        rowReorderDisabledSingleRow: "행 순서를 변경하려면 행이 두 개 이상 필요합니다.",
        rowReorderDisabledSorted: "정렬을 해제한 후 행 순서를 변경하세요.",
        rowReorderDisabledVirtualScroll: "가상 스크롤을 사용하는 동안에는 행 순서를 변경할 수 없습니다.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Alt + 위쪽 화살표 또는 Alt + 아래쪽 화살표로 이동합니다.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `${fromRowNumber}행을 ${toPosition}번째 위치로 이동했습니다.`,
        rowValidationError: "이 행에 유효성 검사 오류가 있습니다.",
        save: "저장",
        saveRow: "행 저장",
        selectAllRows: "모든 행 선택",
        selectRow: (rowNumber: number) => `${rowNumber}행 선택`
    },
    list: {
        noData: "데이터 없음"
    },
    listBox: {
        clearSelection: "선택 해제",
        moveDown: "아래로 이동",
        moveUp: "위로 이동",
        remove: "제거",
        transferAllFrom: "다른 목록에서 모두 가져오기",
        transferAllTo: "모두 다른 목록으로 이동",
        transferFrom: "다른 목록에서 가져오기",
        transferTo: "다른 목록으로 이동"
    },
    multiSelect: {
        clear: "지우기",
        itemsCount: (count: number) => `+ ${count}개`
    },
    notification: {
        close: "닫기",
        error: "오류",
        info: "정보",
        success: "성공",
        warning: "경고"
    },
    numericTextBox: {
        decrease: "값 줄이기",
        increase: "값 늘리기"
    },
    otpInput: {
        verificationCode: "인증 코드"
    },
    pager: {
        firstPageLabel: "첫 페이지",
        jumpBackwardLabel: (pages: number) => `${pages}페이지 뒤로`,
        jumpForwardLabel: (pages: number) => `${pages}페이지 앞으로`,
        lastPageLabel: "마지막 페이지",
        nextPageLabel: "다음 페이지",
        ofText: "/",
        pageLabel: (page: number) => `${page}페이지`,
        pageSizeLabel: (pageSize: number) => `페이지당 ${pageSize}개`,
        pageStatus: (page: number, totalPages: number) => `전체 ${totalPages}페이지 중 ${page}페이지`,
        pageText: "페이지",
        previousPageLabel: "이전 페이지",
        rangeStatus: (start: number, end: number, total: number) =>
            `전체 ${total}개 중 ${start}~${end}`
    },
    rating: {
        notRated: "평가되지 않음",
        valueText: (value: number, max: number) => `${max}점 만점에 ${value}점`
    },
    scrollView: {
        carousel: "캐러셀",
        nextPage: "다음 페이지",
        page: (current: number) => `${current}페이지`,
        pageOf: (current: number, total: number) => `전체 ${total}페이지 중 ${current}페이지`,
        previousPage: "이전 페이지",
        scrollPagerNext: "페이지 표시기 다음으로 스크롤",
        scrollPagerPrevious: "페이지 표시기 이전으로 스크롤",
        slide: "슬라이드"
    },
    sheet: {
        closeSheet: "시트 닫기"
    },
    slider: {
        maximumValue: "최댓값",
        minimumValue: "최솟값",
        sliderValue: "슬라이더 값"
    },
    spinner: {
        cancel: "취소",
        loading: "로딩 중"
    },
    splitButton: {
        menuButtonAriaLabel: "메뉴 옵션 표시",
        splitButton: (text: string) => (text ? `${text}, 분할 버튼` : "분할 버튼")
    },
    splitter: {
        collapseDown: "아래쪽 창 축소",
        collapseNext: "다음 창 축소",
        collapsePrevious: "이전 창 축소",
        collapseUp: "위쪽 창 축소",
        resizer: "크기 조정 핸들"
    },
    stepper: {
        stepProgress: "단계 진행률",
        stepper: "단계 표시기"
    },
    tabs: {
        closeTab: "탭 닫기",
        scrollNext: "다음 탭으로 스크롤",
        scrollPrevious: "이전 탭으로 스크롤"
    },
    textBox: {
        clear: "지우기"
    },
    timePicker: {
        openTimePicker: "시간 선택기 열기",
        timePicker: "시간 선택기"
    },
    timeSelector: {
        am: "오전",
        amPm: "오전/오후",
        headerHours: "시",
        headerMinutes: "분",
        headerSeconds: "초",
        hours: "시",
        minutes: "분",
        now: "현재 시간",
        pm: "오후",
        seconds: "초",
        set: "설정",
        timeSelector: "시간 선택기"
    },
    treeView: {
        collapse: "축소",
        expand: "확장",
        filter: "필터:",
        filterTree: "트리 뷰 필터"
    },
    window: {
        close: "닫기",
        closeWindow: "창 닫기",
        maximize: "최대화",
        minimize: "최소화",
        moveWindow: "창 이동. 화살표 키로 이동합니다.",
        resizeBottom: "아래쪽에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeBottomLeft: "왼쪽 아래 모서리에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeBottomRight: "오른쪽 아래 모서리에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeLeft: "왼쪽에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeRight: "오른쪽에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeTop: "위쪽에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeTopLeft: "왼쪽 위 모서리에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        resizeTopRight: "오른쪽 위 모서리에서 창 크기 조정. 화살표 키로 크기를 조정합니다.",
        restore: "복원"
    }
} satisfies MonaLocaleMessages;

import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

const RU_RU_PLURAL_RULES = new Intl.PluralRules("ru-RU");

function russianPlural(
    count: number,
    forms: {
        one: string;
        few: string;
        many: string;
        other?: string;
    }
): string {
    const category = RU_RU_PLURAL_RULES.select(count);
    switch (category) {
        case "one":
            return forms.one;
        case "few":
            return forms.few;
        case "many":
            return forms.many;
        case "other":
        default:
            return forms.other ?? forms.few;
    }
}

function formatPageCount(count: number): string {
    return `${count} ${russianPlural(count, {
        one: "страницу",
        few: "страницы",
        many: "страниц"
    })}`;
}

function formatItemCount(count: number): string {
    return `${count} ${russianPlural(count, {
        one: "элемент",
        few: "элемента",
        many: "элементов"
    })}`;
}

export const RU_RU_MESSAGES = {
    autoComplete: {
        clear: "Очистить"
    },

    breadcrumb: {
        breadcrumb: "Навигационная цепочка"
    },

    buttonGroup: {
        buttonGroup: "Группа кнопок"
    },

    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Календарь, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) => `${start}–${end}`,
        decadeViewLabel: (start: number, end: number) => `Просмотр десятилетия, ${start}–${end}`,
        goToToday: (formattedDate: string) => `Перейти к сегодняшней дате, ${formattedDate}`,
        nextDecade: "Следующее десятилетие",
        nextMonth: "Следующий месяц",
        nextYear: "Следующий год",
        previousDecade: "Предыдущее десятилетие",
        previousMonth: "Предыдущий месяц",
        previousYear: "Предыдущий год",
        switchToDecadeView: (currentYear: string) =>
            `Перейти к просмотру десятилетия, текущий год: ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Перейти к просмотру года, текущий месяц: ${currentMonthAndYear}`,
        today: "Сегодня",
        yearCellLabel: (year: number) => `Год ${year}`,
        yearViewLabel: (year: string) => `Просмотр года, ${year}`
    },

    card: {
        actionsLabel: "Действия карточки"
    },

    chart: {
        change: "Изменение",
        chart: "Диаграмма",
        chartLegend: "Легенда диаграммы",
        close: "Закрытие",
        closeAbbreviation: "Закр.",
        colorScale: "Цветовая шкала",
        conversion: "Конверсия",
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, от ${minimum} до ${maximum}, середина ${midpoint}`,
        dropOff: "Снижение",
        falling: "Падение",
        high: "Максимум",
        highAbbreviation: "Макс.",
        labelValueSeparator: ":",
        low: "Минимум",
        lowAbbreviation: "Мин.",
        noData: "Нет данных",
        open: "Открытие",
        openAbbreviation: "Откр.",
        overall: "Итого",
        range: "Диапазон",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, от ${minimum} до ${maximum}`,
        rising: "Рост",
        runningTotal: "Накопительный итог",
        size: "размер",
        unchanged: "Без изменений",
        value: "Значение",
        visualIndicatorClamped: "Визуальный индикатор ограничен"
    },

    chip: {
        removeLabel: (label?: string) => (label ? `Удалить ${label}` : "Удалить элемент")
    },

    colorGradient: {
        apply: "Применить",
        cancel: "Отмена",
        clearColor: "Очистить цвет",
        copyAsHex: "Копировать как HEX",
        copyAsRgb: "Копировать как RGB",
        copyColor: "Копировать цвет",
        currentColor: "Текущий цвет",
        previousColor: "Предыдущий цвет",
        saturationAndValue: "Насыщенность и значение",
        saturationAndValueText: (saturation: number, value: number) =>
            `Насыщенность ${saturation}%, значение ${value}%`,
        switchColorMode: "Переключить цветовой режим"
    },

    colorPalette: {
        color: (color: string) => `Цвет: ${color}`,
        colorPalette: "Цветовая палитра"
    },

    colorPicker: {
        clearColor: "Очистить цвет",
        colorGradientPicker: "Выбор градиента цвета",
        colorPalettePicker: "Выбор цвета из палитры",
        colorPicker: "Выбор цвета"
    },

    comboBox: {
        clear: "Очистить"
    },

    datePicker: {
        datePicker: "Выбор даты",
        openCalendar: "Открыть календарь"
    },

    dateTimePicker: {
        calendar: "Календарь",
        cancel: "Отмена",
        date: "Дата",
        dateTimePicker: "Выбор даты и времени",
        openDateTimePicker: "Открыть выбор даты и времени",
        set: "Установить",
        time: "Время",
        timePicker: "Выбор времени"
    },

    dialog: {
        cancel: "Отмена",
        closeDialog: "Закрыть диалоговое окно",
        ok: "\u041E\u041A"
    },

    dropdownList: {
        clear: "Очистить"
    },

    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${position} из ${total}`,
        noResultsFound: "Результаты не найдены",
        resultsAvailable: (count: number) => `Доступно результатов: ${count}`
    },

    editor: {
        addColumnAfter: "Добавить столбец после",
        addColumnBefore: "Добавить столбец перед",
        addHorizontalLine: "Добавить горизонтальную линию",
        addRowAfter: "Добавить строку после",
        addRowBefore: "Добавить строку перед",
        alignCenter: "Выровнять по центру",
        alignLeft: "Выровнять по левому краю",
        alignRight: "Выровнять по правому краю",
        altText: "Альтернативный текст",
        backgroundColor: "Цвет фона",
        bold: "Полужирный",
        cancel: "Отмена",
        codeBlock: "Блок кода",
        color: "Цвет",
        deleteColumn: "Удалить столбец",
        deleteRow: "Удалить строку",
        deleteTable: "Удалить таблицу",
        enterUrl: "Введите URL",
        fontSize: "Размер шрифта",
        format: "Форматирование",
        heading: (level: number) => `Заголовок ${level}`,
        heightPx: "Высота (px)",
        imageUrl: "URL изображения",
        indent: "Увеличить отступ",
        insert: "Вставить",
        insertImage: "Вставить изображение",
        insertLink: "Вставить ссылку",
        insertOrderedList: "Вставить нумерованный список",
        insertTable: "Вставить таблицу",
        insertTaskList: "Вставить список задач",
        insertUnorderedList: "Вставить маркированный список",
        italic: "Курсив",
        justify: "Выровнять по ширине",
        mergeCells: "Объединить выбранные ячейки",
        outdent: "Уменьшить отступ",
        paragraph: "Абзац",
        quotation: "Цитата",
        redo: "Повторить",
        removeLink: "Удалить ссылку",
        selectFontFamily: "Выбрать шрифт",
        selectFontSize: "Выбрать размер шрифта",
        splitCell: "Разделить ячейку",
        strikethrough: "Зачёркнутый",
        subscript: "Подстрочный знак",
        superscript: "Надстрочный знак",
        toggleHeaderRow: "Переключить строку заголовка",
        underline: "Подчёркнутый",
        undo: "Отменить",
        widthPx: "Ширина (px)"
    },

    filter: {
        and: "И",
        apply: "Применить",
        clear: "Очистить",
        contains: "Содержит",
        doesNotContain: "Не содержит",
        endsWith: "Заканчивается на",
        isAfter: "После",
        isAfterOrEqualTo: "Не ранее",
        isBefore: "До",
        isBeforeOrEqualTo: "Не позднее",
        isEmpty: "Пусто",
        isEqualTo: "Равно",
        isFalse: "Ложь",
        isGreaterThan: "Больше",
        isGreaterThanOrEqualTo: "Больше или равно",
        isLessThan: "Меньше",
        isLessThanOrEqualTo: "Меньше или равно",
        isNotEmpty: "Не пусто",
        isNotEqualTo: "Не равно",
        isNotNull: "Значение задано",
        isNotNullOrEmpty: "Значение задано и не пусто",
        isNull: "Значение отсутствует",
        isNullOrEmpty: "Значение отсутствует или пусто",
        isTrue: "Истина",
        or: "ИЛИ",
        startsWith: "Начинается с"
    },

    grid: {
        all: "(Все)",
        apply: "Применить",
        cancel: "Отмена",
        cancelRowEdit: "Отменить редактирование строки",
        columns: "Столбцы",
        columnsSelected: (count: number) => `Выбрано столбцов: ${count}`,
        delete: "Удалить",
        deleteRowConfirmation: "Удалить этот элемент?",
        deleteRowTitle: "Удалить строку?",
        dragColumnHeaderToGroup: "Перетащите заголовок столбца сюда для группировки",
        edit: "Изменить",
        editRow: "Изменить строку",
        fieldValidationError: "Недопустимое значение.",
        filterByColumn: (column: string) => `Фильтр по столбцу ${column}`,
        filterPlaceholder: "Фильтр…",
        modified: "Изменено",
        moveAsNext: "Переместить после",
        moveAsPrevious: "Переместить перед",
        moveRow: "Переместить строку",
        noData: "Нет данных",
        remove: "Удалить",
        removeRow: "Удалить строку",
        reorderRow: (rowNumber: number) => `Изменить порядок строки ${rowNumber}`,
        resizeColumn: "Изменить ширину столбца",
        rowReorder: "Изменение порядка строк",
        rowReorderDisabled: "Изменение порядка строк недоступно.",
        rowReorderDisabledEditing: "Завершите редактирование перед изменением порядка строк.",
        rowReorderDisabledFiltered: "Очистите фильтры перед изменением порядка строк.",
        rowReorderDisabledGrouped: "Отмените группировку перед изменением порядка строк.",
        rowReorderDisabledSingleRow: "Для изменения порядка нужны как минимум две строки.",
        rowReorderDisabledSorted: "Сбросьте сортировку перед изменением порядка строк.",
        rowReorderDisabledVirtualScroll:
            "Нельзя изменять порядок строк при включённой виртуальной прокрутке.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint:
            "Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Строка ${fromRowNumber} перемещена в позицию ${toPosition}.`,
        rowValidationError: "В строке есть ошибки проверки.",
        save: "Сохранить",
        saveRow: "Сохранить строку",
        selectAllRows: "Выбрать все строки",
        selectRow: (rowNumber: number) => `Выбрать строку ${rowNumber}`
    },

    list: {
        noData: "Нет данных"
    },

    listBox: {
        clearSelection: "Очистить выбор",
        moveDown: "Переместить вниз",
        moveUp: "Переместить вверх",
        remove: "Удалить",
        transferAllFrom: "Перенести всё из другого списка",
        transferAllTo: "Перенести всё в другой список",
        transferFrom: "Перенести из другого списка",
        transferTo: "Перенести в другой список"
    },

    multiSelect: {
        clear: "Очистить",
        itemsCount: (count: number) => `+ ${formatItemCount(count)}`
    },

    notification: {
        close: "Закрыть",
        error: "Ошибка",
        info: "Информация",
        success: "Успешно",
        warning: "Предупреждение"
    },

    numericTextBox: {
        decrease: "Уменьшить значение",
        increase: "Увеличить значение"
    },

    otpInput: {
        verificationCode: "Код подтверждения"
    },

    pager: {
        firstPageLabel: "Первая страница",
        jumpBackwardLabel: (pages: number) => `Назад на ${formatPageCount(pages)}`,
        jumpForwardLabel: (pages: number) => `Вперёд на ${formatPageCount(pages)}`,
        lastPageLabel: "Последняя страница",
        nextPageLabel: "Следующая страница",
        ofText: "из",
        pageLabel: (page: number) => `Страница ${page}`,
        pageSizeLabel: (pageSize: number) => `${pageSize} на странице`,
        pageStatus: (page: number, totalPages: number) => `Страница ${page} из ${totalPages}`,
        pageText: "Страница",
        previousPageLabel: "Предыдущая страница",
        rangeStatus: (start: number, end: number, total: number) => `${start}–${end} из ${total}`
    },

    rating: {
        notRated: "Без оценки",
        valueText: (value: number, max: number) => `${value} из ${max}`
    },

    scrollView: {
        carousel: "карусель",
        nextPage: "Следующая страница",
        page: (current: number) => `Страница ${current}`,
        pageOf: (current: number, total: number) => `Страница ${current} из ${total}`,
        previousPage: "Предыдущая страница",
        scrollPagerNext: "Прокрутить список страниц вперёд",
        scrollPagerPrevious: "Прокрутить список страниц назад",
        slide: "слайд"
    },

    sheet: {
        closeSheet: "Закрыть панель"
    },

    slider: {
        maximumValue: "Максимальное значение",
        minimumValue: "Минимальное значение",
        sliderValue: "Значение ползунка"
    },

    spinner: {
        cancel: "Отмена",
        loading: "Загрузка"
    },

    splitButton: {
        menuButtonAriaLabel: "Показать параметры меню",
        splitButton: (text: string) =>
            text ? `${text}, разделённая кнопка` : "Разделённая кнопка"
    },

    splitter: {
        collapseDown: "Свернуть нижнюю панель",
        collapseNext: "Свернуть следующую панель",
        collapsePrevious: "Свернуть предыдущую панель",
        collapseUp: "Свернуть верхнюю панель",
        resizer: "Разделитель панелей"
    },

    stepper: {
        stepProgress: "Ход выполнения шагов",
        stepper: "Шаги"
    },

    tabs: {
        closeTab: "Закрыть вкладку",
        scrollNext: "Прокрутить вкладки вперёд",
        scrollPrevious: "Прокрутить вкладки назад"
    },

    textBox: {
        clear: "Очистить"
    },

    timePicker: {
        openTimePicker: "Открыть выбор времени",
        timePicker: "Выбор времени"
    },

    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "ч",
        headerMinutes: "мин",
        headerSeconds: "с",
        hours: "Часы",
        minutes: "Минуты",
        now: "Сейчас",
        pm: "PM",
        seconds: "Секунды",
        set: "Установить",
        timeSelector: "Выбор времени"
    },

    treeView: {
        collapse: "Свернуть",
        expand: "Развернуть",
        filter: "Фильтр",
        filterTree: "Фильтр дерева"
    },

    window: {
        close: "Закрыть",
        closeWindow: "Закрыть окно",
        maximize: "Развернуть",
        minimize: "Свернуть",
        moveWindow: "Переместить окно. Используйте клавиши со стрелками для перемещения.",
        resizeBottom: "Изменить размер окна снизу. Используйте клавиши со стрелками для изменения размера.",
        resizeBottomLeft:
            "Изменить размер окна из левого нижнего угла. Используйте клавиши со стрелками для изменения размера.",
        resizeBottomRight:
            "Изменить размер окна из правого нижнего угла. Используйте клавиши со стрелками для изменения размера.",
        resizeLeft: "Изменить размер окна слева. Используйте клавиши со стрелками для изменения размера.",
        resizeRight: "Изменить размер окна справа. Используйте клавиши со стрелками для изменения размера.",
        resizeTop: "Изменить размер окна сверху. Используйте клавиши со стрелками для изменения размера.",
        resizeTopLeft:
            "Изменить размер окна из левого верхнего угла. Используйте клавиши со стрелками для изменения размера.",
        resizeTopRight:
            "Изменить размер окна из правого верхнего угла. Используйте клавиши со стрелками для изменения размера.",
        restore: "Восстановить"
    }
} satisfies MonaLocaleMessages;

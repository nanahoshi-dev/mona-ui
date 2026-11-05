// Generated from ru-ru.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "ru-RU", options);
}

const PLURAL_RULES = new Intl.PluralRules("ru-RU");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
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
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })}–${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Просмотр десятилетия, ${localizeNumber(start, { useGrouping: false })}–${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Перейти к сегодняшней дате, ${formattedDate}`,
        nextDecade: "Следующее десятилетие",
        nextMonth: "Следующий месяц",
        nextYear: "Следующий год",
        previousDecade: "Предыдущее десятилетие",
        previousMonth: "Предыдущий месяц",
        previousYear: "Предыдущий год",
        switchToDecadeView: (currentYear: string) => `Перейти к просмотру десятилетия, текущий год: ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Перейти к просмотру года, текущий месяц: ${currentMonthAndYear}`,
        today: "Сегодня",
        yearCellLabel: (year: number) => `Год ${localizeNumber(year, { useGrouping: false })}`,
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
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, от ${minimum} до ${maximum}`,
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
            `Насыщенность ${localizeNumber(saturation)}%, значение ${localizeNumber(value)}%`,
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
        ok: "ОК"
    },
    dropdownList: {
        clear: "Очистить"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${localizeNumber(position)} из ${localizeNumber(total)}`,
        noResultsFound: "Результаты не найдены",
        resultsAvailable: (count: number) => `Доступно результатов: ${localizeNumber(count)}`
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
        heading: (level: number) => `Заголовок ${localizeNumber(level)}`,
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
        logic: "Объединение условий",
        operator: "Оператор",
        or: "ИЛИ",
        secondOperator: "Второй оператор",
        secondValue: "Второе значение",
        startsWith: "Начинается с",
        value: "Значение"
    },
    grid: {
        all: "(Все)",
        apply: "Применить",
        cancel: "Отмена",
        cancelNewRow: "Отменить новую строку",
        cancelRowEdit: (rowNumber: number) => `Отменить редактирование строки ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Очистить фильтр столбца ${column}`,
        collapseDetail: (rowNumber: number) => `Свернуть сведения строки ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Сгруппировано по ${column}`,
        columnMoved: (column: string, position: number) =>
            `Столбец ${column} перемещён на позицию ${localizeNumber(position)}`,
        columns: "Столбцы",
        columnsSelected: (count: number) => `Выбрано столбцов: ${localizeNumber(count)}`,
        commandColumnTitle: "Команды",
        delete: "Удалить",
        deleteRowConfirmation: (rowNumber: number) => `Удалить строку ${localizeNumber(rowNumber)}?`,
        deleteRowTitle: "Удалить строку?",
        details: "Подробности",
        dragColumnHeaderToGroup: "Перетащите заголовок столбца сюда для группировки",
        edit: "Изменить",
        editRow: (rowNumber: number) => `Изменить строку ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Развернуть сведения строки ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Недопустимое значение.",
        filterByColumn: (column: string) => `Фильтр по столбцу ${column}`,
        filterByColumnFiltered: (column: string) => `Фильтр по столбцу ${column}, применён`,
        filterOperator: (column: string, operator: string) => `Оператор фильтра столбца ${column}: ${operator}`,
        filterPlaceholder: "Фильтр…",
        group: "Группа",
        loading: "Загрузка",
        modified: "Изменено",
        moveAsNext: "Переместить после",
        moveAsPrevious: "Переместить перед",
        moveRow: "Переместить строку",
        noData: "Нет данных",
        remove: "Удалить",
        removeRow: (rowNumber: number) => `Удалить строку ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `Изменить порядок строки ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Изменить ширину столбца ${column}`,
        rowReorder: "Изменение порядка строк",
        rowReorderDisabled: "Изменение порядка строк недоступно.",
        rowReorderDisabledEditing: "Завершите редактирование перед изменением порядка строк.",
        rowReorderDisabledFiltered: "Очистите фильтры перед изменением порядка строк.",
        rowReorderDisabledGrouped: "Отмените группировку перед изменением порядка строк.",
        rowReorderDisabledServerBinding: "Изменение порядка строк недоступно при привязке к серверу.",
        rowReorderDisabledSingleRow: "Для изменения порядка нужны как минимум две строки.",
        rowReorderDisabledSorted: "Сбросьте сортировку перед изменением порядка строк.",
        rowReorderDisabledVirtualScroll: "Нельзя изменять порядок строк при включённой виртуальной прокрутке.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint: "Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Строка ${localizeNumber(fromRowNumber)} перемещена в позицию ${localizeNumber(toPosition)}.`,
        rowValidationError: "В строке есть ошибки проверки.",
        save: "Сохранить",
        saveNewRow: "Сохранить новую строку",
        saveRow: (rowNumber: number) => `Сохранить строку ${localizeNumber(rowNumber)}`,
        selectAllRows: "Выбрать все строки",
        selectRow: (rowNumber: number) => `Выбрать строку ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Порядок сортировки ${localizeNumber(position)}`,
        toolbar: "Панель инструментов таблицы"
    },
    list: {
        filterList: "Фильтр списка",
        loading: "Загрузка",
        noData: "Нет данных",
        pagerLabel: (list: string) => `Навигация по страницам: ${list}`
    },
    listBox: {
        clearSelection: "Очистить выбор",
        itemsMoved: (position: number, total: number) =>
            `Перемещено на позицию ${localizeNumber(position)} из ${localizeNumber(total)}`,
        itemsRemoved: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Удалён ${localizeNumber(count)} элемент`,
                few: () => `Удалено ${localizeNumber(count)} элемента`,
                many: () => `Удалено ${localizeNumber(count)} элементов`,
                other: () => `Удалено ${localizeNumber(count)} элемента`
            }),
        itemsTransferred: (count: number, list: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `${localizeNumber(count)} элемент перенесён в список «${list}»`,
                few: () => `${localizeNumber(count)} элемента перенесено в список «${list}»`,
                many: () => `${localizeNumber(count)} элементов перенесено в список «${list}»`,
                other: () => `${localizeNumber(count)} элемента перенесено в список «${list}»`
            }),
        itemsTransferredToOtherList: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `${localizeNumber(count)} элемент перенесён в другой список`,
                few: () => `${localizeNumber(count)} элемента перенесено в другой список`,
                many: () => `${localizeNumber(count)} элементов перенесено в другой список`,
                other: () => `${localizeNumber(count)} элемента перенесено в другой список`
            }),
        moveDown: "Переместить вниз",
        moveUp: "Переместить вверх",
        remove: "Удалить",
        selectionCleared: "Выбор очищен",
        toolbarLabel: (list: string) => `Действия: ${list}`,
        transferAllFrom: "Перенести всё из другого списка",
        transferAllFromList: (list: string) => `Перенести всё из списка «${list}»`,
        transferAllTo: "Перенести всё в другой список",
        transferAllToList: (list: string) => `Перенести всё в список «${list}»`,
        transferFrom: "Перенести из другого списка",
        transferFromList: (list: string) => `Перенести из списка «${list}»`,
        transferTo: "Перенести в другой список",
        transferToList: (list: string) => `Перенести в список «${list}»`
    },
    multiSelect: {
        clear: "Очистить",
        itemsCount: (count: number) =>
            `+ ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} элемент`, few: () => `${localizeNumber(count)} элемента`, many: () => `${localizeNumber(count)} элементов`, other: () => `${localizeNumber(count)} элемента` })}`,
        removeMoreItems: (count: number) =>
            `Удалить ещё ${plural(PLURAL_RULES.select(count), { one: () => `${localizeNumber(count)} элемент`, few: () => `${localizeNumber(count)} элемента`, many: () => `${localizeNumber(count)} элементов`, other: () => `${localizeNumber(count)} элемента` })}`
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
        itemsPerPageLabel: "Элементов на странице",
        jumpBackwardLabel: (pages: number) =>
            `Назад на ${plural(PLURAL_RULES.select(pages), { one: () => `${localizeNumber(pages)} страницу`, few: () => `${localizeNumber(pages)} страницы`, many: () => `${localizeNumber(pages)} страниц`, other: () => `${localizeNumber(pages)} страницы` })}`,
        jumpForwardLabel: (pages: number) =>
            `Вперёд на ${plural(PLURAL_RULES.select(pages), { one: () => `${localizeNumber(pages)} страницу`, few: () => `${localizeNumber(pages)} страницы`, many: () => `${localizeNumber(pages)} страниц`, other: () => `${localizeNumber(pages)} страницы` })}`,
        lastPageLabel: "Последняя страница",
        nextPageLabel: "Следующая страница",
        ofText: "из",
        pageInputPrefix: (_totalPages: number) => "Страница",
        pageInputSuffix: (totalPages: number) => `из ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Страница ${localizeNumber(page)}`,
        pageSelectLabel: "Страница",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} на странице`,
        pageStatus: (page: number, totalPages: number) =>
            `Страница ${localizeNumber(page)} из ${localizeNumber(totalPages)}`,
        pageText: "Страница",
        pagerLabel: "Навигация по страницам",
        previousPageLabel: "Предыдущая страница",
        rangeStatus: (start: number, end: number, total: number) =>
            `${localizeNumber(start)}–${localizeNumber(end)} из ${localizeNumber(total)}`
    },
    rating: {
        notRated: "Без оценки",
        valueText: (value: number, max: number) => `${localizeNumber(value)} из ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "карусель",
        nextPage: "Следующая страница",
        page: (current: number) => `Страница ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Страница ${localizeNumber(current)} из ${localizeNumber(total)}`,
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
        menuButtonWithText: (text: string) => `Другие параметры: ${text}`,
        splitButton: (text: string) => (text ? `${text}, разделённая кнопка` : "Разделённая кнопка")
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
        filterLabel: (tree: string) => `Фильтр: ${tree}`,
        filterTree: "Фильтр дерева",
        loadError: (node: string) => `Не удалось загрузить элементы «${node}»`,
        loadingNode: (node: string) => `Загрузка «${node}»`,
        movedAfter: (node: string, target: string) => `Элемент ${node} перемещён после ${target}`,
        movedBefore: (node: string, target: string) => `Элемент ${node} перемещён перед ${target}`,
        movedInto: (node: string, target: string) => `Элемент ${node} перемещён в ${target}`,
        noData: "Нет данных",
        noMatches: "Нет подходящих элементов",
        results: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `${localizeNumber(count)} результат`,
                few: () => `${localizeNumber(count)} результата`,
                many: () => `${localizeNumber(count)} результатов`,
                other: () => `${localizeNumber(count)} результата`
            }),
        retryLoading: (node: string) => `Повторить загрузку «${node}»`
    },
    window: {
        close: "Закрыть",
        closeWindow: "Закрыть окно",
        maximize: "Развернуть",
        minimize: "Свернуть",
        moveOrResizeWindow:
            "Переместить окно или изменить его размер. Используйте клавиши со стрелками для перемещения или Ctrl и клавиши со стрелками для изменения размера.",
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
        resizeWindow: "Изменить размер окна. Используйте Ctrl и клавиши со стрелками для изменения размера.",
        restore: "Восстановить"
    }
} satisfies MonaLocaleMessages;

import { describe, expect, it } from "vitest";
import { MONA_RU_RU_LOCALE } from "./ru-ru.locale";
import { RU_RU_MESSAGES } from "./ru-ru.messages";

describe("MONA_RU_RU_LOCALE", () => {
    describe("metadata", () => {
        it("declares ru-RU locale id", () => {
            expect(MONA_RU_RU_LOCALE.id).toBe("ru-RU");
            expect(MONA_RU_RU_LOCALE.id).not.toBe("ru");
            expect(MONA_RU_RU_LOCALE.id).not.toBe("ru_RU");
            expect(MONA_RU_RU_LOCALE.id).not.toBe("ru-ru");
            expect(MONA_RU_RU_LOCALE.id).not.toBe("ru-Cyrl");
            expect(MONA_RU_RU_LOCALE.id).not.toBe("ru-Cyrl-RU");
            expect(MONA_RU_RU_LOCALE.id).not.toBe("rus-RU");
        });

        it("canonicalizes to ru-RU via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_RU_RU_LOCALE.id)[0]).toBe("ru-RU");
        });

        it("declares ltr direction", () => {
            expect(MONA_RU_RU_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to RU_RU_MESSAGES", () => {
            expect(MONA_RU_RU_LOCALE.messages).toBe(RU_RU_MESSAGES);
            expect(typeof MONA_RU_RU_LOCALE.messages).toBe("object");
        });
    });

    describe("completeness", () => {
        it("defines message namespaces without empty sections", () => {
            const namespaces = Object.keys(MONA_RU_RU_LOCALE.messages);
            expect(namespaces.length).toBeGreaterThan(0);
            for (const ns of namespaces) {
                const section = (MONA_RU_RU_LOCALE.messages as Record<string, unknown>)[ns];
                expect(typeof section).toBe("object");
                expect(section).not.toBeNull();
                expect(Object.keys(section as object).length).toBeGreaterThan(0);
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_RU_RU_LOCALE.messages;

        it("translates Pager messages correctly with Russian terminology", () => {
            expect(m.pager?.firstPageLabel).toBe("Первая страница");
            expect(m.pager?.lastPageLabel).toBe("Последняя страница");
            expect(m.pager?.nextPageLabel).toBe("Следующая страница");
            expect(m.pager?.previousPageLabel).toBe("Предыдущая страница");
            expect(m.pager?.ofText).toBe("из");
            expect(m.pager?.pageText).toBe("Страница");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 на странице");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1–10 из 50");
        });

        it("translates Grid messages correctly with Russian terminology", () => {
            expect(m.grid?.all).toBe("(Все)");
            expect(m.grid?.apply).toBe("Применить");
            expect(m.grid?.cancel).toBe("Отмена");
            expect(m.grid?.delete).toBe("Удалить");
            expect(m.grid?.deleteRowConfirmation).toBe("Удалить этот элемент?");
            expect(m.grid?.deleteRowTitle).toBe("Удалить строку?");
            expect(m.grid?.edit).toBe("Изменить");
            expect(m.grid?.filterPlaceholder).toBe("Фильтр…");
            expect(m.grid?.moveRow).toBe("Переместить строку");
            expect(m.grid?.noData).toBe("Нет данных");
            expect(m.grid?.moveAsNext).toBe("Переместить после");
            expect(m.grid?.moveAsPrevious).toBe("Переместить перед");
            expect(m.grid?.remove).toBe("Удалить");
            expect(m.grid?.rowReorder).toBe("Изменение порядка строк");
            expect(m.grid?.save).toBe("Сохранить");
            expect(m.grid?.selectAllRows).toBe("Выбрать все строки");
            expect(m.grid?.dragColumnHeaderToGroup).toBe("Перетащите заголовок столбца сюда для группировки");
            expect(m.grid?.rowReorderDisabled).toBe("Изменение порядка строк недоступно.");
            expect(m.grid?.rowValidationError).toBe("В строке есть ошибки проверки.");
            expect(m.grid?.fieldValidationError).toBe("Недопустимое значение.");
        });

        it("translates Filter messages correctly with standard Russian operations", () => {
            expect(m.filter?.and).toBe("И");
            expect(m.filter?.or).toBe("ИЛИ");
            expect(m.filter?.apply).toBe("Применить");
            expect(m.filter?.clear).toBe("Очистить");
            expect(m.filter?.isEqualTo).toBe("Равно");
            expect(m.filter?.isNotEqualTo).toBe("Не равно");
            expect(m.filter?.isGreaterThan).toBe("Больше");
            expect(m.filter?.isGreaterThanOrEqualTo).toBe("Больше или равно");
            expect(m.filter?.isLessThan).toBe("Меньше");
            expect(m.filter?.isLessThanOrEqualTo).toBe("Меньше или равно");
            expect(m.filter?.contains).toBe("Содержит");
            expect(m.filter?.doesNotContain).toBe("Не содержит");
            expect(m.filter?.startsWith).toBe("Начинается с");
            expect(m.filter?.endsWith).toBe("Заканчивается на");
            expect(m.filter?.isEmpty).toBe("Пусто");
            expect(m.filter?.isNotEmpty).toBe("Не пусто");
            expect(m.filter?.isNull).toBe("Значение отсутствует");
            expect(m.filter?.isNotNull).toBe("Значение задано");
            expect(m.filter?.isNullOrEmpty).toBe("Значение отсутствует или пусто");
            expect(m.filter?.isNotNullOrEmpty).toBe("Значение задано и не пусто");
            expect(m.filter?.isAfter).toBe("После");
            expect(m.filter?.isAfterOrEqualTo).toBe("Не ранее");
            expect(m.filter?.isBefore).toBe("До");
            expect(m.filter?.isBeforeOrEqualTo).toBe("Не позднее");
            expect(m.filter?.isTrue).toBe("Истина");
            expect(m.filter?.isFalse).toBe("Ложь");
        });

        it("translates ListBox messages correctly with accessible descriptive labels", () => {
            expect(m.listBox?.clearSelection).toBe("Очистить выбор");
            expect(m.listBox?.moveDown).toBe("Переместить вниз");
            expect(m.listBox?.moveUp).toBe("Переместить вверх");
            expect(m.listBox?.remove).toBe("Удалить");
            expect(m.listBox?.transferFrom).toBe("Перенести из другого списка");
            expect(m.listBox?.transferTo).toBe("Перенести в другой список");
            expect(m.listBox?.transferAllFrom).toBe("Перенести всё из другого списка");
            expect(m.listBox?.transferAllTo).toBe("Перенести всё в другой список");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Полужирный");
            expect(m.editor?.italic).toBe("Курсив");
            expect(m.editor?.underline).toBe("Подчёркнутый");
            expect(m.editor?.strikethrough).toBe("Зачёркнутый");
            expect(m.editor?.insertLink).toBe("Вставить ссылку");
            expect(m.editor?.removeLink).toBe("Удалить ссылку");
            expect(m.editor?.codeBlock).toBe("Блок кода");
            expect(m.editor?.quotation).toBe("Цитата");
            expect(m.editor?.undo).toBe("Отменить");
            expect(m.editor?.redo).toBe("Повторить");
            expect(m.editor?.alignCenter).toBe("Выровнять по центру");
            expect(m.editor?.insertTable).toBe("Вставить таблицу");
            expect(m.editor?.deleteTable).toBe("Удалить таблицу");
            expect(m.editor?.format).toBe("Форматирование");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Сегодня");
            expect(m.calendar?.nextMonth).toBe("Следующий месяц");
            expect(m.calendar?.previousMonth).toBe("Предыдущий месяц");
            expect(m.calendar?.nextYear).toBe("Следующий год");
            expect(m.calendar?.previousYear).toBe("Предыдущий год");
            expect(m.calendar?.nextDecade).toBe("Следующее десятилетие");
            expect(m.calendar?.previousDecade).toBe("Предыдущее десятилетие");
            expect(m.datePicker?.datePicker).toBe("Выбор даты");
            expect(m.datePicker?.openCalendar).toBe("Открыть календарь");
        });

        it("translates TimeSelector, TimePicker, and DateTimePicker messages correctly", () => {
            expect(m.timeSelector?.am).toBe("AM");
            expect(m.timeSelector?.pm).toBe("PM");
            expect(m.timeSelector?.amPm).toBe("AM/PM");
            expect(m.timeSelector?.timeSelector).toBe("Выбор времени");
            expect(m.timeSelector?.hours).toBe("Часы");
            expect(m.timeSelector?.minutes).toBe("Минуты");
            expect(m.timeSelector?.seconds).toBe("Секунды");
            expect(m.timeSelector?.now).toBe("Сейчас");
            expect(m.timeSelector?.set).toBe("Установить");
            expect(m.timePicker?.timePicker).toBe("Выбор времени");
            expect(m.timePicker?.openTimePicker).toBe("Открыть выбор времени");
            expect(m.dateTimePicker?.dateTimePicker).toBe("Выбор даты и времени");
            expect(m.dateTimePicker?.openDateTimePicker).toBe("Открыть выбор даты и времени");
            expect(m.dateTimePicker?.calendar).toBe("Календарь");
            expect(m.dateTimePicker?.timePicker).toBe("Выбор времени");
            expect(m.dateTimePicker?.date).toBe("Дата");
            expect(m.dateTimePicker?.time).toBe("Время");
            expect(m.dateTimePicker?.set).toBe("Установить");
            expect(m.dateTimePicker?.cancel).toBe("Отмена");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Уменьшить значение");
            expect(m.numericTextBox?.increase).toBe("Увеличить значение");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Очистить");
            expect(m.dropdownList?.clear).toBe("Очистить");
            expect(m.dropdowns?.noResultsFound).toBe("Результаты не найдены");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("ОК");
            expect(m.dialog?.ok.charCodeAt(0)).toBe(0x041E); // Cyrillic О
            expect(m.dialog?.ok.charCodeAt(1)).toBe(0x041A); // Cyrillic К
            expect(m.dialog?.cancel).toBe("Отмена");
            expect(m.dialog?.closeDialog).toBe("Закрыть диалоговое окно");
            expect(m.window?.close).toBe("Закрыть");
            expect(m.window?.closeWindow).toBe("Закрыть окно");
            expect(m.window?.maximize).toBe("Развернуть");
            expect(m.window?.minimize).toBe("Свернуть");
            expect(m.window?.restore).toBe("Восстановить");
            expect(m.window?.moveWindow).toBe("Переместить окно. Используйте клавиши со стрелками для перемещения.");
            expect(m.window?.resizeTop).toBe("Изменить размер окна сверху. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeBottom).toBe("Изменить размер окна снизу. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeLeft).toBe("Изменить размер окна слева. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeRight).toBe("Изменить размер окна справа. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeTopLeft).toBe("Изменить размер окна из левого верхнего угла. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeTopRight).toBe("Изменить размер окна из правого верхнего угла. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeBottomLeft).toBe("Изменить размер окна из левого нижнего угла. Используйте клавиши со стрелками для изменения размера.");
            expect(m.window?.resizeBottomRight).toBe("Изменить размер окна из правого нижнего угла. Используйте клавиши со стрелками для изменения размера.");
        });

        it("translates Splitter, Stepper, and Tabs messages correctly", () => {
            expect(m.splitter?.resizer).toBe("Разделитель панелей");
            expect(m.splitter?.collapseUp).toBe("Свернуть верхнюю панель");
            expect(m.splitter?.collapseDown).toBe("Свернуть нижнюю панель");
            expect(m.splitter?.collapsePrevious).toBe("Свернуть предыдущую панель");
            expect(m.splitter?.collapseNext).toBe("Свернуть следующую панель");
            expect(m.stepper?.stepper).toBe("Шаги");
            expect(m.stepper?.stepProgress).toBe("Ход выполнения шагов");
            expect(m.tabs?.closeTab).toBe("Закрыть вкладку");
            expect(m.tabs?.scrollNext).toBe("Прокрутить вкладки вперёд");
            expect(m.tabs?.scrollPrevious).toBe("Прокрутить вкладки назад");
        });

        it("translates Notification, TreeView, and OTPInput messages correctly", () => {
            expect(m.notification?.close).toBe("Закрыть");
            expect(m.notification?.error).toBe("Ошибка");
            expect(m.notification?.info).toBe("Информация");
            expect(m.notification?.success).toBe("Успешно");
            expect(m.notification?.warning).toBe("Предупреждение");
            expect(m.treeView?.collapse).toBe("Свернуть");
            expect(m.treeView?.expand).toBe("Развернуть");
            expect(m.treeView?.filter).toBe("Фильтр");
            expect(m.treeView?.filterTree).toBe("Фильтр дерева");
            expect(m.otpInput?.verificationCode).toBe("Код подтверждения");
        });
    });

    describe("exact accessibility terminology", () => {
        const m = MONA_RU_RU_LOCALE.messages;

        it("locks canonical Russian accessibility terms", () => {
            expect(m.breadcrumb.breadcrumb).toBe("Навигационная цепочка");
            expect(m.scrollView.carousel).toBe("карусель");
            expect(m.scrollView.slide).toBe("слайд");
            expect(m.slider.sliderValue).toBe("Значение ползунка");
            expect(m.slider.minimumValue).toBe("Минимальное значение");
            expect(m.slider.maximumValue).toBe("Максимальное значение");
            expect(m.dialog.ok).toBe("ОК");
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_RU_RU_LOCALE.messages;

        it("formats Calendar functions correctly with Russian date composition", () => {
            expect(m.calendar?.calendarLabel?.("сентябрь 2026 г.")).toBe("Календарь, сентябрь 2026 г.");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020–2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Просмотр десятилетия, 2020–2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Год 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Просмотр года, 2026");
            expect(m.calendar?.goToToday?.("15.09.2026")).toBe("Перейти к сегодняшней дате, 15.09.2026");
            expect(m.calendar?.switchToYearView?.("сентябрь 2026 г.")).toBe(
                "Перейти к просмотру года, текущий месяц: сентябрь 2026 г."
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Перейти к просмотру десятилетия, текущий год: 2026"
            );
        });

        it("formats Chart functions and preserves Russian financial terminology", () => {
            expect(m.chart?.open).toBe("Открытие");
            expect(m.chart?.high).toBe("Максимум");
            expect(m.chart?.low).toBe("Минимум");
            expect(m.chart?.close).toBe("Закрытие");
            expect(m.chart?.openAbbreviation).toBe("Откр.");
            expect(m.chart?.highAbbreviation).toBe("Макс.");
            expect(m.chart?.lowAbbreviation).toBe("Мин.");
            expect(m.chart?.closeAbbreviation).toBe("Закр.");
            expect(m.chart?.rangeDescription?.("Выручка", "0", "100")).toBe("Выручка, от 0 до 100");
            expect(m.chart?.divergingRangeDescription?.("Прибыль", "-10", "0", "+10")).toBe(
                "Прибыль, от -10 до +10, середина 0"
            );
        });

        it("formats Chip removeLabel function correctly for both labelled and unlabelled cases", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Удалить Angular");
            expect(m.chip?.removeLabel?.()).toBe("Удалить элемент");
            expect(m.chip?.removeLabel?.("")).toBe("Удалить элемент");
        });

        it("formats ColorGradient saturationAndValueText function correctly", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Насыщенность 50%, значение 75%");
        });

        it("formats ColorPalette color function correctly", () => {
            expect(m.colorPalette?.color?.("#FF00AA")).toBe("Цвет: #FF00AA");
        });

        it("formats Dropdowns functions correctly", () => {
            expect(m.dropdowns?.itemPosition?.("Москва", 2, 5)).toBe("Москва, 2 из 5");
            expect(m.dropdowns?.resultsAvailable?.(0)).toBe("Доступно результатов: 0");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("Доступно результатов: 1");
            expect(m.dropdowns?.resultsAvailable?.(5)).toBe("Доступно результатов: 5");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Заголовок 1");
            expect(m.editor?.heading?.(3)).toBe("Заголовок 3");
        });

        it("formats Grid functions correctly", () => {
            expect(m.grid?.columnsSelected?.(0)).toBe("Выбрано столбцов: 0");
            expect(m.grid?.columnsSelected?.(1)).toBe("Выбрано столбцов: 1");
            expect(m.grid?.columnsSelected?.(5)).toBe("Выбрано столбцов: 5");
            expect(m.grid?.filterByColumn?.("Имя")).toBe("Фильтр по столбцу Имя");
            expect(m.grid?.reorderRow?.(4)).toBe("Изменить порядок строки 4");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Строка 1",
                    "Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку."
                )
            ).toBe("Строка 1. Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку.");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Строка 1",
                    "Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку.",
                    "Изменение порядка строк недоступно."
                )
            ).toBe(
                "Строка 1. Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку. Изменение порядка строк недоступно."
            );
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("Строка 3 перемещена в позицию 2.");
            expect(m.grid?.selectRow?.(2)).toBe("Выбрать строку 2");
        });

        it("formats Pager functions correctly", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Страница 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 на странице");
            expect(m.pager?.pageStatus?.(1, 1)).toBe("Страница 1 из 1");
            expect(m.pager?.pageStatus?.(1, 5)).toBe("Страница 1 из 5");
            expect(m.pager?.pageStatus?.(2, 10)).toBe("Страница 2 из 10");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 из 5");
        });

        it("formats ScrollView page functions correctly", () => {
            expect(m.scrollView?.page?.(1)).toBe("Страница 1");
            expect(m.scrollView?.pageOf?.(2, 10)).toBe("Страница 2 из 10");
        });

        it("formats SplitButton function correctly for both text and empty states", () => {
            expect(m.splitButton?.splitButton?.("Сохранить")).toBe("Сохранить, разделённая кнопка");
            expect(m.splitButton?.splitButton?.("")).toBe("Разделённая кнопка");
        });
    });

    describe("Russian plural regression matrix", () => {
        const m = MONA_RU_RU_LOCALE.messages;

        it("inflects MultiSelect itemsCount correctly across one, few, and many counts", () => {
            expect(m.multiSelect.itemsCount(0)).toBe("+ 0 элементов");
            expect(m.multiSelect.itemsCount(1)).toBe("+ 1 элемент");
            expect(m.multiSelect.itemsCount(2)).toBe("+ 2 элемента");
            expect(m.multiSelect.itemsCount(4)).toBe("+ 4 элемента");
            expect(m.multiSelect.itemsCount(5)).toBe("+ 5 элементов");
            expect(m.multiSelect.itemsCount(11)).toBe("+ 11 элементов");
            expect(m.multiSelect.itemsCount(21)).toBe("+ 21 элемент");
            expect(m.multiSelect.itemsCount(22)).toBe("+ 22 элемента");
            expect(m.multiSelect.itemsCount(25)).toBe("+ 25 элементов");
            expect(m.multiSelect.itemsCount(101)).toBe("+ 101 элемент");
            expect(m.multiSelect.itemsCount(111)).toBe("+ 111 элементов");
        });

        it("inflects Pager jumpForwardLabel correctly across one, few, and many counts", () => {
            expect(m.pager.jumpForwardLabel(1)).toBe("Вперёд на 1 страницу");
            expect(m.pager.jumpForwardLabel(2)).toBe("Вперёд на 2 страницы");
            expect(m.pager.jumpForwardLabel(4)).toBe("Вперёд на 4 страницы");
            expect(m.pager.jumpForwardLabel(5)).toBe("Вперёд на 5 страниц");
            expect(m.pager.jumpForwardLabel(11)).toBe("Вперёд на 11 страниц");
            expect(m.pager.jumpForwardLabel(21)).toBe("Вперёд на 21 страницу");
            expect(m.pager.jumpForwardLabel(22)).toBe("Вперёд на 22 страницы");
            expect(m.pager.jumpForwardLabel(25)).toBe("Вперёд на 25 страниц");
            expect(m.pager.jumpForwardLabel(101)).toBe("Вперёд на 101 страницу");
            expect(m.pager.jumpForwardLabel(111)).toBe("Вперёд на 111 страниц");
        });

        it("inflects Pager jumpBackwardLabel correctly across one, few, and many counts", () => {
            expect(m.pager.jumpBackwardLabel(1)).toBe("Назад на 1 страницу");
            expect(m.pager.jumpBackwardLabel(2)).toBe("Назад на 2 страницы");
            expect(m.pager.jumpBackwardLabel(4)).toBe("Назад на 4 страницы");
            expect(m.pager.jumpBackwardLabel(5)).toBe("Назад на 5 страниц");
            expect(m.pager.jumpBackwardLabel(11)).toBe("Назад на 11 страниц");
            expect(m.pager.jumpBackwardLabel(21)).toBe("Назад на 21 страницу");
            expect(m.pager.jumpBackwardLabel(22)).toBe("Назад на 22 страницы");
            expect(m.pager.jumpBackwardLabel(25)).toBe("Назад на 25 страниц");
            expect(m.pager.jumpBackwardLabel(101)).toBe("Назад на 101 страницу");
            expect(m.pager.jumpBackwardLabel(111)).toBe("Назад на 111 страниц");
        });
    });
});

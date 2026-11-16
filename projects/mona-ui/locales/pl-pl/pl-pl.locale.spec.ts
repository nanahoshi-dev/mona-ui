import { describe, expect, it } from "vitest";
import { MONA_PL_PL_LOCALE } from "./pl-pl.locale";
import { PL_PL_MESSAGES } from "./pl-pl.messages";

describe("MONA_PL_PL_LOCALE", () => {
    describe("metadata", () => {
        it("declares pl-PL locale id", () => {
            expect(MONA_PL_PL_LOCALE.id).toBe("pl-PL");
            expect(MONA_PL_PL_LOCALE.id).not.toBe("pl");
            expect(MONA_PL_PL_LOCALE.id).not.toBe("pl_PL");
            expect(MONA_PL_PL_LOCALE.id).not.toBe("pl-pl");
            expect(MONA_PL_PL_LOCALE.id).not.toBe("pl-Latn-PL");
            expect(MONA_PL_PL_LOCALE.id).not.toBe("pol-PL");
        });

        it("canonicalizes to pl-PL via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_PL_PL_LOCALE.id)[0]).toBe("pl-PL");
        });

        it("declares ltr direction", () => {
            expect(MONA_PL_PL_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to PL_PL_MESSAGES", () => {
            expect(MONA_PL_PL_LOCALE.messages).toBe(PL_PL_MESSAGES);
            expect(typeof MONA_PL_PL_LOCALE.messages).toBe("object");
        });
    });

    describe("completeness", () => {
        it("defines message namespaces without empty sections", () => {
            const namespaces = Object.keys(MONA_PL_PL_LOCALE.messages);
            expect(namespaces.length).toBeGreaterThan(0);
            for (const ns of namespaces) {
                const section = (MONA_PL_PL_LOCALE.messages as Record<string, unknown>)[ns];
                expect(typeof section).toBe("object");
                expect(section).not.toBeNull();
                expect(Object.keys(section as object).length).toBeGreaterThan(0);
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_PL_PL_LOCALE.messages;

        it("translates Pager messages with Polish terminology", () => {
            expect(m.pager.firstPageLabel).toBe("Pierwsza strona");
            expect(m.pager.lastPageLabel).toBe("Ostatnia strona");
            expect(m.pager.nextPageLabel).toBe("Następna strona");
            expect(m.pager.previousPageLabel).toBe("Poprzednia strona");
            expect(m.pager.ofText).toBe("z");
            expect(m.pager.pageText).toBe("Strona");
            expect(m.pager.pagerLabel).toBe("Stronicowanie");
            expect(m.pager.pageSizeLabel(10)).toBe("10 na stronę");
        });

        it("translates Grid messages with Polish terminology", () => {
            expect(m.grid.all).toBe("(Wszystkie)");
            expect(m.grid.apply).toBe("Zastosuj");
            expect(m.grid.cancel).toBe("Anuluj");
            expect(m.grid.delete).toBe("Usuń");
            expect(m.grid.deleteRowConfirmation(3)).toBe("Czy na pewno chcesz usunąć wiersz 3?");
            expect(m.grid.deleteRowTitle).toBe("Usunąć wiersz?");
            expect(m.grid.edit).toBe("Edytuj");
            expect(m.grid.filterPlaceholder).toBe("Filtruj…");
            expect(m.grid.group).toBe("Grupa");
            expect(m.grid.noData).toBe("Brak danych");
            expect(m.grid.save).toBe("Zapisz");
            expect(m.grid.selectAllRows).toBe("Zaznacz wszystkie wiersze");
            expect(m.grid.dragColumnHeaderToGroup).toBe("Przeciągnij tutaj nagłówek kolumny, aby grupować");
            expect(m.grid.rowReorderDisabled).toBe("Zmiana kolejności wierszy jest wyłączona.");
            expect(m.grid.rowValidationError).toBe("Ten wiersz zawiera błędy walidacji.");
            expect(m.grid.fieldValidationError).toBe("Nieprawidłowa wartość.");
        });

        it("translates Filter operators", () => {
            expect(m.filter.and).toBe("I");
            expect(m.filter.or).toBe("LUB");
            expect(m.filter.isEqualTo).toBe("Jest równe");
            expect(m.filter.isNotEqualTo).toBe("Nie jest równe");
            expect(m.filter.isGreaterThan).toBe("Jest większe niż");
            expect(m.filter.isGreaterThanOrEqualTo).toBe("Jest większe lub równe");
            expect(m.filter.isLessThan).toBe("Jest mniejsze niż");
            expect(m.filter.isLessThanOrEqualTo).toBe("Jest mniejsze lub równe");
            expect(m.filter.contains).toBe("Zawiera");
            expect(m.filter.doesNotContain).toBe("Nie zawiera");
            expect(m.filter.startsWith).toBe("Zaczyna się od");
            expect(m.filter.endsWith).toBe("Kończy się na");
            expect(m.filter.isEmpty).toBe("Jest puste");
            expect(m.filter.isNotEmpty).toBe("Nie jest puste");
            expect(m.filter.isNull).toBe("Brak wartości");
            expect(m.filter.isNotNull).toBe("Ma wartość");
            expect(m.filter.isAfter).toBe("Po");
            expect(m.filter.isAfterOrEqualTo).toBe("Nie wcześniej niż");
            expect(m.filter.isBefore).toBe("Przed");
            expect(m.filter.isBeforeOrEqualTo).toBe("Nie później niż");
            expect(m.filter.isTrue).toBe("Prawda");
            expect(m.filter.isFalse).toBe("Fałsz");
        });

        it("translates Editor messages", () => {
            expect(m.editor.bold).toBe("Pogrubienie");
            expect(m.editor.italic).toBe("Kursywa");
            expect(m.editor.underline).toBe("Podkreślenie");
            expect(m.editor.strikethrough).toBe("Przekreślenie");
            expect(m.editor.insertLink).toBe("Wstaw link");
            expect(m.editor.linkGroup).toBe("Linki");
            expect(m.editor.undo).toBe("Cofnij");
            expect(m.editor.redo).toBe("Ponów");
            expect(m.editor.addRowBefore).toBe("Dodaj wiersz powyżej");
            expect(m.editor.addRowAfter).toBe("Dodaj wiersz poniżej");
            expect(m.editor.format).toBe("Format");
            expect(m.editor.toolbar).toBe("Formatowanie");
        });

        it("translates Calendar, date and time picker messages", () => {
            expect(m.calendar.today).toBe("Dzisiaj");
            expect(m.calendar.nextMonth).toBe("Następny miesiąc");
            expect(m.calendar.previousMonth).toBe("Poprzedni miesiąc");
            expect(m.calendar.nextDecade).toBe("Następna dekada");
            expect(m.datePicker.datePicker).toBe("Selektor daty");
            expect(m.datePicker.openCalendar).toBe("Otwórz kalendarz");
            expect(m.timePicker.timePicker).toBe("Selektor godziny");
            expect(m.dateTimePicker.dateTimePicker).toBe("Selektor daty i godziny");
            expect(m.dateTimePicker.time).toBe("Godzina");
            expect(m.timeSelector.headerHours).toBe("godz.");
            expect(m.timeSelector.now).toBe("Teraz");
        });

        it("keeps the AM and PM day periods that Intl uses for pl-PL", () => {
            const period = (hour: number) =>
                new Intl.DateTimeFormat("pl-PL", { hour: "numeric", hour12: true })
                    .formatToParts(new Date(2026, 0, 1, hour))
                    .find(part => part.type === "dayPeriod")?.value;

            expect(m.timeSelector.am).toBe(period(9));
            expect(m.timeSelector.pm).toBe(period(21));
            expect(m.timeSelector.amPm).toBe("AM/PM");
        });

        it("translates Dialog and Window messages", () => {
            expect(m.dialog.ok).toBe("OK");
            expect(m.dialog.cancel).toBe("Anuluj");
            expect(m.dialog.closeDialog).toBe("Zamknij okno dialogowe");
            expect(m.window.maximize).toBe("Maksymalizuj");
            expect(m.window.minimize).toBe("Minimalizuj");
            expect(m.window.restore).toBe("Przywróć");
            expect(m.window.moveWindow).toBe("Przenieś okno. Użyj klawiszy strzałek, aby przenieść.");
            expect(m.window.resizeWindow).toBe(
                "Zmień rozmiar okna. Użyj klawisza Ctrl i klawiszy strzałek, aby zmienić rozmiar."
            );
        });

        it("names landmarks and controls for assistive technology", () => {
            expect(m.breadcrumb.breadcrumb).toBe("Ścieżka nawigacyjna");
            expect(m.scrollView.carousel).toBe("karuzela");
            expect(m.scrollView.slide).toBe("slajd");
            expect(m.slider.sliderValue).toBe("Wartość suwaka");
            expect(m.sidebar.drawerLabel).toBe("Panel boczny");
            expect(m.otpInput.verificationCode).toBe("Kod weryfikacyjny");
        });

        it("labels candlestick directions with verbs", () => {
            expect(m.chart.rising).toBe("Rośnie");
            expect(m.chart.falling).toBe("Spada");
            expect(m.chart.unchanged).toBe("Bez zmian");
        });

        it("quotes list and node names with Polish quotation marks", () => {
            expect(m.listBox.transferToList("Archiwum")).toBe("Przenieś do listy „Archiwum”");
            expect(m.treeView.loadingNode("Dokumenty")).toBe("Ładowanie węzła „Dokumenty”");
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_PL_PL_LOCALE.messages;

        it("formats Calendar functions without grouping years", () => {
            expect(m.calendar.calendarLabel("wrzesień 2026")).toBe("Kalendarz, wrzesień 2026");
            expect(m.calendar.decadeRange(2020, 2029)).toBe("2020–2029");
            expect(m.calendar.decadeViewLabel(2020, 2029)).toBe("Widok dekady, 2020–2029");
            expect(m.calendar.yearCellLabel(2026)).toBe("Rok 2026");
            expect(m.calendar.yearViewLabel("2026")).toBe("Widok roku, 2026");
            expect(m.calendar.goToToday("15.09.2026")).toBe("Przejdź do dzisiejszej daty, 15.09.2026");
            expect(m.calendar.switchToYearView("wrzesień 2026")).toBe(
                "Przełącz na widok roku, bieżący miesiąc: wrzesień 2026"
            );
        });

        it("formats Chart functions", () => {
            expect(m.chart.rangeDescription("Przychód", "0", "100")).toBe("Przychód, od 0 do 100");
            expect(m.chart.divergingRangeDescription("Zysk", "-10", "0", "+10")).toBe("Zysk, od -10 przez 0 do +10");
            expect(m.chart.ohlcValues("10", "12", "9", "11")).toBe(
                "Otwarcie 10, maksimum 12, minimum 9, zamknięcie 11"
            );
        });

        it("formats Chip removeLabel for labelled and unlabelled chips", () => {
            expect(m.chip.removeLabel("Angular")).toBe("Usuń Angular");
            expect(m.chip.removeLabel()).toBe("Usuń element");
            expect(m.chip.removeLabel("")).toBe("Usuń element");
        });

        it("formats Grid functions", () => {
            expect(m.grid.columnsSelected(5)).toBe("Wybrane kolumny: 5");
            expect(m.grid.filterByColumn("Nazwa")).toBe("Filtruj według kolumny Nazwa");
            expect(m.grid.rowReorderMoved(3, 2)).toBe("Przeniesiono wiersz 3 na pozycję 2.");
            expect(m.grid.rowReorderHandleAriaLabel("Wiersz 1", "Wskazówka.")).toBe("Wiersz 1. Wskazówka.");
            expect(m.grid.rowReorderHandleAriaLabel("Wiersz 1", "Wskazówka.", "Wyłączone.")).toBe(
                "Wiersz 1. Wskazówka. Wyłączone."
            );
        });

        it("formats Pager status and SplitButton names", () => {
            expect(m.pager.pageLabel(3)).toBe("Strona 3");
            expect(m.pager.pageStatus(2, 10)).toBe("Strona 2 z 10");
            expect(m.rating.valueText(4, 5)).toBe("4 z 5");
            expect(m.scrollView.pageOf(2, 10)).toBe("Strona 2 z 10");
            expect(m.splitButton.splitButton("Zapisz")).toBe("Zapisz, przycisk dzielony");
            expect(m.splitButton.splitButton("")).toBe("Przycisk dzielony");
            expect(m.splitButton.menuButtonWithText("Zapisz")).toBe("Więcej opcji: Zapisz");
        });

        it("groups thousands with a no-break space", () => {
            expect(m.pager.pageStatus(2, 12345)).toBe("Strona 2 z 12 345");
            expect(m.rating.valueText(3.5, 5)).toBe("3,5 z 5");
        });
    });

    // Polish "one" is only 1: 21, 101 and 111 take "many", and 22-24, 122-124 take "few" (but not 12-14)
    describe("Polish plural regression matrix", () => {
        const m = MONA_PL_PL_LOCALE.messages;

        it("inflects MultiSelect itemsCount across one, few, many and other", () => {
            expect(m.multiSelect.itemsCount(0)).toBe("+ 0 elementów");
            expect(m.multiSelect.itemsCount(1)).toBe("+ 1 element");
            expect(m.multiSelect.itemsCount(2)).toBe("+ 2 elementy");
            expect(m.multiSelect.itemsCount(4)).toBe("+ 4 elementy");
            expect(m.multiSelect.itemsCount(5)).toBe("+ 5 elementów");
            expect(m.multiSelect.itemsCount(12)).toBe("+ 12 elementów");
            expect(m.multiSelect.itemsCount(14)).toBe("+ 14 elementów");
            expect(m.multiSelect.itemsCount(21)).toBe("+ 21 elementów");
            expect(m.multiSelect.itemsCount(22)).toBe("+ 22 elementy");
            expect(m.multiSelect.itemsCount(101)).toBe("+ 101 elementów");
            expect(m.multiSelect.itemsCount(112)).toBe("+ 112 elementów");
            expect(m.multiSelect.itemsCount(122)).toBe("+ 122 elementy");
            expect(m.multiSelect.itemsCount(1.5)).toBe("+ 1,5 elementu");
        });

        it("inflects Pager jump labels in the accusative", () => {
            expect(m.pager.jumpForwardLabel(1)).toBe("Przeskocz do przodu o 1 stronę");
            expect(m.pager.jumpForwardLabel(3)).toBe("Przeskocz do przodu o 3 strony");
            expect(m.pager.jumpForwardLabel(5)).toBe("Przeskocz do przodu o 5 stron");
            expect(m.pager.jumpForwardLabel(13)).toBe("Przeskocz do przodu o 13 stron");
            expect(m.pager.jumpForwardLabel(23)).toBe("Przeskocz do przodu o 23 strony");
            expect(m.pager.jumpForwardLabel(1.5)).toBe("Przeskocz do przodu o 1,5 strony");
            expect(m.pager.jumpBackwardLabel(1)).toBe("Przeskocz wstecz o 1 stronę");
            expect(m.pager.jumpBackwardLabel(2)).toBe("Przeskocz wstecz o 2 strony");
            expect(m.pager.jumpBackwardLabel(10)).toBe("Przeskocz wstecz o 10 stron");
        });

        it("puts the Pager range total in the genitive after z", () => {
            expect(m.pager.rangeStatus(1, 1, 1)).toBe("1–1 z 1 elementu");
            expect(m.pager.rangeStatus(1, 2, 2)).toBe("1–2 z 2 elementów");
            expect(m.pager.rangeStatus(1, 10, 50)).toBe("1–10 z 50 elementów");
        });

        it("agrees the adjective with the count in resultsAvailable", () => {
            expect(m.dropdowns.resultsAvailable(0)).toBe("Dostępnych 0 wyników");
            expect(m.dropdowns.resultsAvailable(1)).toBe("Dostępny 1 wynik");
            expect(m.dropdowns.resultsAvailable(3)).toBe("Dostępne 3 wyniki");
            expect(m.dropdowns.resultsAvailable(5)).toBe("Dostępnych 5 wyników");
            expect(m.dropdowns.resultsAvailable(22)).toBe("Dostępne 22 wyniki");
            expect(m.command.resultsAvailable(12)).toBe("Dostępnych 12 wyników");
        });

        it("inflects ListBox, TreeView and Chart counts", () => {
            expect(m.listBox.itemsRemoved(1)).toBe("Usunięto 1 element");
            expect(m.listBox.itemsRemoved(3)).toBe("Usunięto 3 elementy");
            expect(m.listBox.itemsRemoved(12)).toBe("Usunięto 12 elementów");
            expect(m.listBox.itemsTransferred(2, "Archiwum")).toBe("Przeniesiono 2 elementy do listy „Archiwum”");
            expect(m.listBox.itemsTransferredToOtherList(5)).toBe("Przeniesiono 5 elementów do drugiej listy");
            expect(m.treeView.results(1)).toBe("1 wynik");
            expect(m.treeView.results(4)).toBe("4 wyniki");
            expect(m.treeView.results(11)).toBe("11 wyników");
            expect(m.chart.seriesSummary(1, "A")).toBe("Jedna seria: A.");
            expect(m.chart.seriesSummary(3, "A, B, C")).toBe("3 serie: A, B, C.");
            expect(m.chart.seriesSummary(5, "A, B, C, D, E")).toBe("5 serii: A, B, C, D, E.");
            expect(m.chart.brushApplied(2)).toBe("Zastosowano zaznaczenie, 2 punkty");
            expect(m.chart.treemapGroup(5)).toBe("Grupa (5 elementów podrzędnych)");
        });
    });
});

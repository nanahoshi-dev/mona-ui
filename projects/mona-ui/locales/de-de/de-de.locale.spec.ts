import { describe, expect, it } from "vitest";
import { MONA_DE_DE_LOCALE } from "./de-de.locale";

describe("MONA_DE_DE_LOCALE", () => {
    describe("metadata", () => {
        it("declares de-DE locale id", () => {
            expect(MONA_DE_DE_LOCALE.id).toBe("de-DE");
        });

        it("declares ltr direction", () => {
            expect(MONA_DE_DE_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object", () => {
            expect(MONA_DE_DE_LOCALE.messages).toBeDefined();
            expect(typeof MONA_DE_DE_LOCALE.messages).toBe("object");
        });
    });

    describe("completeness", () => {
        const expectedNamespaces = [
            "autoComplete",
            "breadcrumb",
            "buttonGroup",
            "calendar",
            "card",
            "chart",
            "chip",
            "colorGradient",
            "colorPalette",
            "colorPicker",
            "comboBox",
            "datePicker",
            "dateTimePicker",
            "dialog",
            "dropdownList",
            "dropdowns",
            "editor",
            "filter",
            "grid",
            "list",
            "listBox",
            "multiSelect",
            "notification",
            "numericTextBox",
            "otpInput",
            "pager",
            "rating",
            "scrollView",
            "sheet",
            "slider",
            "spinner",
            "splitButton",
            "splitter",
            "stepper",
            "tabs",
            "textBox",
            "timePicker",
            "timeSelector",
            "treeView",
            "window"
        ] as const;

        it("defines all 40 canonical message namespaces", () => {
            for (const ns of expectedNamespaces) {
                expect(MONA_DE_DE_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_DE_DE_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager?.firstPageLabel).toBe("Erste Seite");
            expect(m.pager?.lastPageLabel).toBe("Letzte Seite");
            expect(m.pager?.nextPageLabel).toBe("Nächste Seite");
            expect(m.pager?.previousPageLabel).toBe("Vorherige Seite");
            expect(m.pager?.ofText).toBe("von");
            expect(m.pager?.pageText).toBe("Seite");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 pro Seite");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid?.all).toBe("(Alle)");
            expect(m.grid?.delete).toBe("Löschen");
            expect(m.grid?.deleteRowConfirmation).toBe("Diese Zeile wirklich löschen?");
            expect(m.grid?.deleteRowTitle).toBe("Zeile löschen?");
            expect(m.grid?.edit).toBe("Bearbeiten");
            expect(m.grid?.filterPlaceholder).toBe("Filtern...");
            expect(m.grid?.noData).toBe("Keine Daten");
            expect(m.grid?.remove).toBe("Entfernen");
            expect(m.grid?.save).toBe("Speichern");
            expect(m.grid?.selectAllRows).toBe("Alle Zeilen auswählen");
        });

        it("translates ListBox messages correctly", () => {
            expect(m.listBox?.clearSelection).toBe("Auswahl aufheben");
            expect(m.listBox?.moveDown).toBe("Nach unten verschieben");
            expect(m.listBox?.moveUp).toBe("Nach oben verschieben");
            expect(m.listBox?.remove).toBe("Entfernen");
            expect(m.listBox?.transferFrom).toBe("Aus der anderen Liste übertragen");
            expect(m.listBox?.transferTo).toBe("In die andere Liste übertragen");
            expect(m.listBox?.transferAllFrom).toBe("Alle aus der anderen Liste übertragen");
            expect(m.listBox?.transferAllTo).toBe("Alle in die andere Liste übertragen");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Fett");
            expect(m.editor?.italic).toBe("Kursiv");
            expect(m.editor?.underline).toBe("Unterstrichen");
            expect(m.editor?.strikethrough).toBe("Durchgestrichen");
            expect(m.editor?.insertLink).toBe("Link einfügen");
            expect(m.editor?.removeLink).toBe("Link entfernen");
            expect(m.editor?.codeBlock).toBe("Codeblock");
            expect(m.editor?.quotation).toBe("Zitat");
            expect(m.editor?.undo).toBe("Rückgängig");
            expect(m.editor?.redo).toBe("Wiederholen");
            expect(m.editor?.alignCenter).toBe("Text zentrieren");
            expect(m.editor?.insertTable).toBe("Tabelle einfügen");
            expect(m.editor?.deleteTable).toBe("Tabelle löschen");
            expect(m.editor?.format).toBe("Format");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Heute");
            expect(m.calendar?.nextMonth).toBe("Nächster Monat");
            expect(m.calendar?.previousMonth).toBe("Vorheriger Monat");
            expect(m.calendar?.nextYear).toBe("Nächstes Jahr");
            expect(m.calendar?.previousYear).toBe("Vorheriges Jahr");
            expect(m.datePicker?.datePicker).toBe("Datumsauswahl");
            expect(m.datePicker?.openCalendar).toBe("Kalender öffnen");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Wert verringern");
            expect(m.numericTextBox?.increase).toBe("Wert erhöhen");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Leeren");
            expect(m.dropdownList?.clear).toBe("Leeren");
            expect(m.dropdowns?.noResultsFound).toBe("Keine Ergebnisse gefunden");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("OK");
            expect(m.dialog?.cancel).toBe("Abbrechen");
            expect(m.dialog?.closeDialog).toBe("Dialog schließen");
            expect(m.window?.close).toBe("Schließen");
            expect(m.window?.closeWindow).toBe("Fenster schließen");
            expect(m.window?.maximize).toBe("Maximieren");
            expect(m.window?.minimize).toBe("Minimieren");
            expect(m.window?.restore).toBe("Wiederherstellen");
            expect(m.window?.moveWindow).toBe("Fenster verschieben. Pfeiltasten zum Verschieben verwenden.");
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Einklappen");
            expect(m.treeView?.expand).toBe("Erweitern");
            expect(m.treeView?.filterTree).toBe("Baum filtern");
            expect(m.list?.noData).toBe("Keine Daten");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("Karussell");
            expect(m.scrollView?.slide).toBe("Folie");
            expect(m.scrollView?.nextPage).toBe("Nächste Seite");
            expect(m.scrollView?.previousPage).toBe("Vorherige Seite");
            expect(m.scrollView?.scrollPagerNext).toBe("Seitennavigation vorwärts scrollen");
            expect(m.scrollView?.scrollPagerPrevious).toBe("Seitennavigation rückwärts scrollen");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Wird geladen");
            expect(m.spinner?.cancel).toBe("Abbrechen");
            expect(m.notification?.close).toBe("Schließen");
            expect(m.notification?.success).toBe("Erfolg");
            expect(m.notification?.error).toBe("Fehler");
            expect(m.notification?.warning).toBe("Warnung");
            expect(m.notification?.info).toBe("Information");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Bereich schließen");
            expect(m.splitter?.resizer).toBe("Trennleiste");
            expect(m.splitter?.collapsePrevious).toBe("Vorherigen Bereich einklappen");
            expect(m.splitter?.collapseNext).toBe("Nächsten Bereich einklappen");
            expect(m.stepper?.stepProgress).toBe("Schrittfortschritt");
            expect(m.stepper?.stepper).toBe("Schrittanzeige");
            expect(m.tabs?.closeTab).toBe("Registerkarte schließen");
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_DE_DE_LOCALE.messages;

        it("formats Calendar functions correctly", () => {
            expect(m.calendar?.calendarLabel?.("September 2026")).toBe("Kalender, September 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 bis 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Jahrzehntansicht, 2020–2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Jahr 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Jahresansicht, 2026");
            expect(m.calendar?.goToToday?.("12.09.2026")).toBe("Zu heute wechseln, 12.09.2026");
            expect(m.calendar?.switchToYearView?.("September 2026")).toBe(
                "Zur Jahresansicht wechseln, aktuell September 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Zur Jahrzehntansicht wechseln, aktuell 2026"
            );
        });

        it("formats Chart functions correctly", () => {
            expect(m.chart?.rangeDescription?.("Umsatz", "0", "100")).toBe("Umsatz, von 0 bis 100");
            expect(m.chart?.divergingRangeDescription?.("Rentabilität", "-10", "0", "+10")).toBe(
                "Rentabilität, von -10 bis +10, Mittelpunkt bei 0"
            );
        });

        it("formats Chip removeLabel function correctly", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Angular entfernen");
            expect(m.chip?.removeLabel?.()).toBe("Element entfernen");
        });

        it("formats ColorGradient saturationAndValueText function correctly", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Sättigung 50 %, Wert 75 %");
        });

        it("formats Dropdowns functions with singular and plural correctly", () => {
            expect(m.dropdowns?.itemPosition?.("Option 1", 1, 10)).toBe("Option 1, 1 von 10");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 Ergebnis verfügbar");
            expect(m.dropdowns?.resultsAvailable?.(5)).toBe("5 Ergebnisse verfügbar");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Überschrift 1");
            expect(m.editor?.heading?.(3)).toBe("Überschrift 3");
        });

        it("formats Grid functions correctly with singular and plural", () => {
            expect(m.grid?.columnsSelected?.(1)).toBe("1 Spalte ausgewählt");
            expect(m.grid?.columnsSelected?.(3)).toBe("3 Spalten ausgewählt");
            expect(m.grid?.filterByColumn?.("Name")).toBe("Nach Name filtern");
            expect(m.grid?.reorderRow?.(4)).toBe("Zeile 4 neu anordnen");
            expect(m.grid?.selectRow?.(2)).toBe("Zeile 2 auswählen");
        });

        it("formats MultiSelect itemsCount function with singular and plural correctly", () => {
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 Element");
            expect(m.multiSelect?.itemsCount?.(4)).toBe("+ 4 Elemente");
        });

        it("formats Pager functions correctly with singular and plural", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Seite 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 pro Seite");
            expect(m.pager?.pageStatus?.(2, 5)).toBe("Seite 2 von 5");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("Um 1 Seite zurückspringen");
            expect(m.pager?.jumpBackwardLabel?.(3)).toBe("Um 3 Seiten zurückspringen");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("Um 1 Seite vorspringen");
            expect(m.pager?.jumpForwardLabel?.(5)).toBe("Um 5 Seiten vorspringen");
        });

        it("formats Pager rangeStatus with correct German dative plural after 'von'", () => {
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("1–1 von 1 Element");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1–10 von 50 Elementen");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("1–20 von 100 Elementen");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 von 5");
        });

        it("formats ScrollView page functions correctly", () => {
            expect(m.scrollView?.page?.(1)).toBe("Seite 1");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Seite 2 von 8");
        });

        it("formats SplitButton function correctly", () => {
            expect(m.splitButton?.splitButton?.("Speichern")).toBe("Speichern, geteilte Schaltfläche");
            expect(m.splitButton?.splitButton?.("")).toBe("Geteilte Schaltfläche");
        });
    });
});

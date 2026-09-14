import { describe, expect, it } from "vitest";
import { MONA_IT_IT_LOCALE } from "./it-it.locale";
import { IT_IT_MESSAGES } from "./it-it.messages";

describe("MONA_IT_IT_LOCALE", () => {
    describe("metadata", () => {
        it("declares it-IT locale id", () => {
            expect(MONA_IT_IT_LOCALE.id).toBe("it-IT");
            expect(MONA_IT_IT_LOCALE.id).not.toBe("it");
            expect(MONA_IT_IT_LOCALE.id).not.toBe("it_IT");
            expect(MONA_IT_IT_LOCALE.id).not.toBe("it-it");
        });

        it("canonicalizes to it-IT via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_IT_IT_LOCALE.id)[0]).toBe("it-IT");
        });

        it("declares ltr direction", () => {
            expect(MONA_IT_IT_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to IT_IT_MESSAGES", () => {
            expect(MONA_IT_IT_LOCALE.messages).toBe(IT_IT_MESSAGES);
            expect(typeof MONA_IT_IT_LOCALE.messages).toBe("object");
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
            expect(Object.keys(MONA_IT_IT_LOCALE.messages)).toHaveLength(40);
            expect(Object.keys(MONA_IT_IT_LOCALE.messages).sort()).toEqual([...expectedNamespaces].sort());
            for (const ns of expectedNamespaces) {
                expect(MONA_IT_IT_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_IT_IT_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager?.firstPageLabel).toBe("Prima pagina");
            expect(m.pager?.lastPageLabel).toBe("Ultima pagina");
            expect(m.pager?.nextPageLabel).toBe("Pagina successiva");
            expect(m.pager?.previousPageLabel).toBe("Pagina precedente");
            expect(m.pager?.ofText).toBe("di");
            expect(m.pager?.pageText).toBe("Pagina");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 per pagina");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid?.all).toBe("(Tutti)");
            expect(m.grid?.delete).toBe("Elimina");
            expect(m.grid?.deleteRowConfirmation).toBe("Sei sicuro di voler eliminare questo elemento?");
            expect(m.grid?.deleteRowTitle).toBe("Eliminare la riga?");
            expect(m.grid?.edit).toBe("Modifica");
            expect(m.grid?.filterPlaceholder).toBe("Filtra...");
            expect(m.grid?.moveRow).toBe("Sposta riga");
            expect(m.grid?.noData).toBe("Nessun dato disponibile");
            expect(m.grid?.moveAsNext).toBe("Sposta come successivo");
            expect(m.grid?.moveAsPrevious).toBe("Sposta come precedente");
            expect(m.grid?.remove).toBe("Rimuovi");
            expect(m.grid?.rowReorder).toBe("Riordina righe");
            expect(m.grid?.save).toBe("Salva");
            expect(m.grid?.selectAllRows).toBe("Seleziona tutte le righe");
        });

        it("translates ListBox messages correctly with accessible descriptive labels", () => {
            expect(m.listBox?.clearSelection).toBe("Deseleziona tutto");
            expect(m.listBox?.moveDown).toBe("Sposta giù");
            expect(m.listBox?.moveUp).toBe("Sposta su");
            expect(m.listBox?.remove).toBe("Rimuovi");
            expect(m.listBox?.transferFrom).toBe("Sposta dall'altro elenco");
            expect(m.listBox?.transferTo).toBe("Sposta nell'altro elenco");
            expect(m.listBox?.transferAllFrom).toBe("Sposta tutto dall'altro elenco");
            expect(m.listBox?.transferAllTo).toBe("Sposta tutto nell'altro elenco");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Grassetto");
            expect(m.editor?.italic).toBe("Corsivo");
            expect(m.editor?.underline).toBe("Sottolineato");
            expect(m.editor?.strikethrough).toBe("Barrato");
            expect(m.editor?.insertLink).toBe("Inserisci link");
            expect(m.editor?.removeLink).toBe("Rimuovi link");
            expect(m.editor?.codeBlock).toBe("Blocco di codice");
            expect(m.editor?.quotation).toBe("Citazione");
            expect(m.editor?.undo).toBe("Annulla");
            expect(m.editor?.redo).toBe("Ripeti");
            expect(m.editor?.alignCenter).toBe("Allinea al centro");
            expect(m.editor?.insertTable).toBe("Inserisci tabella");
            expect(m.editor?.deleteTable).toBe("Elimina tabella");
            expect(m.editor?.format).toBe("Formattazione");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Oggi");
            expect(m.calendar?.nextMonth).toBe("Mese successivo");
            expect(m.calendar?.previousMonth).toBe("Mese precedente");
            expect(m.calendar?.nextYear).toBe("Anno successivo");
            expect(m.calendar?.previousYear).toBe("Anno precedente");
            expect(m.calendar?.nextDecade).toBe("Decennio successivo");
            expect(m.calendar?.previousDecade).toBe("Decennio precedente");
            expect(m.datePicker?.datePicker).toBe("Selettore data");
            expect(m.datePicker?.openCalendar).toBe("Apri calendario");
        });

        it("translates TimeSelector & TimePicker messages correctly", () => {
            expect(m.timeSelector?.am).toBe("AM");
            expect(m.timeSelector?.pm).toBe("PM");
            expect(m.timeSelector?.amPm).toBe("AM/PM");
            expect(m.timeSelector?.timeSelector).toBe("Selettore ora");
            expect(m.timeSelector?.now).toBe("Ora");
            expect(m.timeSelector?.set).toBe("Imposta");
            expect(m.timePicker?.timePicker).toBe("Selettore ora");
            expect(m.timePicker?.openTimePicker).toBe("Apri selettore ora");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Diminuisci valore");
            expect(m.numericTextBox?.increase).toBe("Aumenta valore");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Cancella");
            expect(m.dropdownList?.clear).toBe("Cancella");
            expect(m.dropdowns?.noResultsFound).toBe("Nessun risultato trovato");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("OK");
            expect(m.dialog?.cancel).toBe("Annulla");
            expect(m.dialog?.closeDialog).toBe("Chiudi finestra di dialogo");
            expect(m.window?.close).toBe("Chiudi");
            expect(m.window?.closeWindow).toBe("Chiudi finestra");
            expect(m.window?.maximize).toBe("Massimizza");
            expect(m.window?.minimize).toBe("Minimizza");
            expect(m.window?.restore).toBe("Ripristina");
            expect(m.window?.moveWindow).toBe("Sposta finestra. Usa i tasti freccia per spostarla.");
            expect(m.window?.resizeTop).toBe(
                "Ridimensiona la finestra dal bordo superiore. Usa i tasti freccia per ridimensionarla."
            );
            expect(m.window?.resizeBottom).toBe(
                "Ridimensiona la finestra dal bordo inferiore. Usa i tasti freccia per ridimensionarla."
            );
            expect(m.window?.resizeLeft).toBe(
                "Ridimensiona la finestra dal bordo sinistro. Usa i tasti freccia per ridimensionarla."
            );
            expect(m.window?.resizeRight).toBe(
                "Ridimensiona la finestra dal bordo destro. Usa i tasti freccia per ridimensionarla."
            );
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Comprimi");
            expect(m.treeView?.expand).toBe("Espandi");
            expect(m.treeView?.filterTree).toBe("Filtra albero");
            expect(m.list?.noData).toBe("Nessun dato disponibile");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("carosello");
            expect(m.scrollView?.slide).toBe("diapositiva");
            expect(m.scrollView?.nextPage).toBe("Pagina successiva");
            expect(m.scrollView?.previousPage).toBe("Pagina precedente");
            expect(m.scrollView?.scrollPagerNext).toBe("Scorri in avanti le opzioni del paginatore");
            expect(m.scrollView?.scrollPagerPrevious).toBe("Scorri indietro le opzioni del paginatore");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Caricamento in corso");
            expect(m.spinner?.cancel).toBe("Annulla");
            expect(m.notification?.close).toBe("Chiudi");
            expect(m.notification?.success).toBe("Operazione riuscita");
            expect(m.notification?.error).toBe("Errore");
            expect(m.notification?.warning).toBe("Avviso");
            expect(m.notification?.info).toBe("Informazioni");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Chiudi pannello");
            expect(m.splitter?.resizer).toBe("Divisore pannelli");
            expect(m.splitter?.collapsePrevious).toBe("Comprimi pannello precedente");
            expect(m.splitter?.collapseNext).toBe("Comprimi pannello successivo");
            expect(m.splitter?.collapseUp).toBe("Comprimi pannello superiore");
            expect(m.splitter?.collapseDown).toBe("Comprimi pannello inferiore");
            expect(m.stepper?.stepProgress).toBe("Avanzamento dei passaggi");
            expect(m.stepper?.stepper).toBe("Avanzamento");
            expect(m.tabs?.closeTab).toBe("Chiudi scheda");
        });

        it("translates Filter date, boolean, and null operators correctly", () => {
            expect(m.filter?.isAfterOrEqualTo).toBe("È successivo o uguale a");
            expect(m.filter?.isBeforeOrEqualTo).toBe("È precedente o uguale a");
            expect(m.filter?.isAfter).toBe("È successivo a");
            expect(m.filter?.isBefore).toBe("È precedente a");
            expect(m.filter?.isEqualTo).toBe("È uguale a");
            expect(m.filter?.isNotEqualTo).toBe("È diverso da");
            expect(m.filter?.isNull).toBe("È nullo");
            expect(m.filter?.isNotNull).toBe("Non è nullo");
            expect(m.filter?.isTrue).toBe("È vero");
            expect(m.filter?.isFalse).toBe("È falso");
            expect(m.filter?.contains).toBe("Contiene");
            expect(m.filter?.doesNotContain).toBe("Non contiene");
            expect(m.filter?.startsWith).toBe("Inizia con");
            expect(m.filter?.endsWith).toBe("Termina con");
        });

        it("translates ColorGradient accessibility labels correctly", () => {
            expect(m.colorGradient?.saturationAndValue).toBe("Saturazione e valore del colore");
        });

        it("translates Grid row-reorder disabled reasons correctly", () => {
            expect(m.grid?.rowReorderDisabled).toBe("Il riordinamento delle righe è disabilitato.");
            expect(m.grid?.rowReorderDisabledEditing).toBe(
                "Completa la modifica prima di riordinare le righe."
            );
            expect(m.grid?.rowReorderDisabledFiltered).toBe(
                "Rimuovi i filtri prima di riordinare le righe."
            );
            expect(m.grid?.rowReorderDisabledGrouped).toBe(
                "Rimuovi il raggruppamento prima di riordinare le righe."
            );
            expect(m.grid?.rowReorderDisabledSingleRow).toBe(
                "Sono necessarie almeno due righe per riordinarle."
            );
            expect(m.grid?.rowReorderDisabledSorted).toBe(
                "Rimuovi l'ordinamento prima di riordinare le righe."
            );
            expect(m.grid?.rowReorderDisabledVirtualScroll).toBe(
                "Il riordinamento delle righe non è disponibile con lo scorrimento virtuale attivo."
            );
            expect(m.grid?.rowReorderKeyboardHint).toBe(
                "Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga."
            );
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_IT_IT_LOCALE.messages;

        it("formats Calendar functions correctly with natural Italian date composition", () => {
            expect(m.calendar?.calendarLabel?.("settembre 2026")).toBe("Calendario, settembre 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 - 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Vista decennio, 2020 - 2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Anno 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Vista anno, 2026");
            expect(m.calendar?.goToToday?.("15/09/2026")).toBe("Vai a oggi, 15/09/2026");
            expect(m.calendar?.switchToYearView?.("settembre 2026")).toBe(
                "Passa alla vista anno, attualmente settembre 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Passa alla vista decennio, attualmente 2026"
            );
        });

        it("formats Chart functions and preserves Italian financial terminology", () => {
            expect(m.chart?.open).toBe("Apertura");
            expect(m.chart?.high).toBe("Massimo");
            expect(m.chart?.low).toBe("Minimo");
            expect(m.chart?.close).toBe("Chiusura");
            expect(m.chart?.openAbbreviation).toBe("A");
            expect(m.chart?.highAbbreviation).toBe("Max");
            expect(m.chart?.lowAbbreviation).toBe("Min");
            expect(m.chart?.closeAbbreviation).toBe("C");
            expect(m.chart?.rangeDescription?.("Fatturato", "0", "100")).toBe("Fatturato, da 0 a 100");
            expect(m.chart?.divergingRangeDescription?.("Redditività", "-10", "0", "+10")).toBe(
                "Redditività, da -10 a +10, valore intermedio 0"
            );
        });

        it("formats Chip removeLabel function correctly for both labelled and unlabelled cases", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Rimuovi Angular");
            expect(m.chip?.removeLabel?.()).toBe("Rimuovi elemento");
            expect(m.chip?.removeLabel?.("")).toBe("Rimuovi elemento");
        });

        it("formats ColorGradient saturationAndValueText function correctly using valore", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Saturazione 50%, valore 75%");
        });

        it("formats ColorPalette color function correctly", () => {
            expect(m.colorPalette?.color?.("#FF00AA")).toBe("Colore: #FF00AA");
        });

        it("formats Dropdowns functions with singular and plural agreement across 0, 1, 2, 10 counts", () => {
            expect(m.dropdowns?.itemPosition?.("Opzione 1", 1, 10)).toBe("Opzione 1, 1 di 10");
            expect(m.dropdowns?.resultsAvailable?.(0)).toBe("0 risultati disponibili");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 risultato disponibile");
            expect(m.dropdowns?.resultsAvailable?.(2)).toBe("2 risultati disponibili");
            expect(m.dropdowns?.resultsAvailable?.(10)).toBe("10 risultati disponibili");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Intestazione 1");
            expect(m.editor?.heading?.(3)).toBe("Intestazione 3");
        });

        it("formats Grid functions correctly with singular and plural agreement across 0, 1, 2, 10 counts", () => {
            expect(m.grid?.columnsSelected?.(0)).toBe("0 colonne selezionate");
            expect(m.grid?.columnsSelected?.(1)).toBe("1 colonna selezionata");
            expect(m.grid?.columnsSelected?.(2)).toBe("2 colonne selezionate");
            expect(m.grid?.columnsSelected?.(10)).toBe("10 colonne selezionate");
            expect(m.grid?.filterByColumn?.("Nome")).toBe("Filtra per Nome");
            expect(m.grid?.reorderRow?.(4)).toBe("Riordina riga 4");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Riordina riga 1",
                    "Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga."
                )
            ).toBe("Riordina riga 1. Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga.");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Riordina riga 1",
                    "Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga.",
                    "Il riordinamento delle righe è disabilitato."
                )
            ).toBe(
                "Riordina riga 1. Usa Alt più Freccia su o Alt più Freccia giù per spostare la riga. Il riordinamento delle righe è disabilitato."
            );
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("Riga 3 spostata alla posizione 2.");
            expect(m.grid?.selectRow?.(2)).toBe("Seleziona riga 2");
        });

        it("formats MultiSelect itemsCount function with singular and plural agreement across 0, 1, 2, 10 counts", () => {
            expect(m.multiSelect?.itemsCount?.(0)).toBe("+ 0 elementi");
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 elemento");
            expect(m.multiSelect?.itemsCount?.(2)).toBe("+ 2 elementi");
            expect(m.multiSelect?.itemsCount?.(10)).toBe("+ 10 elementi");
        });

        it("formats Pager functions correctly with discrete count inflections across 0, 1, 2, 10 counts", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Pagina 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 per pagina");
            expect(m.pager?.pageStatus?.(1, 1)).toBe("Pagina 1 di 1");
            expect(m.pager?.pageStatus?.(1, 2)).toBe("Pagina 1 di 2");
            expect(m.pager?.pageStatus?.(2, 10)).toBe("Pagina 2 di 10");
            expect(m.pager?.jumpBackwardLabel?.(0)).toBe("Torna indietro di 0 pagine");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("Torna indietro di 1 pagina");
            expect(m.pager?.jumpBackwardLabel?.(2)).toBe("Torna indietro di 2 pagine");
            expect(m.pager?.jumpBackwardLabel?.(10)).toBe("Torna indietro di 10 pagine");
            expect(m.pager?.jumpForwardLabel?.(0)).toBe("Avanza di 0 pagine");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("Avanza di 1 pagina");
            expect(m.pager?.jumpForwardLabel?.(2)).toBe("Avanza di 2 pagine");
            expect(m.pager?.jumpForwardLabel?.(10)).toBe("Avanza di 10 pagine");
        });

        it("formats Pager rangeStatus with correct singular and plural noun inflections", () => {
            expect(m.pager?.rangeStatus?.(0, 0, 0)).toBe("0 - 0 di 0 elementi");
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("1 - 1 di 1 elemento");
            expect(m.pager?.rangeStatus?.(1, 2, 2)).toBe("1 - 2 di 2 elementi");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1 - 10 di 50 elementi");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("1 - 20 di 100 elementi");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 di 5");
        });

        it("formats ScrollView page functions correctly with Italian ordering", () => {
            expect(m.scrollView?.page?.(1)).toBe("Pagina 1");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Pagina 2 di 8");
        });

        it("formats SplitButton function correctly for both text and empty states", () => {
            expect(m.splitButton?.splitButton?.("Salva")).toBe("Salva, pulsante con menu");
            expect(m.splitButton?.splitButton?.("")).toBe("Pulsante con menu");
        });
    });
});

import { describe, expect, it } from "vitest";
import { MONA_ES_ES_LOCALE } from "./es-es.locale";

describe("MONA_ES_ES_LOCALE", () => {
    describe("metadata", () => {
        it("declares es-ES locale id", () => {
            expect(MONA_ES_ES_LOCALE.id).toBe("es-ES");
        });

        it("declares ltr direction", () => {
            expect(MONA_ES_ES_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object", () => {
            expect(MONA_ES_ES_LOCALE.messages).toBeDefined();
            expect(typeof MONA_ES_ES_LOCALE.messages).toBe("object");
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
                expect(MONA_ES_ES_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_ES_ES_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager?.firstPageLabel).toBe("Primera página");
            expect(m.pager?.lastPageLabel).toBe("Última página");
            expect(m.pager?.nextPageLabel).toBe("Página siguiente");
            expect(m.pager?.previousPageLabel).toBe("Página anterior");
            expect(m.pager?.ofText).toBe("de");
            expect(m.pager?.pageText).toBe("Página");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid?.all).toBe("(Todos)");
            expect(m.grid?.delete).toBe("Eliminar");
            expect(m.grid?.deleteRowConfirmation).toBe("¿Seguro que deseas eliminar este elemento?");
            expect(m.grid?.deleteRowTitle).toBe("¿Eliminar fila?");
            expect(m.grid?.edit).toBe("Editar");
            expect(m.grid?.filterPlaceholder).toBe("Filtrar...");
            expect(m.grid?.noData).toBe("No hay datos");
            expect(m.grid?.remove).toBe("Quitar");
            expect(m.grid?.save).toBe("Guardar");
            expect(m.grid?.selectAllRows).toBe("Seleccionar todas las filas");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Negrita");
            expect(m.editor?.italic).toBe("Cursiva");
            expect(m.editor?.underline).toBe("Subrayado");
            expect(m.editor?.strikethrough).toBe("Tachado");
            expect(m.editor?.insertLink).toBe("Insertar enlace");
            expect(m.editor?.removeLink).toBe("Quitar enlace");
            expect(m.editor?.codeBlock).toBe("Bloque de código");
            expect(m.editor?.quotation).toBe("Cita");
            expect(m.editor?.undo).toBe("Deshacer");
            expect(m.editor?.redo).toBe("Rehacer");
            expect(m.editor?.alignCenter).toBe("Centrar texto");
            expect(m.editor?.insertTable).toBe("Insertar tabla");
            expect(m.editor?.deleteTable).toBe("Eliminar tabla");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Hoy");
            expect(m.calendar?.nextMonth).toBe("Mes siguiente");
            expect(m.calendar?.previousMonth).toBe("Mes anterior");
            expect(m.calendar?.nextYear).toBe("Año siguiente");
            expect(m.calendar?.previousYear).toBe("Año anterior");
            expect(m.datePicker?.datePicker).toBe("Selector de fecha");
            expect(m.datePicker?.openCalendar).toBe("Abrir calendario");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Reducir valor");
            expect(m.numericTextBox?.increase).toBe("Aumentar valor");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Limpiar");
            expect(m.dropdownList?.clear).toBe("Limpiar");
            expect(m.dropdowns?.noResultsFound).toBe("No se han encontrado resultados");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("Aceptar");
            expect(m.dialog?.cancel).toBe("Cancelar");
            expect(m.dialog?.closeDialog).toBe("Cerrar cuadro de diálogo");
            expect(m.window?.close).toBe("Cerrar");
            expect(m.window?.closeWindow).toBe("Cerrar ventana");
            expect(m.window?.maximize).toBe("Maximizar");
            expect(m.window?.minimize).toBe("Minimizar");
            expect(m.window?.restore).toBe("Restaurar");
            expect(m.window?.moveWindow).toBe("Mover ventana. Usa las teclas de flecha para mover.");
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Contraer");
            expect(m.treeView?.expand).toBe("Expandir");
            expect(m.treeView?.filterTree).toBe("Filtrar árbol");
            expect(m.list?.noData).toBe("No hay datos");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("carrusel");
            expect(m.scrollView?.slide).toBe("diapositiva");
            expect(m.scrollView?.nextPage).toBe("Página siguiente");
            expect(m.scrollView?.previousPage).toBe("Página anterior");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Cargando");
            expect(m.spinner?.cancel).toBe("Cancelar");
            expect(m.notification?.close).toBe("Cerrar");
            expect(m.notification?.success).toBe("Éxito");
            expect(m.notification?.error).toBe("Error");
            expect(m.notification?.warning).toBe("Advertencia");
            expect(m.notification?.info).toBe("Información");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Cerrar panel");
            expect(m.splitter?.resizer).toBe("Separador de paneles");
            expect(m.splitter?.collapsePrevious).toBe("Contraer panel anterior");
            expect(m.splitter?.collapseNext).toBe("Contraer panel siguiente");
            expect(m.stepper?.stepProgress).toBe("Progreso del paso");
            expect(m.tabs?.closeTab).toBe("Cerrar pestaña");
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_ES_ES_LOCALE.messages;

        it("formats Calendar functions correctly", () => {
            expect(m.calendar?.calendarLabel?.("septiembre de 2026")).toBe("Calendario, septiembre de 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 a 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Vista de década, 2020 - 2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Año 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Vista anual, 2026");
            expect(m.calendar?.goToToday?.("12/09/2026")).toBe("Ir a hoy, 12/09/2026");
            expect(m.calendar?.switchToYearView?.("septiembre de 2026")).toBe(
                "Cambiar a vista anual, actualmente septiembre de 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Cambiar a vista de década, actualmente 2026"
            );
        });

        it("formats Chart functions correctly", () => {
            expect(m.chart?.rangeDescription?.("Ingresos", "0", "100")).toBe("Ingresos, de 0 a 100");
            expect(m.chart?.divergingRangeDescription?.("Rentabilidad", "-10", "0", "+10")).toBe(
                "Rentabilidad, de -10 a 0 a +10"
            );
        });

        it("formats Chip removeLabel function correctly", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Quitar, Angular");
            expect(m.chip?.removeLabel?.()).toBe("Quitar elemento");
        });

        it("formats Dropdowns functions with singular and plural correctly", () => {
            expect(m.dropdowns?.itemPosition?.("Opción 1", 1, 10)).toBe("Opción 1, 1 de 10");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 resultado disponible");
            expect(m.dropdowns?.resultsAvailable?.(5)).toBe("5 resultados disponibles");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Encabezado 1");
            expect(m.editor?.heading?.(3)).toBe("Encabezado 3");
        });

        it("formats Grid functions correctly with singular and plural", () => {
            expect(m.grid?.columnsSelected?.(1)).toBe("1 columna seleccionada");
            expect(m.grid?.columnsSelected?.(3)).toBe("3 columnas seleccionadas");
            expect(m.grid?.filterByColumn?.("Nombre")).toBe("Filtrar por Nombre");
            expect(m.grid?.reorderRow?.(4)).toBe("Reordenar fila 4");
            expect(m.grid?.selectRow?.(2)).toBe("Seleccionar fila 2");
        });

        it("formats MultiSelect itemsCount function with singular and plural correctly", () => {
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 elemento");
            expect(m.multiSelect?.itemsCount?.(4)).toBe("+ 4 elementos");
        });

        it("formats Pager functions correctly", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Página 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 / página");
            expect(m.pager?.pageStatus?.(2, 5)).toBe("Página 2 de 5");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1 - 10 de 50 elementos");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("Retroceder 1 página");
            expect(m.pager?.jumpBackwardLabel?.(3)).toBe("Retroceder 3 páginas");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("Avanzar 1 página");
            expect(m.pager?.jumpForwardLabel?.(5)).toBe("Avanzar 5 páginas");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 de 5");
        });

        it("formats ScrollView page functions correctly", () => {
            expect(m.scrollView?.page?.(1)).toBe("Página 1");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Página 2 de 8");
        });

        it("formats SplitButton function correctly", () => {
            expect(m.splitButton?.splitButton?.("Guardar")).toBe("Guardar botón dividido");
            expect(m.splitButton?.splitButton?.("")).toBe("Botón dividido");
        });
    });
});

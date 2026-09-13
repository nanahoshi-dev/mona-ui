import { describe, expect, it } from "vitest";
import { MONA_PT_BR_LOCALE } from "./pt-br.locale";
import { PT_BR_MESSAGES } from "./pt-br.messages";

describe("MONA_PT_BR_LOCALE", () => {
    describe("metadata", () => {
        it("declares pt-BR locale id", () => {
            expect(MONA_PT_BR_LOCALE.id).toBe("pt-BR");
            expect(MONA_PT_BR_LOCALE.id).not.toBe("pt");
            expect(MONA_PT_BR_LOCALE.id).not.toBe("pt_BR");
            expect(MONA_PT_BR_LOCALE.id).not.toBe("pt-br");
        });

        it("canonicalizes to pt-BR via Intl.getCanonicalLocales", () => {
            expect(Intl.getCanonicalLocales(MONA_PT_BR_LOCALE.id)[0]).toBe("pt-BR");
        });

        it("declares ltr direction", () => {
            expect(MONA_PT_BR_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object identical to PT_BR_MESSAGES", () => {
            expect(MONA_PT_BR_LOCALE.messages).toBe(PT_BR_MESSAGES);
            expect(typeof MONA_PT_BR_LOCALE.messages).toBe("object");
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
            expect(Object.keys(MONA_PT_BR_LOCALE.messages)).toHaveLength(40);
            expect(Object.keys(MONA_PT_BR_LOCALE.messages).sort()).toEqual([...expectedNamespaces].sort());
            for (const ns of expectedNamespaces) {
                expect(MONA_PT_BR_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_PT_BR_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager?.firstPageLabel).toBe("Primeira página");
            expect(m.pager?.lastPageLabel).toBe("Última página");
            expect(m.pager?.nextPageLabel).toBe("Próxima página");
            expect(m.pager?.previousPageLabel).toBe("Página anterior");
            expect(m.pager?.ofText).toBe("de");
            expect(m.pager?.pageText).toBe("Página");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 / página");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid?.all).toBe("(Todos)");
            expect(m.grid?.delete).toBe("Excluir");
            expect(m.grid?.deleteRowConfirmation).toBe("Tem certeza de que deseja excluir este item?");
            expect(m.grid?.deleteRowTitle).toBe("Excluir linha?");
            expect(m.grid?.edit).toBe("Editar");
            expect(m.grid?.filterPlaceholder).toBe("Filtrar...");
            expect(m.grid?.moveRow).toBe("Mover linha");
            expect(m.grid?.noData).toBe("Nenhum dado disponível");
            expect(m.grid?.moveAsNext).toBe("Mover como próximo");
            expect(m.grid?.moveAsPrevious).toBe("Mover como anterior");
            expect(m.grid?.remove).toBe("Remover");
            expect(m.grid?.rowReorder).toBe("Reordenar linhas");
            expect(m.grid?.save).toBe("Salvar");
            expect(m.grid?.selectAllRows).toBe("Selecionar todas as linhas");
        });

        it("translates ListBox messages correctly with accessible descriptive labels", () => {
            expect(m.listBox?.clearSelection).toBe("Limpar seleção");
            expect(m.listBox?.moveDown).toBe("Mover para baixo");
            expect(m.listBox?.moveUp).toBe("Mover para cima");
            expect(m.listBox?.remove).toBe("Remover");
            expect(m.listBox?.transferFrom).toBe("Mover da outra lista");
            expect(m.listBox?.transferTo).toBe("Mover para a outra lista");
            expect(m.listBox?.transferAllFrom).toBe("Mover todos da outra lista");
            expect(m.listBox?.transferAllTo).toBe("Mover todos para a outra lista");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Negrito");
            expect(m.editor?.italic).toBe("Itálico");
            expect(m.editor?.underline).toBe("Sublinhado");
            expect(m.editor?.strikethrough).toBe("Tachado");
            expect(m.editor?.insertLink).toBe("Inserir link");
            expect(m.editor?.removeLink).toBe("Remover link");
            expect(m.editor?.codeBlock).toBe("Bloco de código");
            expect(m.editor?.quotation).toBe("Citação");
            expect(m.editor?.undo).toBe("Desfazer");
            expect(m.editor?.redo).toBe("Refazer");
            expect(m.editor?.alignCenter).toBe("Centralizar texto");
            expect(m.editor?.insertTable).toBe("Inserir tabela");
            expect(m.editor?.deleteTable).toBe("Excluir tabela");
            expect(m.editor?.format).toBe("Formatação");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Hoje");
            expect(m.calendar?.nextMonth).toBe("Próximo mês");
            expect(m.calendar?.previousMonth).toBe("Mês anterior");
            expect(m.calendar?.nextYear).toBe("Próximo ano");
            expect(m.calendar?.previousYear).toBe("Ano anterior");
            expect(m.calendar?.nextDecade).toBe("Próxima década");
            expect(m.calendar?.previousDecade).toBe("Década anterior");
            expect(m.datePicker?.datePicker).toBe("Seletor de data");
            expect(m.datePicker?.openCalendar).toBe("Abrir calendário");
        });

        it("translates TimeSelector & TimePicker messages correctly", () => {
            expect(m.timeSelector?.am).toBe("AM");
            expect(m.timeSelector?.pm).toBe("PM");
            expect(m.timeSelector?.amPm).toBe("AM/PM");
            expect(m.timeSelector?.timeSelector).toBe("Seletor de hora");
            expect(m.timeSelector?.now).toBe("Agora");
            expect(m.timeSelector?.set).toBe("Definir");
            expect(m.timePicker?.timePicker).toBe("Seletor de hora");
            expect(m.timePicker?.openTimePicker).toBe("Abrir seletor de hora");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Diminuir valor");
            expect(m.numericTextBox?.increase).toBe("Aumentar valor");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Limpar");
            expect(m.dropdownList?.clear).toBe("Limpar");
            expect(m.dropdowns?.noResultsFound).toBe("Nenhum resultado encontrado");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("OK");
            expect(m.dialog?.cancel).toBe("Cancelar");
            expect(m.dialog?.closeDialog).toBe("Fechar diálogo");
            expect(m.window?.close).toBe("Fechar");
            expect(m.window?.closeWindow).toBe("Fechar janela");
            expect(m.window?.maximize).toBe("Maximizar");
            expect(m.window?.minimize).toBe("Minimizar");
            expect(m.window?.restore).toBe("Restaurar");
            expect(m.window?.moveWindow).toBe("Mover janela. Use as teclas de seta para mover.");
            expect(m.window?.resizeTop).toBe(
                "Redimensionar janela a partir da borda superior. Use as teclas de seta para redimensionar."
            );
            expect(m.window?.resizeBottom).toBe(
                "Redimensionar janela a partir da borda inferior. Use as teclas de seta para redimensionar."
            );
            expect(m.window?.resizeLeft).toBe(
                "Redimensionar janela a partir da borda esquerda. Use as teclas de seta para redimensionar."
            );
            expect(m.window?.resizeRight).toBe(
                "Redimensionar janela a partir da borda direita. Use as teclas de seta para redimensionar."
            );
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Recolher");
            expect(m.treeView?.expand).toBe("Expandir");
            expect(m.treeView?.filterTree).toBe("Filtrar árvore");
            expect(m.list?.noData).toBe("Nenhum dado disponível");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("carrossel");
            expect(m.scrollView?.slide).toBe("slide");
            expect(m.scrollView?.nextPage).toBe("Próxima página");
            expect(m.scrollView?.previousPage).toBe("Página anterior");
            expect(m.scrollView?.scrollPagerNext).toBe("Rolar opções do paginador para a frente");
            expect(m.scrollView?.scrollPagerPrevious).toBe("Rolar opções do paginador para trás");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Carregando");
            expect(m.spinner?.cancel).toBe("Cancelar");
            expect(m.notification?.close).toBe("Fechar");
            expect(m.notification?.success).toBe("Sucesso");
            expect(m.notification?.error).toBe("Erro");
            expect(m.notification?.warning).toBe("Aviso");
            expect(m.notification?.info).toBe("Informação");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Fechar painel");
            expect(m.splitter?.resizer).toBe("Separador de painéis");
            expect(m.splitter?.collapsePrevious).toBe("Recolher painel anterior");
            expect(m.splitter?.collapseNext).toBe("Recolher próximo painel");
            expect(m.splitter?.collapseUp).toBe("Recolher painel superior");
            expect(m.splitter?.collapseDown).toBe("Recolher painel inferior");
            expect(m.stepper?.stepProgress).toBe("Progresso das etapas");
            expect(m.stepper?.stepper).toBe("Progresso");
            expect(m.tabs?.closeTab).toBe("Fechar aba");
        });

        it("translates Filter date, boolean, and null operators correctly", () => {
            expect(m.filter?.isAfterOrEqualTo).toBe("É posterior ou igual a");
            expect(m.filter?.isBeforeOrEqualTo).toBe("É anterior ou igual a");
            expect(m.filter?.isAfter).toBe("É posterior a");
            expect(m.filter?.isBefore).toBe("É anterior a");
            expect(m.filter?.isEqualTo).toBe("É igual a");
            expect(m.filter?.isNotEqualTo).toBe("É diferente de");
            expect(m.filter?.isNull).toBe("É nulo");
            expect(m.filter?.isNotNull).toBe("Não é nulo");
            expect(m.filter?.isTrue).toBe("É verdadeiro");
            expect(m.filter?.isFalse).toBe("É falso");
            expect(m.filter?.contains).toBe("Contém");
            expect(m.filter?.doesNotContain).toBe("Não contém");
            expect(m.filter?.startsWith).toBe("Começa com");
            expect(m.filter?.endsWith).toBe("Termina com");
        });

        it("translates ColorGradient accessibility labels correctly", () => {
            expect(m.colorGradient?.saturationAndValue).toBe("Saturação e valor da cor");
        });

        it("translates Grid row-reorder disabled reasons correctly", () => {
            expect(m.grid?.rowReorderDisabled).toBe("A reordenação de linhas está desabilitada.");
            expect(m.grid?.rowReorderDisabledEditing).toBe(
                "Conclua a edição antes de reordenar as linhas."
            );
            expect(m.grid?.rowReorderDisabledFiltered).toBe(
                "Remova os filtros antes de reordenar as linhas."
            );
            expect(m.grid?.rowReorderDisabledGrouped).toBe(
                "Remova o agrupamento antes de reordenar as linhas."
            );
            expect(m.grid?.rowReorderDisabledSingleRow).toBe(
                "São necessárias pelo menos duas linhas para reordenar."
            );
            expect(m.grid?.rowReorderDisabledSorted).toBe(
                "Remova a ordenação antes de reordenar as linhas."
            );
            expect(m.grid?.rowReorderDisabledVirtualScroll).toBe(
                "A reordenação de linhas não está disponível com a rolagem virtual ativada."
            );
            expect(m.grid?.rowReorderKeyboardHint).toBe(
                "Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover."
            );
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_PT_BR_LOCALE.messages;

        it("formats Calendar functions correctly with natural Portuguese date composition", () => {
            expect(m.calendar?.calendarLabel?.("setembro de 2026")).toBe("Calendário, setembro de 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 a 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Visualização de década, 2020 - 2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Ano 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Visualização de ano, 2026");
            expect(m.calendar?.goToToday?.("15/09/2026")).toBe("Ir para hoje, 15/09/2026");
            expect(m.calendar?.switchToYearView?.("setembro de 2026")).toBe(
                "Alternar para a visualização de ano, atualmente setembro de 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Alternar para a visualização de década, atualmente 2026"
            );
        });

        it("formats Chart functions and preserves Brazilian financial terminology", () => {
            expect(m.chart?.open).toBe("Abertura");
            expect(m.chart?.high).toBe("Máxima");
            expect(m.chart?.low).toBe("Mínima");
            expect(m.chart?.close).toBe("Fechamento");
            expect(m.chart?.openAbbreviation).toBe("A");
            expect(m.chart?.highAbbreviation).toBe("Máx");
            expect(m.chart?.lowAbbreviation).toBe("Mín");
            expect(m.chart?.closeAbbreviation).toBe("F");
            expect(m.chart?.rangeDescription?.("Receita", "0", "100")).toBe("Receita, de 0 a 100");
            expect(m.chart?.divergingRangeDescription?.("Rentabilidade", "-10", "0", "+10")).toBe(
                "Rentabilidade, de -10 a +10, ponto médio 0"
            );
        });

        it("formats Chip removeLabel function correctly for both labelled and unlabelled cases", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Remover Angular");
            expect(m.chip?.removeLabel?.()).toBe("Remover item");
        });

        it("formats ColorGradient saturationAndValueText function correctly using valor", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Saturação 50%, valor 75%");
        });

        it("formats ColorPalette color function correctly", () => {
            expect(m.colorPalette?.color?.("#FF00AA")).toBe("Cor: #FF00AA");
        });

        it("formats Dropdowns functions with singular and plural agreement across 0, 1, 2, 10 counts", () => {
            expect(m.dropdowns?.itemPosition?.("Opção 1", 1, 10)).toBe("Opção 1, 1 de 10");
            expect(m.dropdowns?.resultsAvailable?.(0)).toBe("0 resultados disponíveis");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 resultado disponível");
            expect(m.dropdowns?.resultsAvailable?.(2)).toBe("2 resultados disponíveis");
            expect(m.dropdowns?.resultsAvailable?.(10)).toBe("10 resultados disponíveis");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Título 1");
            expect(m.editor?.heading?.(3)).toBe("Título 3");
        });

        it("formats Grid functions correctly with singular and plural agreement across 0, 1, 2, 10 counts", () => {
            expect(m.grid?.columnsSelected?.(0)).toBe("0 colunas selecionadas");
            expect(m.grid?.columnsSelected?.(1)).toBe("1 coluna selecionada");
            expect(m.grid?.columnsSelected?.(2)).toBe("2 colunas selecionadas");
            expect(m.grid?.columnsSelected?.(10)).toBe("10 colunas selecionadas");
            expect(m.grid?.filterByColumn?.("Nome")).toBe("Filtrar por Nome");
            expect(m.grid?.reorderRow?.(4)).toBe("Reordenar linha 4");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Reordenar linha 1",
                    "Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover."
                )
            ).toBe("Reordenar linha 1. Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover.");
            expect(
                m.grid?.rowReorderHandleAriaLabel?.(
                    "Reordenar linha 1",
                    "Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover.",
                    "A reordenação de linhas está desabilitada."
                )
            ).toBe(
                "Reordenar linha 1. Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover. A reordenação de linhas está desabilitada."
            );
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("Linha 3 movida para a posição 2.");
            expect(m.grid?.selectRow?.(2)).toBe("Selecionar linha 2");
        });

        it("formats MultiSelect itemsCount function with singular and plural agreement across 0, 1, 2, 10 counts", () => {
            expect(m.multiSelect?.itemsCount?.(0)).toBe("+ 0 itens");
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 item");
            expect(m.multiSelect?.itemsCount?.(2)).toBe("+ 2 itens");
            expect(m.multiSelect?.itemsCount?.(10)).toBe("+ 10 itens");
        });

        it("formats Pager functions correctly with discrete count inflections across 0, 1, 2, 10 counts", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Página 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 / página");
            expect(m.pager?.pageStatus?.(1, 1)).toBe("Página 1 de 1");
            expect(m.pager?.pageStatus?.(1, 2)).toBe("Página 1 de 2");
            expect(m.pager?.pageStatus?.(2, 10)).toBe("Página 2 de 10");
            expect(m.pager?.jumpBackwardLabel?.(0)).toBe("Retroceder 0 páginas");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("Retroceder 1 página");
            expect(m.pager?.jumpBackwardLabel?.(2)).toBe("Retroceder 2 páginas");
            expect(m.pager?.jumpBackwardLabel?.(10)).toBe("Retroceder 10 páginas");
            expect(m.pager?.jumpForwardLabel?.(0)).toBe("Avançar 0 páginas");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("Avançar 1 página");
            expect(m.pager?.jumpForwardLabel?.(2)).toBe("Avançar 2 páginas");
            expect(m.pager?.jumpForwardLabel?.(10)).toBe("Avançar 10 páginas");
        });

        it("formats Pager rangeStatus with correct singular and plural noun inflections", () => {
            expect(m.pager?.rangeStatus?.(0, 0, 0)).toBe("0 - 0 de 0 itens");
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("1 - 1 de 1 item");
            expect(m.pager?.rangeStatus?.(1, 2, 2)).toBe("1 - 2 de 2 itens");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1 - 10 de 50 itens");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("1 - 20 de 100 itens");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 de 5");
        });

        it("formats ScrollView page functions correctly with Portuguese ordering", () => {
            expect(m.scrollView?.page?.(1)).toBe("Página 1");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Página 2 de 8");
        });

        it("formats SplitButton function correctly for both text and empty states", () => {
            expect(m.splitButton?.splitButton?.("Salvar")).toBe("Salvar, botão com menu");
            expect(m.splitButton?.splitButton?.("")).toBe("Botão com menu");
        });
    });
});

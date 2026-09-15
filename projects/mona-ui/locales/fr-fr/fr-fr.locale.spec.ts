import { describe, expect, it } from "vitest";
import { MONA_FR_FR_LOCALE } from "./fr-fr.locale";

describe("MONA_FR_FR_LOCALE", () => {
    describe("metadata", () => {
        it("declares fr-FR locale id", () => {
            expect(MONA_FR_FR_LOCALE.id).toBe("fr-FR");
        });

        it("declares ltr direction", () => {
            expect(MONA_FR_FR_LOCALE.direction).toBe("ltr");
        });

        it("contains messages object", () => {
            expect(MONA_FR_FR_LOCALE.messages).toBeDefined();
            expect(typeof MONA_FR_FR_LOCALE.messages).toBe("object");
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
                expect(MONA_FR_FR_LOCALE.messages[ns], `Namespace ${ns} must be defined`).toBeDefined();
            }
        });
    });

    describe("representative exact translations", () => {
        const m = MONA_FR_FR_LOCALE.messages;

        it("translates Pager messages correctly", () => {
            expect(m.pager?.firstPageLabel).toBe("Première page");
            expect(m.pager?.lastPageLabel).toBe("Dernière page");
            expect(m.pager?.nextPageLabel).toBe("Page suivante");
            expect(m.pager?.previousPageLabel).toBe("Page précédente");
            expect(m.pager?.ofText).toBe("sur");
            expect(m.pager?.pageText).toBe("Page");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 par page");
        });

        it("translates Grid messages correctly", () => {
            expect(m.grid?.all).toBe("(Tout)");
            expect(m.grid?.delete).toBe("Supprimer");
            expect(m.grid?.deleteRowConfirmation).toBe("Supprimer cette ligne ?");
            expect(m.grid?.deleteRowTitle).toBe("Supprimer la ligne ?");
            expect(m.grid?.edit).toBe("Modifier");
            expect(m.grid?.filterPlaceholder).toBe("Filtrer...");
            expect(m.grid?.noData).toBe("Aucune donnée");
            expect(m.grid?.moveAsNext).toBe("Déplacer à la position suivante");
            expect(m.grid?.moveAsPrevious).toBe("Déplacer à la position précédente");
            expect(m.grid?.remove).toBe("Retirer");
            expect(m.grid?.save).toBe("Enregistrer");
            expect(m.grid?.selectAllRows).toBe("Sélectionner toutes les lignes");
        });

        it("translates ListBox messages correctly", () => {
            expect(m.listBox?.clearSelection).toBe("Effacer la sélection");
            expect(m.listBox?.moveDown).toBe("Déplacer vers le bas");
            expect(m.listBox?.moveUp).toBe("Déplacer vers le haut");
            expect(m.listBox?.remove).toBe("Retirer");
            expect(m.listBox?.transferFrom).toBe("Transférer depuis l’autre liste");
            expect(m.listBox?.transferTo).toBe("Transférer vers l’autre liste");
            expect(m.listBox?.transferAllFrom).toBe("Tout transférer depuis l’autre liste");
            expect(m.listBox?.transferAllTo).toBe("Tout transférer vers l’autre liste");
        });

        it("translates Editor messages correctly", () => {
            expect(m.editor?.bold).toBe("Gras");
            expect(m.editor?.italic).toBe("Italique");
            expect(m.editor?.underline).toBe("Souligné");
            expect(m.editor?.strikethrough).toBe("Barré");
            expect(m.editor?.insertLink).toBe("Insérer un lien");
            expect(m.editor?.removeLink).toBe("Supprimer le lien");
            expect(m.editor?.codeBlock).toBe("Bloc de code");
            expect(m.editor?.quotation).toBe("Citation");
            expect(m.editor?.undo).toBe("Annuler");
            expect(m.editor?.redo).toBe("Rétablir");
            expect(m.editor?.alignCenter).toBe("Centrer le texte");
            expect(m.editor?.insertTable).toBe("Insérer un tableau");
            expect(m.editor?.deleteTable).toBe("Supprimer le tableau");
            expect(m.editor?.format).toBe("Format");
        });

        it("translates Calendar & DatePicker messages correctly", () => {
            expect(m.calendar?.today).toBe("Aujourd’hui");
            expect(m.calendar?.nextMonth).toBe("Mois suivant");
            expect(m.calendar?.previousMonth).toBe("Mois précédent");
            expect(m.calendar?.nextYear).toBe("Année suivante");
            expect(m.calendar?.previousYear).toBe("Année précédente");
            expect(m.datePicker?.datePicker).toBe("Sélecteur de date");
            expect(m.datePicker?.openCalendar).toBe("Ouvrir le calendrier");
        });

        it("translates NumericTextBox messages correctly", () => {
            expect(m.numericTextBox?.decrease).toBe("Diminuer la valeur");
            expect(m.numericTextBox?.increase).toBe("Augmenter la valeur");
        });

        it("translates ComboBox & Dropdowns messages correctly", () => {
            expect(m.comboBox?.clear).toBe("Effacer");
            expect(m.dropdownList?.clear).toBe("Effacer");
            expect(m.dropdowns?.noResultsFound).toBe("Aucun résultat trouvé");
        });

        it("translates Dialog & Window messages correctly", () => {
            expect(m.dialog?.ok).toBe("OK");
            expect(m.dialog?.cancel).toBe("Annuler");
            expect(m.dialog?.closeDialog).toBe("Fermer la boîte de dialogue");
            expect(m.window?.close).toBe("Fermer");
            expect(m.window?.closeWindow).toBe("Fermer la fenêtre");
            expect(m.window?.maximize).toBe("Agrandir");
            expect(m.window?.minimize).toBe("Réduire");
            expect(m.window?.restore).toBe("Restaurer");
            expect(m.window?.moveWindow).toBe("Déplacer la fenêtre. Utilisez les touches fléchées pour la déplacer.");
        });

        it("translates TreeView & List messages correctly", () => {
            expect(m.treeView?.collapse).toBe("Réduire");
            expect(m.treeView?.expand).toBe("Développer");
            expect(m.treeView?.filterTree).toBe("Filtrer l’arborescence");
            expect(m.list?.noData).toBe("Aucune donnée");
        });

        it("translates ScrollView messages correctly", () => {
            expect(m.scrollView?.carousel).toBe("Carrousel");
            expect(m.scrollView?.slide).toBe("Diapositive");
            expect(m.scrollView?.nextPage).toBe("Page suivante");
            expect(m.scrollView?.previousPage).toBe("Page précédente");
            expect(m.scrollView?.scrollPagerNext).toBe("Faire défiler la pagination vers l’avant");
            expect(m.scrollView?.scrollPagerPrevious).toBe("Faire défiler la pagination vers l’arrière");
        });

        it("translates Spinner & Notification messages correctly", () => {
            expect(m.spinner?.loading).toBe("Chargement");
            expect(m.spinner?.cancel).toBe("Annuler");
            expect(m.notification?.close).toBe("Fermer");
            expect(m.notification?.success).toBe("Succès");
            expect(m.notification?.error).toBe("Erreur");
            expect(m.notification?.warning).toBe("Avertissement");
            expect(m.notification?.info).toBe("Information");
        });

        it("translates Sheet & Splitter & Stepper & Tabs correctly", () => {
            expect(m.sheet?.closeSheet).toBe("Fermer le panneau");
            expect(m.splitter?.resizer).toBe("Séparateur");
            expect(m.splitter?.collapsePrevious).toBe("Réduire le volet précédent");
            expect(m.splitter?.collapseNext).toBe("Réduire le volet suivant");
            expect(m.stepper?.stepProgress).toBe("Progression de l’étape");
            expect(m.stepper?.stepper).toBe("Indicateur d’étapes");
            expect(m.tabs?.closeTab).toBe("Fermer l’onglet");
        });

        it("translates Filter date operators correctly", () => {
            expect(m.filter?.isAfterOrEqualTo).toBe("Est postérieure ou égale à");
            expect(m.filter?.isBeforeOrEqualTo).toBe("Est antérieure ou égale à");
            expect(m.filter?.isAfter).toBe("Est postérieure à");
            expect(m.filter?.isBefore).toBe("Est antérieure à");
            expect(m.filter?.isEqualTo).toBe("Est égal à");
            expect(m.filter?.isNotEqualTo).toBe("N’est pas égal à");
        });

        it("translates ColorGradient accessibility labels correctly", () => {
            expect(m.colorGradient?.saturationAndValue).toBe("Saturation et luminosité");
        });

        it("translates Grid row-reorder disabled reasons correctly", () => {
            expect(m.grid?.rowReorderDisabled).toBe("La réorganisation des lignes est désactivée.");
            expect(m.grid?.rowReorderDisabledEditing).toBe("Terminez la modification avant de réordonner les lignes.");
            expect(m.grid?.rowReorderDisabledFiltered).toBe("Supprimez les filtres avant de réordonner les lignes.");
            expect(m.grid?.rowReorderDisabledGrouped).toBe("Supprimez le regroupement avant de réordonner les lignes.");
            expect(m.grid?.rowReorderDisabledSingleRow).toBe("Au moins deux lignes sont nécessaires pour les réordonner.");
            expect(m.grid?.rowReorderDisabledSorted).toBe("Supprimez le tri avant de réordonner les lignes.");
            expect(m.grid?.rowReorderDisabledVirtualScroll).toBe(
                "La réorganisation des lignes n’est pas disponible lorsque le défilement virtuel est activé."
            );
        });
    });

    describe("function-valued messages", () => {
        const m = MONA_FR_FR_LOCALE.messages;

        it("formats Calendar functions correctly", () => {
            expect(m.calendar?.calendarLabel?.("septembre 2026")).toBe("Calendrier, septembre 2026");
            expect(m.calendar?.decadeRange?.(2020, 2029)).toBe("2020 à 2029");
            expect(m.calendar?.decadeViewLabel?.(2020, 2029)).toBe("Vue par décennie, 2020–2029");
            expect(m.calendar?.yearCellLabel?.(2026)).toBe("Année 2026");
            expect(m.calendar?.yearViewLabel?.("2026")).toBe("Vue annuelle, 2026");
            expect(m.calendar?.goToToday?.("15/09/2026")).toBe("Aller à la date d’aujourd’hui, 15/09/2026");
            expect(m.calendar?.switchToYearView?.("septembre 2026")).toBe(
                "Passer à la vue annuelle, actuellement septembre 2026"
            );
            expect(m.calendar?.switchToDecadeView?.("2026")).toBe(
                "Passer à la vue par décennie, actuellement 2026"
            );
        });

        it("formats Chart functions correctly", () => {
            expect(m.chart?.rangeDescription?.("Revenu", "0", "100")).toBe("Revenu, de 0 à 100");
            expect(m.chart?.divergingRangeDescription?.("Rentabilité", "-10", "0", "+10")).toBe(
                "Rentabilité, de -10 à +10, point médian 0"
            );
        });

        it("formats Chip removeLabel function correctly", () => {
            expect(m.chip?.removeLabel?.("Angular")).toBe("Retirer Angular");
            expect(m.chip?.removeLabel?.()).toBe("Retirer l’élément");
        });

        it("formats ColorGradient saturationAndValueText function correctly", () => {
            expect(m.colorGradient?.saturationAndValueText?.(50, 75)).toBe("Saturation 50\u00A0%, luminosité 75\u00A0%");
        });

        it("formats Dropdowns functions with singular and plural correctly", () => {
            expect(m.dropdowns?.itemPosition?.("Option 1", 1, 10)).toBe("Option 1, 1 sur 10");
            expect(m.dropdowns?.resultsAvailable?.(1)).toBe("1 résultat disponible");
            expect(m.dropdowns?.resultsAvailable?.(5)).toBe("5 résultats disponibles");
        });

        it("formats Editor heading function correctly", () => {
            expect(m.editor?.heading?.(1)).toBe("Titre 1");
            expect(m.editor?.heading?.(3)).toBe("Titre 3");
        });

        it("formats Grid functions correctly with singular and plural", () => {
            expect(m.grid?.columnsSelected?.(1)).toBe("1 colonne sélectionnée");
            expect(m.grid?.columnsSelected?.(3)).toBe("3 colonnes sélectionnées");
            expect(m.grid?.filterByColumn?.("Nom")).toBe("Filtrer par Nom");
            expect(m.grid?.reorderRow?.(4)).toBe("Réordonner la ligne 4");
            expect(m.grid?.rowReorderMoved?.(3, 2)).toBe("Ligne 3 déplacée à la position 2.");
            expect(m.grid?.selectRow?.(2)).toBe("Sélectionner la ligne 2");
        });

        it("formats MultiSelect itemsCount function with singular and plural correctly", () => {
            expect(m.multiSelect?.itemsCount?.(1)).toBe("+ 1 élément");
            expect(m.multiSelect?.itemsCount?.(4)).toBe("+ 4 éléments");
        });

        it("formats Pager functions correctly with singular and plural", () => {
            expect(m.pager?.pageLabel?.(3)).toBe("Page 3");
            expect(m.pager?.pageSizeLabel?.(10)).toBe("10 par page");
            expect(m.pager?.pageStatus?.(2, 5)).toBe("Page 2 sur 5");
            expect(m.pager?.jumpBackwardLabel?.(1)).toBe("Reculer de 1 page");
            expect(m.pager?.jumpBackwardLabel?.(3)).toBe("Reculer de 3 pages");
            expect(m.pager?.jumpForwardLabel?.(1)).toBe("Avancer de 1 page");
            expect(m.pager?.jumpForwardLabel?.(5)).toBe("Avancer de 5 pages");
        });

        it("formats Pager rangeStatus with correct French singular and plural", () => {
            expect(m.pager?.rangeStatus?.(1, 1, 1)).toBe("1–1 sur 1 élément");
            expect(m.pager?.rangeStatus?.(1, 10, 50)).toBe("1–10 sur 50 éléments");
            expect(m.pager?.rangeStatus?.(1, 20, 100)).toBe("1–20 sur 100 éléments");
        });

        it("formats Rating valueText function correctly", () => {
            expect(m.rating?.valueText?.(4, 5)).toBe("4 sur 5");
        });

        it("formats ScrollView page functions correctly", () => {
            expect(m.scrollView?.page?.(1)).toBe("Page 1");
            expect(m.scrollView?.pageOf?.(2, 8)).toBe("Page 2 sur 8");
        });

        it("formats SplitButton function correctly", () => {
            expect(m.splitButton?.splitButton?.("Enregistrer")).toBe("Enregistrer, bouton fractionné");
            expect(m.splitButton?.splitButton?.("")).toBe("Bouton fractionné");
        });
    });
});

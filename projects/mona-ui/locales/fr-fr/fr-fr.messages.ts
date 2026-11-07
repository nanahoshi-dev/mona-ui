// Generated from fr-fr.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "fr-FR", options);
}

const PLURAL_RULES = new Intl.PluralRules("fr-FR");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const FR_FR_MESSAGES = {
    autoComplete: {
        clear: "Effacer"
    },
    breadcrumb: {
        breadcrumb: "Fil d’Ariane",
        showFullPath: "Afficher le chemin complet"
    },
    buttonGroup: {
        buttonGroup: "Groupe de boutons"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Calendrier, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) =>
            `${localizeNumber(start, { useGrouping: false })} à ${localizeNumber(end, { useGrouping: false })}`,
        decadeViewLabel: (start: number, end: number) =>
            `Vue par décennie, ${localizeNumber(start, { useGrouping: false })}–${localizeNumber(end, { useGrouping: false })}`,
        goToToday: (formattedDate: string) => `Aller à la date d’aujourd’hui, ${formattedDate}`,
        nextDecade: "Décennie suivante",
        nextMonth: "Mois suivant",
        nextYear: "Année suivante",
        previousDecade: "Décennie précédente",
        previousMonth: "Mois précédent",
        previousYear: "Année précédente",
        switchToDecadeView: (currentYear: string) => `Passer à la vue par décennie, actuellement ${currentYear}`,
        switchToYearView: (currentMonthAndYear: string) =>
            `Passer à la vue annuelle, actuellement ${currentMonthAndYear}`,
        today: "Aujourd’hui",
        yearCellLabel: (year: number) => `Année ${localizeNumber(year, { useGrouping: false })}`,
        yearViewLabel: (year: string) => `Vue annuelle, ${year}`
    },
    card: {
        actionsLabel: "Actions de la carte"
    },
    chart: {
        announcementSeparator: ", ",
        brushApplied: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Sélection appliquée, ${localizeNumber(count)} point`,
                other: () => `Sélection appliquée, ${localizeNumber(count)} points`
            }),
        brushCleared: "Sélection effacée",
        brushRange: (from: string, to: string) => `Sélection de ${from} à ${to}`,
        category: "Catégorie",
        categoryFallbackName: (index: number) => `Catégorie ${localizeNumber(index)}`,
        categoryRange: (from: string, to: string) => `De ${from} à ${to}.`,
        change: "Variation",
        changeValue: (change: string) => `variation ${change}`,
        chart: "Graphique",
        chartLegend: "Légende du graphique",
        chartRoleDescription: "graphique",
        close: "Clôture",
        closeAbbreviation: "C",
        colorScale: "Échelle de couleurs",
        conversion: "Conversion",
        conversionOfPrevious: (rate: string) => `Conversion de ${rate} par rapport à l’étape précédente`,
        dataTableTruncated: (shown: number, total: number) =>
            `Affichage des ${localizeNumber(shown)} premières lignes sur ${localizeNumber(total)}.`,
        decrease: "Baisse",
        decreaseAnnouncement: (delta: string, from: string, to: string) =>
            `baisse de ${delta}, total cumulé de ${from} à ${to}`,
        divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
            `${title}, de ${minimum} à ${maximum}, point médian ${midpoint}`,
        dropOff: "Abandon",
        dropOffValue: (value: string) => `Abandon ${value}`,
        falling: "En baisse",
        gaugeRange: (minimum: string, maximum: string) => `plage de ${minimum} à ${maximum}`,
        high: "Haut",
        highAbbreviation: "H",
        increase: "Hausse",
        increaseAnnouncement: (delta: string, from: string, to: string) =>
            `hausse de ${delta}, total cumulé de ${from} à ${to}`,
        itemDeselected: (item: string) => `${item}, désélectionné`,
        itemFallbackName: (index: number) => `Élément ${localizeNumber(index)}`,
        itemSelected: (item: string) => `${item}, sélectionné`,
        keyboardHelp:
            "Utilisez les flèches pour passer d’un point de données à l’autre, Début et Fin pour aller au premier et au dernier, Entrée ou Espace pour activer, et Échap pour effacer.",
        labelValueSeparator: "\u00A0:",
        labeledValue: (label: string, value: string) => `${label}\u00A0: ${value}`,
        low: "Bas",
        lowAbbreviation: "B",
        noChange: "Aucune variation",
        noChangeAnnouncement: (value: string) => `aucune variation, total cumulé ${value}`,
        noData: "Aucune donnée disponible",
        ohlcValues: (open: string, high: string, low: string, close: string) =>
            `Ouverture ${open}, haut ${high}, bas ${low}, clôture ${close}`,
        open: "Ouverture",
        openAbbreviation: "O",
        overall: "Total",
        overallConversion: (rate: string) => `Conversion globale ${rate}`,
        pannedDown: "Déplacé vers le bas",
        pannedLeft: "Déplacé vers la gauche",
        pannedRight: "Déplacé vers la droite",
        pannedUp: "Déplacé vers le haut",
        pathSeparator: " / ",
        pointPosition: (position: number, total: number) => `${localizeNumber(position)} sur ${localizeNumber(total)}`,
        range: "Plage",
        rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, de ${minimum} à ${maximum}`,
        rangeValue: (from: string, to: string) => `de ${from} à ${to}`,
        rising: "En hausse",
        runningTotal: "Total cumulé",
        seriesFallbackName: (index: number) => `Série ${localizeNumber(index)}`,
        seriesHidden: (series: string) => `${series} masquée`,
        seriesShown: (series: string) => `${series} affichée`,
        seriesSummary: (count: number, names: string) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Une série\u00A0: ${names}.`,
                other: () => `${localizeNumber(count)} séries\u00A0: ${names}.`
            }),
        seriesValueRange: (series: string, minimum: string, maximum: string) =>
            `${series}\u00A0: minimum ${minimum}, maximum ${maximum}.`,
        shareOfTotal: (share: string) => `${share} du total`,
        size: "Taille",
        sizeValue: (size: string) => `taille ${size}`,
        stackShare: (share: string) => `part de la pile ${share}`,
        stageFallbackName: (index: number) => `Étape ${localizeNumber(index)}`,
        stagePosition: (position: number, total: number) =>
            `étape ${localizeNumber(position)} sur ${localizeNumber(total)}`,
        stepFallbackName: (index: number) => `Pas ${localizeNumber(index)}`,
        stepPosition: (position: number, total: number) =>
            `pas ${localizeNumber(position)} sur ${localizeNumber(total)}`,
        subtotal: "Sous-total",
        subtotalAnnouncement: (value: string) => `sous-total ${value}`,
        total: "Montant total",
        totalAnnouncement: (value: string) => `montant total ${value}`,
        treemapGroup: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `Groupe (${localizeNumber(count)} enfant)`,
                other: () => `Groupe (${localizeNumber(count)} enfants)`
            }),
        treemapLeaf: "Feuille",
        unchanged: "Inchangé",
        value: "Valeur",
        valueRange: (from: string, to: string) => `${from} – ${to}`,
        viewportResetToDefault: "Vue réinitialisée à la plage par défaut",
        viewportResetToFull: "Vue réinitialisée à la plage complète",
        visualIndicatorClamped: "Indicateur visuel limité",
        zoomedIn: "Zoom avant",
        zoomedOut: "Zoom arrière"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Retirer ${label}` : "Retirer l’élément")
    },
    colorGradient: {
        alpha: "Canal alpha",
        alphaText: (opacity: number) => `Opacité ${localizeNumber(opacity)}\u00A0%`,
        apply: "Appliquer",
        blue: "Bleu",
        cancel: "Annuler",
        clearColor: "Effacer la couleur",
        colorCopied: "Couleur copiée",
        colorGradient: "Dégradé de couleur",
        copyAsHex: "Copier en HEX",
        copyAsRgb: "Copier en RVB",
        copyColor: "Copier la couleur",
        copyFailed: "Impossible de copier la couleur",
        currentColor: "Couleur actuelle",
        green: "Vert",
        hexColor: "Couleur hexadécimale",
        hue: "Teinte",
        previousColor: "Couleur précédente",
        red: "Rouge",
        saturation: "Saturation",
        saturationAndValue: "Saturation et luminosité",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturation ${localizeNumber(saturation)}\u00A0%, luminosité ${localizeNumber(value)}\u00A0%`,
        switchColorMode: "Changer de mode colorimétrique",
        value: "Luminosité"
    },
    colorPalette: {
        color: (color: string) => `Couleur ${color}`,
        colorPalette: "Palette de couleurs",
        namedColor: (name: string, color: string) => `${name}, ${color}`
    },
    colorPicker: {
        clearColor: "Effacer la couleur",
        colorGradientPicker: "Sélecteur de dégradé de couleurs",
        colorPalettePicker: "Sélecteur de palette de couleurs",
        colorPicker: "Sélecteur de couleur",
        noColor: "Aucune couleur"
    },
    comboBox: {
        clear: "Effacer"
    },
    datePicker: {
        datePicker: "Sélecteur de date",
        openCalendar: "Ouvrir le calendrier"
    },
    dateTimePicker: {
        calendar: "Calendrier",
        cancel: "Annuler",
        date: "Date",
        dateTimePicker: "Sélecteur de date et d’heure",
        openDateTimePicker: "Ouvrir le sélecteur de date et d’heure",
        set: "Valider",
        time: "Heure",
        timePicker: "Sélecteur d’heure"
    },
    dialog: {
        cancel: "Annuler",
        closeDialog: "Fermer la boîte de dialogue",
        ok: "OK"
    },
    dropdownList: {
        clear: "Effacer"
    },
    dropdowns: {
        itemPosition: (text: string, position: number, total: number) =>
            `${text}, ${localizeNumber(position)} sur ${localizeNumber(total)}`,
        noResultsFound: "Aucun résultat trouvé",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 résultat disponible" : `${localizeNumber(count)} résultats disponibles`
    },
    editor: {
        addColumnAfter: "Insérer une colonne après",
        addColumnBefore: "Insérer une colonne avant",
        addHorizontalLine: "Insérer une ligne horizontale",
        addRowAfter: "Insérer une ligne après",
        addRowBefore: "Insérer une ligne avant",
        alignCenter: "Centrer le texte",
        alignEnd: "Aligner le texte à la fin",
        alignLeft: "Aligner le texte à gauche",
        alignRight: "Aligner le texte à droite",
        alignStart: "Aligner le texte au début",
        alignmentGroup: "Alignement",
        altText: "Texte alternatif",
        apply: "Appliquer",
        backgroundColor: "Couleur d’arrière-plan",
        bold: "Gras",
        cancel: "Annuler",
        codeBlock: "Bloc de code",
        color: "Couleur",
        contentLabel: "Éditeur de texte enrichi",
        defaultFontFamily: "Police par défaut",
        deleteColumn: "Supprimer la colonne",
        deleteRow: "Supprimer la ligne",
        deleteTable: "Supprimer le tableau",
        editLink: "Modifier le lien",
        enterUrl: "Saisir l’URL",
        fontSize: "Taille de police",
        format: "Format",
        heading: (level: number) => `Titre ${localizeNumber(level)}`,
        heightPx: "Hauteur (px)",
        historyGroup: "Historique",
        imageUrl: "URL de l’image",
        indent: "Augmenter le retrait",
        indentGroup: "Retrait",
        insert: "Insérer",
        insertImage: "Insérer une image",
        insertLink: "Insérer un lien",
        insertOrderedList: "Insérer une liste numérotée",
        insertTable: "Insérer un tableau",
        insertTaskList: "Insérer une liste de tâches",
        insertUnorderedList: "Insérer une liste à puces",
        invalidUrl: "Saisissez une adresse web, un lien mailto: ou tel:, ou un chemin relatif.",
        italic: "Italique",
        justify: "Justifier le texte",
        linkGroup: "Lien",
        listGroup: "Listes",
        mergeCells: "Fusionner les cellules sélectionnées",
        outdent: "Diminuer le retrait",
        paragraph: "Paragraphe",
        quotation: "Citation",
        redo: "Rétablir",
        removeLink: "Supprimer le lien",
        selectFontFamily: "Sélectionner la police",
        selectFontSize: "Sélectionner la taille de police",
        splitCell: "Scinder la cellule",
        strikethrough: "Barré",
        subscript: "Indice",
        superscript: "Exposant",
        tableGroup: "Tableau",
        tableSize: (rows: number, columns: number) =>
            `Lignes : ${localizeNumber(rows)}, colonnes : ${localizeNumber(columns)}`,
        textStyleGroup: "Style du texte",
        toggleHeaderRow: "Activer/désactiver la ligne d’en-tête",
        toolbar: "Mise en forme",
        underline: "Souligné",
        undo: "Annuler",
        widthPx: "Largeur (px)"
    },
    filter: {
        and: "Et",
        apply: "Appliquer",
        clear: "Effacer",
        contains: "Contient",
        doesNotContain: "Ne contient pas",
        endsWith: "Se termine par",
        isAfter: "Est postérieure à",
        isAfterOrEqualTo: "Est postérieure ou égale à",
        isBefore: "Est antérieure à",
        isBeforeOrEqualTo: "Est antérieure ou égale à",
        isEmpty: "Est vide",
        isEqualTo: "Est égal à",
        isFalse: "Est faux",
        isGreaterThan: "Est supérieur à",
        isGreaterThanOrEqualTo: "Est supérieur ou égal à",
        isLessThan: "Est inférieur à",
        isLessThanOrEqualTo: "Est inférieur ou égal à",
        isNotEmpty: "N’est pas vide",
        isNotEqualTo: "N’est pas égal à",
        isNotNull: "N’est pas nul",
        isNotNullOrEmpty: "N’est ni nul ni vide",
        isNull: "Est nul",
        isNullOrEmpty: "Est nul ou vide",
        isTrue: "Est vrai",
        logic: "Combiner les conditions",
        operator: "Opérateur",
        or: "Ou",
        secondOperator: "Deuxième opérateur",
        secondValue: "Deuxième valeur",
        startsWith: "Commence par",
        value: "Valeur"
    },
    grid: {
        all: "(Tout)",
        apply: "Appliquer",
        cancel: "Annuler",
        cancelNewRow: "Annuler la nouvelle ligne",
        cancelRowEdit: (rowNumber: number) => `Annuler la modification de la ligne ${localizeNumber(rowNumber)}`,
        clearFilter: (column: string) => `Effacer le filtre de ${column}`,
        collapseDetail: (rowNumber: number) => `Masquer les détails de la ligne ${localizeNumber(rowNumber)}`,
        columnGrouped: (column: string) => `Groupé par ${column}`,
        columnMoved: (column: string, position: number) =>
            `Colonne ${column} déplacée en position ${localizeNumber(position)}`,
        columns: "Colonnes",
        columnsSelected: (count: number) =>
            count === 1 ? "1 colonne sélectionnée" : `${localizeNumber(count)} colonnes sélectionnées`,
        commandColumnTitle: "Commandes",
        delete: "Supprimer",
        deleteRowConfirmation: (rowNumber: number) => `Supprimer la ligne ${localizeNumber(rowNumber)} ?`,
        deleteRowTitle: "Supprimer la ligne ?",
        details: "Détails",
        dragColumnHeaderToGroup: "Faites glisser un en-tête de colonne ici pour regrouper",
        edit: "Modifier",
        editRow: (rowNumber: number) => `Modifier la ligne ${localizeNumber(rowNumber)}`,
        expandDetail: (rowNumber: number) => `Afficher les détails de la ligne ${localizeNumber(rowNumber)}`,
        fieldValidationError: "Valeur non valide.",
        filterByColumn: (column: string) => `Filtrer par ${column}`,
        filterByColumnFiltered: (column: string) => `Filtrer par ${column}, filtré`,
        filterOperator: (column: string, operator: string) => `Opérateur de filtre de ${column} : ${operator}`,
        filterPlaceholder: "Filtrer...",
        group: "Groupe",
        loading: "Chargement",
        modified: "Modifié",
        moveAsNext: "Déplacer à la position suivante",
        moveAsPrevious: "Déplacer à la position précédente",
        moveRow: "Déplacer la ligne",
        noData: "Aucune donnée",
        remove: "Retirer",
        removeRow: (rowNumber: number) => `Retirer la ligne ${localizeNumber(rowNumber)}`,
        reorderRow: (rowNumber: number) => `Réordonner la ligne ${localizeNumber(rowNumber)}`,
        resizeColumn: (column: string) => `Redimensionner la colonne ${column}`,
        rowReorder: "Réorganisation des lignes",
        rowReorderDisabled: "La réorganisation des lignes est désactivée.",
        rowReorderDisabledEditing: "Terminez la modification avant de réordonner les lignes.",
        rowReorderDisabledFiltered: "Supprimez les filtres avant de réordonner les lignes.",
        rowReorderDisabledGrouped: "Supprimez le regroupement avant de réordonner les lignes.",
        rowReorderDisabledServerBinding: "La réorganisation des lignes est indisponible avec la liaison serveur.",
        rowReorderDisabledSingleRow: "Au moins deux lignes sont nécessaires pour les réordonner.",
        rowReorderDisabledSorted: "Supprimez le tri avant de réordonner les lignes.",
        rowReorderDisabledVirtualScroll:
            "La réorganisation des lignes n’est pas disponible lorsque le défilement virtuel est activé.",
        rowReorderHandleAriaLabel: (rowLabel: string, keyboardHint: string, disabledReason?: string) =>
            `${rowLabel}. ${keyboardHint}${disabledReason ? ` ${disabledReason}` : ""}`,
        rowReorderKeyboardHint:
            "Utilisez Alt + Flèche vers le haut ou Alt + Flèche vers le bas pour déplacer la ligne.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Ligne ${localizeNumber(fromRowNumber)} déplacée à la position ${localizeNumber(toPosition)}.`,
        rowValidationError: "Cette ligne contient des erreurs de validation.",
        save: "Enregistrer",
        saveNewRow: "Enregistrer la nouvelle ligne",
        saveRow: (rowNumber: number) => `Enregistrer la ligne ${localizeNumber(rowNumber)}`,
        selectAllRows: "Sélectionner toutes les lignes",
        selectRow: (rowNumber: number) => `Sélectionner la ligne ${localizeNumber(rowNumber)}`,
        sortOrder: (position: number) => `Ordre de tri ${localizeNumber(position)}`,
        toolbar: "Barre d’outils du tableau"
    },
    label: {
        optional: "Facultatif"
    },
    list: {
        filterList: "Filtrer la liste",
        loading: "Chargement",
        noData: "Aucune donnée",
        pagerLabel: (list: string) => `Pagination de ${list}`
    },
    listBox: {
        clearSelection: "Effacer la sélection",
        itemsMoved: (position: number, total: number) =>
            `Déplacé en position ${localizeNumber(position)} sur ${localizeNumber(total)}`,
        itemsRemoved: (count: number) =>
            count === 1 ? `${localizeNumber(count)} élément retiré` : `${localizeNumber(count)} éléments retirés`,
        itemsTransferred: (count: number, list: string) =>
            count === 1
                ? `${localizeNumber(count)} élément transféré vers ${list}`
                : `${localizeNumber(count)} éléments transférés vers ${list}`,
        itemsTransferredToOtherList: (count: number) =>
            count === 1
                ? `${localizeNumber(count)} élément transféré vers l’autre liste`
                : `${localizeNumber(count)} éléments transférés vers l’autre liste`,
        moveDown: "Déplacer vers le bas",
        moveUp: "Déplacer vers le haut",
        remove: "Retirer",
        selectionCleared: "Sélection effacée",
        toolbarLabel: (list: string) => `Actions de ${list}`,
        transferAllFrom: "Tout transférer depuis l’autre liste",
        transferAllFromList: (list: string) => `Tout transférer depuis ${list}`,
        transferAllTo: "Tout transférer vers l’autre liste",
        transferAllToList: (list: string) => `Tout transférer vers ${list}`,
        transferFrom: "Transférer depuis l’autre liste",
        transferFromList: (list: string) => `Transférer depuis ${list}`,
        transferTo: "Transférer vers l’autre liste",
        transferToList: (list: string) => `Transférer vers ${list}`
    },
    multiSelect: {
        clear: "Effacer",
        itemsCount: (count: number) =>
            count === 1 ? `+ ${localizeNumber(count)} élément` : `+ ${localizeNumber(count)} éléments`,
        removeMoreItems: (count: number) =>
            count === 1
                ? `Retirer ${localizeNumber(count)} autre élément`
                : `Retirer ${localizeNumber(count)} autres éléments`
    },
    notification: {
        close: "Fermer",
        error: "Erreur",
        info: "Information",
        region: "Notifications",
        success: "Succès",
        warning: "Avertissement"
    },
    numericTextBox: {
        decrease: "Diminuer la valeur",
        increase: "Augmenter la valeur"
    },
    otpInput: {
        verificationCode: "Code de vérification"
    },
    pager: {
        firstPageLabel: "Première page",
        itemsPerPageLabel: "Éléments par page",
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Reculer de 1 page" : `Reculer de ${localizeNumber(pages)} pages`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avancer de 1 page" : `Avancer de ${localizeNumber(pages)} pages`,
        lastPageLabel: "Dernière page",
        nextPageLabel: "Page suivante",
        ofText: "sur",
        pageInputPrefix: (_totalPages: number) => "Page",
        pageInputSuffix: (totalPages: number) => `sur ${localizeNumber(totalPages)}`,
        pageLabel: (page: number) => `Page ${localizeNumber(page)}`,
        pageSelectLabel: "Page",
        pageSizeLabel: (pageSize: number) => `${localizeNumber(pageSize)} par page`,
        pageStatus: (page: number, totalPages: number) =>
            `Page ${localizeNumber(page)} sur ${localizeNumber(totalPages)}`,
        pageText: "Page",
        pagerLabel: "Pagination",
        previousPageLabel: "Page précédente",
        rangeStatus: (start: number, end: number, total: number) =>
            total === 1
                ? `${localizeNumber(start)}–${localizeNumber(end)} sur ${localizeNumber(total)} élément`
                : `${localizeNumber(start)}–${localizeNumber(end)} sur ${localizeNumber(total)} éléments`
    },
    progressBar: {
        label: "Progression"
    },
    rating: {
        notRated: "Non évalué",
        valueText: (value: number, max: number) => `${localizeNumber(value)} sur ${localizeNumber(max)}`
    },
    scrollView: {
        carousel: "Carrousel",
        nextPage: "Page suivante",
        page: (current: number) => `Page ${localizeNumber(current)}`,
        pageOf: (current: number, total: number) => `Page ${localizeNumber(current)} sur ${localizeNumber(total)}`,
        pages: "Pages",
        previousPage: "Page précédente",
        scrollPagerNext: "Faire défiler la pagination vers l’avant",
        scrollPagerPrevious: "Faire défiler la pagination vers l’arrière",
        slide: "Diapositive"
    },
    sheet: {
        closeSheet: "Fermer le panneau"
    },
    sidebar: {
        drawerLabel: "Barre latérale",
        rail: "Afficher ou masquer la barre latérale"
    },
    slider: {
        maximumValue: "Valeur maximale",
        minimumValue: "Valeur minimale",
        sliderValue: "Valeur du curseur"
    },
    spinner: {
        cancel: "Annuler",
        loading: "Chargement"
    },
    splitButton: {
        menuButtonAriaLabel: "Afficher les options du menu",
        menuButtonWithText: (text: string) => `Autres options pour ${text}`,
        splitButton: (text: string) => (text ? `${text}, bouton fractionné` : "Bouton fractionné")
    },
    splitter: {
        collapseDown: "Réduire le volet inférieur",
        collapseNext: "Réduire le volet suivant",
        collapsePrevious: "Réduire le volet précédent",
        collapseUp: "Réduire le volet supérieur",
        resizer: "Séparateur"
    },
    stepper: {
        stepCompleted: "Terminée",
        stepInvalid: "Contient des erreurs",
        stepPosition: (current: number, total: number) =>
            `Étape ${localizeNumber(current)} sur ${localizeNumber(total)}`,
        stepProgress: "Progression de l’étape",
        stepper: "Indicateur d’étapes"
    },
    tabs: {
        closeTab: "Fermer l’onglet",
        scrollNext: "Faire défiler les onglets vers l’avant",
        scrollPrevious: "Faire défiler les onglets vers l’arrière"
    },
    textBox: {
        clear: "Effacer"
    },
    timePicker: {
        openTimePicker: "Ouvrir le sélecteur d’heure",
        timePicker: "Sélecteur d’heure"
    },
    timeSelector: {
        am: "AM",
        amPm: "AM/PM",
        headerHours: "h",
        headerMinutes: "min",
        headerSeconds: "s",
        hours: "Heures",
        minutes: "Minutes",
        now: "Maintenant",
        pm: "PM",
        seconds: "Secondes",
        set: "Valider",
        timeSelector: "Sélecteur d’heure"
    },
    treeView: {
        collapse: "Réduire",
        expand: "Développer",
        filter: "Filtrer",
        filterLabel: (tree: string) => `Filtrer ${tree}`,
        filterTree: "Filtrer l’arborescence",
        loadError: (node: string) => `Impossible de charger les éléments de ${node}`,
        loadingNode: (node: string) => `Chargement de ${node}`,
        movedAfter: (node: string, target: string) => `${node} déplacé après ${target}`,
        movedBefore: (node: string, target: string) => `${node} déplacé avant ${target}`,
        movedInto: (node: string, target: string) => `${node} déplacé dans ${target}`,
        noData: "Aucune donnée",
        noMatches: "Aucun élément correspondant",
        results: (count: number) =>
            plural(PLURAL_RULES.select(count), {
                one: () => `${localizeNumber(count)} résultat`,
                other: () => `${localizeNumber(count)} résultats`
            }),
        retryLoading: (node: string) => `Réessayer de charger ${node}`
    },
    window: {
        close: "Fermer",
        closeWindow: "Fermer la fenêtre",
        maximize: "Agrandir",
        minimize: "Réduire",
        moveOrResizeWindow:
            "Déplacer ou redimensionner la fenêtre. Utilisez les touches fléchées pour la déplacer, ou Ctrl et les touches fléchées pour la redimensionner.",
        moveWindow: "Déplacer la fenêtre. Utilisez les touches fléchées pour la déplacer.",
        resizeBottom: "Redimensionner la fenêtre depuis le bas. Utilisez les touches fléchées pour redimensionner.",
        resizeBottomLeft:
            "Redimensionner la fenêtre depuis le coin inférieur gauche. Utilisez les touches fléchées pour redimensionner.",
        resizeBottomRight:
            "Redimensionner la fenêtre depuis le coin inférieur droit. Utilisez les touches fléchées pour redimensionner.",
        resizeLeft: "Redimensionner la fenêtre depuis la gauche. Utilisez les touches fléchées pour redimensionner.",
        resizeRight: "Redimensionner la fenêtre depuis la droite. Utilisez les touches fléchées pour redimensionner.",
        resizeTop: "Redimensionner la fenêtre depuis le haut. Utilisez les touches fléchées pour redimensionner.",
        resizeTopLeft:
            "Redimensionner la fenêtre depuis le coin supérieur gauche. Utilisez les touches fléchées pour redimensionner.",
        resizeTopRight:
            "Redimensionner la fenêtre depuis le coin supérieur droit. Utilisez les touches fléchées pour redimensionner.",
        resizeWindow: "Redimensionner la fenêtre. Utilisez Ctrl et les touches fléchées pour la redimensionner.",
        restore: "Restaurer"
    }
} satisfies MonaLocaleMessages;

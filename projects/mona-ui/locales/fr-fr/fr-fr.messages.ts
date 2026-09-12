import type { MonaLocaleMessages } from "@nanahoshi/mona-ui/i18n";

export const FR_FR_MESSAGES = {
    autoComplete: {
        clear: "Effacer"
    },
    breadcrumb: {
        breadcrumb: "Fil d’Ariane"
    },
    buttonGroup: {
        buttonGroup: "Groupe de boutons"
    },
    calendar: {
        calendarLabel: (formattedMonthAndYear: string) => `Calendrier, ${formattedMonthAndYear}`,
        decadeRange: (start: number, end: number) => `${start} à ${end}`,
        decadeViewLabel: (start: number, end: number) => `Vue par décennie, ${start}–${end}`,
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
        yearCellLabel: (year: number) => `Année ${year}`,
        yearViewLabel: (year: string) => `Vue annuelle, ${year}`
    },
    card: {
        actionsLabel: "Actions de la carte"
    },
    chart: {
        change: "Variation",
        chart: "Graphique",
        chartLegend: "Légende du graphique",
        close: "Clôture",
        closeAbbreviation: "C",
        colorScale: "Échelle de couleurs",
        conversion: "Conversion",
        divergingRangeDescription: (
            title: string,
            minimum: string,
            midpoint: string,
            maximum: string
        ) => `${title}, de ${minimum} à ${maximum}, point médian ${midpoint}`,
        dropOff: "Abandon",
        falling: "En baisse",
        high: "Haut",
        highAbbreviation: "H",
        labelValueSeparator: ":",
        low: "Bas",
        lowAbbreviation: "B",
        noData: "Aucune donnée disponible",
        open: "Ouverture",
        openAbbreviation: "O",
        overall: "Total",
        range: "Plage",
        rangeDescription: (title: string, minimum: string, maximum: string) =>
            `${title}, de ${minimum} à ${maximum}`,
        rising: "En hausse",
        runningTotal: "Total cumulé",
        size: "Taille",
        unchanged: "Inchangé",
        value: "Valeur",
        visualIndicatorClamped: "Indicateur visuel limité"
    },
    chip: {
        removeLabel: (label?: string) => (label ? `Retirer ${label}` : "Retirer l’élément")
    },
    colorGradient: {
        apply: "Appliquer",
        cancel: "Annuler",
        clearColor: "Effacer la couleur",
        copyAsHex: "Copier en HEX",
        copyAsRgb: "Copier en RVB",
        copyColor: "Copier la couleur",
        currentColor: "Couleur actuelle",
        previousColor: "Couleur précédente",
        saturationAndValue: "Saturation et luminosité",
        saturationAndValueText: (saturation: number, value: number) =>
            `Saturation ${saturation}\u00A0%, luminosité ${value}\u00A0%`,
        switchColorMode: "Changer de mode colorimétrique"
    },
    colorPalette: {
        color: (color: string) => `Couleur ${color}`,
        colorPalette: "Palette de couleurs"
    },
    colorPicker: {
        clearColor: "Effacer la couleur",
        colorGradientPicker: "Sélecteur de dégradé de couleurs",
        colorPalettePicker: "Sélecteur de palette de couleurs",
        colorPicker: "Sélecteur de couleur"
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
            `${text}, ${position} sur ${total}`,
        noResultsFound: "Aucun résultat trouvé",
        resultsAvailable: (count: number) =>
            count === 1 ? "1 résultat disponible" : `${count} résultats disponibles`
    },
    editor: {
        addColumnAfter: "Insérer une colonne après",
        addColumnBefore: "Insérer une colonne avant",
        addHorizontalLine: "Insérer une ligne horizontale",
        addRowAfter: "Insérer une ligne après",
        addRowBefore: "Insérer une ligne avant",
        alignCenter: "Centrer le texte",
        alignLeft: "Aligner le texte à gauche",
        alignRight: "Aligner le texte à droite",
        altText: "Texte alternatif",
        backgroundColor: "Couleur d’arrière-plan",
        bold: "Gras",
        cancel: "Annuler",
        codeBlock: "Bloc de code",
        color: "Couleur",
        deleteColumn: "Supprimer la colonne",
        deleteRow: "Supprimer la ligne",
        deleteTable: "Supprimer le tableau",
        enterUrl: "Saisir l’URL",
        fontSize: "Taille de police",
        format: "Format",
        heading: (level: number) => `Titre ${level}`,
        heightPx: "Hauteur (px)",
        imageUrl: "URL de l’image",
        indent: "Augmenter le retrait",
        insert: "Insérer",
        insertImage: "Insérer une image",
        insertLink: "Insérer un lien",
        insertOrderedList: "Insérer une liste numérotée",
        insertTable: "Insérer un tableau",
        insertTaskList: "Insérer une liste de tâches",
        insertUnorderedList: "Insérer une liste à puces",
        italic: "Italique",
        justify: "Justifier le texte",
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
        toggleHeaderRow: "Activer/désactiver la ligne d’en-tête",
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
        or: "Ou",
        startsWith: "Commence par"
    },
    grid: {
        all: "(Tout)",
        apply: "Appliquer",
        cancel: "Annuler",
        cancelRowEdit: "Annuler la modification de la ligne",
        columns: "Colonnes",
        columnsSelected: (count: number) =>
            count === 1 ? "1 colonne sélectionnée" : `${count} colonnes sélectionnées`,
        delete: "Supprimer",
        deleteRowConfirmation: "Supprimer cette ligne ?",
        deleteRowTitle: "Supprimer la ligne ?",
        dragColumnHeaderToGroup: "Faites glisser un en-tête de colonne ici pour regrouper",
        edit: "Modifier",
        editRow: "Modifier la ligne",
        fieldValidationError: "Valeur non valide.",
        filterByColumn: (column: string) => `Filtrer par ${column}`,
        filterPlaceholder: "Filtrer...",
        modified: "Modifié",
        moveAsNext: "Déplacer à la position suivante",
        moveAsPrevious: "Déplacer à la position précédente",
        moveRow: "Déplacer la ligne",
        noData: "Aucune donnée",
        remove: "Retirer",
        removeRow: "Retirer la ligne",
        reorderRow: (rowNumber: number) => `Réordonner la ligne ${rowNumber}`,
        resizeColumn: "Redimensionner la colonne",
        rowReorder: "Réorganisation des lignes",
        rowReorderDisabled: "La réorganisation des lignes est désactivée.",
        rowReorderDisabledEditing: "Terminez la modification avant de réordonner les lignes.",
        rowReorderDisabledFiltered: "Supprimez les filtres avant de réordonner les lignes.",
        rowReorderDisabledGrouped: "Supprimez le regroupement avant de réordonner les lignes.",
        rowReorderDisabledSingleRow: "Au moins deux lignes sont nécessaires pour les réordonner.",
        rowReorderDisabledSorted: "Supprimez le tri avant de réordonner les lignes.",
        rowReorderDisabledVirtualScroll:
            "La réorganisation des lignes n’est pas disponible lorsque le défilement virtuel est activé.",
        rowReorderKeyboardHint:
            "Utilisez Alt + Flèche vers le haut ou Alt + Flèche vers le bas pour déplacer la ligne.",
        rowReorderMoved: (fromRowNumber: number, toPosition: number) =>
            `Ligne ${fromRowNumber} déplacée à la position ${toPosition}.`,
        rowValidationError: "Cette ligne contient des erreurs de validation.",
        save: "Enregistrer",
        saveRow: "Enregistrer la ligne",
        selectAllRows: "Sélectionner toutes les lignes",
        selectRow: (rowNumber: number) => `Sélectionner la ligne ${rowNumber}`
    },
    list: {
        noData: "Aucune donnée"
    },
    listBox: {
        clearSelection: "Effacer la sélection",
        moveDown: "Déplacer vers le bas",
        moveUp: "Déplacer vers le haut",
        remove: "Retirer",
        transferAllFrom: "Tout transférer depuis l’autre liste",
        transferAllTo: "Tout transférer vers l’autre liste",
        transferFrom: "Transférer depuis l’autre liste",
        transferTo: "Transférer vers l’autre liste"
    },
    multiSelect: {
        clear: "Effacer",
        itemsCount: (count: number) => `+ ${count} ${count === 1 ? "élément" : "éléments"}`
    },
    notification: {
        close: "Fermer",
        error: "Erreur",
        info: "Information",
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
        jumpBackwardLabel: (pages: number) =>
            pages === 1 ? "Reculer de 1 page" : `Reculer de ${pages} pages`,
        jumpForwardLabel: (pages: number) =>
            pages === 1 ? "Avancer de 1 page" : `Avancer de ${pages} pages`,
        lastPageLabel: "Dernière page",
        nextPageLabel: "Page suivante",
        ofText: "sur",
        pageLabel: (page: number) => `Page ${page}`,
        pageSizeLabel: (pageSize: number) => `${pageSize} par page`,
        pageStatus: (page: number, totalPages: number) => `Page ${page} sur ${totalPages}`,
        pageText: "Page",
        previousPageLabel: "Page précédente",
        rangeStatus: (start: number, end: number, total: number) =>
            `${start}–${end} sur ${total} ${total === 1 ? "élément" : "éléments"}`
    },
    rating: {
        notRated: "Non évalué",
        valueText: (value: number, max: number) => `${value} sur ${max}`
    },
    scrollView: {
        carousel: "Carrousel",
        nextPage: "Page suivante",
        page: (current: number) => `Page ${current}`,
        pageOf: (current: number, total: number) => `Page ${current} sur ${total}`,
        previousPage: "Page précédente",
        scrollPagerNext: "Faire défiler la pagination vers l’avant",
        scrollPagerPrevious: "Faire défiler la pagination vers l’arrière",
        slide: "Diapositive"
    },
    sheet: {
        closeSheet: "Fermer le panneau"
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
        filterTree: "Filtrer l’arborescence"
    },
    window: {
        close: "Fermer",
        closeWindow: "Fermer la fenêtre",
        maximize: "Agrandir",
        minimize: "Réduire",
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
        restore: "Restaurer"
    }
} satisfies MonaLocaleMessages;

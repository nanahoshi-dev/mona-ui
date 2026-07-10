import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    editorBaseVariants as monaEditorBaseVariants,
    editorContainerVariants as monaEditorContainerVariants,
    editorFontColorPreviewVariants as monaEditorFontColorPreviewVariants,
    editorFontColorValueVariants as monaEditorFontColorValueVariants,
    editorFontFamilyDropdownListVariants as monaEditorFontFamilyDropdownListVariants,
    editorFontHighlightPreviewVariants as monaEditorFontHighlightPreviewVariants,
    editorFontHighlightValueVariants as monaEditorFontHighlightValueVariants,
    editorFontSizeDropdownListVariants as monaEditorFontSizeDropdownListVariants,
    editorHeadingsDropdownListVariants as monaEditorHeadingsDropdownListVariants,
    editorImageInserterActionsVariants as monaEditorImageInserterActionsVariants,
    editorImageInserterFormVariants as monaEditorImageInserterFormVariants,
    editorImageInserterRowLabelVariants as monaEditorImageInserterRowLabelVariants,
    editorImageInserterRowVariants as monaEditorImageInserterRowVariants,
    editorTableCreatorCellVariants as monaEditorTableCreatorCellVariants,
    editorTableCreatorVariants as monaEditorTableCreatorVariants,
    editorToolbarVariants as monaEditorToolbarVariants
} from "./editor.mona.styles";

const editorBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaEditorBaseVariants }, monaEditorBaseVariants);

export const editorBaseThemeVariants = (theme: ThemeStyle) => editorBaseThemeVariantsStrategy.resolve(theme);

const editorContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorContainerVariants },
    monaEditorContainerVariants
);

export const editorContainerThemeVariants = (theme: ThemeStyle) => editorContainerThemeVariantsStrategy.resolve(theme);

const editorFontColorPreviewThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorFontColorPreviewVariants },
    monaEditorFontColorPreviewVariants
);

export const editorFontColorPreviewThemeVariants = (theme: ThemeStyle) =>
    editorFontColorPreviewThemeVariantsStrategy.resolve(theme);

const editorFontColorValueThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorFontColorValueVariants },
    monaEditorFontColorValueVariants
);

export const editorFontColorValueThemeVariants = (theme: ThemeStyle) =>
    editorFontColorValueThemeVariantsStrategy.resolve(theme);

const editorFontFamilyDropdownListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorFontFamilyDropdownListVariants },
    monaEditorFontFamilyDropdownListVariants
);

export const editorFontFamilyDropdownListThemeVariants = (theme: ThemeStyle) =>
    editorFontFamilyDropdownListThemeVariantsStrategy.resolve(theme);

const editorFontHighlightPreviewThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorFontHighlightPreviewVariants },
    monaEditorFontHighlightPreviewVariants
);

export const editorFontHighlightPreviewThemeVariants = (theme: ThemeStyle) =>
    editorFontHighlightPreviewThemeVariantsStrategy.resolve(theme);

const editorFontHighlightValueThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorFontHighlightValueVariants },
    monaEditorFontHighlightValueVariants
);

export const editorFontHighlightValueThemeVariants = (theme: ThemeStyle) =>
    editorFontHighlightValueThemeVariantsStrategy.resolve(theme);

const editorFontSizeDropdownListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorFontSizeDropdownListVariants },
    monaEditorFontSizeDropdownListVariants
);

export const editorFontSizeDropdownListThemeVariants = (theme: ThemeStyle) =>
    editorFontSizeDropdownListThemeVariantsStrategy.resolve(theme);

const editorHeadingsDropdownListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorHeadingsDropdownListVariants },
    monaEditorHeadingsDropdownListVariants
);

export const editorHeadingsDropdownListThemeVariants = (theme: ThemeStyle) =>
    editorHeadingsDropdownListThemeVariantsStrategy.resolve(theme);

const editorImageInserterActionsThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorImageInserterActionsVariants },
    monaEditorImageInserterActionsVariants
);

export const editorImageInserterActionsThemeVariants = (theme: ThemeStyle) =>
    editorImageInserterActionsThemeVariantsStrategy.resolve(theme);
const editorImageInserterFormThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorImageInserterFormVariants },
    monaEditorImageInserterFormVariants
);

export const editorImageInserterFormThemeVariants = (theme: ThemeStyle) =>
    editorImageInserterFormThemeVariantsStrategy.resolve(theme);

const editorImageInserterRowLabelThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorImageInserterRowLabelVariants },
    monaEditorImageInserterRowLabelVariants
);

export const editorImageInserterRowLabelThemeVariants = (theme: ThemeStyle) =>
    editorImageInserterRowLabelThemeVariantsStrategy.resolve(theme);

const editorImageInserterRowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorImageInserterRowVariants },
    monaEditorImageInserterRowVariants
);

export const editorImageInserterRowThemeVariants = (theme: ThemeStyle) =>
    editorImageInserterRowThemeVariantsStrategy.resolve(theme);

const editorTableCreatorCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorTableCreatorCellVariants },
    monaEditorTableCreatorCellVariants
);

export const editorTableCreatorCellThemeVariants = (theme: ThemeStyle) =>
    editorTableCreatorCellThemeVariantsStrategy.resolve(theme);

const editorTableCreatorThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorTableCreatorVariants },
    monaEditorTableCreatorVariants
);

export const editorTableCreatorThemeVariants = (theme: ThemeStyle) =>
    editorTableCreatorThemeVariantsStrategy.resolve(theme);

const editorToolbarThemeVariantsStrategy = createThemeStrategy(
    { mona: monaEditorToolbarVariants },
    monaEditorToolbarVariants
);

export const editorToolbarThemeVariants = (theme: ThemeStyle) => editorToolbarThemeVariantsStrategy.resolve(theme);

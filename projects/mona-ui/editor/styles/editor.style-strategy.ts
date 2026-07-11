import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
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
import {
    reinaEditorBaseVariants,
    reinaEditorContainerVariants,
    reinaEditorFontColorPreviewVariants,
    reinaEditorFontColorValueVariants,
    reinaEditorFontFamilyDropdownListVariants,
    reinaEditorFontHighlightPreviewVariants,
    reinaEditorFontHighlightValueVariants,
    reinaEditorFontSizeDropdownListVariants,
    reinaEditorHeadingsDropdownListVariants,
    reinaEditorImageInserterActionsVariants,
    reinaEditorImageInserterFormVariants,
    reinaEditorImageInserterRowLabelVariants,
    reinaEditorImageInserterRowVariants,
    reinaEditorTableCreatorCellVariants,
    reinaEditorTableCreatorVariants,
    reinaEditorToolbarVariants
} from "./editor.reina.styles";
import { createEditorVariants } from "./editor.style-composition";
import type { EditorStyleOverrides, EditorStyleStrategy, EditorVariantsFunctions } from "./editor.types";

export function createEditorStyleStrategy(overrides: readonly EditorStyleOverrides[] = []): EditorStyleStrategy {
    const mona: EditorVariantsFunctions = {
        base: createEditorVariants(monaEditorBaseVariants, overrides, "mona", override => override.base),
        container: createEditorVariants(monaEditorContainerVariants, overrides, "mona", override => override.container),
        fontColorPreview: createEditorVariants(
            monaEditorFontColorPreviewVariants,
            overrides,
            "mona",
            override => override.fontColorPreview
        ),
        fontColorValue: createEditorVariants(
            monaEditorFontColorValueVariants,
            overrides,
            "mona",
            override => override.fontColorValue
        ),
        fontFamilyDropdownList: createEditorVariants(
            monaEditorFontFamilyDropdownListVariants,
            overrides,
            "mona",
            override => override.fontFamilyDropdownList
        ),
        fontHighlightPreview: createEditorVariants(
            monaEditorFontHighlightPreviewVariants,
            overrides,
            "mona",
            override => override.fontHighlightPreview
        ),
        fontHighlightValue: createEditorVariants(
            monaEditorFontHighlightValueVariants,
            overrides,
            "mona",
            override => override.fontHighlightValue
        ),
        fontSizeDropdownList: createEditorVariants(
            monaEditorFontSizeDropdownListVariants,
            overrides,
            "mona",
            override => override.fontSizeDropdownList
        ),
        headingsDropdownList: createEditorVariants(
            monaEditorHeadingsDropdownListVariants,
            overrides,
            "mona",
            override => override.headingsDropdownList
        ),
        imageInserterActions: createEditorVariants(
            monaEditorImageInserterActionsVariants,
            overrides,
            "mona",
            override => override.imageInserterActions
        ),
        imageInserterForm: createEditorVariants(
            monaEditorImageInserterFormVariants,
            overrides,
            "mona",
            override => override.imageInserterForm
        ),
        imageInserterRow: createEditorVariants(
            monaEditorImageInserterRowVariants,
            overrides,
            "mona",
            override => override.imageInserterRow
        ),
        imageInserterRowLabel: createEditorVariants(
            monaEditorImageInserterRowLabelVariants,
            overrides,
            "mona",
            override => override.imageInserterRowLabel
        ),
        tableCreator: createEditorVariants(
            monaEditorTableCreatorVariants,
            overrides,
            "mona",
            override => override.tableCreator
        ),
        tableCreatorCell: createEditorVariants(
            monaEditorTableCreatorCellVariants,
            overrides,
            "mona",
            override => override.tableCreatorCell
        ),
        toolbar: createEditorVariants(monaEditorToolbarVariants, overrides, "mona", override => override.toolbar)
    };
    const reina: EditorVariantsFunctions = {
        base: createEditorVariants(reinaEditorBaseVariants, overrides, "reina", override => override.base),
        container: createEditorVariants(
            reinaEditorContainerVariants,
            overrides,
            "reina",
            override => override.container
        ),
        fontColorPreview: createEditorVariants(
            reinaEditorFontColorPreviewVariants,
            overrides,
            "reina",
            override => override.fontColorPreview
        ),
        fontColorValue: createEditorVariants(
            reinaEditorFontColorValueVariants,
            overrides,
            "reina",
            override => override.fontColorValue
        ),
        fontFamilyDropdownList: createEditorVariants(
            reinaEditorFontFamilyDropdownListVariants,
            overrides,
            "reina",
            override => override.fontFamilyDropdownList
        ),
        fontHighlightPreview: createEditorVariants(
            reinaEditorFontHighlightPreviewVariants,
            overrides,
            "reina",
            override => override.fontHighlightPreview
        ),
        fontHighlightValue: createEditorVariants(
            reinaEditorFontHighlightValueVariants,
            overrides,
            "reina",
            override => override.fontHighlightValue
        ),
        fontSizeDropdownList: createEditorVariants(
            reinaEditorFontSizeDropdownListVariants,
            overrides,
            "reina",
            override => override.fontSizeDropdownList
        ),
        headingsDropdownList: createEditorVariants(
            reinaEditorHeadingsDropdownListVariants,
            overrides,
            "reina",
            override => override.headingsDropdownList
        ),
        imageInserterActions: createEditorVariants(
            reinaEditorImageInserterActionsVariants,
            overrides,
            "reina",
            override => override.imageInserterActions
        ),
        imageInserterForm: createEditorVariants(
            reinaEditorImageInserterFormVariants,
            overrides,
            "reina",
            override => override.imageInserterForm
        ),
        imageInserterRow: createEditorVariants(
            reinaEditorImageInserterRowVariants,
            overrides,
            "reina",
            override => override.imageInserterRow
        ),
        imageInserterRowLabel: createEditorVariants(
            reinaEditorImageInserterRowLabelVariants,
            overrides,
            "reina",
            override => override.imageInserterRowLabel
        ),
        tableCreator: createEditorVariants(
            reinaEditorTableCreatorVariants,
            overrides,
            "reina",
            override => override.tableCreator
        ),
        tableCreatorCell: createEditorVariants(
            reinaEditorTableCreatorCellVariants,
            overrides,
            "reina",
            override => override.tableCreatorCell
        ),
        toolbar: createEditorVariants(reinaEditorToolbarVariants, overrides, "reina", override => override.toolbar)
    };
    return createThemeStrategy<EditorVariantsFunctions>({ mona, reina }, mona);
}

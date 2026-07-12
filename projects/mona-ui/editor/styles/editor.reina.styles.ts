import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
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
    editorTableCreatorVariants as monaEditorTableCreatorVariants,
    editorTableCreatorCellVariants as monaEditorTableCreatorCellVariants,
    editorToolbarVariants as monaEditorToolbarVariants
} from "./editor.mona.styles";

export const reinaEditorBaseVariants = createInheritedVariants(monaEditorBaseVariants, {
    add: "rounded-lg border-input-border ease-out focus-visible:ring-primary/35 prose-headings:font-semibold [&_hr]:border-input-border [&_pre]:border-input-border [&_table_th]:font-semibold",
    remove: "border-border ease-in focus-visible:border-focus-indicator prose-headings:font-bold [&_hr]:border-border [&_pre]:border-border [&_table_th]:font-bold"
});

export const reinaEditorContainerVariants = createInheritedVariants(monaEditorContainerVariants, {
    remove: "[&_div:first-child[contenteditable='true']]:resize-none"
});

export const reinaEditorFontColorPreviewVariants = createInheritedVariants(monaEditorFontColorPreviewVariants, {});

export const reinaEditorFontColorValueVariants = createInheritedVariants(monaEditorFontColorValueVariants, {});

export const reinaEditorFontFamilyDropdownListVariants = createInheritedVariants(
    monaEditorFontFamilyDropdownListVariants,
    {}
);

export const reinaEditorFontHighlightPreviewVariants = createInheritedVariants(
    monaEditorFontHighlightPreviewVariants,
    {}
);

export const reinaEditorFontHighlightValueVariants = createInheritedVariants(monaEditorFontHighlightValueVariants, {});

export const reinaEditorFontSizeDropdownListVariants = createInheritedVariants(
    monaEditorFontSizeDropdownListVariants,
    {}
);

export const reinaEditorHeadingsDropdownListVariants = createInheritedVariants(
    monaEditorHeadingsDropdownListVariants,
    {}
);

export const reinaEditorImageInserterActionsVariants = createInheritedVariants(monaEditorImageInserterActionsVariants, {
    add: "border-t-input-border",
    remove: "border-t-border"
});

export const reinaEditorImageInserterFormVariants = createInheritedVariants(monaEditorImageInserterFormVariants, {});

export const reinaEditorImageInserterRowLabelVariants = createInheritedVariants(
    monaEditorImageInserterRowLabelVariants,
    {}
);

export const reinaEditorImageInserterRowVariants = createInheritedVariants(monaEditorImageInserterRowVariants, {});

export const reinaEditorTableCreatorVariants = createInheritedVariants(monaEditorTableCreatorVariants, {});

export const reinaEditorTableCreatorCellVariants = createInheritedVariants(monaEditorTableCreatorCellVariants, {
    add: "rounded-sm border-input-border",
    remove: "border-border"
});

export const reinaEditorToolbarVariants = createInheritedVariants(monaEditorToolbarVariants, {
    add: "border-b-input-border",
    remove: "border-b-border"
});

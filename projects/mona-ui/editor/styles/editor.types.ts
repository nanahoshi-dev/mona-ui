import type { ClassValue } from "clsx";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";

export type EditorBaseVariantsFunction = () => string;
export type EditorContainerVariantsFunction = () => string;
export type EditorFontColorPreviewVariantsFunction = () => string;
export type EditorFontColorValueVariantsFunction = () => string;
export type EditorFontFamilyDropdownListVariantsFunction = () => string;
export type EditorFontHighlightPreviewVariantsFunction = () => string;
export type EditorFontHighlightValueVariantsFunction = () => string;
export type EditorFontSizeDropdownListVariantsFunction = () => string;
export type EditorHeadingsDropdownListVariantsFunction = () => string;
export type EditorImageInserterActionsVariantsFunction = () => string;
export type EditorImageInserterFormVariantsFunction = () => string;
export type EditorImageInserterRowLabelVariantsFunction = () => string;
export type EditorImageInserterRowVariantsFunction = () => string;
export type EditorTableCreatorVariantsFunction = () => string;
export type EditorTableCreatorCellVariantsFunction = () => string;
export type EditorToolbarVariantsFunction = () => string;

export interface EditorVariantsFunctions {
    readonly base: EditorBaseVariantsFunction;
    readonly container: EditorContainerVariantsFunction;
    readonly fontColorPreview: EditorFontColorPreviewVariantsFunction;
    readonly fontColorValue: EditorFontColorValueVariantsFunction;
    readonly fontFamilyDropdownList: EditorFontFamilyDropdownListVariantsFunction;
    readonly fontHighlightPreview: EditorFontHighlightPreviewVariantsFunction;
    readonly fontHighlightValue: EditorFontHighlightValueVariantsFunction;
    readonly fontSizeDropdownList: EditorFontSizeDropdownListVariantsFunction;
    readonly headingsDropdownList: EditorHeadingsDropdownListVariantsFunction;
    readonly imageInserterActions: EditorImageInserterActionsVariantsFunction;
    readonly imageInserterForm: EditorImageInserterFormVariantsFunction;
    readonly imageInserterRow: EditorImageInserterRowVariantsFunction;
    readonly imageInserterRowLabel: EditorImageInserterRowLabelVariantsFunction;
    readonly tableCreator: EditorTableCreatorVariantsFunction;
    readonly tableCreatorCell: EditorTableCreatorCellVariantsFunction;
    readonly toolbar: EditorToolbarVariantsFunction;
}

export type EditorStyleStrategy = ThemeStrategy<EditorVariantsFunctions>;

export interface EditorStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ClassValue;
    readonly container?: ClassValue;
    readonly fontColorPreview?: ClassValue;
    readonly fontColorValue?: ClassValue;
    readonly fontFamilyDropdownList?: ClassValue;
    readonly fontHighlightPreview?: ClassValue;
    readonly fontHighlightValue?: ClassValue;
    readonly fontSizeDropdownList?: ClassValue;
    readonly headingsDropdownList?: ClassValue;
    readonly imageInserterActions?: ClassValue;
    readonly imageInserterForm?: ClassValue;
    readonly imageInserterRow?: ClassValue;
    readonly imageInserterRowLabel?: ClassValue;
    readonly tableCreator?: ClassValue;
    readonly tableCreatorCell?: ClassValue;
    readonly toolbar?: ClassValue;
}

export type EditorStylesProviderConfig = EditorStyleOverrides | { readonly strategy: EditorStyleStrategy };

import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    gridBaseVariants as annaGridBaseVariants,
    gridCellBaseVariants as annaGridCellBaseVariants,
    gridCellContainerVariants as annaGridCellContainerVariants,
    gridCellDirtyIndicatorVariants as annaGridCellDirtyIndicatorVariants,
    gridCellEditorBaseVariants as annaGridCellEditorBaseVariants,
    gridCellEditorInputVariants as annaGridCellEditorInputVariants,
    gridCellTextVariants as annaGridCellTextVariants,
    gridColumnActionsVariants as annaGridColumnActionsVariants,
    gridColumnDragPreviewVariants as annaGridColumnDragPreviewVariants,
    gridColumnDropHintVariants as annaGridColumnDropHintVariants,
    gridColumnResizerVariants as annaGridColumnResizerVariants,
    gridDetailContentCellVariants as annaGridDetailContentCellVariants,
    gridDetailIndentCellVariants as annaGridDetailIndentCellVariants,
    gridDetailRowVariants as annaGridDetailRowVariants,
    gridFilterRowCellVariants as annaGridFilterRowCellVariants,
    gridFooterTableCellVariants as annaGridFooterTableCellVariants,
    gridFooterTableRowVariants as annaGridFooterTableRowVariants,
    gridFooterTableVariants as annaGridFooterTableVariants,
    gridFooterVariants as annaGridFooterVariants,
    gridGroupPanelPlaceholderVariants as annaGridGroupPanelPlaceholderVariants,
    gridGroupPanelVariants as annaGridGroupPanelVariants,
    gridGroupRowVariants as annaGridGroupRowVariants,
    gridHeaderTableCellVariants as annaGridHeaderTableCellVariants,
    gridHeaderTableColumnTitleVariants as annaGridHeaderTableColumnTitleVariants,
    gridHeaderTableColumnWrapVariants as annaGridHeaderTableColumnWrapVariants,
    gridHeaderTableRowVariants as annaGridHeaderTableRowVariants,
    gridHeaderTableVariants as annaGridHeaderTableVariants,
    gridHeaderVariants as annaGridHeaderVariants,
    gridListBaseVariants as annaGridListBaseVariants,
    gridListTableCellVariants as annaGridListTableCellVariants,
    gridListTableRowVariants as annaGridListTableRowVariants,
    gridListTableVariants as annaGridListTableVariants,
    gridNoDataVariants as annaGridNoDataVariants
} from "./grid.anna.styles";
import {
    gridBaseVariants as monaGridBaseVariants,
    gridCellBaseVariants as monaGridCellBaseVariants,
    gridCellContainerVariants as monaGridCellContainerVariants,
    gridCellDirtyIndicatorVariants as monaGridCellDirtyIndicatorVariants,
    gridCellEditorBaseVariants as monaGridCellEditorBaseVariants,
    gridCellEditorInputVariants as monaGridCellEditorInputVariants,
    gridCellTextVariants as monaGridCellTextVariants,
    gridColumnActionsVariants as monaGridColumnActionsVariants,
    gridColumnDragPreviewVariants as monaGridColumnDragPreviewVariants,
    gridColumnDropHintVariants as monaGridColumnDropHintVariants,
    gridColumnResizerVariants as monaGridColumnResizerVariants,
    gridDetailContentCellVariants as monaGridDetailContentCellVariants,
    gridDetailIndentCellVariants as monaGridDetailIndentCellVariants,
    gridDetailRowVariants as monaGridDetailRowVariants,
    gridFilterRowCellVariants as monaGridFilterRowCellVariants,
    gridFooterTableCellVariants as monaGridFooterTableCellVariants,
    gridFooterTableRowVariants as monaGridFooterTableRowVariants,
    gridFooterTableVariants as monaGridFooterTableVariants,
    gridFooterVariants as monaGridFooterVariants,
    gridGroupPanelPlaceholderVariants as monaGridGroupPanelPlaceholderVariants,
    gridGroupPanelVariants as monaGridGroupPanelVariants,
    gridGroupRowVariants as monaGridGroupRowVariants,
    gridHeaderTableCellVariants as monaGridHeaderTableCellVariants,
    gridHeaderTableColumnTitleVariants as monaGridHeaderTableColumnTitleVariants,
    gridHeaderTableColumnWrapVariants as monaGridHeaderTableColumnWrapVariants,
    gridHeaderTableRowVariants as monaGridHeaderTableRowVariants,
    gridHeaderTableVariants as monaGridHeaderTableVariants,
    gridHeaderVariants as monaGridHeaderVariants,
    gridListBaseVariants as monaGridListBaseVariants,
    gridListTableCellVariants as monaGridListTableCellVariants,
    gridListTableRowVariants as monaGridListTableRowVariants,
    gridListTableVariants as monaGridListTableVariants,
    gridNoDataVariants as monaGridNoDataVariants
} from "./grid.mona.styles";

export const gridBaseThemeVariants = createThemeStrategy({
    anna: annaGridBaseVariants,
    mona: monaGridBaseVariants
});

export const gridCellBaseThemeVariants = createThemeStrategy({
    anna: annaGridCellBaseVariants,
    mona: monaGridCellBaseVariants
});

export const gridCellContainerThemeVariants = createThemeStrategy({
    anna: annaGridCellContainerVariants,
    mona: monaGridCellContainerVariants
});

export const gridCellDirtyIndicatorThemeVariants = createThemeStrategy({
    anna: annaGridCellDirtyIndicatorVariants,
    mona: monaGridCellDirtyIndicatorVariants
});

export const gridCellEditorBaseThemeVariants = createThemeStrategy({
    anna: annaGridCellEditorBaseVariants,
    mona: monaGridCellEditorBaseVariants
});

export const gridCellEditorInputThemeVariants = createThemeStrategy({
    anna: annaGridCellEditorInputVariants,
    mona: monaGridCellEditorInputVariants
});

export const gridCellTextThemeVariants = createThemeStrategy({
    anna: annaGridCellTextVariants,
    mona: monaGridCellTextVariants
});

export const gridColumnActionsThemeVariants = createThemeStrategy({
    anna: annaGridColumnActionsVariants,
    mona: monaGridColumnActionsVariants
});

export const gridColumnDragPreviewThemeVariants = createThemeStrategy({
    anna: annaGridColumnDragPreviewVariants,
    mona: monaGridColumnDragPreviewVariants
});

export const gridColumnResizerThemeVariants = createThemeStrategy({
    anna: annaGridColumnResizerVariants,
    mona: monaGridColumnResizerVariants
});

export const gridColumnDropHintThemeVariants = createThemeStrategy({
    anna: annaGridColumnDropHintVariants,
    mona: monaGridColumnDropHintVariants
});

export const gridFilterRowCellThemeVariants = createThemeStrategy({
    anna: annaGridFilterRowCellVariants,
    mona: monaGridFilterRowCellVariants
});

export const gridFooterThemeVariants = createThemeStrategy({
    anna: annaGridFooterVariants,
    mona: monaGridFooterVariants
});

export const gridFooterTableThemeVariants = createThemeStrategy({
    anna: annaGridFooterTableVariants,
    mona: monaGridFooterTableVariants
});

export const gridFooterTableRowThemeVariants = createThemeStrategy({
    anna: annaGridFooterTableRowVariants,
    mona: monaGridFooterTableRowVariants
});

export const gridFooterTableCellThemeVariants = createThemeStrategy({
    anna: annaGridFooterTableCellVariants,
    mona: monaGridFooterTableCellVariants
});

export const gridGroupPanelPlaceholderThemeVariants = createThemeStrategy({
    anna: annaGridGroupPanelPlaceholderVariants,
    mona: monaGridGroupPanelPlaceholderVariants
});

export const gridGroupPanelThemeVariants = createThemeStrategy({
    anna: annaGridGroupPanelVariants,
    mona: monaGridGroupPanelVariants
});

export const gridGroupRowThemeVariants = createThemeStrategy({
    anna: annaGridGroupRowVariants,
    mona: monaGridGroupRowVariants
});

export const gridHeaderTableCellThemeVariants = createThemeStrategy({
    anna: annaGridHeaderTableCellVariants,
    mona: monaGridHeaderTableCellVariants
});

export const gridHeaderTableColumnTitleThemeVariants = createThemeStrategy({
    anna: annaGridHeaderTableColumnTitleVariants,
    mona: monaGridHeaderTableColumnTitleVariants
});

export const gridHeaderTableColumnWrapThemeVariants = createThemeStrategy({
    anna: annaGridHeaderTableColumnWrapVariants,
    mona: monaGridHeaderTableColumnWrapVariants
});

export const gridHeaderTableRowThemeVariants = createThemeStrategy({
    anna: annaGridHeaderTableRowVariants,
    mona: monaGridHeaderTableRowVariants
});

export const gridHeaderTableThemeVariants = createThemeStrategy({
    anna: annaGridHeaderTableVariants,
    mona: monaGridHeaderTableVariants
});

export const gridHeaderThemeVariants = createThemeStrategy({
    anna: annaGridHeaderVariants,
    mona: monaGridHeaderVariants
});

export const gridListTableCellThemeVariants = createThemeStrategy({
    anna: annaGridListTableCellVariants,
    mona: monaGridListTableCellVariants
});

export const gridListTableRowThemeVariants = createThemeStrategy({
    anna: annaGridListTableRowVariants,
    mona: monaGridListTableRowVariants
});

export const gridListTableThemeVariants = createThemeStrategy({
    anna: annaGridListTableVariants,
    mona: monaGridListTableVariants
});

export const gridListBaseThemeVariants = createThemeStrategy({
    anna: annaGridListBaseVariants,
    mona: monaGridListBaseVariants
});

export const gridNoDataThemeVariants = createThemeStrategy({
    anna: annaGridNoDataVariants,
    mona: monaGridNoDataVariants
});

export const gridDetailRowThemeVariants = createThemeStrategy({
    anna: annaGridDetailRowVariants,
    mona: monaGridDetailRowVariants
});

export const gridDetailIndentCellThemeVariants = createThemeStrategy({
    anna: annaGridDetailIndentCellVariants,
    mona: monaGridDetailIndentCellVariants
});

export const gridDetailContentCellThemeVariants = createThemeStrategy({
    anna: annaGridDetailContentCellVariants,
    mona: monaGridDetailContentCellVariants
});

type GridBaseVariantProps = VariantProps<ReturnType<typeof gridBaseThemeVariants>>;
type GridBaseVariantInput = VariantInputs<GridBaseVariantProps>;

export type GridHeaderTableCellVariantProps = VariantProps<ReturnType<typeof gridHeaderTableCellThemeVariants>>;
export type GridHeaderTableCellVariantInput = VariantInputs<GridHeaderTableCellVariantProps>;

export type GridHeaderTableColumnTitleVariantProps = VariantProps<
    ReturnType<typeof gridHeaderTableColumnTitleThemeVariants>
>;
export type GridHeaderTableColumnTitleVariantInput = VariantInputs<GridHeaderTableColumnTitleVariantProps>;

export type GridHeaderTableColumnWrapVariantProps = VariantProps<
    ReturnType<typeof gridHeaderTableColumnWrapThemeVariants>
>;
export type GridHeaderTableColumnWrapVariantInput = VariantInputs<GridHeaderTableColumnWrapVariantProps>;

export type GridHeaderTableRowVariantProps = VariantProps<ReturnType<typeof gridHeaderTableRowThemeVariants>>;
export type GridHeaderTableRowVariantInput = VariantInputs<GridHeaderTableRowVariantProps>;

export type GridHeaderTableVariantProps = VariantProps<ReturnType<typeof gridHeaderTableThemeVariants>>;
export type GridHeaderTableVariantInput = VariantInputs<GridHeaderTableVariantProps>;

export type GridHeaderVariantProps = VariantProps<ReturnType<typeof gridHeaderThemeVariants>>;
export type GridHeaderVariantInput = VariantInputs<GridHeaderVariantProps>;

export type GridListTableCellVariantProps = VariantProps<ReturnType<typeof gridListTableCellThemeVariants>>;
export type GridListTableCellVariantInput = VariantInputs<GridListTableCellVariantProps>;

type GridListTableRowVariantProps = VariantProps<ReturnType<typeof gridListTableRowThemeVariants>>;
type GridListTableRowVariantInput = VariantInputs<GridListTableRowVariantProps>;

export type GridListTableVariantProps = VariantProps<ReturnType<typeof gridListTableThemeVariants>>;
export type GridListTableVariantInput = VariantInputs<GridListTableVariantProps>;

type GridListBaseVariantProps = VariantProps<ReturnType<typeof gridListBaseThemeVariants>>;
type GridListBaseVariantInput = VariantInputs<GridListBaseVariantProps>;

export type GridListVariantProps = VariantProps<ReturnType<typeof gridListBaseThemeVariants>> &
    GridListTableVariantProps &
    GridListTableRowVariantProps &
    GridListTableCellVariantProps;
export type GridListVariantInput = Omit<GridListBaseVariantInput, "virtual"> &
    GridListTableVariantInput &
    Omit<GridListTableRowVariantInput, "selected">;

export type GridVariantProps = GridBaseVariantProps &
    GridHeaderTableCellVariantProps &
    GridHeaderTableColumnTitleVariantProps &
    GridHeaderTableColumnWrapVariantProps &
    GridHeaderTableRowVariantProps &
    GridHeaderTableVariantProps &
    GridHeaderVariantProps;
export type GridVariantInput = GridBaseVariantInput &
    GridHeaderTableCellVariantInput &
    GridHeaderTableColumnTitleVariantInput &
    GridHeaderTableColumnWrapVariantInput &
    Omit<GridHeaderTableRowVariantInput, "isFilterRow"> &
    GridHeaderTableVariantInput &
    GridHeaderVariantInput;

import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
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

const gridBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaGridBaseVariants }, monaGridBaseVariants);

export const gridBaseThemeVariants = (theme: ThemeStyle) => gridBaseThemeVariantsStrategy.resolve(theme);

const gridCellBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridCellBaseVariants },
    monaGridCellBaseVariants
);

export const gridCellBaseThemeVariants = (theme: ThemeStyle) => gridCellBaseThemeVariantsStrategy.resolve(theme);

const gridCellContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridCellContainerVariants },
    monaGridCellContainerVariants
);

export const gridCellContainerThemeVariants = (theme: ThemeStyle) =>
    gridCellContainerThemeVariantsStrategy.resolve(theme);

const gridCellDirtyIndicatorThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridCellDirtyIndicatorVariants },
    monaGridCellDirtyIndicatorVariants
);

export const gridCellDirtyIndicatorThemeVariants = (theme: ThemeStyle) =>
    gridCellDirtyIndicatorThemeVariantsStrategy.resolve(theme);

const gridCellEditorBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridCellEditorBaseVariants },
    monaGridCellEditorBaseVariants
);

export const gridCellEditorBaseThemeVariants = (theme: ThemeStyle) =>
    gridCellEditorBaseThemeVariantsStrategy.resolve(theme);

const gridCellEditorInputThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridCellEditorInputVariants },
    monaGridCellEditorInputVariants
);

export const gridCellEditorInputThemeVariants = (theme: ThemeStyle) =>
    gridCellEditorInputThemeVariantsStrategy.resolve(theme);

const gridCellTextThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridCellTextVariants },
    monaGridCellTextVariants
);

export const gridCellTextThemeVariants = (theme: ThemeStyle) => gridCellTextThemeVariantsStrategy.resolve(theme);

const gridColumnActionsThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridColumnActionsVariants },
    monaGridColumnActionsVariants
);

export const gridColumnActionsThemeVariants = (theme: ThemeStyle) =>
    gridColumnActionsThemeVariantsStrategy.resolve(theme);

const gridColumnDragPreviewThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridColumnDragPreviewVariants },
    monaGridColumnDragPreviewVariants
);

export const gridColumnDragPreviewThemeVariants = (theme: ThemeStyle) =>
    gridColumnDragPreviewThemeVariantsStrategy.resolve(theme);

const gridColumnResizerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridColumnResizerVariants },
    monaGridColumnResizerVariants
);

export const gridColumnResizerThemeVariants = (theme: ThemeStyle) =>
    gridColumnResizerThemeVariantsStrategy.resolve(theme);

const gridColumnDropHintThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridColumnDropHintVariants },
    monaGridColumnDropHintVariants
);

export const gridColumnDropHintThemeVariants = (theme: ThemeStyle) =>
    gridColumnDropHintThemeVariantsStrategy.resolve(theme);

const gridFilterRowCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridFilterRowCellVariants },
    monaGridFilterRowCellVariants
);

export const gridFilterRowCellThemeVariants = (theme: ThemeStyle) =>
    gridFilterRowCellThemeVariantsStrategy.resolve(theme);

const gridFooterThemeVariantsStrategy = createThemeStrategy({ mona: monaGridFooterVariants }, monaGridFooterVariants);

export const gridFooterThemeVariants = (theme: ThemeStyle) => gridFooterThemeVariantsStrategy.resolve(theme);

const gridFooterTableThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridFooterTableVariants },
    monaGridFooterTableVariants
);

export const gridFooterTableThemeVariants = (theme: ThemeStyle) => gridFooterTableThemeVariantsStrategy.resolve(theme);

const gridFooterTableRowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridFooterTableRowVariants },
    monaGridFooterTableRowVariants
);

export const gridFooterTableRowThemeVariants = (theme: ThemeStyle) =>
    gridFooterTableRowThemeVariantsStrategy.resolve(theme);

const gridFooterTableCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridFooterTableCellVariants },
    monaGridFooterTableCellVariants
);

export const gridFooterTableCellThemeVariants = (theme: ThemeStyle) =>
    gridFooterTableCellThemeVariantsStrategy.resolve(theme);

const gridGroupPanelPlaceholderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridGroupPanelPlaceholderVariants },
    monaGridGroupPanelPlaceholderVariants
);

export const gridGroupPanelPlaceholderThemeVariants = (theme: ThemeStyle) =>
    gridGroupPanelPlaceholderThemeVariantsStrategy.resolve(theme);

const gridGroupPanelThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridGroupPanelVariants },
    monaGridGroupPanelVariants
);

export const gridGroupPanelThemeVariants = (theme: ThemeStyle) => gridGroupPanelThemeVariantsStrategy.resolve(theme);

const gridGroupRowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridGroupRowVariants },
    monaGridGroupRowVariants
);

export const gridGroupRowThemeVariants = (theme: ThemeStyle) => gridGroupRowThemeVariantsStrategy.resolve(theme);

const gridHeaderTableCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridHeaderTableCellVariants },
    monaGridHeaderTableCellVariants
);

export const gridHeaderTableCellThemeVariants = (theme: ThemeStyle) =>
    gridHeaderTableCellThemeVariantsStrategy.resolve(theme);

const gridHeaderTableColumnTitleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridHeaderTableColumnTitleVariants },
    monaGridHeaderTableColumnTitleVariants
);

export const gridHeaderTableColumnTitleThemeVariants = (theme: ThemeStyle) =>
    gridHeaderTableColumnTitleThemeVariantsStrategy.resolve(theme);

const gridHeaderTableColumnWrapThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridHeaderTableColumnWrapVariants },
    monaGridHeaderTableColumnWrapVariants
);

export const gridHeaderTableColumnWrapThemeVariants = (theme: ThemeStyle) =>
    gridHeaderTableColumnWrapThemeVariantsStrategy.resolve(theme);

const gridHeaderTableRowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridHeaderTableRowVariants },
    monaGridHeaderTableRowVariants
);

export const gridHeaderTableRowThemeVariants = (theme: ThemeStyle) =>
    gridHeaderTableRowThemeVariantsStrategy.resolve(theme);

const gridHeaderTableThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridHeaderTableVariants },
    monaGridHeaderTableVariants
);

export const gridHeaderTableThemeVariants = (theme: ThemeStyle) => gridHeaderTableThemeVariantsStrategy.resolve(theme);

const gridHeaderThemeVariantsStrategy = createThemeStrategy({ mona: monaGridHeaderVariants }, monaGridHeaderVariants);

export const gridHeaderThemeVariants = (theme: ThemeStyle) => gridHeaderThemeVariantsStrategy.resolve(theme);

const gridListTableCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridListTableCellVariants },
    monaGridListTableCellVariants
);

export const gridListTableCellThemeVariants = (theme: ThemeStyle) =>
    gridListTableCellThemeVariantsStrategy.resolve(theme);

const gridListTableRowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridListTableRowVariants },
    monaGridListTableRowVariants
);

export const gridListTableRowThemeVariants = (theme: ThemeStyle) =>
    gridListTableRowThemeVariantsStrategy.resolve(theme);

const gridListTableThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridListTableVariants },
    monaGridListTableVariants
);

export const gridListTableThemeVariants = (theme: ThemeStyle) => gridListTableThemeVariantsStrategy.resolve(theme);

const gridListBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridListBaseVariants },
    monaGridListBaseVariants
);

export const gridListBaseThemeVariants = (theme: ThemeStyle) => gridListBaseThemeVariantsStrategy.resolve(theme);

const gridNoDataThemeVariantsStrategy = createThemeStrategy({ mona: monaGridNoDataVariants }, monaGridNoDataVariants);

export const gridNoDataThemeVariants = (theme: ThemeStyle) => gridNoDataThemeVariantsStrategy.resolve(theme);

const gridDetailRowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridDetailRowVariants },
    monaGridDetailRowVariants
);

export const gridDetailRowThemeVariants = (theme: ThemeStyle) => gridDetailRowThemeVariantsStrategy.resolve(theme);

const gridDetailIndentCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridDetailIndentCellVariants },
    monaGridDetailIndentCellVariants
);

export const gridDetailIndentCellThemeVariants = (theme: ThemeStyle) =>
    gridDetailIndentCellThemeVariantsStrategy.resolve(theme);

const gridDetailContentCellThemeVariantsStrategy = createThemeStrategy(
    { mona: monaGridDetailContentCellVariants },
    monaGridDetailContentCellVariants
);

export const gridDetailContentCellThemeVariants = (theme: ThemeStyle) =>
    gridDetailContentCellThemeVariantsStrategy.resolve(theme);

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

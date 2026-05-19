import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../theme/models/Theme";
import { VariantInputs } from "../../utils/VariantInputs";
import {
    gridBaseVariants as monaGridBaseVariants,
    gridCellBaseVariants as monaGridCellBaseVariants,
    gridCellContainerVariants as monaGridCellContainerVariants,
    gridCellTextVariants as monaGridCellTextVariants,
    gridColumnActionsVariants as monaGridColumnActionsVariants,
    gridColumnDragPreviewVariants as monaGridColumnDragPreviewVariants,
    gridColumnDropHintVariants as monaGridColumnDropHintVariants,
    gridColumnResizerVariants as monaGridColumnResizerVariants,
    gridDetailContentCellVariants as monaGridDetailContentCellVariants,
    gridDetailIndentCellVariants as monaGridDetailIndentCellVariants,
    gridDetailRowVariants as monaGridDetailRowVariants,
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
    gridNoDataVariants as monaGridNoDataVariants,
    monaGridCellPositionalBorders
} from "./grid.mona.styles";

export const gridBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridBaseVariants;
        default:
            return monaGridBaseVariants;
    }
};

export const gridCellBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridCellBaseVariants;
        default:
            return monaGridCellBaseVariants;
    }
};

export const gridCellContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridCellContainerVariants;
        default:
            return monaGridCellContainerVariants;
    }
};

export const gridCellTextThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridCellTextVariants;
        default:
            return monaGridCellTextVariants;
    }
};

export const gridColumnActionsThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridColumnActionsVariants;
        default:
            return monaGridColumnActionsVariants;
    }
};

export const gridColumnDragPreviewThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridColumnDragPreviewVariants;
        default:
            return monaGridColumnDragPreviewVariants;
    }
};

export const gridColumnResizerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridColumnResizerVariants;
        default:
            return monaGridColumnResizerVariants;
    }
};

export const gridColumnDropHintThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridColumnDropHintVariants;
        default:
            return monaGridColumnDropHintVariants;
    }
};

export const gridGroupPanelPlaceholderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridGroupPanelPlaceholderVariants;
        default:
            return monaGridGroupPanelPlaceholderVariants;
    }
};

export const gridGroupPanelThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridGroupPanelVariants;
        default:
            return monaGridGroupPanelVariants;
    }
};

export const gridGroupRowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridGroupRowVariants;
        default:
            return monaGridGroupRowVariants;
    }
};

export const gridHeaderTableCellThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridHeaderTableCellVariants;
        default:
            return monaGridHeaderTableCellVariants;
    }
};

export const gridHeaderTableColumnTitleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridHeaderTableColumnTitleVariants;
        default:
            return monaGridHeaderTableColumnTitleVariants;
    }
};

export const gridHeaderTableColumnWrapThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridHeaderTableColumnWrapVariants;
        default:
            return monaGridHeaderTableColumnWrapVariants;
    }
};

export const gridHeaderTableRowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridHeaderTableRowVariants;
        default:
            return monaGridHeaderTableRowVariants;
    }
};

export const gridHeaderTableThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridHeaderTableVariants;
        default:
            return monaGridHeaderTableVariants;
    }
};

export const gridHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridHeaderVariants;
        default:
            return monaGridHeaderVariants;
    }
};

export const gridListTableCellThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridListTableCellVariants;
        default:
            return monaGridListTableCellVariants;
    }
};

export const gridListTableRowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridListTableRowVariants;
        default:
            return monaGridListTableRowVariants;
    }
};

export const gridListTableThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridListTableVariants;
        default:
            return monaGridListTableVariants;
    }
};

export const gridListBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridListBaseVariants;
        default:
            return monaGridListBaseVariants;
    }
};

export const gridNoDataThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridNoDataVariants;
        default:
            return monaGridNoDataVariants;
    }
};

export const gridDetailRowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridDetailRowVariants;
        default:
            return monaGridDetailRowVariants;
    }
};

export const gridDetailIndentCellThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridDetailIndentCellVariants;
        default:
            return monaGridDetailIndentCellVariants;
    }
};

export const gridDetailContentCellThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridDetailContentCellVariants;
        default:
            return monaGridDetailContentCellVariants;
    }
};

export const gridCellPositionalBordersThemeResolver = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaGridCellPositionalBorders;
        default:
            return monaGridCellPositionalBorders;
    }
};

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

export type GridDetailRowVariantProps = VariantProps<ReturnType<typeof gridDetailRowThemeVariants>>;
export type GridDetailIndentCellVariantProps = VariantProps<ReturnType<typeof gridDetailIndentCellThemeVariants>>;
export type GridDetailIndentCellVariantInput = VariantInputs<GridDetailIndentCellVariantProps>;
export type GridDetailContentCellVariantProps = VariantProps<ReturnType<typeof gridDetailContentCellThemeVariants>>;
export type GridDetailContentCellVariantInput = VariantInputs<GridDetailContentCellVariantProps>;

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
    GridHeaderTableRowVariantInput &
    GridHeaderTableVariantInput &
    GridHeaderVariantInput;

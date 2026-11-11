/**
 * The single description of the documentation site: which pages exist, how navigation groups them, and what each one
 * says about itself. Sidebar, routes, search and the AI docs are meant to read from here. See
 * `docs/internal/docs-page-schema.md`.
 *
 * Keep this file free of Angular imports. `scripts/check-docs-schema.ts` runs it under plain Node.
 */

export type DocsPageKind = "component" | "guide";

export interface DocsPage {
    /** Other entry points whose exports this page also documents, because using the component takes them. */
    readonly apiAlsoFrom?: readonly string[];
    /**
     * The exports this page documents, when pages share an entry point. Without it, the page documents the exports no
     * other page of that entry point names, which is all of them when no other page does.
     */
    readonly apiExports?: readonly string[];
    /** Sub-pages shown nested in the sidebar. Only for topics with their own examples and a reason to be linked to. */
    readonly children?: readonly DocsPage[];
    /** One plain sentence for search results, page metadata and `llms.txt`. No markdown. */
    readonly description: string;
    /** The folder under `projects/mona-ui` whose `public-api.ts` this page documents. */
    readonly entryPoint?: string;
    readonly kind: DocsPageKind;
    /** The route segment under `/components`. */
    readonly path: string;
    readonly title: string;
}

export interface DocsCategory {
    readonly id: string;
    readonly pages: readonly DocsPage[];
    readonly title: string;
}

function guide(path: string, title: string, description: string, entryPoint?: string): DocsPage {
    return { description, entryPoint, kind: "guide", path, title };
}

function component(
    path: string,
    title: string,
    entryPoint: string,
    description: string,
    api?: Pick<DocsPage, "apiAlsoFrom" | "apiExports">
): DocsPage {
    return { ...api, description, entryPoint, kind: "component", path, title };
}

export const DOCS_MANIFEST: readonly DocsCategory[] = [
    {
        id: "get-started",
        title: "Get Started",
        pages: [
            guide("introduction", "Introduction", "What Mona UI is, what it includes and how it is built."),
            guide("installation", "Installation", "Install the package, set up its styles and choose a theme."),
            guide("theming", "Theming", "Customize colors, density and shape through design tokens.", "theme"),
            guide("forms", "Forms", "Connect Mona UI controls to Angular signal forms."),
            guide("theme-colors", "Theme Colors", "The color tokens each theme defines, with live swatches."),
            guide("theme-luna", "Luna Theme", "The Luna theme and how to enable it.")
        ]
    },
    {
        id: "actions",
        title: "Actions",
        pages: [
            component("button", "Button", "button", "Styles a native button and adds loading, toggle and disabled behavior."),
            component("button-group", "Button Group", "button-group", "Joins related buttons into one control with a shared look and size."),
            component("dropdown-button", "Dropdown Button", "dropdown-button", "A single button that opens a menu of actions."),
            component("split-button", "Split Button", "split-button", "A primary action button paired with a menu of secondary actions.")
        ]
    },
    {
        id: "form-fields",
        title: "Form Fields",
        pages: [
            component("decimal-textbox", "Decimal Text Box", "numeric-text-box", "A numeric input whose value is a decimal string, for exact values like money.", { apiExports: ["DecimalTextBoxComponent", "NumericTextBoxPrefixTemplateDirective"] }),
            component("editor", "Editor", "editor", "A rich text editor with a configurable toolbar and an HTML value."),
            component("fieldset", "Fieldset", "fieldset", "Groups related form controls under a labelled border."),
            component("input", "Input", "text-box", "Styles a native input element and keeps its browser behavior.", { apiExports: ["InputType", "TextBoxDirective"] }),
            component("label", "Label", "label", "Styled, accessible labels associated with form controls."),
            component("numeric-textbox", "Numeric Text Box", "numeric-text-box", "A number input with spinner buttons, bounds and decimal formatting.", { apiExports: ["NUMERIC_TEXT_BOX_DEFAULT_MESSAGES", "NumericTextBoxComponent", "NumericTextBoxPrefixTemplateDirective"] }),
            component("otp-input", "OTP Input", "otp-input", "A segmented input for one-time passwords and verification codes."),
            component("textarea", "Text Area", "text-area", "Styles a native textarea element and keeps its browser behavior."),
            component("textbox", "Text Box", "text-box", "A text input with prefix and suffix slots and an optional clear button.", { apiExports: ["TEXT_BOX_DEFAULT_MESSAGES", "TextBoxComponent", "TextBoxPrefixTemplateDirective", "TextBoxSuffixTemplateDirective"] })
        ]
    },
    {
        id: "selection",
        title: "Selection",
        pages: [
            component("auto-complete", "Auto Complete", "auto-complete", "A text input that suggests matching options as the user types.", { apiAlsoFrom: ["dropdowns"] }),
            component("checkbox", "Checkbox", "check-box", "A checkbox with label handling and an indeterminate state."),
            component("combo-box", "Combo Box", "combo-box", "A text input that resolves typed text to one item from a collection.", { apiAlsoFrom: ["dropdowns"] }),
            component("dropdown-list", "Dropdown List", "dropdown-list", "A closed control that opens a list for choosing exactly one option.", { apiAlsoFrom: ["dropdowns"] }),
            component("multi-select", "Multi Select", "multi-select", "A control that shows selected options as removable tags.", { apiAlsoFrom: ["dropdowns"] }),
            component("radio-button", "Radio Button", "radio-button", "Radio buttons and groups for choosing one option from several."),
            component("range-slider", "Range Slider", "slider", "A two-handle slider for selecting a numeric interval.", { apiExports: ["RangeSliderComponent", "SliderHandleTemplateDirective", "SliderLabelPosition", "SliderTickValueTemplateDirective"] }),
            component("rating", "Rating", "rating", "Choose a value from a visual scale of icons, in whole or half steps."),
            component("segmented", "Segmented", "segmented", "A compact set of mutually exclusive options."),
            component("slider", "Slider", "slider", "A single-handle slider for selecting a numeric value.", { apiExports: ["SLIDER_DEFAULT_MESSAGES", "SliderComponent", "SliderHandleTemplateDirective", "SliderLabelPosition", "SliderTickValueTemplateDirective"] }),
            component("switch", "Switch", "switch", "A binary on and off toggle with optional state labels.")
        ]
    },
    {
        id: "pickers",
        title: "Date, Time & Color",
        pages: [
            component("calendar", "Calendar", "calendar", "Date selection in single, multiple and range modes across month, year and decade views."),
            component("color-gradient", "Color Gradient", "color-gradient", "A color editor for saturation, value, hue and alpha."),
            component("color-palette", "Color Palette", "color-palette", "A grid of selectable color swatches from a built-in or custom scheme."),
            component("color-picker", "Color Picker", "color-picker", "A compact control that opens a color palette or gradient editor."),
            component("date-picker", "Date Picker", "date-picker", "A date input that opens a calendar popup."),
            component("datetime-picker", "Date Time Picker", "datetime-picker", "An input for choosing a date and a time together."),
            component("time-picker", "Time Picker", "time-picker", "A time input that opens a time selector popup.")
        ]
    },
    {
        id: "data",
        title: "Data",
        pages: [
            component("avatar", "Avatar", "avatar", "Shows a person or entity as an image, text label or projected content."),
            component("chip", "Chip", "chip", "A compact label that can be selected, removed or given a prefix."),
            component("list-box", "List Box", "list-box", "A selectable list with a toolbar for moving items and transferring them between lists."),
            component("list-view", "List View", "list-view", "Renders a collection as a list, with optional selection, grouping and paging."),
            component("pager", "Pager", "pager", "Pagination controls with page buttons, a page-size selector and a page-jump input."),
            component("tree-view", "Tree View", "tree-view", "Hierarchical data as an expandable, keyboard-navigable tree.")
        ]
    },
    {
        id: "grid",
        title: "Grid",
        // The overview documents every grid export that no feature page claims.
        pages: [
            component("grid", "Grid Overview", "grid", "Tabular data in typed columns with paging, templates and a toolbar, extended by feature directives."),
            component("grid-sorting-filtering", "Sorting & Filtering", "grid", "Sort rows by column headers and filter them from a header menu or a filter row.", { apiExports: ["ColumnSortComparator", "ColumnSortEvent", "FilterableOptions", "GridFilterableDirective", "GridSortableDirective", "SortableOptions"] }),
            component("grid-grouping", "Grouping & Aggregates", "grid", "Group rows by column values and show sums, averages and other aggregates in footers.", { apiExports: ["AggregateFunction", "GridFooterTemplateDirective", "GridGroupableDirective", "GridGroupFooterTemplateDirective", "GroupableOptions", "GroupDescriptor"] }),
            component("grid-selection", "Selection", "grid", "Select single or multiple rows by key, with checkboxes, row clicks and the keyboard.", { apiExports: ["GridKeySelector", "GridSelectableDirective", "SelectableOptions"] }),
            component("grid-editing", "Editing", "grid", "Edit cells or rows inline with Signal Forms, and add, save, cancel and remove rows.", { apiExports: ["CellEditEvent", "EditableOptions", "GridAddCommandDirective", "GridAddEvent", "GridCancelCommandDirective", "GridCancelEvent", "GridCancelReason", "GridCommandColumnComponent", "GridEditableDirective", "GridEditCommandDirective", "GridEditEvent", "GridEditFormContext", "GridEditOperation", "GridEditSchemaFactory", "GridEditSession", "GridEditTemplateContext", "GridEditTemplateDirective", "GridRemoveCommandDirective", "GridRemoveEvent", "GridRowCommand", "GridSaveCommandDirective", "GridSaveEvent", "GridSaveOperation", "RowEditEvent"] }),
            component("grid-columns", "Columns", "grid", "Resize, reorder, lock and hide columns, by pointer, keyboard or the column chooser.", { apiExports: ["ColumnReorderEvent", "ColumnResizeEvent", "GridColumnLockedPosition", "GridReorderableDirective", "GridResizableDirective", "ReorderableOptions", "ResizableOptions", "ResizeMethod"] }),
            component("grid-rows", "Rows", "grid", "Expandable detail rows, row reordering by drag or keyboard, row classes and row sizing.", { apiExports: ["GridDetailTemplateDirective", "GridRowClass", "GridRowClassValue", "GridRowReorderableDirective", "RowReorderableOptions", "RowReorderEvent"] }),
            component("grid-server", "Server Binding & Virtualization", "grid", "Load pages from a server, or render only the visible rows of a large data set.", { apiExports: ["GridDataState", "GridServerBindingDirective", "GridVirtualScrollDirective"] }),
            component("grid-state-export", "State & Export", "grid", "Save and restore the grid's columns, sort, filter, groups and page size, and export rows as CSV.", { apiExports: ["GridColumnState", "GridExportDirective", "GridState", "GridStateCompositeFilterDescriptor", "GridStateFilterDescriptor", "GridStateFilterValue", "GridStateLoadResult", "GridStateLoadStatus", "GridStatePersistenceDirective", "GridStatePersistenceOptions", "GridStateSortDescriptor", "GridStateVersion"] })
        ]
    },
    {
        id: "charts",
        title: "Charts",
        // The overview documents every chart export that no family page claims.
        pages: [
            component("chart", "Chart Overview", "chart", "High-performance Canvas charts composed from series, axes and interaction parts."),
            component("chart-line-area", "Line & Area", "chart", "Line, area and range area series for values that change across a continuous or category axis.", { apiExports: ["AreaSeriesComponent", "ChartAreaFillMode", "ChartCurve", "ChartLineStyle", "LineSeriesComponent", "RangeAreaSeriesComponent"] }),
            component("chart-bar", "Bar & Waterfall", "chart", "Bar, range bar and waterfall series for comparing values, intervals and running totals.", { apiExports: ["BarSeriesComponent", "ChartBarOrientation", "ChartWaterfallDatumKind", "ChartWaterfallLabelTemplateContext", "ChartWaterfallLabelTemplateDirective", "ChartWaterfallPointContext", "ChartWaterfallPointValue", "ChartWaterfallVisualKind", "RangeBarSeriesComponent", "WaterfallSeriesComponent"] }),
            component("chart-scatter", "Scatter & Bubble", "chart", "Scatter and bubble series for the relationship between two or three numeric values.", { apiExports: ["BubbleSeriesComponent", "ScatterSeriesComponent"] }),
            component("chart-financial", "Financial", "chart", "Candlestick and OHLC series for open, high, low and close prices.", { apiExports: ["CandlestickSeriesComponent", "ChartFinancialDirection", "ChartFinancialFillMode", "ChartOhlcPointValue", "OhlcSeriesComponent"] }),
            component("chart-heatmap", "Heatmap", "chart", "A heatmap series that colors a grid of cells by value, with a color legend.", { apiExports: ["ChartColorLegendScale", "ChartColorLegendStop", "ChartColorLegendTick", "ChartHeatmapCategory", "ChartHeatmapCellData", "ChartHeatmapColorMode", "HeatmapCellClickEvent", "HeatmapColorStop", "HeatmapSeriesComponent"] }),
            component("chart-pie", "Pie & Donut", "chart", "Pie and donut series for the parts of a whole, with slice labels and a donut center.", { apiExports: ["ChartCenterTemplateContext", "ChartCenterTemplateDirective", "ChartPolarFillMode", "ChartPolarLabelContent", "ChartPolarLabelPosition", "ChartPolarLabelSide", "ChartSliceContext", "ChartSliceLabelTemplateContext", "ChartSliceLabelTemplateDirective", "ChartSliceVisibilityEvent", "DonutSeriesComponent", "PieSeriesComponent"] }),
            component("chart-funnel", "Funnel", "chart", "A funnel series for stages that narrow, with conversion and drop-off between them.", { apiExports: ["ChartFunnelLabelContent", "ChartFunnelLabelTemplateContext", "ChartFunnelLabelTemplateDirective", "ChartFunnelOrientation", "ChartFunnelPointMetadata", "ChartFunnelStageContext", "ChartFunnelStageVisibilityEvent", "FunnelSeriesComponent"] }),
            component("chart-treemap", "Treemap", "chart", "A treemap series that tiles hierarchical data by value.", { apiExports: ["ChartHierarchicalKind", "ChartHierarchyNodeContext", "ChartHierarchyPointMetadata", "ChartTreemapLabelTemplateContext", "ChartTreemapLabelTemplateDirective", "ChartTreemapNodeVisibilityEvent", "ChartTreemapSort", "ChartTreemapTile", "TreemapSeriesComponent"] }),
            component("chart-radar", "Radar & Polar", "chart", "Radar and polar series on angular and radial axes, for comparing metrics or directions.", { apiExports: ["ChartAngularAxisComponent", "ChartRadialAxisComponent", "ChartRadialCurve", "ChartRadialFillMode", "ChartRadialGridShape", "PolarSeriesComponent", "RadarSeriesComponent"] }),
            component("chart-radial", "Radial", "chart", "Radial bar, rose and gauge series that draw values as arcs around a center.", { apiExports: ["ChartGaugeCenterTemplateContext", "ChartGaugeCenterTemplateDirective", "ChartGaugeIndicator", "ChartRadialArcFillMode", "ChartRadialDatumVisibilityEvent", "ChartRoseScaleMode", "GaugeSeriesComponent", "RadialBarSeriesComponent", "RoseSeriesComponent"] })
        ]
    },
    {
        id: "navigation",
        title: "Navigation",
        pages: [
            component("breadcrumb", "Breadcrumb", "breadcrumb", "A navigation trail showing where the current page sits in a hierarchy."),
            component("command", "Command Menu", "command", "A searchable list of actions or options, operated from one input, inline or in a dialog."),
            component("contextmenu", "Context Menu", "contextmenu", "A popup menu attached to an element, opened by right-click or keyboard."),
            component("menubar", "Menubar", "menubar", "A persistent horizontal bar of top-level menus."),
            component("popup-menu", "Popup Menu", "popup-menu", "Opens a menu from an element you already have, such as an icon button or a row action."),
            component("sidebar", "Sidebar", "sidebar", "A composable application shell with collapsible side panels."),
            component("stepper", "Stepper", "stepper", "Guides users through a sequential, multi-step process."),
            component("tabs", "Tabs", "tabs", "Switches between panels of related content.")
        ]
    },
    {
        id: "overlays",
        title: "Overlays",
        pages: [
            component("dialog", "Dialog", "dialog", "Modal or non-modal messages, confirmations and content dialogs."),
            component("popover", "Popover", "popover", "A floating panel anchored to a target and opened by a configurable trigger."),
            component("popup", "Popup", "popup", "Positions arbitrary content relative to an anchor, a point or the viewport."),
            component("sheet", "Sheet", "sheet", "A modal panel attached to an edge of the viewport."),
            component("tooltip", "Tooltip", "tooltip", "A floating tooltip with projected content, anchored to a separate target."),
            component("tooltip-directive", "Tooltip Directive", "tooltip", "Replaces a native title attribute with a styled tooltip."),
            component("window", "Window", "window", "A draggable, resizable floating window that can be minimized and maximized.")
        ]
    },
    {
        id: "layout",
        title: "Layout",
        pages: [
            component("card", "Card", "card", "Groups related content and actions on one raised surface."),
            component("collapsible", "Collapsible", "collapsible", "A headless disclosure primitive for expandable regions."),
            component("expansion-panel", "Expansion Panel", "expansion-panel", "A header that shows and hides its content, designed to stack with other panels."),
            component("scroll-view", "Scroll View", "scroll-view", "A fixed-size carousel that pages through a collection one item at a time."),
            component("splitter", "Splitter", "splitter", "Lays out panes in a row or column that can be resized and collapsed.")
        ]
    },
    {
        id: "feedback",
        title: "Feedback",
        pages: [
            component("circular-progress-bar", "Circular Progress Bar", "circular-progress-bar", "A circular progress indicator with an optional custom label."),
            component("notification", "Notification", "notification", "Transient toast notifications with optional auto-dismiss."),
            component("placeholder", "Placeholder", "placeholder", "Fills an empty area with a muted label or projected content."),
            component("progress-bar", "Progress Bar", "progress-bar", "A horizontal progress indicator with determinate and indeterminate modes."),
            component("skeleton", "Skeleton", "skeleton", "A decorative placeholder block for content that is still loading."),
            component("spinner", "Spinner", "spinner", "An animated loading indicator and a service for loading overlays.")
        ]
    }
];

/** Every page in navigation order, with nested pages after their parent. */
export function flattenDocsPages(categories: readonly DocsCategory[] = DOCS_MANIFEST): DocsPage[] {
    const flatten = (pages: readonly DocsPage[]): DocsPage[] =>
        pages.flatMap(page => [page, ...flatten(page.children ?? [])]);
    return categories.flatMap(category => flatten(category.pages));
}

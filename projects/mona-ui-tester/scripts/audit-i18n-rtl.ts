import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    type AST,
    BindingType,
    Interpolation,
    LiteralPrimitive,
    parseTemplate,
    RecursiveAstVisitor,
    TmplAstBoundText,
    TmplAstDeferredBlock,
    TmplAstElement,
    TmplAstForLoopBlock,
    TmplAstIfBlock,
    type TmplAstNode,
    TmplAstSwitchBlock,
    TmplAstTemplate,
    TmplAstText
} from "@angular/compiler";
import { Node, Project, type ReturnStatement, SyntaxKind } from "ts-morph";

export type AuditCategory = "i18n-text" | "i18n-aria" | "rtl-physical-style" | "rtl-manual-review";

export interface AuditViolation {
    category: AuditCategory;
    detail: string;
    file: string;
    line: number;
}

export interface AllowlistEntry {
    category: AuditCategory;
    filePattern: string;
    lineRange?: [number, number];
    lineSnippet?: string;
    reason: string;
}

// Patterns for physical CSS and Tailwind classes
const PHYSICAL_TAILWIND_PATTERNS = [
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?m[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical margin utility (ml-*/mr-* -> ms-*/me-*)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?p[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical padding utility (pl-*/pr-* -> ps-*/pe-*)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?(?:left|right)-(?=[0-9a-zA-Z_[])[0-9a-z_[\].-]+/g,
        label: "Physical position utility (left-*/right-* -> start-*/end-*)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*border-[lr](?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical border utility (border-l/r -> border-s/e)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*rounded-[lr](?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical radius utility (rounded-l/r -> rounded-s/e)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*rounded-(?:tl|tr|bl|br)(?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical corner radius utility (rounded-tl/tr/bl/br -> rounded-ss/se/es/ee)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*text-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical text-align utility (text-left/right -> text-start/end)"
    },
    { regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*space-x-[0-9a-z_[\].-]+/g, label: "Physical space-x utility" },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*divide-x(?:-[0-9a-z_[\].-]+)?(?![a-zA-Z0-9_-])/g,
        label: "Physical divide-x utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*origin-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical transform origin utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*float-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical float utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*clear-(?:left|right)(?![a-zA-Z0-9_-])/g,
        label: "Physical clear utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*scroll-m[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical scroll margin utility"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*scroll-p[lr]-[0-9a-z_[\].-]+/g,
        label: "Physical scroll padding utility"
    }
];

const PHYSICAL_CSS_PATTERNS = [
    {
        regex: /\bmargin-(?:left|right)\s*:/g,
        label: "Physical CSS property (margin-left/right -> margin-inline-start/end)"
    },
    {
        regex: /\bpadding-(?:left|right)\s*:/g,
        label: "Physical CSS property (padding-left/right -> padding-inline-start/end)"
    },
    {
        regex: /\bborder-(?:left|right)(?:-[a-z]+)?\s*:/g,
        label: "Physical CSS property (border-left/right -> border-inline-start/end)"
    },
    {
        regex: /\bborder-(?:top|bottom)-(?:left|right)-radius\s*:/g,
        label: "Physical CSS border-radius (border-*-left/right-radius -> border-*-start/end-radius)"
    },
    { regex: /\btext-align\s*:\s*(?:left|right)\b/g, label: "Physical CSS text-align (left/right -> start/end)" }
];

const PHYSICAL_CSS_POSITION_PATTERN = {
    regex: /(?<![a-z0-9_$-])(?:left|right)\s*:\s*[^;]+/g,
    label: "Physical CSS position (left/right -> inset-inline-start/end)"
};

// Accessibility text attributes that require internationalization
export const ARIA_TEXT_ATTRIBUTES = new Set([
    "aria-label",
    "aria-description",
    "aria-roledescription",
    "aria-placeholder",
    "aria-valuetext"
]);

// General user-facing text attributes that require internationalization
export const GENERAL_TEXT_ATTRIBUTES = new Set([
    "title",
    "placeholder",
    "alt"
]);

// Patterns for hard-coded TS ARIA and titles
export const HARD_CODED_ARIA_PATTERNS = [
    { regex: /\baria-label="([^"{}]+)"/g, label: "Static aria-label attribute" },
    { regex: /\[attr\.aria-label\]="'([^']+)'"/g, label: "Static [attr.aria-label] binding" }
];

// Patterns for manual-review RTL constructs
export const MANUAL_REVIEW_PATTERNS = [
    {
        regex: /\b(?:scrollLeft|offsetLeft|clientLeft)\b/g,
        label: "Manual review: DOM scroll/offset coordinate property"
    },
    {
        regex: /\b(?:DOMRect\.(?:left|right)|\.getBoundingClientRect\(\)\.(?:left|right))\b/g,
        label: "Manual review: DOMRect left/right coordinate"
    },
    {
        regex: /(?<!\w)style\.(?:left|right)\b/g,
        label: "Manual review: physical inline style.left/right assignment"
    },
    {
        regex: /linear-gradient\([^)]*\b(?:to[\s_]+(?:left|right)|(?:90|270)deg)\b/g,
        label: "Manual review: directional gradient (horizontal orientation)"
    },
    {
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?translate-x-[0-9a-z_[\].-]+/g,
        label: "Manual review: physical horizontal translate utility (translate-x-*)"
    },
    {
        regex: /\btranslateX\s*\([^)]+\)/g,
        label: "Manual review: physical translateX transform"
    }
];

// Documented intentional allowlist entries (narrowed to specific files/lines)
export const ALLOWLIST: AllowlistEntry[] = [
    // Narrow physical style exemptions
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/chart/components/chart/chart.component.html",
        lineSnippet: "[style.left.px]",
        reason: "DOM overlay positioned from Cartesian chart scene x coordinate"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/chart/components/chart-tooltip/chart-tooltip.component.html",
        lineSnippet: "[style.left.px]",
        reason: "Tooltip floating placement uses Cartesian screen coordinate x position"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "stagingContainer.style.left",
        reason: "Chart export staging container offscreen positioning (-99999px)"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "island.frozenRoot.style.left",
        reason: "Chart export island root staging position"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.html",
        lineSnippet: "[style.left.px]",
        reason: "Color gradient 2D coordinate space mapping handle position"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/tooltip/styles/tooltip.styles.ts",
        lineSnippet: 'data-[position="',
        reason: "Tooltip arrow pointer geometry uses 45-degree rotated box Cartesian coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/popover/styles/popover.styles.ts",
        lineSnippet: 'data-[position="',
        reason: "Popover arrow pointer geometry uses 45-degree rotated box Cartesian coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        lineSnippet: "bottomleft",
        reason: "Notification screen dock coordinates are physical viewport screen positions"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        lineSnippet: "bottomright",
        reason: "Notification screen dock coordinates are physical viewport screen positions"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        lineSnippet: "topleft",
        reason: "Notification screen dock coordinates are physical viewport screen positions"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        lineSnippet: "topright",
        reason: "Notification screen dock coordinates are physical viewport screen positions"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        lineSnippet: "left-1/2",
        reason: "Notification center positioning uses 50% screen coordinate"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
        lineRange: [60, 76],
        reason: "Spinner pulsing triad dot positions in 2D circular coordinate geometry"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
        lineRange: [106, 153],
        reason: "Spinner pulsing ring 8-segment radial dot positions in octagon geometry"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/spinner/components/spinner/spinner.component.css",
        lineRange: [171, 190],
        reason: "Spinner converging 4-corner segment positions in Cartesian square geometry"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/styles/slider.styles.ts",
        lineSnippet: 'data-[orientation="horizontal"]:left-0',
        reason: "Slider horizontal tick container physical positioning pinned to left-0"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/styles/slider.styles.ts",
        lineSnippet: 'data-[orientation="vertical"]:left-0',
        reason: "Slider vertical tick container physical positioning pinned to left-0"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/slider/slider.component.html",
        lineSnippet: '[style.left.%]="horizontalSelectionLeft()"',
        reason: "Slider handle and selection physical left coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/slider/slider.component.html",
        lineSnippet: '[style.right.%]="horizontalSelectionRight()"',
        reason: "Slider handle and selection physical right coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/slider/slider.component.html",
        lineSnippet: '[style.left.%]="orientation() === \'horizontal\' && !isRtl() ? handlePosition() : undefined"',
        reason: "Slider horizontal handle physical left coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/slider/slider.component.html",
        lineSnippet: '[style.right.%]="orientation() === \'horizontal\' && isRtl() ? handlePosition() : undefined"',
        reason: "Slider horizontal handle physical right coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
        lineSnippet: '[style.left.%]="horizontalSelectionLeft()"',
        reason: "RangeSlider handles and selection physical left coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
        lineSnippet: '[style.right.%]="horizontalSelectionRight()"',
        reason: "RangeSlider handles and selection physical right coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
        lineSnippet: '[style.left.%]="orientation() === \'horizontal\' && !isRtl() ? primaryHandlePosition() : undefined"',
        reason: "RangeSlider primary handle physical left coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
        lineSnippet: '[style.right.%]="orientation() === \'horizontal\' && isRtl() ? primaryHandlePosition() : undefined"',
        reason: "RangeSlider primary handle physical right coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
        lineSnippet: '[style.left.%]="orientation() === \'horizontal\' && !isRtl() ? secondaryHandlePosition() : undefined"',
        reason: "RangeSlider secondary handle physical left coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.html",
        lineSnippet: '[style.right.%]="orientation() === \'horizontal\' && isRtl() ? secondaryHandlePosition() : undefined"',
        reason: "RangeSlider secondary handle physical right coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/pipes/label-style.pipe.ts",
        lineSnippet: "styles.right = `${valuePosition}%`;",
        reason: "Slider label horizontal physical coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/pipes/label-style.pipe.ts",
        lineSnippet: "styles.left = `${valuePosition}%`;",
        reason: "Slider label horizontal physical coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/pipes/label-style.pipe.ts",
        lineSnippet: 'styles[side] = "100%";',
        reason: "Slider vertical label horizontal physical side intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/pipes/tick-style.pipe.ts",
        lineSnippet: "{ right: `${position}%` }",
        reason: "Slider tick horizontal physical coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/pipes/tick-style.pipe.ts",
        lineSnippet: "{ left: `${position}%` }",
        reason: "Slider tick horizontal physical coordinate intentionally chosen from Mona semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/slider/pipes/tick-style.pipe.ts",
        lineSnippet: 'left: "50%"',
        reason: "Slider vertical tick Cartesian horizontal centering (50%)"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: 'physicalSide: "left", class: "border-r border-(--color-sidebar-border)"',
        reason: "Sidebar non-drawer physical border variant mapped from semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: 'physicalSide: "right", class: "border-l border-(--color-sidebar-border)"',
        reason: "Sidebar non-drawer physical border variant mapped from semantic direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: '{ drawer: true, physicalSide: "left", class: "left-0" }',
        reason: "Sidebar drawer physical side variants mapped from semantic HTML direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: '{ drawer: true, physicalSide: "right", class: "right-0" }',
        reason: "Sidebar drawer physical side variants mapped from semantic HTML direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: 'left: "right-0"',
        reason: "Sidebar rail physical edge variant mapped from semantic HTML direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: 'right: "left-0"',
        reason: "Sidebar rail physical edge variant mapped from semantic HTML direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/scroll-view/styles/scroll-view.styles.ts",
        lineSnippet: 'left: "left-0"',
        reason: "ScrollView navigation arrow physical side variants mapped from semantic HTML direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/scroll-view/styles/scroll-view.styles.ts",
        lineSnippet: 'right: "right-0"',
        reason: "ScrollView navigation arrow physical side variants mapped from semantic HTML direction"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "stagingContainer.style.left",
        reason: "Chart export staging container offscreen positioning (-99999px)"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "island.frozenRoot.style.left",
        reason: "Chart export island root staging position"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/window/models/WindowReference.ts",
        lineSnippet: "element.style.left",
        reason: "Desktop window floating coordinate management operates in 2D viewport coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/window/directives/window-drag-handler.directive.ts",
        lineSnippet: "element.style.left",
        reason: "Desktop window drag handler operates in 2D viewport coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/window/directives/window-resize-handler.directive.ts",
        lineSnippet: "element.style.left",
        reason: "Desktop window resize handler operates in 2D viewport coordinates"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/internal/tree/components/tree-drop-hint/tree-drop-hint.component.ts",
        lineSnippet: "left,",
        reason: "Tree drop hint position calculation explicitly branches on isRtl"
    },
    {
        category: "rtl-physical-style",
        filePattern: "projects/mona-ui/internal/utils/setWindowStyles.ts",
        lineSnippet: "left,",
        reason: "Desktop window floating coordinate management operates in 2D viewport coordinates"
    },

    // Manual review exemptions for directional gradients, translate transforms, and DOM/coordinate operations
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/color-gradient/styles/color-gradient.styles.ts",
        lineSnippet: "linear-gradient(to_right",
        reason: "Color picker gradient coordinate space is physical 2D hue/saturation mapping"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: "linear-gradient(to right",
        reason: "Alpha slider gradient tracks physical left-to-right opacity"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: "containerRect.left",
        reason: "Color gradient 2D coordinate space mapping"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.html",
        lineSnippet: "linear-gradient(to right",
        reason: "Hue rainbow slider spectrum track is physical 0-360 color wheel"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/notification/styles/notification.styles.ts",
        lineSnippet: "-translate-x-1/2",
        reason: "Notification container centered horizontally using 50% left and -50% translateX"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/components/chart/chart.component.ts",
        lineSnippet: "translateX(-50%)",
        reason: "Cartesian chart horizontal axis tick label center alignment"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/window/models/WindowReference.ts",
        lineSnippet: "element.style.left",
        reason: "Desktop window floating coordinate management operates in 2D viewport coordinates"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/window/components/window-content/window-content.component.ts",
        lineSnippet: "element.offsetLeft",
        reason: "Desktop window floating coordinate management operates in 2D viewport coordinates"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/window/directives/window-drag-handler.directive.ts",
        lineSnippet: "element.style.left",
        reason: "Desktop window drag handler operates in 2D viewport coordinates"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/window/directives/window-drag-handler.directive.ts",
        lineSnippet: "getBoundingClientRect().left",
        reason: "Desktop window drag handler operates in 2D viewport coordinates"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/window/directives/window-resize-handler.directive.ts",
        lineSnippet: "element.style.left",
        reason: "Desktop window resize handler operates in 2D viewport coordinates"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/window/directives/window-resize-handler.directive.ts",
        lineSnippet: "rect.left",
        reason: "Desktop window resize handler operates in 2D viewport coordinates"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/grid/services/grid.service.ts",
        lineSnippet: "scrollLeft",
        reason: "Synchronizes horizontal scrollLeft across grid header, body, and footer"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/grid/components/grid-virtual-list/grid-virtual-list.component.ts",
        lineSnippet: "scrollLeft",
        reason: "Synchronizes horizontal scrollLeft for virtual row container"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/grid/directives/grid-locked-cell.directive.ts",
        lineSnippet: "[style.left.px]",
        reason: "Sticky column positioning calculates left offset boundary"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/grid/directives/grid-locked-cell.directive.ts",
        lineSnippet: "[style.right.px]",
        reason: "Sticky column positioning calculates right offset boundary"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "scrollLeft",
        reason: "Chart export scrollLeft snapshot restoration"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "wrapperRect.left",
        reason: "Chart export raster island staging geometry measurement"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-raster-island-renderer.ts",
        lineSnippet: "childRect.left",
        reason: "Chart export raster island staging geometry measurement"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-dom-freezer.ts",
        lineSnippet: "scrollLeft",
        reason: "Chart export scrollLeft snapshot capture"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-dom-collector.ts",
        lineSnippet: "hostRect.left",
        reason: "Chart export DOM collector Cartesian relative positioning"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-dom-collector.ts",
        lineSnippet: "nodeRect.left",
        reason: "Chart export DOM collector Cartesian relative positioning"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/numeric-text-box/components/numeric-text-box/numeric-text-box.component.ts",
        lineSnippet: "scrollLeft",
        reason: "NumericTextBox scrolls input to end on focus"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/text-box/components/text-box/text-box.component.ts",
        lineSnippet: "scrollLeft",
        reason: "TextBox scrolls input to end on focus"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/scroll-view/components/scroll-view/scroll-view.component.ts",
        lineSnippet: "const currentScrollLeft = element.scrollLeft",
        reason: "ScrollView pager calculates cumulative scroll target from element scrollLeft"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/segmented/components/segmented/segmented.component.ts",
        lineSnippet: "offsetLeft",
        reason: "Segmented pill offsetLeft calculation relative to parent container"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/popup-menu/components/popup-menu/popup-menu.component.ts",
        lineSnippet: "center.left + center.width / 2",
        reason: "Popup menu calculates midpoint of target element for keyboard context menu"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/popup-menu/components/popup-menu/popup-menu.component.ts",
        lineSnippet: "rect.left + rect.width / 2",
        reason: "Popup menu calculates midpoint of target element for positioning"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/internal/tree/components/tree-drop-hint/tree-drop-hint.component.ts",
        lineSnippet: "rect.right - 40",
        reason: "Tree drop hint position calculation explicitly branches on isRtl"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/internal/tree/components/tree-drop-hint/tree-drop-hint.component.ts",
        lineSnippet: "rect.left",
        reason: "Tree drop hint position calculation explicitly branches on isRtl"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/stepper/styles/stepper.styles.ts",
        lineSnippet: "-translate-x-3 rtl:translate-x-3",
        reason: "Stepper connector offset with explicit RTL counterpart"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/styles/slider.styles.ts",
        lineSnippet: "translate-x-[-50%]",
        reason: "Slider handle centering with explicit RTL counterpart"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/pipes/label-style.pipe.ts",
        lineSnippet: "translateX(-50%)",
        reason: "Slider label center alignment on tick"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/pipes/label-style.pipe.ts",
        lineSnippet: "translateX(50%)",
        reason: "Slider label RTL center alignment on tick"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/pipes/tick-style.pipe.ts",
        lineSnippet: "translateX(-50%)",
        reason: "Slider tick mark center alignment"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/pipes/tick-style.pipe.ts",
        lineSnippet: "translateX(50%)",
        reason: "Slider tick mark RTL center alignment"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/slider-base/slider-base.component.ts",
        lineSnippet: "rect.left",
        reason: "Slider coordinate mapping"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/slider-base/slider-base.component.ts",
        lineSnippet: "containerRect.right",
        reason: "Slider RTL coordinate calculation"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/slider-base/slider-base.component.ts",
        lineSnippet: "containerRect.left",
        reason: "Slider LTR coordinate calculation"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.ts",
        lineSnippet: "containerRect.right",
        reason: "Range slider RTL coordinate calculation"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.ts",
        lineSnippet: "containerRect.left",
        reason: "Range slider LTR coordinate calculation"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.ts",
        lineSnippet: "primaryRect.left",
        reason: "Range slider primary handle positioning"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/slider/components/range-slider/range-slider.component.ts",
        lineSnippet: "secondaryRect.left",
        reason: "Range slider secondary handle positioning"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: '{ drawer: true, open: false, physicalSide: "left", class: "-translate-x-full" }',
        reason: "Sidebar slide-in transform with explicit RTL counterpart"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: '{ drawer: true, open: false, physicalSide: "right", class: "translate-x-full" }',
        reason: "Sidebar slide-out transform with explicit RTL counterpart"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/scroll-view/components/scroll-view/scroll-view.component.ts",
        lineSnippet: "translateX(",
        reason: "ScrollView slide animation transforms"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/popup/components/popup-wrapper/popup-wrapper.component.ts",
        lineSnippet: "translateX(",
        reason: "Popup slide animation keyframes"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/layout/cartesian-axis-geometry.ts",
        lineSnippet: "translateX(-50%)",
        reason: "Cartesian chart axis tick label center alignment"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-snapshot-builder.ts",
        lineSnippet: "plotRect.left",
        reason: "Chart export Cartesian relative X coordinate"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/internal/brush/chart-brush-gesture-controller.ts",
        lineSnippet: "rect.left",
        reason: "Chart brush gesture Cartesian coordinate calculation"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/chart/components/chart/chart.component.ts",
        lineSnippet: "rect.left",
        reason: "Chart pointer event Cartesian relative X coordinate"
    },

    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/chart/internal/export/chart-export-resource-manager.ts",
        lineSnippet: "message:",
        reason: "Internal export rejection diagnostic error messages"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/chart/internal/layout/cartesian-series-policy.ts",
        lineSnippet: "message:",
        reason: "Internal series policy diagnostic warning messages"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/chart/internal/data/cartesian-stack-engine.ts",
        lineSnippet: "message:",
        reason: "Internal stack engine diagnostic warning messages"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "A"',
        reason: "Alpha color channel symbol in ColorInput descriptor"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "H"',
        reason: "Hue color channel symbol in ColorInput descriptor"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "S"',
        reason: "Saturation color channel symbol in ColorInput descriptor"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "V"',
        reason: "Value color channel symbol in ColorInput descriptor"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "R"',
        reason: "Red color channel symbol in ColorInput descriptor"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "G"',
        reason: "Green color channel symbol in ColorInput descriptor"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/color-gradient/components/color-gradient/color-gradient.component.ts",
        lineSnippet: 'label: "B"',
        reason: "Blue color channel symbol in ColorInput descriptor"
    }
];

export function matchesFilePattern(filePath: string, pattern: string): boolean {
    const normFile = filePath.replace(/\\/g, "/");
    const normPattern = pattern.replace(/\\/g, "/");
    if (normFile === normPattern) {
        return true;
    }
    if (normFile.endsWith("/" + normPattern)) {
        if (normPattern.startsWith("projects/")) {
            const prefix = normFile.slice(0, -(normPattern.length + 1));
            if (prefix.includes("projects/")) {
                return false;
            }
        }
        return true;
    }
    return false;
}

export function isAllowlisted(
    violation: AuditViolation,
    lineContent?: string,
    allowlist: AllowlistEntry[] = ALLOWLIST
): boolean {
    const normalizedFile = violation.file.replace(/\\/g, "/");
    for (const entry of allowlist) {
        if (entry.category !== violation.category) {
            continue;
        }
        const normalizedPattern = entry.filePattern.replace(/\\/g, "/");
        if (!matchesFilePattern(normalizedFile, normalizedPattern)) {
            continue;
        }
        if (entry.lineRange) {
            const [min, max] = entry.lineRange;
            if (violation.line < min || violation.line > max) {
                continue;
            }
        }
        if (entry.lineSnippet && (!lineContent || !lineContent.includes(entry.lineSnippet))) {
            continue;
        }
        return true;
    }
    return false;
}

// Check if string contains actual user-facing text vs purely numbers/symbols/formatting tokens
export function isUserFacingText(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
        return false;
    }
    // Pure numbers or digits (ASCII or localized) with symbols like #1, 100%, 1.5
    if (/^#?\s*[-+]?[\d\p{N}]+([.,][\d\p{N}]+)?\s*%?$/u.test(trimmed)) {
        return false;
    }
    // Pure symbols/punctuation/math/HTML entities
    if (/^[&;:,\-–—/\\|•*+×#%°<>=_~()[\]{}!?@^$'"`]+$/.test(trimmed)) {
        return false;
    }
    // HTML entities
    if (/^&(?:times|nbsp|bull|hellip|#\d+);$/.test(trimmed)) {
        return false;
    }
    // Contains letters or marks across any script (Unicode-aware)
    return /[\p{L}\p{M}]/u.test(trimmed);
}

export const isPhysicalCssPropertyName = (name: string): boolean => {
    if (!name) {
        return false;
    }
    const clean = name.trim().replace(/^['"]|['"]$/g, "");
    const lower = clean.toLowerCase();

    // Guard against logical properties
    if (
        lower.startsWith("border-inline") ||
        lower.startsWith("borderinline") ||
        lower.startsWith("border-block") ||
        lower.startsWith("borderblock") ||
        lower.startsWith("margin-inline") ||
        lower.startsWith("margininline") ||
        lower.startsWith("padding-inline") ||
        lower.startsWith("paddinginline") ||
        lower.startsWith("inset-inline") ||
        lower.startsWith("insetinline")
    ) {
        return false;
    }

    if (lower === "left" || lower === "right") {
        return true;
    }
    if (lower === "margin-left" || lower === "margin-right" || lower === "marginleft" || lower === "marginright") {
        return true;
    }
    if (lower === "padding-left" || lower === "padding-right" || lower === "paddingleft" || lower === "paddingright") {
        return true;
    }
    if (
        lower.startsWith("border-left") ||
        lower.startsWith("border-right") ||
        lower.startsWith("borderleft") ||
        lower.startsWith("borderright")
    ) {
        return true;
    }
    if (/^border-(?:top|bottom)-(?:left|right)-radius$/.test(lower)) {
        return true;
    }
    if (/^border(?:top|bottom)(?:left|right)radius$/i.test(clean)) {
        return true;
    }
    return false;
};

export const isStyleName = (name: string | undefined): boolean => {
    if (!name) {
        return false;
    }
    const raw = name.includes(".") ? (name.split(".").pop() ?? name) : name;
    const clean = raw.replace(/^#+/, "").replace(/^[_\s]+|[_\s]+$/g, "");
    if (!clean) {
        return false;
    }

    // Explicit negative exclusions: metadata, IDs, guides, tokens, or non-style words
    if (
        /^(?:lifestyle|stylesheet(?:Metadata|Token|Guide|Id|Name|Type|Key|Index|Doc|Rule|Prop|Class)|style(?:Id|Token|Guide|Name|Type|Key|Index|Doc|Rule|Prop|Class))/i.test(
            clean
        )
    ) {
        return false;
    }

    // 1. Exact "style" or "styles" (case-insensitive for standalone words like "Style" or "styles")
    if (/^styles?$/i.test(clean)) {
        return true;
    }

    // 2. Exact "styleObject" or "stylesObject"
    if (/^styles?Object$/i.test(clean)) {
        return true;
    }

    // 3. Exact "stylesheet" or "stylesheets" or begins with stylesheet (e.g. stylesheetOverrides)
    if (/^stylesheets?/i.test(clean)) {
        return true;
    }

    // 4. camelCase suffix ending in Style or Styles: [a-z0-9]Styles?$
    // Examples: handleStyle, handleStyles, computedHandleStyle, labelStyles, makeStyle, createStyles
    if (/[a-z0-9]Styles?$/.test(clean)) {
        return true;
    }

    // 5. Suffix ending in StyleSheet or StyleSheets: [a-z0-9]StyleSheets?$
    // Example: componentStylesheet, customStylesheet
    if (/[a-z0-9]StyleSheets?$/i.test(clean)) {
        return true;
    }

    // 6. snake_case suffix: _styles?$ or _stylesheets?$ (case-insensitive)
    // Examples: handle_style, make_styles, handle_stylesheet
    if (/[a-z0-9]_(?:styles?|stylesheets?)$/i.test(clean)) {
        return true;
    }

    // 7. kebab-case suffix: -styles?$ or -stylesheets?$ (case-insensitive)
    // Examples: handle-style, make-styles, handle-stylesheet
    if (/[a-z0-9]-(?:styles?|stylesheets?)$/i.test(clean)) {
        return true;
    }

    return false;
};

export const TECHNICAL_SEMANTIC_STRINGS = new Set([
    "",
    "A",
    "H",
    "S",
    "V",
    "R",
    "G",
    "B",
    "horizontal",
    "vertical",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "button",
    "menuitem",
    "checkbox",
    "radio",
    "combobox",
    "grid",
    "tab",
    "dialog",
    "alert",
    "none",
    "presentation",
    "start",
    "center",
    "end",
    "left",
    "right",
    "top",
    "bottom",
    "auto",
    "contains",
    "doesnotcontain",
    "startswith",
    "endswith",
    "eq",
    "neq",
    "gte",
    "gt",
    "lte",
    "lt",
    "isnull",
    "isnotnull",
    "isempty",
    "isnotempty",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-roledescription",
    "aria-label-start",
    "aria-label-end",
    "true",
    "false",
    "assertive",
    "polite",
    "off",
    "mixed",
    "ascending",
    "descending"
]);

export const SEMANTIC_OBJECT_KEYS = new Set([
    "text",
    "label",
    "title",
    "placeholder",
    "ariaLabel",
    "ariaDescription",
    "ariaRoleDescription",
    "emptyText",
    "description",
    "tooltip",
    "message"
]);

export interface LiteralFragment {
    node: Node;
    text: string;
}

function isFunctionLikeScope(node: Node): boolean {
    return (
        Node.isArrowFunction(node) ||
        Node.isFunctionDeclaration(node) ||
        Node.isFunctionExpression(node) ||
        Node.isMethodDeclaration(node) ||
        Node.isGetAccessorDeclaration(node) ||
        Node.isSetAccessorDeclaration(node) ||
        Node.isConstructorDeclaration(node)
    );
}

export function getDirectReturnStatements(scopeNode: Node): ReturnStatement[] {
    const functionScope = isFunctionLikeScope(scopeNode)
        ? scopeNode
        : scopeNode.getFirstAncestor(ancestor => isFunctionLikeScope(ancestor)) ?? scopeNode;

    const returns = scopeNode.getDescendantsOfKind(SyntaxKind.ReturnStatement);
    return returns.filter(returnStmt => {
        const owner = returnStmt.getFirstAncestor(ancestor => isFunctionLikeScope(ancestor));
        return owner === functionScope;
    });
}

export function collectLiteralFragments(node: Node | undefined): LiteralFragment[] {
    if (!node) {
        return [];
    }
    if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
        return [{ node, text: node.getLiteralText() }];
    }
    if (Node.isTemplateExpression(node)) {
        const fragments: LiteralFragment[] = [];
        const head = node.getHead();
        const headText = head.getLiteralText();
        if (headText) {
            fragments.push({ node: head, text: headText });
        }
        for (const span of node.getTemplateSpans()) {
            const spanLit = span.getLiteral();
            const spanText = spanLit.getLiteralText();
            if (spanText) {
                fragments.push({ node: spanLit, text: spanText });
            }
            fragments.push(...collectLiteralFragments(span.getExpression()));
        }
        return fragments;
    }
    if (
        Node.isParenthesizedExpression(node) ||
        Node.isAsExpression(node) ||
        Node.isTypeAssertion(node) ||
        Node.isNonNullExpression(node) ||
        Node.isSatisfiesExpression(node)
    ) {
        return collectLiteralFragments(node.getExpression());
    }
    if (Node.isConditionalExpression(node)) {
        return [
            ...collectLiteralFragments(node.getWhenTrue()),
            ...collectLiteralFragments(node.getWhenFalse())
        ];
    }
    if (Node.isBinaryExpression(node)) {
        const op = node.getOperatorToken().getKind();
        if (
            op === SyntaxKind.PlusToken ||
            op === SyntaxKind.BarBarToken ||
            op === SyntaxKind.QuestionQuestionToken ||
            op === SyntaxKind.AmpersandAmpersandToken
        ) {
            return [
                ...collectLiteralFragments(node.getLeft()),
                ...collectLiteralFragments(node.getRight())
            ];
        }
        return [];
    }
    if (Node.isArrowFunction(node) || Node.isFunctionExpression(node)) {
        const body = node.getBody();
        if (Node.isBlock(body)) {
            const returns = getDirectReturnStatements(node);
            const fragments: LiteralFragment[] = [];
            for (const ret of returns) {
                fragments.push(...collectLiteralFragments(ret.getExpression()));
            }
            return fragments;
        } else {
            return collectLiteralFragments(body);
        }
    }
    if (Node.isCallExpression(node)) {
        const expr = node.getExpression();
        const exprText = expr.getText();
        if (
            exprText === "computed" ||
            exprText.endsWith(".computed") ||
            exprText === "signal" ||
            exprText.endsWith(".signal")
        ) {
            const fragments: LiteralFragment[] = [];
            for (const arg of node.getArguments()) {
                fragments.push(...collectLiteralFragments(arg));
            }
            return fragments;
        }
        if (
            exprText === "linkedSignal" ||
            exprText.endsWith(".linkedSignal")
        ) {
            const fragments: LiteralFragment[] = [];
            for (const arg of node.getArguments()) {
                if (Node.isObjectLiteralExpression(arg)) {
                    const computation = arg.getProperty("computation");
                    if (computation && Node.isPropertyAssignment(computation)) {
                        fragments.push(...collectLiteralFragments(computation.getInitializer()));
                    } else if (computation && Node.isMethodDeclaration(computation)) {
                        const body = computation.getBody();
                        if (body) {
                            const returns = getDirectReturnStatements(computation);
                            for (const ret of returns) {
                                fragments.push(...collectLiteralFragments(ret.getExpression()));
                            }
                        }
                    }
                } else {
                    fragments.push(...collectLiteralFragments(arg));
                }
            }
            return fragments;
        }
        return [];
    }
    return [];
}

const ROLE_TOKENS = new Set([
    "button",
    "menuitem",
    "checkbox",
    "radio",
    "combobox",
    "grid",
    "tab",
    "dialog",
    "alert",
    "none",
    "presentation"
]);

const ORIENTATION_TOKENS = new Set([
    "horizontal",
    "vertical"
]);

const PLACEMENT_TOKENS = new Set([
    "start",
    "center",
    "end",
    "left",
    "right",
    "top",
    "bottom",
    "auto"
]);

const SORT_TOKENS = new Set([
    "ascending",
    "descending"
]);

const FILTER_OPERATOR_TOKENS = new Set([
    "contains",
    "doesnotcontain",
    "startswith",
    "endswith",
    "eq",
    "neq",
    "gte",
    "gt",
    "lte",
    "lt",
    "isnull",
    "isnotnull",
    "isempty",
    "isnotempty"
]);

const COLOR_CHANNEL_TOKENS = new Set([
    "A",
    "H",
    "S",
    "V",
    "R",
    "G",
    "B"
]);

const TECHNICAL_ARIA_STATE_PROPERTIES = new Set([
    "ariadisabled",
    "arialive",
    "ariachecked",
    "ariaexpanded",
    "ariaselected",
    "ariahidden",
    "ariapressed",
    "ariacurrent",
    "ariahaspopup",
    "ariamodal",
    "ariaatomic",
    "ariabusy",
    "ariarequired",
    "ariareadonly",
    "ariaorientation",
    "ariasort",
    "ariainvalid",
    "ariarole",
    "role"
]);

const TECHNICAL_ARIA_STATE_VALUES = new Set([
    "true",
    "false",
    "assertive",
    "polite",
    "off",
    "mixed",
    "none",
    "horizontal",
    "vertical",
    "ascending",
    "descending",
    "page",
    "step",
    "location",
    "date",
    "time",
    "all",
    "grammar",
    "spelling"
]);

export type SemanticMapKind =
    | "announcements-map"
    | "aria-labels-map"
    | "labels-map"
    | "configuration-text-map"
    | "generic-text-map";

export function classifySemanticMapName(name: string): SemanticMapKind {
    const clean = name.replace(/^#/, "").replace(/^_+/, "");
    if (/announcement/i.test(clean)) {
        return "announcements-map";
    }
    if (/aria.*label/i.test(clean)) {
        return "aria-labels-map";
    }
    if (/label/i.test(clean)) {
        return "labels-map";
    }
    if (/config/i.test(clean)) {
        return "configuration-text-map";
    }
    return "generic-text-map";
}

export function isTechnicalSemanticMapValue(
    mapName: string,
    propertyName: string,
    value: string
): boolean {
    if (!value || !value.trim()) {
        return true;
    }

    const cleanProp = propertyName.replace(/^#/, "").replace(/^_+/, "").replace(/-/g, "").toLowerCase();

    if (
        TECHNICAL_ARIA_STATE_PROPERTIES.has(cleanProp) &&
        TECHNICAL_ARIA_STATE_VALUES.has(value.toLowerCase())
    ) {
        return true;
    }

    if (
        /^(?:role|ariaRole|roleName)$/i.test(propertyName) &&
        ROLE_TOKENS.has(value)
    ) {
        return true;
    }

    if (
        /^(?:orientation|axis)$/i.test(propertyName) &&
        ORIENTATION_TOKENS.has(value)
    ) {
        return true;
    }

    if (
        /^(?:placement|position|alignment|align)$/i.test(propertyName) &&
        PLACEMENT_TOKENS.has(value)
    ) {
        return true;
    }

    if (
        /^(?:sortDirection|sortOrder|sort|direction)$/i.test(propertyName) &&
        SORT_TOKENS.has(value)
    ) {
        return true;
    }

    if (
        /^(?:operator|filterOperator|op)$/i.test(propertyName) &&
        FILTER_OPERATOR_TOKENS.has(value)
    ) {
        return true;
    }

    if (
        /^(?:channel|colorChannel)$/i.test(propertyName) &&
        COLOR_CHANNEL_TOKENS.has(value)
    ) {
        return true;
    }

    if (
        /^(?:encoding|charset|mode)$/i.test(propertyName) &&
        /^(?:utf-?8|utf-?16|ascii)$/i.test(value)
    ) {
        return true;
    }

    if (
        /^(?:format|serializationFormat)$/i.test(propertyName) &&
        /^(?:json|xml|yaml|yml)$/i.test(value)
    ) {
        return true;
    }

    if (
        /^(?:mimeType|contentType)$/i.test(propertyName) &&
        /^(?:application|text|image|audio|video)\/[a-z0-9.+-]+$/i.test(value)
    ) {
        return true;
    }

    return false;
}

export type SemanticLiteralContext =
    | "host-aria-text"
    | "host-visible-text"
    | "aria-property"
    | "semantic-property"
    | "semantic-helper"
    | "live-announcement"
    | "generic-semantic-object";

export function isTechnicalLiteralForContext(
    context: SemanticLiteralContext,
    propertyName: string | undefined,
    value: string
): boolean {
    switch (context) {
        case "host-aria-text":
        case "host-visible-text":
        case "live-announcement":
        case "aria-property":
            return false;

        case "semantic-helper":
        case "semantic-property": {
            if (propertyName) {
                const cleanProp = propertyName.replace(/^#/, "").replace(/^_+/, "").toLowerCase();
                if (
                    TECHNICAL_ARIA_STATE_PROPERTIES.has(cleanProp) &&
                    TECHNICAL_ARIA_STATE_VALUES.has(value.toLowerCase())
                ) {
                    return true;
                }
            }
            return false;
        }

        case "generic-semantic-object":
            return false;

        default:
            return false;
    }
}

export function isSemanticTextMapName(name: string): boolean {
    const clean = name.replace(/^#/, "").replace(/^_+/, "");
    if (/^(?:labels|announcements)$/i.test(clean)) {
        return true;
    }
    return (
        /(?:_TEXT|_LABELS|_ANNOUNCEMENTS)$/.test(clean) ||
        /^(?:TEXT|LABELS|ANNOUNCEMENTS)_/.test(clean) ||
        /^(?:TEXT|LABELS|ANNOUNCEMENTS)$/.test(clean) ||
        /.+(?:Text|Labels|Announcements)$/.test(clean)
    );
}

function unwrapInitializer(node: Node | undefined): Node | undefined {
    let current = node;
    while (current) {
        if (
            Node.isParenthesizedExpression(current) ||
            Node.isAsExpression(current) ||
            Node.isTypeAssertion(current) ||
            Node.isNonNullExpression(current) ||
            Node.isSatisfiesExpression(current)
        ) {
            current = current.getExpression();
        } else if (Node.isCallExpression(current)) {
            const exprText = current.getExpression().getText();
            if (exprText === "Object.freeze" || exprText === "freeze") {
                const args = current.getArguments();
                current = args.length > 0 ? args[0] : undefined;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    return current;
}

function scanSemanticMapNode(
    mapName: string,
    propertyName: string,
    node: Node | undefined,
    filePath: string,
    isAria: boolean,
    violations: AuditViolation[]
): void {
    const unwrapped = unwrapInitializer(node);
    if (!unwrapped) {
        return;
    }

    if (Node.isCallExpression(unwrapped)) {
        const exprText = unwrapped.getExpression().getText();
        const callee = exprText.split(".").pop() ?? exprText;

        if (callee === "computed") {
            const args = unwrapped.getArguments();
            if (args.length > 0) {
                scanSemanticMapNode(mapName, propertyName, args[0], filePath, isAria, violations);
            }
            return;
        }

        if (callee === "signal") {
            const args = unwrapped.getArguments();
            if (args.length > 0) {
                scanSemanticMapNode(mapName, propertyName, args[0], filePath, isAria, violations);
            }
            return;
        }

        if (callee === "linkedSignal") {
            const args = unwrapped.getArguments();
            if (args.length > 0) {
                const arg = args[0];
                if (Node.isObjectLiteralExpression(arg)) {
                    const computation = arg.getProperty("computation");
                    if (computation && Node.isPropertyAssignment(computation)) {
                        scanSemanticMapNode(mapName, propertyName, computation.getInitializer(), filePath, isAria, violations);
                    } else if (
                        computation &&
                        (Node.isMethodDeclaration(computation) || Node.isGetAccessorDeclaration(computation))
                    ) {
                        const body = computation.getBody();
                        if (body) {
                            for (const ret of getDirectReturnStatements(computation)) {
                                scanSemanticMapNode(mapName, propertyName, ret.getExpression(), filePath, isAria, violations);
                            }
                        }
                    }
                } else {
                    scanSemanticMapNode(mapName, propertyName, arg, filePath, isAria, violations);
                }
            }
            return;
        }
    }

    if (Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) {
        const body = unwrapped.getBody();
        if (Node.isBlock(body)) {
            for (const ret of getDirectReturnStatements(unwrapped)) {
                scanSemanticMapNode(mapName, propertyName, ret.getExpression(), filePath, isAria, violations);
            }
        } else {
            scanSemanticMapNode(mapName, propertyName, body, filePath, isAria, violations);
        }
        return;
    }

    if (Node.isObjectLiteralExpression(unwrapped)) {
        for (const prop of unwrapped.getProperties()) {
            if (Node.isPropertyAssignment(prop)) {
                const propName = prop.getName().replace(/^['"]|['"]$/g, "");
                scanSemanticMapNode(mapName, propName, prop.getInitializer(), filePath, isAria, violations);
            } else if (Node.isMethodDeclaration(prop) || Node.isGetAccessorDeclaration(prop)) {
                const propName = prop.getName().replace(/^['"]|['"]$/g, "");
                const returns = getDirectReturnStatements(prop);
                for (const ret of returns) {
                    scanSemanticMapNode(mapName, propName, ret.getExpression(), filePath, isAria, violations);
                }
            }
        }
        return;
    }

    if (Node.isArrayLiteralExpression(unwrapped)) {
        for (const element of unwrapped.getElements()) {
            scanSemanticMapNode(mapName, propertyName, element, filePath, isAria, violations);
        }
        return;
    }

    if (Node.isConditionalExpression(unwrapped)) {
        scanSemanticMapNode(mapName, propertyName, unwrapped.getWhenTrue(), filePath, isAria, violations);
        scanSemanticMapNode(mapName, propertyName, unwrapped.getWhenFalse(), filePath, isAria, violations);
        return;
    }

    if (!propertyName) {
        return;
    }

    const fragments = collectLiteralFragments(unwrapped);
    for (const frag of fragments) {
        const val = frag.text.trim();
        if (isUserFacingText(val) && !isTechnicalSemanticMapValue(mapName, propertyName, val)) {
            violations.push({
                category: isAria ? "i18n-aria" : "i18n-text",
                detail: `Hard-coded semantic text-map property "${propertyName}" in "${mapName}": "${val}"`,
                file: filePath,
                line: frag.node.getStartLineNumber()
            });
        }
    }
}

export function scanSemanticTextMap(
    mapName: string,
    initializer: Node | undefined,
    filePath: string,
    violations: AuditViolation[]
): void {
    const isAria = /aria|announcement/i.test(mapName);
    scanSemanticMapNode(mapName, "", initializer, filePath, isAria, violations);
}

const sharedTsProject = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
        target: 99
    }
});

export function scanTypeScriptAst(
    filePath: string,
    content: string,
    violations: AuditViolation[],
    project: Project = sharedTsProject
): void {
    const sf = project.createSourceFile(`virtual-${Date.now()}-${Math.random()}.ts`, content, { overwrite: true });

    const normalizedPath = filePath.replace(/\\/g, "/");
    const isMessageCatalog =
        normalizedPath.includes("/i18n/") ||
        normalizedPath.endsWith(".default-messages.ts") ||
        isOfficialLocaleMessageCatalog(normalizedPath);

    try {
        if (!isMessageCatalog) {
            // 1. Angular host metadata inspection
        for (const classDecl of sf.getClasses()) {
            for (const decorator of classDecl.getDecorators()) {
                const name = decorator.getName();
                if (name === "Component" || name === "Directive") {
                    const args = decorator.getArguments();
                    if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
                        const hostProp = args[0].getProperty("host");
                        if (hostProp && Node.isPropertyAssignment(hostProp)) {
                            const hostInit = hostProp.getInitializer();
                            if (hostInit && Node.isObjectLiteralExpression(hostInit)) {
                                for (const prop of hostInit.getProperties()) {
                                    if (Node.isPropertyAssignment(prop)) {
                                        const rawPropName = prop.getName().replace(/['"]/g, "").toLowerCase();
                                        const strippedPropName =
                                            rawPropName.startsWith("[") && rawPropName.endsWith("]")
                                                ? rawPropName.slice(1, -1)
                                                : rawPropName;
                                        const cleanPropName = strippedPropName.startsWith("attr.")
                                            ? strippedPropName.slice(5)
                                            : strippedPropName;
                                        const isAria = ARIA_TEXT_ATTRIBUTES.has(cleanPropName);
                                        const isText = GENERAL_TEXT_ATTRIBUTES.has(cleanPropName);
                                        if (isAria || isText) {
                                            const init = prop.getInitializer();
                                            if (
                                                init &&
                                                (Node.isStringLiteral(init) ||
                                                    Node.isNoSubstitutionTemplateLiteral(init))
                                            ) {
                                                const rawVal = init.getLiteralText().trim();
                                                const isBound = rawPropName.startsWith("[");
                                                if (isBound) {
                                                    try {
                                                        const escapedVal = rawVal.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
                                                        const dummyHtml = `<div [${cleanPropName}]="${escapedVal}"></div>`;
                                                        const parsed = parseTemplate(dummyHtml, filePath, {
                                                            preserveWhitespaces: false
                                                        });
                                                        if (parsed.errors && parsed.errors.length > 0) {
                                                            for (const e of parsed.errors) {
                                                                violations.push({
                                                                    category: isAria ? "i18n-aria" : "i18n-text",
                                                                    detail: `Host binding parse error in ${rawPropName}: ${e.msg}`,
                                                                    file: filePath,
                                                                    line: prop.getStartLineNumber()
                                                                });
                                                            }
                                                        }
                                                        if (
                                                            parsed.nodes &&
                                                            parsed.nodes.length > 0 &&
                                                            parsed.nodes[0] instanceof TmplAstElement
                                                        ) {
                                                            const el = parsed.nodes[0] as TmplAstElement;
                                                            for (const inp of el.inputs) {
                                                                const literals = collectLiteralStrings(inp.value);
                                                                for (const strVal of literals) {
                                                                    if (
                                                                        isUserFacingText(strVal) &&
                                                                        !isTechnicalLiteralForContext(
                                                                            isAria ? "host-aria-text" : "host-visible-text",
                                                                            cleanPropName,
                                                                            strVal
                                                                        )
                                                                    ) {
                                                                        violations.push({
                                                                            category: isAria
                                                                                ? "i18n-aria"
                                                                                : "i18n-text",
                                                                            detail: `Literal string in host binding ${rawPropName}: "${strVal.trim()}"`,
                                                                            file: filePath,
                                                                            line: prop.getStartLineNumber()
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } catch (err) {
                                                        violations.push({
                                                            category: isAria ? "i18n-aria" : "i18n-text",
                                                            detail: `Exception parsing host binding ${rawPropName}: ${String(err)}`,
                                                            file: filePath,
                                                            line: prop.getStartLineNumber()
                                                        });
                                                    }
                                                } else {
                                                    if (
                                                        isUserFacingText(rawVal) &&
                                                        !isTechnicalLiteralForContext(
                                                            isAria ? "host-aria-text" : "host-visible-text",
                                                            cleanPropName,
                                                            rawVal
                                                        )
                                                    ) {
                                                        violations.push({
                                                            category: isAria ? "i18n-aria" : "i18n-text",
                                                            detail: `Static host binding ${rawPropName}: "${rawVal}"`,
                                                            file: filePath,
                                                            line: prop.getStartLineNumber()
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (name === "Component") {
                            const templateProp = args[0].getProperty("template");
                            if (templateProp && Node.isPropertyAssignment(templateProp)) {
                                const templateInit = templateProp.getInitializer();
                                if (
                                    templateInit &&
                                    (Node.isStringLiteral(templateInit) ||
                                        Node.isNoSubstitutionTemplateLiteral(templateInit))
                                ) {
                                    const templateText = templateInit.getLiteralText();
                                    if (templateText.trim()) {
                                        const templateStartLine = templateInit.getStartLineNumber();
                                        try {
                                            const parsed = parseTemplate(templateText, filePath, {
                                                preserveWhitespaces: false
                                            });
                                            if (parsed.errors && parsed.errors.length > 0) {
                                                for (const e of parsed.errors) {
                                                    violations.push({
                                                        category: "i18n-text",
                                                        detail: `Inline template parse error: ${e.msg}`,
                                                        file: filePath,
                                                        line: templateStartLine + (e.span?.start?.line ?? 0)
                                                    });
                                                }
                                            }
                                            if (parsed.nodes) {
                                                const inlineViolations: AuditViolation[] = [];
                                                scanTemplateNodes(parsed.nodes, filePath, inlineViolations);
                                                for (const iv of inlineViolations) {
                                                    iv.line = templateStartLine + iv.line - 1;
                                                    violations.push(iv);
                                                }
                                            }
                                        } catch (err) {
                                            violations.push({
                                                category: "i18n-text",
                                                detail: `Exception parsing inline template: ${String(err)}`,
                                                file: filePath,
                                                line: templateStartLine
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Object literal properties with semantic keys
        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of obj.getProperties()) {
                if (Node.isPropertyAssignment(prop)) {
                    const propName = prop.getName();
                    if (SEMANTIC_OBJECT_KEYS.has(propName)) {
                        const init = prop.getInitializer();
                        if (init) {
                            const fragments = collectLiteralFragments(init);
                            for (const frag of fragments) {
                                const val = frag.text.trim();
                                if (isUserFacingText(val) && !isTechnicalLiteralForContext("generic-semantic-object", propName, val)) {
                                    const isAria = propName.toLowerCase().startsWith("aria");
                                    violations.push({
                                        category: isAria ? "i18n-aria" : "i18n-text",
                                        detail: `Hard-coded literal property "${propName}": "${val}"`,
                                        file: filePath,
                                        line: frag.node.getStartLineNumber()
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Computed accessibility properties and string getters
        for (const node of [
            ...sf.getDescendantsOfKind(SyntaxKind.PropertyDeclaration),
            ...sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        ]) {
            const propName = node.getName();
            if (propName.toLowerCase().includes("arialabel") || propName.toLowerCase().includes("announcement")) {
                const init = node.getInitializer();
                if (init) {
                    const fragments = collectLiteralFragments(init);
                    for (const frag of fragments) {
                        const val = frag.text.trim();
                        if (isUserFacingText(val) && !isTechnicalLiteralForContext("aria-property", propName, val)) {
                            violations.push({
                                category: "i18n-aria",
                                detail: `Hard-coded text in accessibility property "${propName}": "${val}"`,
                                file: filePath,
                                line: frag.node.getStartLineNumber()
                            });
                        }
                    }
                }
            }
        }

        const isSemanticName = (name: string): boolean => {
            if (/(?:label|title|message|placeholder|tooltip|description|announcement|emptyText)/i.test(name)) {
                return true;
            }
            if (/(?:^|[a-z0-9_#])Aria(?:[A-Z0-9_]|$)/.test(name) || /^#?aria(?:[A-Z0-9_]|$)/.test(name)) {
                return true;
            }
            return false;
        };
        const isAriaSemanticName = (name: string): boolean => {
            return (
                /(?:^|[a-z0-9_#])Aria(?:[A-Z0-9_]|$)/.test(name) ||
                /^#?aria(?:[A-Z0-9_]|$)/.test(name) ||
                /announcement/i.test(name)
            );
        };
        const predicatePrefixRegex = /^(?:is|has|should|can|check)[A-Z]/;
        const technicalFnSuffixRegex =
            /(?:transform|origin|style|styles|class|classes|options|config|rect|size|bounds|width|height|coord|coords|coordinate|coordinates|pattern|regex|index|key|id)$/i;

        // 3b. Semantic class property declarations (e.g. title, tooltip, message, label, placeholder, description, emptyText)
        for (const prop of sf.getDescendantsOfKind(SyntaxKind.PropertyDeclaration)) {
            const propName = prop.getName();
            if (propName.toLowerCase().includes("arialabel") || propName.toLowerCase().includes("announcement")) {
                continue;
            }
            if (isSemanticName(propName) && !predicatePrefixRegex.test(propName) && !technicalFnSuffixRegex.test(propName)) {
                const init = prop.getInitializer();
                if (init) {
                    const fragments = collectLiteralFragments(init);
                    for (const frag of fragments) {
                        const val = frag.text.trim();
                        if (isUserFacingText(val) && !isTechnicalLiteralForContext("semantic-property", propName, val)) {
                            const isAria = isAriaSemanticName(propName);
                            violations.push({
                                category: isAria ? "i18n-aria" : "i18n-text",
                                detail: `Hard-coded text in semantic property "${propName}": "${val}"`,
                                file: filePath,
                                line: frag.node.getStartLineNumber()
                            });
                        }
                    }
                }
            }
        }

        // 4. Semantic functions, methods, and getters returning string literals

        const candidateFunctions: { name: string; returnExprs: (Node | undefined)[] }[] = [];

        for (const fn of sf.getFunctions()) {
            const name = fn.getName();
            const returnType = fn.getReturnTypeNode()?.getText().trim();
            if (name && !predicatePrefixRegex.test(name) && returnType !== "boolean" && returnType !== "number" && returnType !== "void") {
                candidateFunctions.push({
                    name,
                    returnExprs: getDirectReturnStatements(fn).map(r => r.getExpression())
                });
            }
        }

        for (const cls of sf.getClasses()) {
            for (const method of cls.getMethods()) {
                const name = method.getName();
                const returnType = method.getReturnTypeNode()?.getText().trim();
                if (name && !predicatePrefixRegex.test(name) && returnType !== "boolean" && returnType !== "number" && returnType !== "void") {
                    candidateFunctions.push({
                        name,
                        returnExprs: getDirectReturnStatements(method).map(r => r.getExpression())
                    });
                }
            }
            for (const getter of cls.getGetAccessors()) {
                const name = getter.getName();
                const returnType = getter.getReturnTypeNode()?.getText().trim();
                if (name && !predicatePrefixRegex.test(name) && returnType !== "boolean" && returnType !== "number" && returnType !== "void") {
                    candidateFunctions.push({
                        name,
                        returnExprs: getDirectReturnStatements(getter).map(r => r.getExpression())
                    });
                }
            }
        }

        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            for (const prop of obj.getProperties()) {
                if (Node.isGetAccessorDeclaration(prop)) {
                    const name = prop.getName();
                    const returnType = prop.getReturnTypeNode()?.getText().trim();
                    if (name && !predicatePrefixRegex.test(name) && returnType !== "boolean" && returnType !== "number" && returnType !== "void") {
                        candidateFunctions.push({
                            name,
                            returnExprs: getDirectReturnStatements(prop).map(r => r.getExpression())
                        });
                    }
                }
            }
        }

        for (const varDecl of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
            const name = varDecl.getName();
            if (name && isSemanticName(name) && !predicatePrefixRegex.test(name)) {
                const init = varDecl.getInitializer();
                if (init && Node.isArrowFunction(init)) {
                    const body = init.getBody();
                    if (Node.isBlock(body)) {
                        candidateFunctions.push({
                            name,
                            returnExprs: getDirectReturnStatements(body).map(r => r.getExpression())
                        });
                    } else {
                        candidateFunctions.push({
                            name,
                            returnExprs: [body]
                        });
                    }
                } else if (init && Node.isFunctionExpression(init)) {
                    candidateFunctions.push({
                        name,
                        returnExprs: getDirectReturnStatements(init).map(r => r.getExpression())
                    });
                }
            }
        }

        for (const { name: fnName, returnExprs } of candidateFunctions) {
            if (isSemanticName(fnName) && !technicalFnSuffixRegex.test(fnName)) {
                for (const expr of returnExprs) {
                    const fragments = collectLiteralFragments(expr);
                    for (const frag of fragments) {
                        const val = frag.text.trim();
                        if (isUserFacingText(val) && !isTechnicalLiteralForContext("semantic-helper", fnName, val)) {
                            const isAria = isAriaSemanticName(fnName);
                            violations.push({
                                category: isAria ? "i18n-aria" : "i18n-text",
                                detail: `Hard-coded text returned from semantic helper "${fnName}": "${val}"`,
                                file: filePath,
                                line: frag.node.getStartLineNumber()
                            });
                        }
                    }
                }
            }
        }

        // 4b. Hard-coded LiveAnnouncer announcement detection
        const liveAnnouncerNames = new Set<string>();
        for (const prop of sf.getDescendantsOfKind(SyntaxKind.PropertyDeclaration)) {
            const typeText = prop.getTypeNode()?.getText() ?? "";
            const initText = prop.getInitializer()?.getText() ?? "";
            if (typeText.includes("LiveAnnouncer") || initText.includes("LiveAnnouncer")) {
                liveAnnouncerNames.add(prop.getName());
            }
        }
        for (const varDecl of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
            const typeText = varDecl.getTypeNode()?.getText() ?? "";
            const initText = varDecl.getInitializer()?.getText() ?? "";
            if (typeText.includes("LiveAnnouncer") || initText.includes("LiveAnnouncer")) {
                liveAnnouncerNames.add(varDecl.getName());
            }
        }
        for (const param of sf.getDescendantsOfKind(SyntaxKind.Parameter)) {
            const typeText = param.getTypeNode()?.getText() ?? "";
            if (typeText.includes("LiveAnnouncer")) {
                liveAnnouncerNames.add(param.getName());
            }
        }

        for (const callExpr of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
            const expr = callExpr.getExpression();
            if (!Node.isPropertyAccessExpression(expr)) {
                continue;
            }
            if (expr.getName() !== "announce") {
                continue;
            }
            const receiver = expr.getExpression();
            const receiverText = receiver.getText();
            const isLiveAnnouncer =
                (Node.isIdentifier(receiver) && liveAnnouncerNames.has(receiver.getText())) ||
                (Node.isPropertyAccessExpression(receiver) &&
                    (liveAnnouncerNames.has(receiver.getName()) || /(?:^|[.#_])liveannouncer$/i.test(receiverText))) ||
                /(?:^|[.#_])liveannouncer$/i.test(receiverText);

            if (isLiveAnnouncer) {
                const args = callExpr.getArguments();
                if (args.length > 0) {
                    const fragments = collectLiteralFragments(args[0]);
                    for (const frag of fragments) {
                        const val = frag.text.trim();
                        if (isUserFacingText(val) && !isTechnicalLiteralForContext("live-announcement", undefined, val)) {
                            violations.push({
                                category: "i18n-aria",
                                detail: `Hard-coded accessibility live-announcement text in announce: "${val}"`,
                                file: filePath,
                                line: frag.node.getStartLineNumber()
                            });
                        }
                    }
                }
            }
        }

        // 4c. Semantic text maps with user-facing strings (e.g. *_TEXT, *_LABELS, *_ANNOUNCEMENTS)
        for (const varDecl of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
            const varName = varDecl.getName();
            if (isSemanticTextMapName(varName)) {
                scanSemanticTextMap(varName, varDecl.getInitializer(), filePath, violations);
            }
        }
        for (const prop of sf.getDescendantsOfKind(SyntaxKind.PropertyDeclaration)) {
            const propName = prop.getName();
            if (isSemanticTextMapName(propName)) {
                scanSemanticTextMap(propName, prop.getInitializer(), filePath, violations);
            }
        }
        }

        // 5. Indirect DOMRect access tracking
        const domRectVarNames = new Set<string>();
        for (const varDecl of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
            const init = varDecl.getInitializer();
            if (init && Node.isCallExpression(init)) {
                const exprText = init.getExpression().getText();
                if (exprText.endsWith("getBoundingClientRect")) {
                    const nameNode = varDecl.getNameNode();
                    if (Node.isObjectBindingPattern(nameNode)) {
                        for (const element of nameNode.getElements()) {
                            const boundName = element.getName();
                            if (boundName === "left" || boundName === "right") {
                                violations.push({
                                    category: "rtl-manual-review",
                                    detail: `Manual review: destructured DOMRect.${boundName} from getBoundingClientRect()`,
                                    file: filePath,
                                    line: element.getStartLineNumber()
                                });
                            }
                        }
                    } else {
                        domRectVarNames.add(varDecl.getName());
                    }
                }
            }
        }

        if (domRectVarNames.size > 0) {
            for (const propAccess of sf.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
                const propName = propAccess.getName();
                if (propName === "left" || propName === "right") {
                    const expr = propAccess.getExpression();
                    if (Node.isIdentifier(expr) && domRectVarNames.has(expr.getText())) {
                        violations.push({
                            category: "rtl-manual-review",
                            detail: `Manual review: indirect DOMRect.${propName} access via "${expr.getText()}.${propName}"`,
                            file: filePath,
                            line: propAccess.getStartLineNumber()
                        });
                    }
                }
            }
        }

        // 6. TypeScript-authored physical style objects and assignments
        const isCssStyleType = (typeText: string | undefined): boolean => {
            if (!typeText) {
                return false;
            }
            return /CSSStyleDeclaration|CSSProperties|StyleDeclaration/.test(typeText);
        };

        const hasCssUnit = (text: string): boolean => {
            return /(?:px|%|rem|em|vh|vw|calc\(|translateX\(|translateY\(|translate\()/i.test(text);
        };

        const isStyleObject = (obj: Node): boolean => {
            if (!Node.isObjectLiteralExpression(obj)) {
                return false;
            }

            // 1. Inside cva() call -> not a CSSStyleDeclaration (CVA variants)
            const cvaCall = obj.getFirstAncestor(
                n => Node.isCallExpression(n) && n.getExpression().getText().endsWith("cva")
            );
            if (cvaCall) {
                return false;
            }

            // 2. Type assertion / satisfies with CSSStyleDeclaration
            const parent = obj.getParent();
            if (parent && (Node.isAsExpression(parent) || Node.isSatisfiesExpression(parent))) {
                if (isCssStyleType(parent.getTypeNode()?.getText())) {
                    return true;
                }
            }

            // 3. Nested inside another style object (e.g. spread, conditional, parenthesized)
            let curr: Node | undefined = parent;
            while (
                curr &&
                (Node.isParenthesizedExpression(curr) ||
                    Node.isConditionalExpression(curr) ||
                    Node.isSpreadAssignment(curr))
            ) {
                curr = curr.getParent();
            }
            if (curr && Node.isObjectLiteralExpression(curr) && curr !== obj) {
                if (isStyleObject(curr)) {
                    return true;
                }
            }

            // 4. Object.assign(target, { ... }) where target ends in .style or is a style name
            if (parent && Node.isCallExpression(parent)) {
                const callText = parent.getExpression().getText();
                if (callText === "Object.assign" || callText.endsWith(".assign")) {
                    const args = parent.getArguments();
                    if (args.length > 0 && args[0] !== obj) {
                        const firstArgText = args[0].getText();
                        if (firstArgText.endsWith(".style") || isStyleName(firstArgText)) {
                            return true;
                        }
                    }
                }
            }

            // 5. Enclosing variable declaration
            const varDecl = obj.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
            if (varDecl) {
                if (isCssStyleType(varDecl.getTypeNode()?.getText())) {
                    return true;
                }
                if (isStyleName(varDecl.getName())) {
                    return true;
                }
            }

            // 6. Enclosing property declaration
            const propDecl = obj.getFirstAncestorByKind(SyntaxKind.PropertyDeclaration);
            if (propDecl) {
                if (isCssStyleType(propDecl.getTypeNode()?.getText())) {
                    return true;
                }
                if (isStyleName(propDecl.getName())) {
                    return true;
                }
            }

            // 7. Enclosing function / method / getter / arrow / return statement
            const fn = obj.getFirstAncestor(
                n =>
                    Node.isFunctionDeclaration(n) ||
                    Node.isMethodDeclaration(n) ||
                    Node.isGetAccessorDeclaration(n) ||
                    Node.isArrowFunction(n) ||
                    Node.isFunctionExpression(n)
            );
            if (fn) {
                if ("getReturnTypeNode" in fn && typeof fn.getReturnTypeNode === "function") {
                    const rt = fn.getReturnTypeNode();
                    if (isCssStyleType(rt?.getText())) {
                        return true;
                    }
                }
                if ("getName" in fn && typeof fn.getName === "function") {
                    const fnName = fn.getName();
                    if (isStyleName(fnName)) {
                        return true;
                    }
                }
            }

            // 8. Enclosing call expression (e.g. computed<Partial<CSSStyleDeclaration>>(() => ({ ... })))
            const callExpr = obj.getFirstAncestorByKind(SyntaxKind.CallExpression);
            if (callExpr) {
                for (const typeArg of callExpr.getTypeArguments()) {
                    if (isCssStyleType(typeArg.getText())) {
                        return true;
                    }
                }
            }

            return false;
        };

        for (const obj of sf.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)) {
            if (!isStyleObject(obj)) {
                continue;
            }
            for (const prop of obj.getProperties()) {
                if (Node.isPropertyAssignment(prop) || Node.isShorthandPropertyAssignment(prop)) {
                    const rawName = prop.getName().replace(/['"]/g, "");
                    if (isPhysicalCssPropertyName(rawName)) {
                        violations.push({
                            category: "rtl-physical-style",
                            detail: `Physical style property "${rawName}" in style object`,
                            file: filePath,
                            line: prop.getStartLineNumber()
                        });
                    }
                }
            }
        }

        for (const binExpr of sf.getDescendantsOfKind(SyntaxKind.BinaryExpression)) {
            if (binExpr.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) {
                continue;
            }
            const left = binExpr.getLeft();
            let propName: string | null = null;
            let targetExpr: Node | null = null;

            if (Node.isPropertyAccessExpression(left)) {
                propName = left.getName();
                targetExpr = left.getExpression();
            } else if (Node.isElementAccessExpression(left)) {
                const arg = left.getArgumentExpression();
                if (arg && (Node.isStringLiteral(arg) || Node.isNoSubstitutionTemplateLiteral(arg))) {
                    propName = arg.getLiteralText();
                } else if (arg && Node.isIdentifier(arg)) {
                    const argName = arg.getText();
                    if (argName === "side" || argName === "directionSide" || argName === "physicalSide") {
                        propName = argName;
                    }
                }
                targetExpr = left.getExpression();
            }

            if (!propName || !targetExpr) {
                continue;
            }

            const isPhysical = isPhysicalCssPropertyName(propName) || propName === "side";
            if (!isPhysical) {
                continue;
            }

            const targetText = targetExpr.getText();
            const isTargetStyle =
                targetText.endsWith(".style") ||
                isStyleName(targetText) ||
                /(?:^|[\s._])styles?$/i.test(targetText);

            let isStyleAssignment = isTargetStyle;
            if (!isStyleAssignment && Node.isIdentifier(targetExpr)) {
                for (const v of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
                    if (v.getName() === targetExpr.getText() && isCssStyleType(v.getTypeNode()?.getText())) {
                        isStyleAssignment = true;
                        break;
                    }
                }
            }

            if (!isStyleAssignment && hasCssUnit(binExpr.getRight().getText())) {
                if (!/rect|bounds|point|coords|offset|box/i.test(targetText)) {
                    isStyleAssignment = true;
                }
            }

            if (isStyleAssignment) {
                violations.push({
                    category: "rtl-physical-style",
                    detail: `Physical style assignment to "${propName}": "${binExpr.getText().trim()}"`,
                    file: filePath,
                    line: binExpr.getStartLineNumber()
                });
            }
        }

        for (const callExpr of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
            const expr = callExpr.getExpression();
            if (!Node.isPropertyAccessExpression(expr)) {
                continue;
            }
            if (expr.getName() !== "setProperty") {
                continue;
            }

            const receiver = expr.getExpression();
            const receiverText = receiver.getText();
            const isReceiverStyle =
                receiverText.endsWith(".style") ||
                isStyleName(receiverText) ||
                /(?:^|[\s._])styles?$/i.test(receiverText);

            let isStyleCall = isReceiverStyle;
            if (!isStyleCall && Node.isIdentifier(receiver)) {
                for (const v of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
                    if (v.getName() === receiver.getText() && isCssStyleType(v.getTypeNode()?.getText())) {
                        isStyleCall = true;
                        break;
                    }
                }
            }

            if (!isStyleCall) {
                continue;
            }

            const args = callExpr.getArguments();
            if (args.length === 0) {
                continue;
            }

            const firstArg = args[0];
            let propName: string | null = null;
            if (Node.isStringLiteral(firstArg) || Node.isNoSubstitutionTemplateLiteral(firstArg)) {
                propName = firstArg.getLiteralText();
            }

            if (propName && isPhysicalCssPropertyName(propName)) {
                violations.push({
                    category: "rtl-physical-style",
                    detail: `Physical style property "${propName}" in setProperty call: "${callExpr.getText().trim()}"`,
                    file: filePath,
                    line: callExpr.getStartLineNumber()
                });
            }
        }
    } finally {
        project.removeSourceFile(sf);
    }
}

export class LiteralStringCollector extends RecursiveAstVisitor {
    public readonly literals: string[] = [];

    public override visitLiteralPrimitive(ast: LiteralPrimitive): void {
        if (typeof ast.value === "string") {
            this.literals.push(ast.value);
        }
    }
}

export function collectLiteralStrings(ast: unknown): string[] {
    const collector = new LiteralStringCollector();
    const actualAst =
        ast && typeof ast === "object"
            ? "visit" in ast
                ? (ast as AST)
                : ((ast as { ast?: AST }).ast ?? null)
            : null;
    if (actualAst && typeof actualAst.visit === "function") {
        actualAst.visit(collector);
    }
    return collector.literals;
}

export function scanTemplateNodes(nodes: TmplAstNode[], filePath: string, violations: AuditViolation[]): void {
    for (const node of nodes) {
        if (node instanceof TmplAstText) {
            const raw = node.value;
            if (isUserFacingText(raw)) {
                violations.push({
                    category: "i18n-text",
                    detail: `Hard-coded text node: "${raw.trim()}"`,
                    file: filePath,
                    line: node.sourceSpan.start.line + 1
                });
            }
        } else if (node instanceof TmplAstBoundText) {
            const ast = node.value;
            const interpolation = ast instanceof Interpolation ? ast : (ast as { ast?: AST }).ast;
            if (interpolation instanceof Interpolation) {
                for (const str of interpolation.strings) {
                    if (isUserFacingText(str)) {
                        violations.push({
                            category: "i18n-text",
                            detail: `Hard-coded text fragment in interpolation: "${str.trim()}"`,
                            file: filePath,
                            line: node.sourceSpan.start.line + 1
                        });
                    }
                }
                for (const expr of interpolation.expressions) {
                    const literals = collectLiteralStrings(expr);
                    for (const lit of literals) {
                        if (isUserFacingText(lit)) {
                            violations.push({
                                category: "i18n-text",
                                detail: `Hard-coded text in interpolation expression: "${lit.trim()}"`,
                                file: filePath,
                                line: node.sourceSpan.start.line + 1
                            });
                        }
                    }
                }
            }
        } else if (node instanceof TmplAstElement) {
            // Check static attributes
            for (const attr of node.attributes) {
                const rawName = attr.name.toLowerCase();
                const cleanName = rawName.startsWith("attr.") ? rawName.slice(5) : rawName;
                const val = attr.value;
                if (ARIA_TEXT_ATTRIBUTES.has(cleanName)) {
                    if (isUserFacingText(val)) {
                        violations.push({
                            category: "i18n-aria",
                            detail: `Static ${attr.name} attribute: "${val.trim()}"`,
                            file: filePath,
                            line: attr.sourceSpan.start.line + 1
                        });
                    }
                } else if (GENERAL_TEXT_ATTRIBUTES.has(cleanName)) {
                    if (isUserFacingText(val)) {
                        violations.push({
                            category: "i18n-text",
                            detail: `Static ${attr.name} attribute: "${val.trim()}"`,
                            file: filePath,
                            line: attr.sourceSpan.start.line + 1
                        });
                    }
                }
            }

            // Check bound attributes with literal strings (including nested in expressions and ternaries)
            for (const input of node.inputs) {
                const rawName = input.name.toLowerCase();
                const cleanName = rawName.startsWith("attr.") ? rawName.slice(5) : rawName;
                const isAria = ARIA_TEXT_ATTRIBUTES.has(cleanName);
                const isText = GENERAL_TEXT_ATTRIBUTES.has(cleanName);
                if (isAria || isText) {
                    const literals = collectLiteralStrings(input.value);
                    for (const strVal of literals) {
                        if (isUserFacingText(strVal)) {
                            violations.push({
                                category: isAria ? "i18n-aria" : "i18n-text",
                                detail: `Literal string in [${input.name}] binding: "${strVal.trim()}"`,
                                file: filePath,
                                line: input.sourceSpan.start.line + 1
                            });
                        }
                    }
                }

                // Check [style.left] or [style.right] (including units like .px, %, etc.)
                if (
                    (input.type === BindingType.Style && (rawName === "left" || rawName === "right")) ||
                    rawName.startsWith("style.left") ||
                    rawName.startsWith("style.right")
                ) {
                    const styleName =
                        input.type === BindingType.Style
                            ? `style.${input.name}${input.unit ? "." + input.unit : ""}`
                            : input.name;
                    violations.push({
                        category: "rtl-physical-style",
                        detail: `Physical [${styleName}] style binding`,
                        file: filePath,
                        line: input.sourceSpan.start.line + 1
                    });
                }
            }

            scanTemplateNodes(node.children, filePath, violations);
        } else if (node instanceof TmplAstTemplate) {
            scanTemplateNodes(node.children, filePath, violations);
        } else if (node instanceof TmplAstIfBlock) {
            for (const branch of node.branches) {
                scanTemplateNodes(branch.children, filePath, violations);
            }
        } else if (node instanceof TmplAstForLoopBlock) {
            scanTemplateNodes(node.children, filePath, violations);
            if (node.empty) {
                scanTemplateNodes(node.empty.children, filePath, violations);
            }
        } else if (node instanceof TmplAstSwitchBlock) {
            for (const group of node.groups) {
                scanTemplateNodes(group.children, filePath, violations);
            }
        } else if (node instanceof TmplAstDeferredBlock) {
            scanTemplateNodes(node.children, filePath, violations);
            if (node.placeholder) {
                scanTemplateNodes(node.placeholder.children, filePath, violations);
            }
            if (node.loading) {
                scanTemplateNodes(node.loading.children, filePath, violations);
            }
            if (node.error) {
                scanTemplateNodes(node.error.children, filePath, violations);
            }
        }
    }
}

export function isOfficialLocaleMessageCatalog(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, "/");
    return /\/locales\/[^/]+\/[^/]+\.messages\.ts$/.test(normalized);
}

export function scanFile(filePath: string, violations: AuditViolation[]): void {
    const normalizedPath = filePath.replace(/\\/g, "/");
    // Skip spec files, i18n package itself, tester app, scripts, tests directories, and generated files
    if (
        normalizedPath.endsWith(".spec.ts") ||
        normalizedPath.includes("/i18n/") ||
        normalizedPath.includes("/tests/") ||
        normalizedPath.includes("/testing/") ||
        normalizedPath.includes("/scripts/") ||
        normalizedPath.includes("component-metadata")
    ) {
        return;
    }

    const content = readFileSync(filePath, "utf-8");
    scanFileContent(normalizedPath, content, violations);
}

export function scanFileContent(filePath: string, content: string, violations: AuditViolation[]): void {
    const normalizedPath = filePath.replace(/\\/g, "/");
    const lines = content.split("\n");

    // 1. Line-by-line scanning for physical styles and regex patterns
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            continue;
        }

        // Scan physical Tailwind utilities (only in TS and HTML files)
        if (normalizedPath.endsWith(".ts") || normalizedPath.endsWith(".html")) {
            for (const pattern of PHYSICAL_TAILWIND_PATTERNS) {
                pattern.regex.lastIndex = 0;
                const matches = line.match(pattern.regex);
                if (matches) {
                    for (const match of matches) {
                        const violation: AuditViolation = {
                            category: "rtl-physical-style",
                            detail: `${pattern.label}: "${match}"`,
                            file: normalizedPath,
                            line: lineNumber
                        };
                        if (!isAllowlisted(violation, line)) {
                            violations.push(violation);
                        }
                    }
                }
            }
        }

        // Scan physical CSS properties
        for (const pattern of PHYSICAL_CSS_PATTERNS) {
            pattern.regex.lastIndex = 0;
            const matches = line.match(pattern.regex);
            if (matches) {
                for (const match of matches) {
                    const violation: AuditViolation = {
                        category: "rtl-physical-style",
                        detail: `${pattern.label}: "${match.trim()}"`,
                        file: normalizedPath,
                        line: lineNumber
                    };
                    if (!isAllowlisted(violation, line)) {
                        violations.push(violation);
                    }
                }
            }
        }

        // In CSS/SCSS or style attributes, scan physical left/right
        if (normalizedPath.endsWith(".scss") || normalizedPath.endsWith(".css") || line.includes("style=")) {
            PHYSICAL_CSS_POSITION_PATTERN.regex.lastIndex = 0;
            const matches = line.match(PHYSICAL_CSS_POSITION_PATTERN.regex);
            if (matches) {
                for (const match of matches) {
                    const violation: AuditViolation = {
                        category: "rtl-physical-style",
                        detail: `${PHYSICAL_CSS_POSITION_PATTERN.label}: "${match.trim()}"`,
                        file: normalizedPath,
                        line: lineNumber
                    };
                    if (!isAllowlisted(violation, line)) {
                        violations.push(violation);
                    }
                }
            }
        }

        // Scan manual review patterns
        if (
            normalizedPath.endsWith(".ts") ||
            normalizedPath.endsWith(".html") ||
            normalizedPath.endsWith(".scss") ||
            normalizedPath.endsWith(".css")
        ) {
            for (const pattern of MANUAL_REVIEW_PATTERNS) {
                if (
                    (pattern.label.includes("DOM scroll/offset") ||
                        pattern.label.includes("DOMRect") ||
                        pattern.label.includes("inline style.left/right")) &&
                    !normalizedPath.endsWith(".ts")
                ) {
                    continue;
                }
                pattern.regex.lastIndex = 0;
                const matches = line.match(pattern.regex);
                if (matches) {
                    for (const match of matches) {
                        const violation: AuditViolation = {
                            category: "rtl-manual-review",
                            detail: `${pattern.label}: "${match.trim()}"`,
                            file: normalizedPath,
                            line: lineNumber
                        };
                        if (!isAllowlisted(violation, line)) {
                            violations.push(violation);
                        }
                    }
                }
            }
        }

        // Scan TS host ARIA bindings regex
        if (normalizedPath.endsWith(".ts") && !isOfficialLocaleMessageCatalog(normalizedPath)) {
            for (const pattern of HARD_CODED_ARIA_PATTERNS) {
                pattern.regex.lastIndex = 0;
                let match: RegExpExecArray | null;
                while ((match = pattern.regex.exec(line)) !== null) {
                    const text = match[1]?.trim();
                    if (text && !text.startsWith("{{") && !text.startsWith("messages().")) {
                        const violation: AuditViolation = {
                            category: "i18n-aria",
                            detail: `${pattern.label}: "${text}"`,
                            file: normalizedPath,
                            line: lineNumber
                        };
                        if (!isAllowlisted(violation, line)) {
                            violations.push(violation);
                        }
                    }
                }
            }
        }
    }

    // 2. TypeScript AST scanning
    if (normalizedPath.endsWith(".ts")) {
        const tsViolations: AuditViolation[] = [];
        scanTypeScriptAst(normalizedPath, content, tsViolations);
        const isCatalog = isOfficialLocaleMessageCatalog(normalizedPath);
        for (const tv of tsViolations) {
            if (isCatalog && (tv.category === "i18n-text" || tv.category === "i18n-aria")) {
                continue;
            }
            const lineContent = lines[tv.line - 1] ?? "";
            if (!isAllowlisted(tv, lineContent)) {
                violations.push(tv);
            }
        }
    }

    // 3. Angular template AST scanning for HTML templates
    if (normalizedPath.endsWith(".html")) {
        let parsed;
        try {
            parsed = parseTemplate(content, normalizedPath, { preserveWhitespaces: false });
        } catch (err) {
            console.error(`AUDIT ERROR: Exception parsing template ${normalizedPath}:`, err);
            process.exit(1);
        }

        if (parsed.errors && parsed.errors.length > 0) {
            console.error(`AUDIT ERROR: Could not parse template ${normalizedPath}:`);
            for (const e of parsed.errors) {
                console.error(`  ${e.msg} at line ${e.span.start.line + 1}`);
            }
            process.exit(1);
        }

        if (parsed.nodes) {
            const templateViolations: AuditViolation[] = [];
            scanTemplateNodes(parsed.nodes, normalizedPath, templateViolations);
            for (const tv of templateViolations) {
                const lineContent = lines[tv.line - 1] ?? "";
                if (!isAllowlisted(tv, lineContent)) {
                    violations.push(tv);
                }
            }
        }
    }
}

const BASELINE_PATH = resolve("projects/mona-ui-tester/scripts/i18n-rtl-baseline.json");

interface BaselineViolation {
    category: string;
    detail: string;
    file: string;
    line: number;
}

function loadBaseline(): Set<string> {
    if (!existsSync(BASELINE_PATH)) {
        return new Set<string>();
    }
    try {
        const raw = readFileSync(BASELINE_PATH, "utf-8");
        const list = JSON.parse(raw) as BaselineViolation[];
        return new Set(list.map(v => `${v.category}|${v.file}|${v.line}`));
    } catch {
        return new Set<string>();
    }
}

function saveBaseline(violations: AuditViolation[]): void {
    const list: BaselineViolation[] = violations.map(v => ({
        category: v.category,
        detail: v.detail,
        file: v.file.replace(/.*projects\/mona-ui\//, "projects/mona-ui/"),
        line: v.line
    }));
    writeFileSync(BASELINE_PATH, JSON.stringify(list, null, 2), "utf-8");
    console.log(`Baseline updated with ${list.length} entries at ${BASELINE_PATH}`);
}

export function runAudit(): void {
    const isReportMode = process.argv.includes("--report");
    const isUpdateBaseline = process.argv.includes("--update-baseline");
    const isStrict = process.argv.includes("--strict");

    const files = globSync("projects/mona-ui/**/*.{ts,html,scss,css}");

    const violations: AuditViolation[] = [];
    for (const file of files) {
        scanFile(resolve(file), violations);
    }

    if (isUpdateBaseline) {
        saveBaseline(violations);
        process.exit(0);
    }

    const physicalViolations = violations.filter(v => v.category === "rtl-physical-style");
    const ariaViolations = violations.filter(v => v.category === "i18n-aria");
    const textViolations = violations.filter(v => v.category === "i18n-text");
    const manualReviewViolations = violations.filter(v => v.category === "rtl-manual-review");

    console.log("==================================================");
    console.log("  Mona UI i18n & RTL Readiness Audit Report");
    console.log("==================================================");
    console.log(`Total scanned files: ${files.length}`);
    console.log(`Hard-coded text violations (i18n-text): ${textViolations.length}`);
    console.log(`Hard-coded ARIA violations (i18n-aria): ${ariaViolations.length}`);
    console.log(`Physical style violations (rtl-physical): ${physicalViolations.length}`);
    console.log(`Manual review items (rtl-manual-review): ${manualReviewViolations.length}`);
    console.log("--------------------------------------------------");

    if (isReportMode) {
        if (textViolations.length > 0) {
            console.log("\n--- Hard-coded text violations ---");
            for (const v of textViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        if (ariaViolations.length > 0) {
            console.log("\n--- Hard-coded ARIA violations ---");
            for (const v of ariaViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        if (physicalViolations.length > 0) {
            console.log("\n--- Physical style violations ---");
            for (const v of physicalViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        if (manualReviewViolations.length > 0) {
            console.log("\n--- Manual review violations ---");
            for (const v of manualReviewViolations) {
                const relative = v.file.replace(/.*projects\/mona-ui\//, "");
                console.log(`  ${relative}:${v.line} -> ${v.detail}`);
            }
        }

        console.log("\nAudit report completed.");
        process.exit(0);
    }

    // Enforcement mode
    const baseline = isStrict ? new Set<string>() : loadBaseline();
    const newViolations = violations.filter(v => {
        const rel = v.file.replace(/.*projects\/mona-ui\//, "projects/mona-ui/");
        const key = `${v.category}|${rel}|${v.line}`;
        return !baseline.has(key);
    });

    if (newViolations.length > 0) {
        console.error(`\nFAILED: Found ${newViolations.length} unapproved i18n/RTL violation(s):`);
        for (const v of newViolations.slice(0, 30)) {
            const rel = v.file.replace(/.*projects\/mona-ui\//, "");
            console.error(`  [${v.category}] ${rel}:${v.line} - ${v.detail}`);
        }
        if (newViolations.length > 30) {
            console.error(`  ...and ${newViolations.length - 30} more violations`);
        }
        process.exit(1);
    }

    console.log("\nSUCCESS: All scanned files satisfy i18n & RTL rules (no unapproved violations).");
}

if (
    process.env["VITEST"] !== "true" &&
    process.argv[1] &&
    (process.argv[1].endsWith("audit-i18n-rtl.ts") || process.argv[1].endsWith("audit-i18n-rtl.js"))
) {
    runAudit();
}

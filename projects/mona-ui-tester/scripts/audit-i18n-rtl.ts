import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    type AST,
    BindingType,
    Interpolation,
    LiteralPrimitive,
    parseTemplate,
    RecursiveAstVisitor,
    TmplAstBoundAttribute,
    TmplAstBoundText,
    TmplAstDeferredBlock,
    TmplAstElement,
    TmplAstForLoopBlock,
    TmplAstIfBlock,
    type TmplAstNode,
    TmplAstSwitchBlock,
    TmplAstTemplate,
    TmplAstText,
    TmplAstTextAttribute
} from "@angular/compiler";
import { Node, Project, SyntaxKind } from "ts-morph";

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
        regex: /(?<![a-zA-Z0-9_-])(?:[a-z0-9-]+:)*-?(?:left|right)-(?=[0-9a-zA-Z_\[])[0-9a-z_[\].-]+/g,
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
        lineRange: [60, 190],
        reason: "Spinner radial keyframe dot positions in circular coordinate geometry"
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
        filePattern: "projects/mona-ui/slider/pipes/tick-style.pipe.ts",
        lineSnippet: "translateX(-50%)",
        reason: "Slider tick mark center alignment"
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
        lineSnippet: "-translate-x-full rtl:translate-x-full",
        reason: "Sidebar slide-in transform with explicit RTL counterpart"
    },
    {
        category: "rtl-manual-review",
        filePattern: "projects/mona-ui/sidebar/styles/sidebar.styles.ts",
        lineSnippet: "translate-x-full rtl:-translate-x-full",
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
        lineSnippet: 'message: "',
        reason: "Internal export rejection diagnostic error messages"
    },
    {
        category: "i18n-text",
        filePattern: "projects/mona-ui/notification/components/notification/notification.component.html",
        lineSnippet: "data().options.closeTitle || 'Close'",
        reason: "Notification close button fallback title when closeTitle option is not specified"
    },
    {
        category: "i18n-aria",
        filePattern: "projects/mona-ui/notification/components/notification/notification.component.html",
        lineSnippet: "data().options.closeTitle || 'Close'",
        reason: "Notification close button fallback aria-label when closeTitle option is not specified"
    }
];

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
        if (!normalizedFile.includes(normalizedPattern)) {
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
    if (/^[&;:,\-–—/\\|•*+×#%°<>=_~()\[\]{}!?@^$'"`]+$/.test(trimmed)) {
        return false;
    }
    // HTML entities
    if (/^&(?:times|nbsp|bull|hellip|#\d+);$/.test(trimmed)) {
        return false;
    }
    // Contains letters or marks across any script (Unicode-aware)
    return /[\p{L}\p{M}]/u.test(trimmed);
}

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
    "aria-label-end"
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

    try {
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
                                                let rawVal = init.getLiteralText().trim();
                                                const isBound = rawPropName.startsWith("[");
                                                let isStaticLiteral = false;
                                                if (isBound) {
                                                    if (
                                                        (rawVal.startsWith("'") && rawVal.endsWith("'")) ||
                                                        (rawVal.startsWith('"') && rawVal.endsWith('"'))
                                                    ) {
                                                        rawVal = rawVal.slice(1, -1).trim();
                                                        isStaticLiteral = true;
                                                    }
                                                } else {
                                                    isStaticLiteral = true;
                                                }
                                                if (
                                                    isStaticLiteral &&
                                                    isUserFacingText(rawVal) &&
                                                    !rawVal.startsWith("messages().") &&
                                                    !rawVal.startsWith("{{")
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
                                        try {
                                            const parsed = parseTemplate(templateText, filePath, {
                                                preserveWhitespaces: false
                                            });
                                            if (parsed.nodes) {
                                                const inlineViolations: AuditViolation[] = [];
                                                scanTemplateNodes(parsed.nodes, filePath, inlineViolations);
                                                const templateStartLine = templateInit.getStartLineNumber();
                                                for (const iv of inlineViolations) {
                                                    iv.line = templateStartLine + iv.line - 1;
                                                    violations.push(iv);
                                                }
                                            }
                                        } catch {
                                            // Ignore parsing errors for template expressions that cannot be parsed standalone
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
                        if (init && (Node.isStringLiteral(init) || Node.isNoSubstitutionTemplateLiteral(init))) {
                            const val = init.getLiteralText().trim();
                            if (isUserFacingText(val) && !TECHNICAL_SEMANTIC_STRINGS.has(val)) {
                                violations.push({
                                    category: "i18n-text",
                                    detail: `Hard-coded literal property "${propName}": "${val}"`,
                                    file: filePath,
                                    line: prop.getStartLineNumber()
                                });
                            }
                        }
                    }
                }
            }
        }

        // 3. Computed accessibility properties and string getters
        for (const prop of sf.getDescendantsOfKind(SyntaxKind.PropertyDeclaration)) {
            const propName = prop.getName();
            if (propName.toLowerCase().includes("arialabel") || propName.toLowerCase().includes("announcement")) {
                const init = prop.getInitializer();
                if (init && Node.isCallExpression(init)) {
                    const text = init.getText();
                    if (!text.includes("messages()") && !text.includes("this.#i18n") && !text.includes("this.i18n")) {
                        const stringLiterals = init.getDescendantsOfKind(SyntaxKind.StringLiteral);
                        for (const sl of stringLiterals) {
                            const val = sl.getLiteralText().trim();
                            if (isUserFacingText(val) && !TECHNICAL_SEMANTIC_STRINGS.has(val)) {
                                violations.push({
                                    category: "i18n-aria",
                                    detail: `Hard-coded text in accessibility property "${propName}": "${val}"`,
                                    file: filePath,
                                    line: sl.getStartLineNumber()
                                });
                            }
                        }
                    }
                }
            }
        }

        // 4. Indirect DOMRect access tracking
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
        if (normalizedPath.endsWith(".ts")) {
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
        for (const tv of tsViolations) {
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

# Mona UI i18n & RTL Migration Inventory (Baseline)

## 1. Overview

This document establishes the repository baseline for the Mona UI Internationalization (i18n), RTL Readiness, and Class Override hardening migration across `@nanahoshi/mona-ui`.

- **Date:** 2026-09-09
- **Framework:** Angular 22
- **Styling:** Tailwind CSS + class-variance-authority + tailwind-merge
- **Target Package:** `@nanahoshi/mona-ui`

---

## 2. Secondary Entry Points Inventory

The following 68 secondary entry points exist in `projects/mona-ui/`:

1. `auto-complete`
2. `avatar`
3. `breadcrumb`
4. `button`
5. `button-group`
6. `calendar`
7. `card`
8. `chart`
9. `check-box`
10. `chip`
11. `circular-progress-bar`
12. `collapsible`
13. `color-gradient`
14. `color-palette`
15. `color-picker`
16. `combo-box`
17. `common`
18. `contextmenu`
19. `date-input`
20. `date-picker`
21. `datetime-picker`
22. `dialog`
23. `dropdown-button`
24. `dropdown-list`
25. `dropdowns`
26. `editor`
27. `expansion-panel`
28. `fieldset`
29. `filter`
30. `grid`
31. `internal` (includes `internal/filter-input`, `internal/indicator-icon`, `internal/list`, `internal/tree`)
32. `label`
33. `list`
34. `list-box`
35. `list-view`
36. `menubar`
37. `multi-select`
38. `notification`
39. `numeric-text-box`
40. `otp-input`
41. `pager`
42. `placeholder`
43. `popover`
44. `popup`
45. `popup-menu`
46. `progress-bar`
47. `query`
48. `radio-button`
49. `rating`
50. `scroll-view`
51. `segmented`
52. `sheet`
53. `sidebar`
54. `skeleton`
55. `slider`
56. `spinner`
57. `split-button`
58. `splitter`
59. `stepper`
60. `switch`
61. `tabs`
62. `text-area`
63. `text-box`
64. `theme`
65. `time-picker`
66. `time-selector`
67. `tooltip`
68. `tree-view`
69. `window`

---

## 3. Migration Categories & Classification

### 3.1 Components with Built-in Visible Text
- `pager`: Page, of, X - Y of Z items, N / page
- `calendar`: Today, month/year navigation, weekday headers
- `editor`: Toolbar tooltips, table/link dialog strings
- `filter` / `query`: Filter operators (Contains, Starts with, Equal, etc.), logic operators (And, Or), Clear, Apply
- `grid`: Column menu (Sort Ascending, Sort Descending, Filter, Columns), No records available, Grouping drop-zone text
- `list` / `internal/list`: No data available
- `color-picker`: Cancel, Apply

### 3.2 Components with Built-in Accessibility Text (`aria-label`, `title`, `placeholder`)
- `pager`: First page, Previous page, Next page, Last page, Page {n}, Jump forward {n} pages, Jump back {n} pages
- `date-picker` / `time-picker` / `datetime-picker`: Toggle popup, Select date, Select time, Clear value
- `numeric-text-box`: Increment, Decrement
- `check-box` / `switch` / `radio-button`: State descriptors where no visible label is provided
- `slider`: Accessible value text
- `rating`: Rating value of {n} stars
- `dialog` / `window`: Close, Minimize, Maximize, Restore
- `stepper`: Step {n} of {total}, completed, current
- `tabs`: Previous tab, Next tab, Close tab
- `chip`: Remove chip

### 3.3 Locale-Sensitive Formatting
- Numbers: `numeric-text-box`, `pager`, `slider`, `rating`
- Dates and Times: `calendar`, `date-input`, `date-picker`, `time-picker`, `datetime-picker`
- Currency and Percentages: `numeric-text-box` formatting options
- Relative Time: Date/time utilities

### 3.4 Physical Styling Patterns to Convert
- Margins: `ml-*` -> `ms-*`, `mr-*` -> `me-*`
- Paddings: `pl-*` -> `ps-*`, `pr-*` -> `pe-*`
- Positions: `left-*` -> `start-*`, `right-*` -> `end-*`
- Borders: `border-l` -> `border-s`, `border-r` -> `border-e`
- Radii: `rounded-l-*` -> `rounded-s-*`, `rounded-r-*` -> `rounded-e-*`
- Text Alignments: `text-left` -> `text-start`, `text-right` -> `text-end`
- CSS Properties: `margin-left/right`, `padding-left/right`, `left/right`, `border-left/right` -> logical counterparts

### 3.5 Class Override Contracts
Components using `class` input with `userClasses` and `twMerge`:
- Enforce `twMerge(defaultClasses, userClasses)` (consumer classes last).
- Verify logical utility overrides succeed in `tailwind-merge`.

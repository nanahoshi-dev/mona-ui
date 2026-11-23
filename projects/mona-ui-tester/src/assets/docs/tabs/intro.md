# Tabs

**Selector:** `mona-tabs`, `mona-tab-strip`

`TabsComponent` renders a set of `mona-tab` panels and lets the consumer switch between them by clicking a tab or navigating with the keyboard. Tabs are the right choice when each option labels an associated content panel — for example `Account | Security | Notifications`.

The tab strip is line-based by default: a horizontal rule separates the tab list from the content below it, and the active tab is marked by a short indicator line. The strip can be placed on any edge via the `position` input. With `look="pill"`, the active tab is raised on a rounded background instead.

`TabStripComponent` renders only the tab list, for tabs whose panels are elsewhere on the page, such as browser-style tabs in a window's titlebar.

For compact value selection that does not switch content panels — for example `List | Grid` or `Day | Week | Month` — use `SegmentedComponent` instead.

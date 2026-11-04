# List Box

**Selector:** `mona-list-box`

`ListBoxComponent` renders a selectable list of items with an action toolbar for moving, clearing and removing items, and for transferring them to and from a second, connected list box.

Import it from `@nanahoshi/mona-ui/list-box` and name every list box with `aria-label`: the toolbar's name and the transfer buttons' labels are built from it. The list box emits what the user asked for; your handler updates the items.

# Drag and Drop

**Selectors:** `[monaDraggable]`, `[monaDropTarget]`, `ng-template[monaDragPreview]`

`DraggableDirective` and `DropTargetDirective` let users drag things onto places that take them, with the mouse or a pen, as files are dragged onto folders in a file explorer. A drop target says what a drop would do, moving, copying, linking or nothing, from what is dragged and the keys held; a preview follows the pointer and says it too, and Escape cancels. The drop target emits the drop, and your app applies it.

Grids and tile views take part without extra markup: [Grid rows](/components/grid-rows#dragging-rows-onto-folders) and [tiles](/components/tile-view#dragging-tiles) drag the selection, and their folders can be drop targets. Breadcrumb items take `monaDropTarget`, as the crumbs of a file explorer's address bar do. To let users reorder a list, use [Sortable](/components/sortable) instead.

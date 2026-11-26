## Overview

Put `monaDraggable` on what users drag, with the data it carries, and `monaDropTarget` on the places that take it, with what each stands for. While a drag is over a target, the target's `dropEffect` says what a drop would do: `"move"`, `"copy"`, `"link"`, or `"none"` to refuse it. The target is framed while a drop would do something, the pointer and the preview show the effect, and letting go there emits `dropTargetDrop`. Nothing moves until your app applies the drop.

**Use Drag and Drop when:**

- Users move or copy things onto places: files onto folders, cards onto lanes, people onto teams.
- What a drop does depends on the place and on the keys held, as in a file explorer.
- Files dragged from the desktop or another app should land on those places too: see [Drags from outside the page](#drags-from-outside-the-page).
- In a desktop app, what is dragged out of the window should land in other apps: see [Drags that leave the page](#drags-that-leave-the-page).

**Use something else when:**

- Users reorder a list, or move items between lists of the same kind. [Sortable](/components/sortable) does that, with the keyboard too.
- Columns of a board take cards, with limits. Use [Kanban](/components/kanban).
- Files from the desktop or another app are to be uploaded. [File Upload](/components/file-upload) takes them.

## Import & Quick Start

```typescript
import { DraggableDirective, DropTargetDirective, type DropTargetEvent } from "@nanahoshi/mona-ui/drag-drop";
```

```html
<ul aria-label="Files">
    @for (file of files(); track file.id) {
        <li [monaDraggable]="file">{{ file.name }}</li>
    }
</ul>
<div monaDropTarget="Archive" (dropTargetDrop)="onDrop($event)">Archive</div>
```

```typescript
protected onDrop(event: DropTargetEvent<string>): void {
    const file = event.drag.data as FileItem;
    this.files.update(files => files.map(other => (other === file ? { ...file, folder: event.target } : other)));
}
```

Without `dropEffect`, a target takes every drag as a move. The event's `target` is the target's value, here `"Archive"`, and `drag.data` is the draggable's.

## Anatomy

| Directive | Selector | Goes on |
| --- | --- | --- |
| `DraggableDirective` | `[monaDraggable]` | What users drag, given what it carries |
| `DropTargetDirective` | `[monaDropTarget]` | A place that takes drops, given what it stands for |
| `DragPreviewTemplateDirective` | `ng-template[monaDragPreview]` | A template that follows the pointer instead of the default preview |

The preview template's context is `DragPreviewContext`: `{ $implicit: data, data, effect, target }`. `data` is what is dragged, `effect` what a drop would do where the pointer is, and `target` the value of the target there, or `null`. Give it to a draggable through `dragPreview`, or place it inside `mona-grid` or `mona-tile-view` for their drags.

## Examples

### Keys choose the effect

```example
drag-drop/keys
```

`dropEffect` takes a function of the drag and the target's value, called as the drag comes over the target and again as keys are pressed. Here, Ctrl copies, and otherwise a file moves, except into the folder it's in, where the drop is refused. The preview says what the drop would do, and where. Type the function's parameters, as `DragInfo<FileItem>` here, and the events carry the same types.

### Files from the desktop

```example
drag-drop/external
```

The area listens to the browser's own drag events and passes them to `DragDropService`: `startExternal` when files come over it, `move` on each `dragover`, `drop` on `drop`, and `cancel` once the drag has left every element of it. The folders are ordinary `monaDropTarget`s, and setting `dropEffect` on the browser's `DataTransfer` from the drag's `effect` makes its pointer agree with them. The browser says what the files are only on the drop, so the drag carries how many there are.

### Rows, tiles and crumbs

Grid rows and tile view tiles drag the selection, and folders among them can be drop targets, as [Dragging rows onto folders](/components/grid-rows#dragging-rows-onto-folders) shows with a file list and the crumbs of its path. See also [Dragging tiles](/components/tile-view#dragging-tiles) and [Dropping on crumbs](/components/breadcrumb#dropping-on-crumbs).

## Appearance & Styling

A target with a drop that does something has the attribute `data-drop-target` and a 2px ring in the selection's border color, inside its edge; `active` on the directive, through `exportAs: "monaDropTarget"`, says the same. Style it further with Tailwind's `data-drop-target:` variant, such as `data-drop-target:bg-(--color-selected)`. In forced colors, the ring is a `Highlight` outline. A `mona-grid` or `mona-tile-view` that is a target draws its ring over its header, rows and tiles, which would hide a ring drawn under them.

The default preview is a small chip by the pointer: a plus for a copy, an arrow for a move, a link for a link and a crossed circle for none, and the count when an array of more than one item is dragged. The pointer shows the effect too, over every element: the copy, alias or no-drop cursor, and the arrow for a move. A `monaDragPreview` template replaces the chip; it sits 12 pixels right of the pointer and 16 below it, and never takes the pointer's events.

## Behavior

### Starting and ending

A drag starts once the pointer has moved 4 pixels either way with the main button held, as in Windows, so a click stays a click. It doesn't start from a text field, so text in one can still be selected. `dragStart` is emitted then, and calling `preventDefault()` on it drags nothing. While the drag lasts, nothing on the page is selected as text, and the browser's own drag of an image or a link doesn't start.

Letting go over a target whose effect isn't `"none"` drops there: the target emits `dropTargetDrop`, and the draggable `dragEnd` with that effect. Letting go anywhere else, pressing Escape, or the window losing focus ends the drag without a drop: the target under the pointer emits `dropTargetLeave`, and `dragEnd` has the effect `"none"`. The click that follows the release is swallowed, so ending a drag on a button doesn't press it, and on a grid row or a tile doesn't change the selection.

### Finding the target

The target is found by where the pointer is, so targets needn't know the draggables. A target inside another one comes first. A target that isn't one for the drag passes it on to the one around it: a `dropEffect` function, or a grid's `rowDropEffect`, that returns `null`, or `dropDisabled`. That's how a drag over a file in a file list reaches the folder around it. A target that returns `"none"` keeps the drag and refuses it.

### Keys

The keys held are part of the drag: `drag.altKey`, `ctrlKey`, `metaKey` and `shiftKey` follow them, and an effect function that reads them is called again when one changes. Keys go to the drag while it lasts and not to the page, so its shortcuts don't act on what is being dragged.

### Scrolling

Bringing the pointer within 32 pixels of the edge of an element that scrolls, such as a grid's or a tile view's, scrolls it, faster the nearer the edge: up to 16 pixels a frame. The target under the pointer changes with the content.

### Mouse and pen

Drags start from the main button of a mouse or a pen. Touch scrolls the page as usual, and starts no drag.

### Drags from outside the page

The page can't follow a drag that starts outside it, such as files dragged from another app, with the pointer. Your app follows it instead, from the browser's drag events or from the native app the page runs in, and passes it on: `DragDropService.startExternal(data, point)` starts it at a point with what it carries, and returns an `ExternalDrag`, whose `move(point)`, `drop(point)` and `cancel()` take it the rest of the way. A point is a `DragPoint`: `x` and `y` as a pointer event's `clientX` and `clientY` are, and the keys held there.

Targets take it as they take a `monaDraggable`'s drag: they are found by its point, framed, asked again as the keys change, and told as it enters, leaves and drops, and it scrolls what it comes near the edge of. The drag's `effect` and `target` signals say what a drop would do and where; hand them back to the browser or the other app, which draws the drag. `drop` returns what the drop did. No preview follows the drag and the cursor is left alone, since the app it comes from shows its own.

Starting one ends a drag in progress without a drop, and no drag starts with the pointer until it ends. Once it has ended, its `effect` is `"none"`, its `target` null, and its methods do nothing.

### Drags that leave the page

A drag follows the pointer past the edges of the page, where nothing of the page is, so letting go there drops nothing. `DragDropService.outsidePage` says while the pointer is out there. In a browser the drag goes on, and takes targets again when the pointer comes back.

A desktop app the page runs in, such as one built on WebView2 or Electron, can hand the drag to the system's own drag and drop there, so it drops in other apps. Watch `outsidePage`, read what is dragged from `drag()`, end the page's drag with `cancel()`, and start the system's drag with that, while the button is still held. `cancel()` drops nothing, the draggable's `dragEnd` has the effect `"none"`, and the click after it is the page's again. A drag from outside the page is never outside it.

## Accessibility

Dragging needs a pointer and a steady hand, so give every drop another way to do it: a Cut and Paste, a Move to command in a menu, or buttons. WCAG 2.5.7 asks for one that works with single clicks or the keyboard. The directives don't add it, since what a drop does is your app's.

The preview is hidden from screen readers, and the directives add no roles: draggables and targets keep the ones of their elements. Announce the result of a drop through a status message, as the examples do, when it isn't otherwise seen.

<!-- verification-checklist
- [x] Inputs, outputs and defaults checked against drag-drop/directives/draggable.directive.ts and drop-target.directive.ts
- [x] Threshold, fields, keys, Escape, blur, scrolling and touch checked against services/drag-drop.service.ts and the specs in tests/drag-drop.spec.ts
- [x] Drags from outside the page checked against DragDropService.startExternal, models/ExternalDrag.ts and models/DragPoint.ts, and the "from outside the page" specs
- [x] Drags that leave the page checked against DragDropService.outsidePage, cancel and hitTest, and the "leaving the page" specs
- [x] Preview context checked against models/DragPreviewContext.ts; DragPreviewTemplateDirective has a context guard
- [x] Styling checked against styles/drag-drop.styles.ts and components/drag-preview/drag-preview.component.ts
- [x] Exports checked against drag-drop/public-api.ts
-->

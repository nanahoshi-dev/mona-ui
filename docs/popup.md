# Mona UI Popups

`@nanahoshi/mona-ui/popup` is the overlay layer under every dropdown, menu, tooltip, popover, dialog, window and sheet in the library. It wraps the Angular CDK overlay and adds positioning presets, close handling, focus management, animations, and the `lang` and `dir` of the anchor. Use `PopupService` to open a popup from code, or `<mona-popup>` to attach one to an element in a template.

For what dialogs, windows and sheets add on top (the close contract, data, modality), see [Overlays](overlays.md); for menus, see [Menus](menus.md).

---

## 1. Opening a Popup from Code

```typescript
import { Component, ElementRef, inject, Injector, TemplateRef, viewChild } from '@angular/core';
import { PopupRef, PopupService } from '@nanahoshi/mona-ui/popup';

@Component({
    selector: 'app-account-menu',
    template: `
        <button #trigger type="button" aria-haspopup="dialog" (click)="open()">Account</button>
        <ng-template #content>
            <div class="p-4">Signed in as Ada</div>
        </ng-template>
    `
})
export class AccountMenuComponent {
    readonly #injector = inject(Injector);
    readonly #popupService = inject(PopupService);
    protected readonly content = viewChild.required<TemplateRef<unknown>>('content');
    protected readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
    #popupRef: PopupRef | null = null;

    protected open(): void {
        this.#popupRef = this.#popupService.create({
            anchor: this.trigger(),
            anchorConnectionPoint: 'bottomleft',
            content: this.content(),
            injector: this.#injector,
            offset: { vertical: 4 },
            popupConnectionPoint: 'topleft'
        });
        this.#popupRef.closed.subscribe(() => (this.#popupRef = null));
    }
}
```

- `anchor` is an element, an `ElementRef`, a point (`{ x, y }`), or a CSS selector (see section 7).
- `content` is a `TemplateRef` or a component class. A template resolves dependencies where it is declared. A component resolves them from `injector` (see section 6).
- `create()` returns a `PopupRef`. A content component can `inject(PopupRef)` to get the same reference, and `inject(PopupDataInjectionToken)` to get the `data` setting. A template reaches neither, because it resolves from where it is declared.

---

## 2. Position and Size

| Setting | Description | Default |
|---|---|---|
| `anchorConnectionPoint` | Point on the anchor the popup attaches to: `topleft`, `topcenter`, `topright`, `centerleft`, `center`, `centerright`, `bottomleft`, `bottomcenter`, `bottomright`. | `bottomleft` |
| `popupConnectionPoint` | Point on the popup that meets it. | `topleft` |
| `positions` | Your own CDK positions, tried in order. Replaces the two settings above. | — |
| `offset` | `{ horizontal, vertical }` in pixels. | `0, 0` |
| `positionStrategy` | `"connected"` follows the anchor; `"global"` positions against the viewport, as dialogs do. | `"connected"` |
| `withPush` | Pushes the popup back on screen when it would overflow. | `true` |
| `withScrollTracking` | Repositions the popup when the page or a container around the anchor scrolls. | `true` |
| `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Size of the overlay pane. | — |
| `popupClass`, `popupWrapperClass` | Classes for the overlay pane and for the element inside it. | — |

When the requested position doesn't fit, the popup tries the anchor's other edge, then the opposite side, then the mirrored position. A fallback never puts the popup over the anchor unless the requested position does.

The popup takes the nearest `lang` and `dir` above the anchor, and follows `dir` changes while it is open.

---

## 3. Closing

`popupRef.close(result?)` asks the popup to close. It returns `false` when the close was prevented or is already under way. The popup also closes on its own:

| Setting | Closes when | Default |
|---|---|---|
| `closeOnOutsideClick` | The user clicks outside the popup and its anchor. | `true` |
| `hasBackdrop` + `closeOnBackdropClick` | The user clicks the backdrop. Backdrop clicks are never counted as outside clicks. | `false`, `true` |
| `closeOnEscape` | The user presses Escape (see section 5). | `true` |
| `closeOnScroll` | The page, or a scrollable container around the anchor, scrolls. | `false` |
| `closeOnMouseLeave` | The pointer leaves the anchor. | `false` |

The `PopupRef` events, in order:

1. `beforeClose` emits a `PopupCloseEvent` for every close request. Call `event.preventDefault()` to keep the popup open. The `preventClose` setting does the same: return `true` from it to cancel.
2. `closeStart` emits when the close goes ahead and the leave animation starts.
3. `closed` emits once the animation has finished and the overlay is removed.

`event.via` (a `PopupCloseSource`) tells you why the popup closed: `outsideClick`, `backdropClick`, `escape`, `scroll`, `mouseLeave`, `programmatic`, or `closeButton` for dialogs and windows. Detaching or disposing `popupRef.overlayRef` directly also completes the close, with `via` set to `programmatic`.

```typescript
const popupRef = this.#popupService.create({
    anchor: this.trigger(),
    content: EditorComponent,
    preventClose: event => event.via === PopupCloseSource.OutsideClick && this.hasUnsavedChanges()
});
```

---

## 4. Focus

The popup doesn't move focus into itself; the content decides that. When it closes, it can return focus with `restoreFocus`:

- `"auto"` (the default): if the anchor, or an element inside it, had focus when the popup opened, focus returns to that element.
- `true`: focus returns to the anchor.
- `false`: focus is left alone. Use this for tooltips and for menus that manage focus themselves.

Focus is only returned while it is on the page itself, inside the popup or inside the anchor. If the user moved it elsewhere first, for example by clicking another field or pressing Tab, it stays there.

---

## 5. Escape and Nested Popups

Escape only reaches the topmost open popup. With a dropdown open inside a dialog, the first Escape closes the dropdown and the second closes the dialog. A popup that is already playing its leave animation no longer counts as the topmost one.

- If the topmost popup sets `closeOnEscape: false`, Escape closes nothing. A modal that can't be dismissed doesn't let it reach the popup underneath.
- A control inside a popup that handles Escape itself should call `event.stopPropagation()`. `preventDefault()` alone doesn't keep the popup open.
- An Escape that ends an IME composition is ignored.

---

## 6. Content Components and Injectors

A component passed as `content` is created with an injector made of:

1. the popup's own tokens: `PopupRef` and `PopupDataInjectionToken`;
2. the `providers` setting;
3. the `injector` setting, or the root injector when it isn't set.

Pass the opening component's `Injector` as `injector` when the content needs services provided by that component, its ancestors or a lazy-loaded route. Without it, those services aren't found.

---

## 7. One Popup for Many Elements

Pass a CSS selector as `anchor` to show a popup over whichever matching element the pointer is on, for example a hover card for every avatar in a list:

```typescript
const popupRef = this.#popupService.create({
    anchor: '.user-avatar',
    content: this.userCard(),
    restoreFocus: false
});
```

- One popup shows at a time. It closes when the pointer leaves its element.
- Elements added after `create()` match too.
- `popupRef.close()` stops the behavior and closes the popup that is showing.

---

## 8. Animations

`animation` takes `true` (the default scale animation), `false`, or `{ enter, leave }` with CSS classes. The entry point exports the presets `defaultPopupAnimation`, `dropdownPopupAnimation`, `fadePopupAnimation` and `slideFrom{Right,Left,Top,Bottom}PopupAnimation`. With `prefers-reduced-motion: reduce`, every preset finishes in 1 ms. `closed` waits for the leave animation.

---

## 9. `<mona-popup>`

```html
<button #trigger type="button" aria-haspopup="true">Options</button>
<mona-popup [anchor]="trigger" anchorConnectionPoint="bottomleft" popupConnectionPoint="topleft">
    <ng-template>
        <div class="p-3">Popup content</div>
    </ng-template>
</mona-popup>
```

- The popup opens on the `trigger` event of the anchor (`"click"` by default), and the same event closes it again.
- It takes the settings above as inputs, except that `anchorConnectionPoint` and `popupConnectionPoint` default to `bottomcenter` and `topcenter`. The boolean ones accept the bare attribute form: `<mona-popup [anchor]="trigger" hasBackdrop closeOnScroll>`.
- Without `width`, the popup is as wide as the anchor when it opens.
- `(open)` emits the `PopupRef`, and `(close)` emits once the popup has closed.

`<mona-popup>` doesn't set ARIA attributes on the anchor. Give the trigger `aria-haspopup`, and `aria-expanded` if the content is a menu or a listbox.

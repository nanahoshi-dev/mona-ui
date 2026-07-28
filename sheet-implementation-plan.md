# Mona UI — Sheet Component Implementation Plan

## Goal

Implement a new `Sheet` component for Mona UI, conceptually similar to the Shadcn/Base UI Sheet component:

* https://ui.shadcn.com/docs/components/base/sheet

A Sheet is a **modal panel attached to one edge of the viewport**. It should slide into view from one of four sides:

* `left`
* `right`
* `top`
* `bottom`

The component must integrate naturally with the existing Mona UI architecture.

A critical requirement is **first-class mobile support**. Sheet will later be used as the foundation for mobile-friendly versions of existing Mona UI components, so it must work well on narrow screens, touch devices, mobile browser dynamic viewports, devices with safe areas/notches, and pages containing scrollable content.

Do not over-engineer the implementation.

---

# 1. Architectural decision

Implement Sheet as a **small specialization of `PopupService`**.

The dependency chain should be:

```text
SheetComponent
    ↓
PopupService
    ↓
Angular CDK Overlay
```

Do **not** implement it as:

```text
SheetComponent
    ↓
DialogComponent / DialogService
    ↓
PopupService
```

and do not use `PopupComponent` as the direct foundation either.

## Why `PopupService` is the correct primitive

The current Mona architecture already has the necessary low-level functionality in `PopupService`:

* Angular CDK overlay creation
* global positioning
* backdrop support
* backdrop-click handling
* Escape handling
* preventable close events
* focus restoration
* projected `TemplateRef` content
* component content
* arbitrary providers/data
* enter animation lifecycle
* leave animation lifecycle
* delayed overlay disposal until the leave animation finishes

`DialogService` already demonstrates the intended architecture: it is essentially a modal specialization built on top of `PopupService`.

Sheet should follow the same principle.

However, Sheet does **not** need to reuse `DialogService` itself because Dialog has behavior specific to centered dialogs:

* centered window positioning
* dialog severity/type
* dialog actions
* dialog icons
* dialog-specific layout
* dialog sizing/positioning behavior

Trying to extend Dialog to support edge-mounted sheets would make Dialog unnecessarily generic.

## Why not `PopupComponent`

`PopupComponent` is primarily designed around an anchor and a trigger event.

A Sheet:

* is viewport-relative
* does not need an anchor for visual positioning
* is controlled by application state
* behaves like a modal surface

Therefore Sheet should use `PopupService` directly.

---

# 2. Keep the first implementation deliberately small

Do not create abstractions before they are actually necessary.

For the initial implementation, do **not** create:

* `SheetService`
* `SheetRef`
* `SheetReference`
* `SheetHeaderComponent`
* `SheetFooterComponent`
* `SheetTitleComponent`
* `SheetDescriptionComponent`
* `SheetTriggerDirective`
* `SheetCloseDirective`
* generic `ModalService`
* generic `ModalComponent`
* shared Dialog/Sheet base classes
* Drawer abstractions
* responsive breakpoint services
* swipe/gesture infrastructure

The first implementation should primarily consist of:

1. `SheetComponent`
2. `SheetSide`
3. Sheet styles
4. a very small Popup enhancement for background-scroll blocking
5. reusable directional Popup animations
6. tests
7. demo
8. documentation

If future components require imperative Sheet creation, a `SheetService` can be introduced later.

---

# 3. Public API

Create:

```ts
export type SheetSide = "top" | "right" | "bottom" | "left";
```

The default should be:

```ts
"right"
```

## Proposed `SheetComponent` API

### Inputs

Start with only the inputs required for normal Sheet use.

```ts
public readonly side = input<SheetSide>("right");

public readonly title = input<string>();
public readonly description = input<string>();

public readonly ariaLabel = input<string>();

public readonly closable = input(true);

public readonly closeOnEscape = input(true);
public readonly closeOnBackdropClick = input(true);

public readonly width = input<number | string>();
public readonly height = input<number | string>();
```

Do not introduce size variants such as:

```ts
"small" | "medium" | "large" | "full"
```

in the first implementation.

Explicit `width` / `height` already cover custom sizing without introducing another abstraction.

### Outputs

Expose:

```ts
public readonly close = output<PopupCloseEvent>();
public readonly closed = output<void>();
```

`close` must be preventable.

Example:

```ts
protected onSheetClose(event: PopupCloseEvent): void {
    if (this.hasUnsavedChanges()) {
        event.preventDefault();
    }
}
```

`closed` should only emit after the Sheet's leave animation has completed and the underlying popup has actually closed.

---

# 4. Declarative lifecycle

Follow the same general lifecycle model already used by `DialogComponent`.

Typical usage should be:

```html
<button monaButton (click)="sheetOpen.set(true)">
    Open sheet
</button>

@if (sheetOpen()) {
    <mona-sheet
        side="right"
        title="Edit profile"
        description="Update your profile information."
        (closed)="sheetOpen.set(false)">

        <form>
            ...
        </form>
    </mona-sheet>
}
```

When `SheetComponent` is created:

1. render its template
2. create the Popup
3. display the Sheet

When `SheetComponent` is destroyed:

1. close its Popup if still open
2. allow normal Popup cleanup

Do **not** add an `open` input/model in the first implementation.

Avoid this:

```html
<mona-sheet [(open)]="open">
```

The current component-presence model is simpler:

```html
@if (open()) {
    <mona-sheet />
}
```

This avoids maintaining two sources of truth:

```text
Angular component exists
+
open() true/false
+
PopupRef exists/doesn't exist
```

---

# 5. Entry point and file structure

Create a new Mona UI secondary entry point:

```text
projects/mona-ui/sheet/
├── components/
│   └── sheet/
│       ├── sheet.component.ts
│       ├── sheet.component.html
│       └── sheet.component.spec.ts
├── models/
│   └── SheetSide.ts
├── styles/
│   └── sheet.styles.ts
├── ng-package.json
└── public-api.ts
```

Follow the same structure and conventions used by newer Mona UI secondary entry points.

## `ng-package.json`

Use the standard Mona secondary-entry-point structure:

```json
{
    "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
    "lib": {
        "entryFile": "public-api.ts"
    }
}
```

## `public-api.ts`

Export only public Sheet APIs.

For example:

```ts
/*
 * Public API Surface of @nanahoshi/mona-ui/sheet
 */

export * from "./components/sheet/sheet.component";
export * from "./models/SheetSide";
```

Do not export internal helpers.

---

# 6. Sheet template strategy

Use the same general technique already used by `PopupComponent`: capture projected content through an `ng-template` and provide that `TemplateRef` to `PopupService`.

Conceptually:

```html
<ng-template>
    <section
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        [class]="baseClass()"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-describedby]="description() ? descriptionId : null"
        [attr.aria-label]="!title() ? ariaLabel() : null">

        ...
    </section>
</ng-template>
```

The projected application content should remain completely arbitrary:

```html
<div [class]="contentClass()">
    <ng-content></ng-content>
</div>
```

Do not introduce a separate `SheetContentComponent`.

---

# 7. Internal Sheet structure

The Sheet should have three conceptual regions:

```text
Sheet
├── optional header
│   ├── title
│   ├── description
│   └── close button
└── scrollable content
```

A reasonable template structure:

```html
<ng-template>
    <section
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        [class]="baseClass()"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-describedby]="description() ? descriptionId : null"
        [attr.aria-label]="!title() ? ariaLabel() : null">

        @if (title() || description() || closable()) {
            <header [class]="headerClass()">
                <div class="min-w-0 flex-1">
                    @if (title()) {
                        <h2 [id]="titleId" [class]="titleClass()">
                            {{ title() }}
                        </h2>
                    }

                    @if (description()) {
                        <p [id]="descriptionId" [class]="descriptionClass()">
                            {{ description() }}
                        </p>
                    }
                </div>

                @if (closable()) {
                    <button
                        monaButton
                        type="button"
                        look="ghost"
                        [iconOnly]="true"
                        aria-label="Close"
                        [class]="closeButtonClass()"
                        (click)="closeSheet()">
                        <svg lucideX></svg>
                    </button>
                }
            </header>
        }

        <div [class]="contentClass()">
            <ng-content></ng-content>
        </div>
    </section>
</ng-template>
```

The exact class composition should follow existing Mona conventions.

---

# 8. Accessibility

Sheet is a modal dialog from an accessibility perspective.

Use:

```html
role="dialog"
aria-modal="true"
```

Do not add Dialog's:

```text
alertdialog
```

semantics because Sheet has no warning/error/confirmation severity model.

## Accessible name

When `title` exists:

```html
aria-labelledby="<generated title ID>"
```

When `title` does not exist:

```html
aria-label="<ariaLabel input>"
```

Consumers should provide either:

```text
title
```

or:

```text
ariaLabel
```

Do not add runtime validation machinery for this in the first implementation.

Document the requirement.

## Description

Only set:

```html
aria-describedby
```

when `description` exists.

Generate IDs using Mona's existing:

```ts
createElementControlId()
```

utility.

## Focus trapping

Use Angular CDK:

```ts
CdkTrapFocus
```

The Sheet must trap keyboard focus while open.

The focus trap should auto-capture focus when the Sheet opens.

## Focus restoration

Do not implement custom focus-restoration code inside Sheet unless necessary.

Use the existing Popup focus restoration mechanism.

The element focused immediately before the Sheet opens should be used as the Popup anchor for focus-restoration purposes.

For example:

```ts
const activeElement = this.#document.activeElement;

const anchor =
    activeElement instanceof HTMLElement
        ? activeElement
        : this.#document.body;
```

Although the Sheet uses a global position strategy and is not visually anchored to this element, PopupService can still use the anchor to restore focus when the Sheet closes.

---

# 9. Mobile support — hard requirement

Mobile support is not optional or a later enhancement.

The initial Sheet implementation must satisfy the following requirements.

---

## 9.1 Dynamic mobile viewport units

Do not base full-height mobile Sheet sizing exclusively on:

```css
100vh
```

Mobile browser chrome can make `100vh` unsuitable.

Prefer dynamic viewport units:

```css
100dvh
100dvw
```

For example:

```text
left/right:
    max-width: 100dvw
    height: 100dvh

top/bottom:
    width: 100dvw
    max-height: 90dvh
```

Tailwind 4 dynamic viewport utilities may be used where appropriate, such as:

```text
h-dvh
max-h-dvh
w-dvw
max-w-dvw
```

or equivalent explicit CSS values.

The Sheet must never accidentally extend horizontally outside the mobile viewport.

---

# 9.2 Safe-area support

The Sheet must work correctly on devices with:

* display notches
* rounded display corners
* iPhone Dynamic Island areas
* bottom home indicators

Use the CSS environment variables:

```css
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

The simplest implementation is to apply safe-area padding to the Sheet surface itself.

Conceptually:

```css
padding-top: env(safe-area-inset-top);
padding-right: env(safe-area-inset-right);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
```

The regular Sheet header/content padding should then exist inside that safe-area boundary.

Do not modify the consuming application's viewport meta tag from the library.

---

# 9.3 Background page scrolling must be blocked

While a modal Sheet is open, the page underneath it must not continue scrolling.

This is particularly important on mobile.

The current Popup architecture should be extended minimally to support this generically.

Add an optional setting to `PopupSettings`:

```ts
blockScroll?: boolean;
```

Default:

```ts
false
```

Then when constructing the CDK `OverlayConfig`, use:

```ts
scrollStrategy: settings.blockScroll
    ? this.#overlay.scrollStrategies.block()
    : undefined
```

or the equivalent implementation appropriate for Angular CDK 22.

Sheet should always create its Popup with:

```ts
blockScroll: true
```

This is preferable to manually changing:

```ts
document.body.style.overflow
```

inside Sheet.

Do not implement independent body-scroll locking in Sheet.

CDK should own locking and cleanup.

Do not change Dialog behavior as part of this task unless a test demonstrates that sharing the new option requires a trivial compatibility fix.

---

# 9.4 Internal content must scroll independently

Large Sheet content must scroll **inside the Sheet**, not expand beyond the viewport.

The Sheet layout should therefore use:

```text
display: flex
flex-direction: column
min-height: 0
```

The header should remain outside the scrolling region.

The main content area should use approximately:

```text
flex: 1
min-height: 0
min-width: 0
overflow-y: auto
overscroll-behavior: contain
```

Equivalent Tailwind classes would be approximately:

```text
flex-1
min-h-0
min-w-0
overflow-y-auto
overscroll-contain
```

This matters for mobile components that may contain:

* long forms
* lists
* filters
* menus
* configuration panels
* navigation
* large component content

The content should not cause the body beneath the Sheet to scroll.

---

# 9.5 Touch-friendly close control

The close control must have an adequate touch target.

Do not render a tiny icon-only target that is only comfortable with a mouse.

Ensure an effective target of approximately:

```text
44 × 44 px
```

or larger.

This can be accomplished through Mona Button sizing/classes without visually making the X icon excessively large.

---

# 9.6 No hover-dependent functionality

All Sheet functionality must work without hover.

Do not make any important action discoverable only through:

```css
:hover
```

Hover styling is fine, but interaction must remain fully usable with:

* touch
* keyboard
* pointer

---

# 9.7 Mobile overscroll

The Sheet's internal scrolling area should use:

```css
overscroll-behavior: contain;
```

This reduces scroll chaining from the Sheet into the document behind it.

Background scrolling must still primarily be prevented through CDK's block scroll strategy.

---

# 9.8 Mobile keyboard/form compatibility

Sheet is expected to contain forms.

Therefore:

* content must remain scrollable
* controls near the bottom must remain reachable
* use dynamic viewport sizing
* do not use fixed pixel heights for the overall Sheet
* do not globally disable touch scrolling inside the Sheet
* do not add `touch-action: none` to the Sheet

Do not add custom virtual-keyboard JavaScript handling in this first implementation.

Avoid introducing `visualViewport` listeners unless a real defect demonstrates that they are required.

---

# 9.9 Orientation changes

Avoid JavaScript viewport-size calculations such as:

```ts
window.innerHeight
```

for primary Sheet sizing.

Use CSS dynamic viewport units instead.

This allows portrait/landscape changes to naturally update the Sheet dimensions without adding resize listeners.

---

# 9.10 Responsive placement belongs to the consumer

Do not create a Mona-specific Sheet breakpoint system.

For example, do not introduce:

```ts
mobileSide
desktopSide
breakpoint
responsiveSide
```

inputs.

Applications can already derive `side` using Angular state/media-query infrastructure if needed.

For example, a consumer may choose:

```text
desktop → right
mobile → bottom
```

The Sheet itself only needs to guarantee that **every side works correctly on mobile**.

Avoid building responsive policy into the primitive.

---

# 10. Default sizing

Use mobile-friendly defaults.

## Left / right

The default should provide enough space for real mobile UI.

Recommended:

```text
height: 100dvh
width: min(100dvw, 24rem)
max-width: 100dvw
```

The result is:

* narrow phones → effectively full-width
* larger screens → approximately `24rem`
* desktops → does not become excessively wide

This is preferable for Mona's planned use of Sheet as a mobile-component foundation.

Consumers can override width:

```html
<mona-sheet width="32rem">
```

or:

```html
<mona-sheet width="100dvw">
```

if necessary.

## Top / bottom

Default:

```text
width: 100dvw
height: auto
max-height: 90dvh
```

This allows bottom Sheets to size naturally to smaller content while preventing large content from exceeding the available mobile viewport.

When explicit `height` is provided, allow heights such as:

```html
<mona-sheet side="bottom" height="100dvh">
```

for full-screen mobile layouts.

Do not add predefined size variants yet.

---

# 11. Popup creation

Create the Sheet through `PopupService`.

Conceptually:

```ts
const popupRef = this.#popupService.create({
    anchor,

    content: this.contentTemplate(),

    positionStrategy: "global",

    hasBackdrop: true,

    backdropClass: [
        "fixed",
        "inset-0",
        "bg-background/50",
        "backdrop-blur-xs"
    ],

    closeOnBackdropClick: this.closeOnBackdropClick(),
    closeOnEscape: this.closeOnEscape(),

    closeOnOutsideClick: false,

    restoreFocus: true,

    blockScroll: true,

    width: this.resolveWidth(),
    height: this.resolveHeight(),
    maxWidth: "100dvw",
    maxHeight: this.resolveMaxHeight(),

    animation: this.resolveAnimation()
});
```

Adapt details to the actual existing Popup API rather than copying this literally if names differ.

### Why `closeOnOutsideClick: false`

A modal Sheet already has a backdrop.

Backdrop clicks should be the mechanism responsible for outside-click closing.

Do not run two competing outside-click mechanisms.

---

# 12. Positioning against viewport edges

Do not modify `setWindowStyles()` to support Sheet.

That utility is currently designed for centered/window-like positioning.

Keep Sheet edge positioning local.

Create a small private helper:

```ts
private positionOverlay(ref: PopupRef): void
```

Access:

```ts
ref.overlayRef.overlayElement
```

and apply the appropriate edge styles.

## Right

```css
top: 0;
right: 0;
bottom: 0;
left: auto;
```

## Left

```css
top: 0;
left: 0;
bottom: 0;
right: auto;
```

## Top

```css
top: 0;
left: 0;
right: 0;
bottom: auto;
```

## Bottom

```css
bottom: 0;
left: 0;
right: 0;
top: auto;
```

Clear properties from other sides before applying the new position.

For example:

```ts
Object.assign(element.style, {
    top: "",
    right: "",
    bottom: "",
    left: ""
});
```

then apply the selected side.

Do not introduce a generic `GlobalPositionSettings` abstraction into PopupService just for Sheet.

---

# 13. Styling

Create:

```text
styles/sheet.styles.ts
```

Use CVA and Mona's existing theme tokens.

The Sheet should use existing semantic surface colors instead of introducing new Sheet-specific color variables.

Reuse:

```ts
themeOverlaySurfaceClasses
```

where appropriate.

The base styling should conceptually be:

```ts
export const sheetBaseVariants = cva(
    `
        relative
        flex w-full min-h-0 min-w-0 flex-col
        overflow-hidden
        ${themeOverlaySurfaceClasses}
        text-foreground
        shadow-(--shadow-overlay)
        outline-none
    `,
    {
        variants: {
            side: {
                top: "border-b border-border",
                right: "border-l border-border",
                bottom: "border-t border-border",
                left: "border-r border-border"
            }
        },
        defaultVariants: {
            side: "right"
        }
    }
);
```

Adjust classes to Mona conventions.

## Additional style functions

Create only the functions that provide actual value:

```text
sheetBaseVariants
sheetHeaderVariants
sheetTitleVariants
sheetDescriptionVariants
sheetContentVariants
sheetCloseButtonVariants
```

Avoid creating variants for elements that only have a single trivial class unless doing so matches the surrounding Mona code conventions.

---

# 14. Safe-area styling

Apply safe-area protection at the outer Sheet level.

For example, equivalent styles to:

```css
padding-top: env(safe-area-inset-top);
padding-right: env(safe-area-inset-right);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
```

The header/content then apply normal Mona spacing inside this area.

This avoids:

* close buttons underneath display cutouts
* content underneath the home indicator
* text touching rounded display edges

Do not duplicate safe-area values across every child element.

---

# 15. Header styling

The header should:

* be non-scrolling
* shrink only as necessary
* contain title/description and close button
* keep close button accessible on narrow screens
* allow long titles to wrap
* avoid horizontal overflow

Conceptually:

```text
flex
shrink-0
items-start
gap-3
p-4
```

The text container should include:

```text
min-w-0
flex-1
```

The close button should use:

```text
shrink-0
```

---

# 16. Content styling

The content area is especially important for mobile.

Use approximately:

```text
flex-1
min-h-0
min-w-0
overflow-y-auto
overscroll-contain
px-4
pb-4
```

Do not apply:

```text
overflow: hidden
```

to the main content region.

Do not force projected content to a particular display type.

---

# 17. Directional animations

Reuse the existing Popup animation lifecycle.

Do not implement Sheet-specific animation timers.

`PopupWrapperComponent` already:

* applies enter animation classes
* applies leave animation classes
* waits for CSS animation/transition completion
* has a fallback timer
* only disposes the Popup after the leave animation finishes
* handles reduced motion

Extend the Popup animation infrastructure with four reusable directional animations.

For example:

```ts
export const slideFromRightPopupAnimation: Required<PopupAnimationSettings> = {
    enter: "mona-popup-slide-from-right-enter",
    leave: "mona-popup-slide-to-right-leave"
};

export const slideFromLeftPopupAnimation: Required<PopupAnimationSettings> = {
    enter: "mona-popup-slide-from-left-enter",
    leave: "mona-popup-slide-to-left-leave"
};

export const slideFromTopPopupAnimation: Required<PopupAnimationSettings> = {
    enter: "mona-popup-slide-from-top-enter",
    leave: "mona-popup-slide-to-top-leave"
};

export const slideFromBottomPopupAnimation: Required<PopupAnimationSettings> = {
    enter: "mona-popup-slide-from-bottom-enter",
    leave: "mona-popup-slide-to-bottom-leave"
};
```

Names may be adjusted to match existing naming conventions.

## Animation behavior

Right:

```text
enter: translateX(100%) → translateX(0)
leave: translateX(0) → translateX(100%)
```

Left:

```text
enter: translateX(-100%) → translateX(0)
leave: translateX(0) → translateX(-100%)
```

Top:

```text
enter: translateY(-100%) → translateY(0)
leave: translateY(0) → translateY(-100%)
```

Bottom:

```text
enter: translateY(100%) → translateY(0)
leave: translateY(0) → translateY(100%)
```

Use transform-based animation.

Do not animate:

* width
* height
* top
* left

because transform animation is significantly more appropriate for mobile rendering.

A duration around the existing Mona overlay animation range is sufficient.

Do not attempt complex spring physics.

---

# 18. Reduced-motion support

Extend PopupWrapper's existing:

```css
@media (prefers-reduced-motion: reduce)
```

handling to include the new slide animation classes.

The Sheet must still open/close correctly when animations effectively have near-zero duration.

Do not implement separate reduced-motion logic inside Sheet.

---

# 19. Close behavior

Closing should support the following sources:

* close button
* Escape
* backdrop click
* programmatic close
* component destruction

For the close button, create a `PopupCloseEvent` using the existing source:

```ts
PopupCloseSource.CloseButton
```

Do not invent a Sheet-specific close-source enum.

---

# 20. Preventable closing

Subscribe to:

```ts
popupRef.beforeClose
```

and emit the same event through:

```ts
this.close.emit(event)
```

Consumers must be able to call:

```ts
event.preventDefault()
```

during the `close` output and keep the Sheet open.

Do not create a duplicate Sheet close-event class.

Use the existing `PopupCloseEvent`.

---

# 21. Closed lifecycle

Subscribe once to:

```ts
popupRef.closed
```

After that event:

```ts
this.closed.emit();
```

`closed` must represent actual completion.

Do not emit `closed` when:

* a close was requested
* an animation started
* a preventable close was cancelled

Only emit it after Popup has completed its close lifecycle.

---

# 22. Component destruction

Register cleanup through `DestroyRef`.

When `SheetComponent` is destroyed:

```ts
this.#popupRef?.close();
```

Do not manually remove CDK overlay DOM nodes.

PopupService/PopupRef must remain responsible for overlay disposal.

---

# 23. Theme integration

Do not introduce Sheet-specific theme colors.

Use existing semantic variables such as:

```text
--color-background
--color-surface
--color-surface-raised
--color-foreground
--color-muted-foreground
--color-border
--shadow-overlay
```

or the existing semantic utility classes wrapping them.

Sheet should automatically work with:

* Mona
* Luna
* Aurora
* third-party/custom themes

without adding new color contracts.

If a theme does not need a unique semantic role for Sheet, do not create one.

---

# 24. Do not copy Shadcn's React component anatomy

Shadcn exposes concepts such as:

```text
Sheet
SheetTrigger
SheetContent
SheetHeader
SheetTitle
SheetDescription
SheetFooter
SheetClose
```

Do not reproduce these one-for-one simply because Shadcn does.

Mona is an Angular component library with an existing architecture.

The initial Mona API should instead be simple:

```html
<mona-sheet
    title="Settings"
    description="Configure this component.">

    <app-settings-form />

</mona-sheet>
```

For fully custom content:

```html
<mona-sheet
    [closable]="false"
    ariaLabel="Navigation">

    <app-mobile-navigation />

</mona-sheet>
```

If real-world usage later demonstrates a need for title/footer template directives, they can be added then.

---

# 25. Do not create a Sheet service yet

Do not implement:

```ts
sheetService.open(...)
```

in this task.

The declarative API is sufficient for the initial use cases.

A future service can be added without breaking the component architecture because both would ultimately use `PopupService`.

Do not build an unused service preemptively.

---

# 26. Tests

Add comprehensive behavior-focused tests.

Do not retest every internal behavior of `PopupService`.

Test Sheet's contract and its integration with Popup.

## 26.1 Rendering

Verify:

* projected content renders
* title renders
* description renders
* close button renders by default
* no unnecessary header is rendered when title/description are missing and `closable=false`

---

## 26.2 Default configuration

Verify:

```text
side = right
closable = true
closeOnEscape = true
closeOnBackdropClick = true
```

---

## 26.3 Side positioning

Test all four sides.

### Right

Verify overlay is attached to:

```text
top
right
bottom
```

and not `left`.

### Left

Verify:

```text
top
left
bottom
```

### Top

Verify:

```text
top
left
right
```

### Bottom

Verify:

```text
bottom
left
right
```

---

# 26.4 Sizing

Verify default left/right sizing is mobile-safe:

```text
max-width <= 100dvw
height = 100dvh
```

Verify top/bottom:

```text
width = 100dvw
max-height <= mobile viewport
```

Verify explicit:

```text
width
height
```

inputs override defaults appropriately.

Do not attempt pixel-layout testing in JSDOM where browser layout is not reliable.

Test the values/classes/settings that drive the behavior instead.

---

# 26.5 Backdrop

Verify:

* backdrop exists
* backdrop click closes by default
* `[closeOnBackdropClick]="false"` prevents backdrop close

---

# 26.6 Escape

Verify:

* Escape closes by default
* `[closeOnEscape]="false"` prevents Escape closing

---

# 26.7 Close button

Verify:

* rendered by default
* hidden when `closable=false`
* clicking it requests close
* close source is `PopupCloseSource.CloseButton`

---

# 26.8 Preventable close

Verify:

```ts
sheet.close.subscribe(event => event.preventDefault());
```

prevents:

* close button close
* backdrop close
* Escape close

where applicable.

Ensure the Sheet remains mounted.

---

# 26.9 Closed output

Verify:

* `closed` emits after actual Popup close
* `closed` does not emit when closing is prevented

---

# 26.10 Accessibility

Verify:

```text
role="dialog"
aria-modal="true"
```

Verify title wiring:

```text
aria-labelledby → generated title ID
```

Verify description wiring:

```text
aria-describedby → generated description ID
```

Verify:

```text
aria-describedby
```

is absent when no description exists.

Verify `ariaLabel` is applied when title is absent.

---

# 26.11 Focus

Verify:

* focus is moved into the Sheet
* Tab cannot escape the Sheet
* focus returns to the previously focused trigger when Sheet closes

Follow existing Dialog/Popup testing patterns where available.

---

# 26.12 Background scrolling

Verify Sheet requests:

```ts
blockScroll: true
```

from PopupService.

Where practical, test that CDK's block scroll strategy is used.

Do not create brittle tests relying on browser scrollbar geometry in JSDOM.

---

# 26.13 Lifecycle cleanup

Verify:

* destroying Sheet closes its Popup
* overlay is eventually disposed
* no dangling subscriptions remain

---

# 27. Mobile validation

In addition to unit tests, manually validate the tester application using browser device emulation.

Do **not** add an E2E framework solely for this task.

At minimum test:

```text
320 × 568
375 × 667
390 × 844
430 × 932
844 × 390 landscape
```

Also verify a normal desktop size such as:

```text
1440 × 900
```

## Mobile acceptance checks

For every side, verify:

* Sheet remains entirely inside viewport
* no unexpected horizontal scrollbar
* backdrop covers the viewport
* page underneath cannot scroll
* Sheet content can scroll
* close button is easy to tap
* close button is not underneath a notch/safe area
* bottom content is not underneath the home-indicator safe area
* long content remains usable
* form controls remain reachable
* orientation changes do not leave stale pixel dimensions
* animation remains smooth
* reduced-motion mode works

Specifically test a Sheet containing:

```text
a long form with enough controls to exceed viewport height
```

because this approximates the future mobile-component use case.

---

# 28. Tester/demo implementation

Create:

```text
projects/mona-ui-tester/src/app/demo/components/sheet-demo/
```

Follow the current demo infrastructure.

The primary interactive demo should allow changing:

```text
side
closable
closeOnEscape
closeOnBackdropClick
width
height
```

Do not make the demo unnecessarily complex.

---

# 29. Demo scenarios

In addition to the configurable demo, ensure the documentation demonstrates the most useful scenarios.

## Default right Sheet

```html
<mona-sheet
    title="Edit profile"
    description="Make changes to your profile.">

    ...
</mona-sheet>
```

## Bottom mobile Sheet

Demonstrate a realistic mobile action/filter panel:

```html
<mona-sheet
    side="bottom"
    title="Filters"
    description="Narrow the displayed results.">

    ...
</mona-sheet>
```

## Long scrollable content

Include enough content to demonstrate that:

* Sheet stays within the viewport
* header stays available
* content scrolls independently

This scenario is particularly important.

## Custom mobile content

Show that arbitrary components can be projected:

```html
<mona-sheet
    side="right"
    ariaLabel="Navigation"
    [closable]="false">

    <app-mobile-navigation />

</mona-sheet>
```

---

# 30. Documentation

Follow Mona's newer Markdown documentation structure.

Create approximately:

```text
projects/mona-ui-tester/src/app/docs/components/sheet-doc/

projects/mona-ui-tester/src/assets/docs/sheet/
├── intro.md
└── api.md
```

Add the corresponding documentation route.

## Intro documentation

Explain:

* what Sheet is
* that it is modal
* supported sides
* default side
* declarative lifecycle
* mobile suitability
* arbitrary projected content

## API documentation

Document:

```text
side
title
description
ariaLabel
closable
closeOnEscape
closeOnBackdropClick
width
height

close
closed
```

Clearly document:

> Sheet content should have either a `title` or an `ariaLabel` so that the modal has an accessible name.

Also document:

> Sheet automatically blocks scrolling of the page behind it while open.

---

# 31. Minimal Popup changes

Popup changes must remain small and reusable.

Only make changes required by Sheet that logically belong to Popup.

## Required Popup change 1: scroll blocking

Add:

```ts
blockScroll?: boolean;
```

to `PopupSettings`.

Use CDK:

```ts
this.#overlay.scrollStrategies.block()
```

when enabled.

Default remains disabled so existing Popup behavior does not change.

---

# 32. Required Popup change 2: directional animations

Add reusable directional animation definitions to the existing Popup animation infrastructure.

For example:

```text
slideFromRightPopupAnimation
slideFromLeftPopupAnimation
slideFromTopPopupAnimation
slideFromBottomPopupAnimation
```

Add their CSS animation classes/keyframes to the existing Popup wrapper animation styles.

Extend the existing reduced-motion selector to include them.

Do not create a separate animation framework for Sheet.

---

# 33. Avoid unrelated Popup refactoring

While modifying PopupService:

Do not:

* rewrite Popup positioning
* rewrite Popup event delegation
* rewrite Popup lifecycle
* redesign `PopupSettings`
* change existing default animations
* change existing backdrop behavior
* change existing focus-restoration behavior
* alter unrelated Popup consumers

The goal is to add only the small capabilities Sheet requires.

---

# 34. Explicit non-goals

The following are intentionally outside the first implementation.

Do not implement:

* swipe-to-close
* drag gestures
* swipe velocity calculations
* snap points
* drawer mechanics
* pull handles
* resizable Sheet
* nested Sheet management
* Sheet stacking manager
* responsive breakpoint configuration
* automatic `bottom` side on mobile
* `mobileSide`
* `desktopSide`
* non-modal Sheet mode
* Sheet-specific theme colors
* custom body-scroll lock
* `SheetService`
* `SheetRef`
* `SheetReference`
* `SheetTriggerDirective`
* `SheetCloseDirective`
* separate Sheet header/footer/title/description components
* generic Dialog/Sheet modal base classes
* large Dialog refactoring
* gesture libraries
* custom `window.visualViewport` logic
* new E2E framework

Mobile-friendly does **not** mean the first Sheet needs native drawer gestures.

For this stage, mobile support means:

* correct mobile sizing
* dynamic viewport handling
* safe areas
* scroll containment
* background scroll blocking
* touch-friendly controls
* accessible modal behavior
* responsive layout
* smooth transform animations

Gestures can be considered separately if future use cases actually require them.

---

# 35. Suggested implementation sequence

Implement in this order.

## Phase 1 — Entry point

1. Create `projects/mona-ui/sheet`.
2. Add `ng-package.json`.
3. Add `public-api.ts`.
4. Add `SheetSide`.

Confirm the library recognizes the secondary entry point.

---

## Phase 2 — Popup mobile prerequisite

5. Add `blockScroll?: boolean` to `PopupSettings`.
6. Integrate it with CDK `OverlayConfig`.
7. Add focused unit tests for the new Popup setting.
8. Confirm no existing Popup behavior changes.

---

## Phase 3 — Sheet foundation

9. Create `SheetComponent`.
10. Capture projected content with an `ng-template`.
11. Create a global Popup through `PopupService`.
12. Add backdrop.
13. Enable `blockScroll`.
14. Close Popup when the component is destroyed.

Confirm a basic right-side Sheet can open and close.

---

## Phase 4 — Edge positioning and sizing

15. Implement `SheetSide`.
16. Implement the four edge-positioning cases.
17. Implement mobile-safe default sizing.
18. Use `dvh` / `dvw`.
19. Implement `width` / `height` overrides.
20. Ensure maximum dimensions never exceed mobile viewport.

Confirm all four sides work before continuing.

---

## Phase 5 — Sheet content UI

21. Add title.
22. Add description.
23. Add close button.
24. Add scrollable content region.
25. Add safe-area padding.
26. Add touch-friendly close-button sizing.

---

## Phase 6 — Accessibility

27. Add `role="dialog"`.
28. Add `aria-modal`.
29. Add generated title/description IDs.
30. Add `aria-labelledby`.
31. Add conditional `aria-describedby`.
32. Add `ariaLabel` fallback.
33. Add `CdkTrapFocus`.
34. Verify focus restoration through Popup.

---

## Phase 7 — Close lifecycle

35. Add `close` output.
36. Forward `PopupCloseEvent`.
37. Verify `preventDefault()`.
38. Add `closed`.
39. Forward close sources correctly.

---

## Phase 8 — Animations

40. Add generic directional Popup animations.
41. Map each Sheet side to its correct animation.
42. Extend reduced-motion support.
43. Confirm Popup waits for leave animation before disposal.

---

## Phase 9 — Unit tests

44. Add Sheet component tests.
45. Test all sides.
46. Test sizing.
47. Test projected content.
48. Test backdrop.
49. Test Escape.
50. Test close button.
51. Test preventable closing.
52. Test accessibility.
53. Test focus behavior.
54. Test lifecycle cleanup.
55. Test block-scroll integration.

---

## Phase 10 — Demo and documentation

56. Add Sheet demo.
57. Add realistic mobile bottom-sheet example.
58. Add long scrollable-content example.
59. Add Sheet documentation.
60. Add documentation route.

---

## Phase 11 — Validation

61. Run formatting/linting applicable to the repository.
62. Run Mona UI tests.
63. Build the Mona UI library.
64. Build the tester application.
65. Test Sheet through browser mobile emulation.
66. Verify all four sides in portrait.
67. Verify at least one side in landscape.
68. Verify long form content.
69. Verify background page does not scroll.
70. Verify safe-area handling.
71. Verify reduced-motion behavior.

Fix only issues related to this implementation.

Do not perform unrelated cleanup.

---

# 36. Expected final architecture

The resulting architecture should remain approximately:

```text
Application state
      │
      │ @if (sheetOpen())
      ▼
┌────────────────────────────┐
│       SheetComponent       │
│                            │
│  side                      │
│  title / description       │
│  close button              │
│  projected content         │
│  accessibility             │
│  mobile-safe layout        │
└─────────────┬──────────────┘
              │
              │ TemplateRef
              ▼
┌────────────────────────────┐
│        PopupService        │
│                            │
│  Angular CDK Overlay       │
│  backdrop                  │
│  Escape                    │
│  preventable close         │
│  focus restoration         │
│  background scroll lock    │
│  animation lifecycle       │
└────────────────────────────┘
```

The Sheet should remain a thin component.

PopupService remains the reusable overlay primitive.

Dialog remains unchanged conceptually.

---

# 37. Definition of done

The task is complete when all of the following are true:

* `@nanahoshi/mona-ui/sheet` exists and builds.
* `<mona-sheet>` works declaratively.
* Sheet supports `top`, `right`, `bottom`, and `left`.
* `right` is the default.
* Sheet uses `PopupService`.
* Sheet does not depend on `DialogService`.
* Sheet does not duplicate CDK overlay management.
* Sheet is modal.
* Backdrop is present.
* Escape closes by default.
* Backdrop click closes by default.
* Close requests are preventable through `PopupCloseEvent`.
* Focus is trapped inside the Sheet.
* Focus is restored after closing.
* Background document scrolling is blocked.
* Large Sheet content scrolls internally.
* Sheet uses mobile-safe dynamic viewport sizing.
* Sheet respects safe areas.
* Close button has a touch-friendly target.
* Sheet does not require hover.
* All four sides animate correctly.
* Animations respect reduced-motion preferences.
* No Sheet-specific theme color contract is introduced.
* Arbitrary Angular content can be projected into the Sheet.
* Unit tests pass.
* Library production build passes.
* Tester build passes.
* Mobile browser-emulation validation passes.
* No unrelated architectural refactor was introduced.

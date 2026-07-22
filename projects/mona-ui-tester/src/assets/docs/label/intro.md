# Label

**Selectors:** `mona-label`, `label[monaLabel]`

`LabelComponent` and `LabelDirective` provide styled, accessible labels for individual form controls. Both reproduce the native `<label>` element's two built-in association mechanisms — explicit `for`/`id` and implicit wrapping — and add an opt-in convenience for delegating focus to Angular component references.

## `LabelComponent` vs `LabelDirective`

Use `LabelComponent` (`mona-label`) when you want Mona UI's standard label layout, a caption placed above a projected control, and optional-field text:

```html
<mona-label text="Email address">
    <mona-text-box [(value)]="email"></mona-text-box>
</mona-label>
```

Use `LabelDirective` (`label[monaLabel]`) when you want a plain native `<label>` element with full control over its markup, styled with Mona UI typography and colors:

```html
<label monaLabel [for]="textBox">Email address</label>
<mona-text-box #textBox></mona-text-box>
```

The directive is opt-in — it only activates on a `<label>` that carries the `monaLabel` attribute, so importing it never changes the behavior of ordinary native labels elsewhere in your app.

## Optional fields

Both APIs can indicate that a field is optional. `LabelComponent` renders this text automatically:

```html
<mona-label text="Company" optional>
    <mona-text-box></mona-text-box>
</mona-label>
```

`LabelDirective` does not manage caption content, so write the optional text directly:

```html
<label monaLabel for="company">
    Company
    <span class="text-muted-foreground">(Optional)</span>
</label>
```

## Not included

Floating labels are explicitly out of scope for this component. If you need a label that animates into a placeholder position, that is a separate, not-yet-implemented feature — `LabelComponent` and `LabelDirective` only render static, always-visible captions.

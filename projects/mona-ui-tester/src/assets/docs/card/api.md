## Import & Basic Usage

```typescript
import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CardActionDirective,
    CardComponent,
    CardContentDirective,
    CardDescriptionDirective,
    CardFooterComponent,
    CardHeaderComponent,
    CardTitleDirective
} from "@nanahoshi/mona-ui/card";

@Component({
    selector: "app-account-card",
    imports: [
        ButtonDirective,
        CardActionDirective,
        CardComponent,
        CardContentDirective,
        CardDescriptionDirective,
        CardFooterComponent,
        CardHeaderComponent,
        CardTitleDirective
    ],
    templateUrl: "./account-card.component.html"
})
export class AccountCardComponent {}
```

```html
<mona-card role="region">
    <mona-card-header>
        <h3 *monaCardTitle>Your account</h3>
        <p *monaCardDescription>Signed in on two devices.</p>
        <button monaButton look="link" size="small" *monaCardAction>Manage</button>
    </mona-card-header>

    <div *monaCardContent>The card's content.</div>

    <mona-card-footer>
        <button monaButton>Sign out</button>
    </mona-card-footer>
</mona-card>
```

Everything is optional except the content, which only shows if it's on `monaCardContent`. Text placed directly in `<mona-card>` isn't rendered.

The header and footer can be written in any order, because the card always renders header, content, then footer.

## Accessibility Notes

- **Name:** a card with a title takes `role` (`group` by default) and is named by the title, with the description as its `aria-describedby`. Use `article` for self-contained content, or `region` for a landmark.
- **No title, no role:** a name only counts on an element with a role, so a card without a title has none. If it needs a name, give it a title.
- **`let id`:** the title and description templates receive an id, as in `*monaCardTitle="let id"`. The card doesn't need it for its name, so use it only if something else has to refer to that element.
- **Headings:** `monaCardTitle` doesn't make a heading for you. Use the level that fits the page, as the `h3` above does.
- **Actions:** the actions are in a group named by the `card.actionsLabel` message, "Card actions" in English. Each action still needs its own name.
- **Keyboard:** a card isn't interactive and takes no focus. Only what you put in it does.

## Appearance & Styling

`rounded` sets the corners of the card and of its header and footer. `class` on `<mona-card>`, `<mona-card-header>` and `<mona-card-footer>` is merged through `tailwind-merge`.

A card's colors come from `--color-card` and `--color-card-foreground`, and its shadow from `--shadow-raised`, so a theme can change all three.

## API

### `CardComponent`

**Selector:** `mona-card`

#### Inputs

| Name      | Type                                                                | Default    | Description                                                       |
| --------- | ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| `class`   | `string`                                                            | `""`       | Additional CSS classes merged onto the host element.              |
| `role`    | `"article" \| "group" \| "region"`                                  | `"group"`  | The role the card takes when it has a title, which then names it. |
| `rounded` | `"none" \| "small" \| "medium" \| "large" \| "xlarge" \| "xxlarge"` | `"medium"` | Border radius of the card and of its header and footer.           |

### `CardHeaderComponent`

**Selector:** `mona-card-header`

Holds the title, description and actions, which go on the templates below.

#### Inputs

| Name    | Type             | Default | Description                                             |
| ------- | ---------------- | ------- | ------------------------------------------------------- |
| `class` | `ClassInputType` | `""`    | Additional CSS classes merged onto the rendered header. |

### `CardFooterComponent`

**Selector:** `mona-card-footer`

Its content is projected.

#### Inputs

| Name    | Type             | Default | Description                                             |
| ------- | ---------------- | ------- | ------------------------------------------------------- |
| `class` | `ClassInputType` | `""`    | Additional CSS classes merged onto the rendered footer. |

### Template Directives

| Directive                  | Selector                           | Goes in            | Context                     |
| -------------------------- | ---------------------------------- | ------------------ | --------------------------- |
| `CardTitleDirective`       | `ng-template[monaCardTitle]`       | `mona-card-header` | `CardTemplateContext`       |
| `CardDescriptionDirective` | `ng-template[monaCardDescription]` | `mona-card-header` | `CardTemplateContext`       |
| `CardActionDirective`      | `ng-template[monaCardAction]`      | `mona-card-header` | None. There can be several. |
| `CardContentDirective`     | `ng-template[monaCardContent]`     | `mona-card`        | None                        |

### Exported Types

- `CardTemplateContext`: `$implicit` is the id for the element in the template.
- `CardVariantProps`: the variant options, including `rounded`.
- `CARD_DEFAULT_MESSAGES`: the card's English messages.

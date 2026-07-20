# Mona UI Theme Color Strategy — Implementation Plan

## Objective

Refactor Mona UI's runtime color theming into a professional, dependency-injection-based strategy system.

This first stage must allow application developers to:

- Override any existing Mona color variable.
- Add new `--color-*` variables.
- Provide values shared by light and dark variants.
- Provide variant-specific light and dark values.
- Compose multiple color registrations with deterministic precedence.

Keep the existing component recipe architecture intact. Files such as `*.mona.styles.ts` must continue to define CVA/Tailwind component recipes, while `*.styles.ts` must continue to select the recipe for the active visual theme. This stage concerns runtime color definitions only.

## Repository context

The relevant current implementation is under:

```text
projects/mona-ui/theme/
├── models/Theme.ts
├── models/ThemeDefinition.ts
├── services/theme.service.ts
├── utils/generateThemeColors.ts
├── utils/themeColorMap.ts
└── public-api.ts
```

The consuming tester application's Tailwind theme declarations are in:

```text
projects/mona-ui-tester/src/styles.css
```

Before changing anything, read and follow the repository's `AGENTS.md` and inspect the current files rather than assuming that the paths or implementations are unchanged.

## Current problems to address

1. `ThemeService` currently owns too many responsibilities:
   - Theme state.
   - Built-in Mona color definitions.
   - Theme/variant resolution.
   - DOM mutation.

2. `themeId`, `theme`, and `themeVariant` are separate signals representing the same state. They can become inconsistent.

3. `themeId` is exposed as a writable signal. A consumer can call `themeId.set(...)` without triggering CSS-variable application.

4. Theme switching writes new variables but never removes variables absent from the next definition. This can leave stale values behind. For example, the light definition currently contains destructive colors not present in the dark definition.

5. Unknown themes silently resolve to an empty object.

6. The project already contains `ThemeDefinition` and `ThemeDefinitionRegistry` types, but they are not integrated into the runtime architecture or exported publicly.

7. Runtime definitions and the tester application's Tailwind `@theme` block contain partially different token catalogs.

8. Tester-only variables such as `--page-background` and `--color-demo-background` are mixed into the library's runtime theme service.

9. A preliminary inventory identified recipe references that may not have matching declared tokens, including:
   - `background-light`
   - `background-darker`
   - `hover-foreground`
   - A possible `color-foreground` typo in the editor recipe

Do not silently invent colors for these. Inventory and classify them before deciding whether to define, rename, or fix them.

## Architectural boundaries

### In scope

- Extract built-in Mona light/dark colors from `ThemeService`.
- Introduce a pure color-resolution strategy.
- Introduce an Angular multi-provider for color registrations.
- Add a public helper for registering color additions and overrides.
- Simplify `ThemeService` to state orchestration and DOM application.
- Remove stale applied variables during theme changes.
- Add comprehensive unit tests.
- Add a consumer-facing example and documentation.
- Reconcile the supported runtime token inventory sufficiently for predictable light/dark behavior.

### Out of scope

- Adding a second visual theme.
- Letting users register arbitrary new `ThemeStyle` names.
- Replacing or redesigning `*.mona.styles.ts` recipes.
- Theme inheritance.
- Component-level or nested theme scopes.
- Runtime mutation of provider registrations after bootstrap.
- Persisting theme selection.
- Detecting `prefers-color-scheme`.
- Generating CSS files from TypeScript.
- Redesigning the Mona palette.

Do not widen `ThemeStyle` to `"mona" | string`. TypeScript reduces that to `string`, destroying useful autocomplete and exhaustiveness. Registration of entirely new themes must be handled later together with component recipe registration.

## Target architecture

Use the following resolution pipeline:

```text
Built-in Mona definition
        +
Root-level DI color registrations
        ↓
DefaultThemeColorStrategy
        ↓
ThemeService
        ↓
document.documentElement CSS variables
        ↓
Existing Tailwind/CVA recipes
```

Separate the implementation into these responsibilities:

| Layer | Responsibility |
| --- | --- |
| Built-in definition | Immutable Mona light/dark values; no Angular or DOM dependencies |
| Registration token | Collect consumer additions and overrides through Angular DI |
| Provider helper | Offer a typed, ergonomic bootstrap API |
| Resolution strategy | Merge built-in values and registrations deterministically |
| Theme service | Own active theme state and apply resolved variables to the document |
| Tailwind/CVA recipes | Consume semantic variables through existing utility classes; unchanged in this stage |

## Proposed file structure

Adapt naming to existing repository conventions where necessary, but keep the separation of responsibilities:

```text
projects/mona-ui/theme/
├── definitions/
│   ├── mona-theme-colors.ts
│   └── built-in-theme-colors.ts
├── models/
│   ├── Theme.ts
│   └── ThemeDefinition.ts
├── providers/
│   └── theme-color.providers.ts
├── strategies/
│   ├── theme-color.strategy.ts
│   └── default-theme-color.strategy.ts
├── tokens/
│   └── theme-color.tokens.ts
├── services/
│   └── theme.service.ts
└── public-api.ts
```

Avoid barrel files inside every directory unless they make the existing project more consistent. Do not add abstraction layers that have no immediate responsibility.

## Public type design

Add or refine types similar to the following:

```ts
export type ThemeColorVariable = `--color-${string}`;

export type ThemeColors = Readonly<Record<ThemeColorVariable, string>>;

export interface ThemeColorOverrides {
    readonly common?: ThemeColors;
    readonly light?: ThemeColors;
    readonly dark?: ThemeColors;
}

export interface ThemeColorRegistration {
    readonly theme: ThemeStyle;
    readonly colors: ThemeColorOverrides;
}
```

Requirements:

- Color values must be strings because they are passed to `CSSStyleDeclaration.setProperty()`.
- Custom keys such as `--color-brand` must be accepted.
- Unrelated keys such as `--border-radius` should be rejected by the color-provider API.
- The built-in definition must require complete light and dark records.
- User registrations must allow partial records and optional variants.
- Use `Readonly` types so registrations and definitions are treated as immutable.
- Do not use `any`.

If the existing generic `ThemeVariables` type remains useful for future non-color design tokens, preserve it separately rather than conflating it with the public color-only provider API.

## Built-in Mona definition

Move all effective Mona light and dark values out of `ThemeService` into a pure definition module.

Example shape:

```ts
export const monaThemeColors = {
    light: {
        "--color-background": "oklch(1 0 0)",
        // Remaining supported Mona light colors.
    },
    dark: {
        "--color-background": "oklch(0.21 0 0)",
        // Remaining supported Mona dark colors.
    }
} satisfies ThemeDefinition;
```

Migration rules:

- Preserve the current effective appearance unless fixing a clearly identified bug.
- Continue using `generatePrimaryColorPalette()` where appropriate.
- Make both variant definitions deliberate and complete for the supported library token inventory.
- Fix the stale destructive-color situation by defining the intended dark values or explicitly removing those tokens from the supported contract.
- Remove tester-only shell/demo variables from the library definition and manage them in the tester application.
- Do not export the built-in object publicly unless there is a concrete consumer use case. Avoid expanding the public API unnecessarily.

## DI registration token

Create a multi-provider token that collects color registrations:

```ts
export const THEME_COLOR_REGISTRATIONS =
    new InjectionToken<readonly ThemeColorRegistration[]>(
        "Mona UI theme color registrations"
    );
```

Important implementation detail:

- Do not define a non-multi default provider/factory for this token and then mix it with `multi: true` providers.
- The resolver should inject it optionally:

```ts
const registrations =
    inject(THEME_COLOR_REGISTRATIONS, { optional: true }) ?? [];
```

Registrations are static bootstrap configuration. Document that they belong in the root environment providers. Do not imply that component-level providers can create independent local themes while `ThemeService` is a root service writing global document variables.

## Public provider helper

Create a public helper using `makeEnvironmentProviders()`:

```ts
export function provideThemeColors(
    registration: ThemeColorRegistration
): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: THEME_COLOR_REGISTRATIONS,
            multi: true,
            useValue: registration
        }
    ]);
}
```

The final implementation may defensively copy/freeze the registration if appropriate, but it must not mutate consumer objects.

Expected consumer API:

```ts
bootstrapApplication(AppComponent, {
    providers: [
        provideThemeColors({
            theme: "mona",
            colors: {
                common: {
                    "--color-brand": "oklch(62% 0.18 280)"
                },
                light: {
                    "--color-primary": "oklch(48% 0.16 280)",
                    "--color-primary-foreground": "white"
                },
                dark: {
                    "--color-primary": "oklch(72% 0.14 280)",
                    "--color-primary-foreground": "oklch(18% 0.02 280)"
                }
            }
        })
    ]
});
```

## Color strategy

Define a small strategy interface:

```ts
export interface ThemeColorStrategy {
    resolve(
        theme: ThemeStyle,
        variant: ThemeVariant
    ): ThemeColors;
}
```

Create a default implementation that depends on the built-in registry and the optional DI registrations.

The merge algorithm must be:

1. Resolve the built-in definition for the requested theme and variant.
2. Start with a fresh copy of that built-in record.
3. Iterate matching registrations in Angular multi-provider order.
4. Merge `registration.colors.common`.
5. Merge `registration.colors[variant]`.
6. Return the completed record without mutating the built-in definition or registrations.

Therefore:

- User values overwrite built-in values.
- Variant-specific values overwrite `common` values from the same registration.
- Later registrations overwrite earlier registrations.
- New keys are retained.

Example:

```ts
providers: [
    provideThemeColors({
        theme: "mona",
        colors: {
            common: { "--color-primary": "rebeccapurple" }
        }
    }),
    provideThemeColors({
        theme: "mona",
        colors: {
            dark: { "--color-primary": "plum" }
        }
    })
]
```

Expected result:

- Mona light: `--color-primary` is `rebeccapurple`.
- Mona dark: `--color-primary` is `plum`.

Create an injection token for the strategy abstraction, with the default strategy as its root fallback. `ThemeService` must inject the strategy token rather than instantiate or depend directly on the default implementation.

This token is an advanced extension point. Ordinary color customization must use `provideThemeColors()`.

If no built-in definition exists for the requested theme, throw a descriptive error. Do not silently return an empty object.

## ThemeService refactor

After the refactor, `ThemeService` must only:

- Own active theme state.
- Expose read-only derived state.
- Ask the strategy to resolve colors.
- Apply the resolved colors to the DOM.
- Remove stale variables.

Use one internal state signal instead of three independently writable signals:

```ts
interface ActiveTheme {
    readonly id: ThemeId;
    readonly style: ThemeStyle;
    readonly variant: ThemeVariant;
}
```

Expose computed or otherwise read-only signals:

```ts
readonly #activeTheme = signal<ActiveTheme>(/* Mona light */);

public readonly themeId = computed(() => this.#activeTheme().id);
public readonly theme = computed(() => this.#activeTheme().style);
public readonly themeVariant = computed(() => this.#activeTheme().variant);
```

Preserve `setThemeId()` for compatibility unless repository analysis proves it is safe to replace. Validate/parse the supplied identifier in one place and update the single state value atomically.

Do not rely on unrestricted `themeId.split("-")` if the design is expected eventually to permit hyphenated theme names. At minimum, isolate parsing behind one function so it can be replaced later.

### Applying variables

Use `document.documentElement` rather than `querySelector(":root")`.

Track the names written during the previous application. Before applying the next definition, remove any previously written name that is absent from the next result:

```ts
for (const previousName of this.#appliedVariables) {
    if (!(previousName in nextVariables)) {
        root.style.removeProperty(previousName);
    }
}

for (const [name, value] of Object.entries(nextVariables)) {
    root.style.setProperty(name, value);
}
```

Then replace the tracked-name set with the names from the new result.

Handle the absence of `document.documentElement` safely if required by the project's supported rendering environments. Do not add speculative SSR architecture beyond a simple safety guard.

## Tailwind token handling

Keep runtime value resolution separate from Tailwind's build-time token discovery.

Adding this through DI:

```ts
"--color-brand": "rebeccapurple"
```

creates a runtime CSS variable, but it does not automatically guarantee that Tailwind generates `bg-brand`, `text-brand`, or similar utilities.

Document that consumers must either:

- Declare the token in their Tailwind `@theme` block so named utilities are generated; or
- Use an arbitrary CSS-variable utility such as `bg-[var(--color-brand)]`; or
- Use ordinary CSS with `var(--color-brand)`.

Do not attempt runtime generation of Tailwind utilities.

Treat the tester application's `@theme` block as the compile-time Tailwind token catalog, not as an independent runtime strategy implementation. Avoid expanding this stage into a TypeScript-to-CSS generator.

## Token inventory and cleanup

Before finalizing the built-in Mona definition:

1. Extract all semantic color utility names used by `*.mona.styles.ts` files.
2. Compare those names against:
   - The built-in TypeScript definition.
   - The tester application's Tailwind `@theme` block.
3. Classify discrepancies as:
   - Missing supported token.
   - Unused declaration.
   - Tester-only token.
   - Typo in a component recipe.
   - Future/unimplemented token.
4. Correct obvious recipe typos in a narrowly scoped change.
5. Do not redesign color values during this architectural refactor.

If full token cleanup would materially expand the task, document remaining discrepancies in a focused follow-up list, but do not leave the new resolver with known stale-variable behavior or an ambiguous supported-token contract.

## Public exports

Update `projects/mona-ui/theme/public-api.ts` to export the intentionally supported API:

- `ThemeService`.
- Existing `ThemeStyle`, `ThemeVariant`, and `ThemeId` types.
- Public color registration types.
- `provideThemeColors()`.
- `ThemeColorStrategy` and its token only if the advanced replacement point is deliberately public.

Do not export internal built-in registries, merge helpers, or implementation classes without a demonstrated public use case.

Respect the repository's secondary-entry-point packaging structure and verify that consumers can import the new API from:

```ts
import {
    provideThemeColors,
    ThemeService
} from "@nanahoshi/mona-ui/theme";
```

## Tests

Add focused unit tests for the resolver, provider composition, and service DOM behavior.

### Strategy tests

- Mona light resolves the expected built-in record.
- Mona dark resolves the expected built-in record.
- Resolution returns a new record and does not mutate the built-in definition.
- `common` additions appear in both variants.
- Light-only additions appear only in light.
- Dark-only additions appear only in dark.
- Existing values can be overwritten.
- New `--color-*` keys can be added.
- Variant-specific values overwrite `common` values.
- Later registrations overwrite earlier registrations.
- Registrations for a nonmatching theme are ignored.
- Missing built-in themes produce a descriptive error.

### Provider tests

- `provideThemeColors()` contributes a multi-provider registration.
- Multiple helper calls are preserved in declaration order.
- The helper does not mutate the supplied object.

### ThemeService tests

- The service starts with Mona light.
- Initial resolved variables are applied.
- `setThemeId("mona-dark")` updates all derived signals atomically.
- Switching variants applies the correct result.
- Variables missing from the next result are removed.
- Existing values are replaced rather than duplicated.
- `themeId`, `theme`, and `themeVariant` cannot be mutated publicly.
- DOM writes target `document.documentElement`.

### Definition-contract tests

- Built-in light and dark definitions contain every required supported token.
- Definition keys conform to the expected CSS-variable naming contract.
- Tester-only variables are not part of the library definition.

Follow `AGENTS.md` and the repository's enhanced testing rules. Use Vitest through the existing Angular test setup. Run the smallest relevant test target while developing, followed by the complete library test command before handoff.

## Documentation and demo

Add a concise consumer-facing documentation section showing:

1. Overriding one color for both variants.
2. Giving light and dark different values.
3. Adding a new custom color variable.
4. Registering multiple contributions and explaining later-provider-wins precedence.
5. The Tailwind build-time requirement for new named utilities.
6. That registrations belong in root/bootstrap providers.

Update the tester application with a small real example. Do not turn the tester into a runtime theme editor in this stage.

## Verification commands

Use the repository's actual scripts after inspecting `package.json`. At minimum, run the equivalents of:

```bash
npm run test:lib
npm run build:prod
```

Also verify:

- The theme secondary entry point builds successfully.
- The tester application can import `provideThemeColors()` from `@nanahoshi/mona-ui/theme`.
- Mona light and dark still render with expected colors.
- A consumer override changes existing components without changing their CVA recipes.
- A custom CSS variable is present on `document.documentElement`.
- Switching variants does not retain stale custom variables.
- No unrelated files or component behavior changed.

## Acceptance criteria

The work is complete only when all of the following are true:

- `ThemeService` contains no built-in Mona color literals.
- Built-in Mona colors live in a pure definition module.
- Consumers can add or overwrite colors through root-level Angular providers.
- Common and variant-specific overrides behave as documented.
- Multiple registrations merge deterministically, with later values winning.
- The resolver is implemented behind a strategy abstraction injected by `ThemeService`.
- Public theme signals cannot be mutated directly.
- Theme state cannot become internally inconsistent.
- Stale CSS variables are removed during a theme/variant change.
- Unknown base themes do not silently resolve to an empty definition.
- Existing component recipe selection continues to work without architectural changes.
- New public APIs are exported from the theme secondary entry point.
- Tests cover definition resolution, DI composition, precedence, state changes, and DOM cleanup.
- Documentation explains both the DI API and Tailwind's build-time limitation.
- Library tests and the production build pass.

## Deliverable expectations

Implement the complete first stage, including code, tests, public exports, and documentation. Keep the change focused and avoid speculative abstractions for future visual themes.

At handoff, provide:

- A concise summary of the architecture implemented.
- A list of public APIs added or changed.
- Any token inconsistencies discovered and how each was handled.
- Tests and build commands run, with their results.
- Explicit follow-up items that were intentionally left outside this stage.

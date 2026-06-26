# Angular Component Production Audit

**Role:** Act as a Principal Angular UI Engineer and Accessibility Specialist.
**Context:** I am building a proprietary UI library using **Angular 21**, **Tailwind CSS**, and **class-variance-authority (CVA)**.

**Task:** Perform a "Deep Dive Code Review" on the target component provided in the context.
**Target Component:** Identify the component class name from the provided code (e.g., `ButtonComponent`) and use that as the subject of your report.

**Evaluation Criteria:**
Analyze the code against the following five pillars. Do **not** implement fixes yet; strictly report gaps.

## 1. Accessibility (a11y) & WCAG 2.2 Compliance

* **Semantic HTML:** Are the correct tags used (e.g., `<button>` vs `<div>`)?
* **ARIA Attributes:** Are `aria-` attributes used correctly for dynamic states?
* **Keyboard Navigation:** Does it manage focus? Usable without a mouse?
* **Screen Readers:** How will this be announced?
* **Color Contrast:** Are color variants accessible?

## 2. Angular 22 Modern Standards

* **Signals Architecture:** Does it properly utilize `input()`, `output()`, and `viewChild()`?
* **Change Detection:** Is `ChangeDetectionStrategy.OnPush` used? Is it Zoneless-ready?
    * Note: Since Angular 22, `OnPush` is now the default change detection strategy, and it does not require explicit usage.
    * Note: Since Angular 22, `Default` is now named `Eager`.
* **Control Flow:** Does it use `@if`, `@for`, `@switch`?
* **Cleanliness:** Are `hostDirectives` or composition used effectively?
* **Form Interaction:** If a form control, does it have functional signal-based form support?
    * Note: Since Angular 22, `ControlValueAccessor` is now deprecated in favor of signal-based form support.
    * Note: Components should be designed with signal-based form support in mind. Reactive forms will be phased out in favor of signal-based forms in future versions of Angular.

## 3. API Design & DX

* **Inputs:** Are inputs intuitive?
* **Polymorphism:** Does it support `as` input (e.g., rendering a button as an anchor)?
* **Content Projection:** Proper use of `ng-content`?

## 4. Styling (Tailwind + CVA)

* **Variance:** Are CVA variants logical?
* **Overridability:** Can consumers merge classes (via `tailwind-merge`) without conflicts?
* **Responsiveness:** Mobile-first considerations?

## 5. Robustness

* **Empty States:** Handling of `null`/`undefined` inputs.
* **SSR Safety:** No direct DOM access that breaks server-side rendering.

**Output Format:**
Provide the report in Markdown with sections:

1. 🚨 Critical Issues (Must Fix)
2. ⚠️ Improvements (Should Fix)
3. ✅ Good Practices Found
4. 🧪 Missing Features Checklist

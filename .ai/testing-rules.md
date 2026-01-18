Role: You are a Senior Angular SDET (Software Development Engineer in Test) specializing in Angular 21 and Vitest. Your task is to write a robust, high-coverage unit test suite for the provided Angular UI component.

Context: We are building a strict UI framework. The tests must verify the component's behavior from the perspective of a consumer (using the public API) and the end-user (interacting with the DOM).

Strict Guidelines & Constraints:

Technology Stack:

Framework: Angular 21 (Utilize modern testing patterns compatible with Signal-based inputs/queries if present).

Runner: Vitest. Use vi.fn(), describe, it, expect, and beforeEach.

Utils: Use ComponentFixture, DebugElement, and By.css for DOM interaction.

Coverage Goal:

Aim for 90% - 100% code coverage.

Ensure all branches, error states, and template conditionals (@if, @for) are exercised.

Ensure all accessibility attributes are present and valid.

Black-Box Testing (Crucial):

FORBIDDEN: Do NOT access private or protected methods or properties directly.

FORBIDDEN: Do NOT use casting to any (e.g., (component as any).privateMethod()) to bypass TypeScript restrictions.

REQUIRED: Test logic strictly by setting Signal inputs, triggering DOM events, and observing public output emissions or DOM updates.

REQUIRED: Use useFakeTimers, advanceTimersByTime, useRealTimers when necessary. Do not use fakeAsync, tick, or any other old timing-related APIs. 

View & User Interaction:

Do not just call methods on the component instance (e.g., component.handleClick()).

Instead, query the DOM element (e.g., the button) and trigger the event (e.g., button.triggerEventHandler('click', null)).

Assert results by checking the DOM state (classes, text content, attributes) or verifying Output emissions.

Mocking:

No Real Services: Never provide actual service implementations in the providers array.

Minimal Mocks: Create minimal mock objects or use vi.fn() for service dependencies.

Testbed: Configure the TestBed properly using provideHttpClientTesting() if HTTP is involved (though unlikely for UI components) or standard provider mocks.

Output Format: Please provide the full spec.ts file. Do not include setup instructions, just the code.

Input Code to Test:

TypeScript

[PASTE YOUR COMPONENT CODE HERE]

import * as fs from "fs";
import * as path from "path";
import { CallExpression, JSDocTag, Node, Project } from "ts-morph";

interface ComponentInputMetadata {
    name: string;
    type: string;
    description: string;
    kind: "input" | "model" | "output";
}

interface ComponentMetadata {
    name: string;
    selector: string;
    inputs: ComponentInputMetadata[];
}

const outputPath = path.resolve(__dirname, "../src/assets/component-metadata.json");
const projectPath = path.resolve(__dirname, "../../mona-ui"); // Path to your Angular project root

/**
 * Simplifies a TypeScript type string by removing import paths and extracting generic arguments.
 * Examples:
 * - "import(\"...\").InputSignal<boolean>" becomes "boolean"
 * - "import(\"...\").InputSignalWithTransform<string, boolean>" becomes "boolean"
 * - "boolean | undefined" remains "boolean | undefined"
 * - "SomeNamespace.MyType" becomes "MyType"
 * @param fullType The full type string from ts-morph.
 * @returns A simplified type string.
 */
function simplifyType(fullType: string): string {
    let simplified = fullType;

    // 1. Remove "import(...)."-like prefixes
    // This handles cases like: import("L:/Codes/.../index").InputSignal<boolean>
    simplified = simplified.replace(/import\([^)]*\)\./g, "");

    // 2. Handle InputSignalWithTransform specifically: extract the second generic parameter
    // Regex to match "InputSignalWithTransform<T1, T2>" and capture T2
    const inputSignalWithTransformMatch = simplified.match(/InputSignalWithTransform<[^,]+,\s*(.+?)>$/);
    if (inputSignalWithTransformMatch && inputSignalWithTransformMatch[1]) {
        return inputSignalWithTransformMatch[1].trim();
    }

    // 3. Extract generic type argument if present (e.g., InputSignal<boolean> -> boolean)
    // This should run AFTER InputSignalWithTransform specific handling
    const genericMatch = simplified.match(/^[^<]+<(.+)>$/);
    if (genericMatch && genericMatch[1]) {
        // This captures the content inside the outermost angle brackets
        simplified = genericMatch[1];
    }

    // 4. Remove any remaining namespace prefixes (e.g., Core.InputSignal -> InputSignal)
    const lastDotIndex = simplified.lastIndexOf(".");
    if (lastDotIndex > -1) {
        simplified = simplified.substring(lastDotIndex + 1);
    }

    return simplified.trim();
}

/**
 * Recursively extracts input/output metadata from a class and its inheritance chain
 * @param classDeclaration The class to extract metadata from
 * @param visitedClasses Set to track visited classes and avoid infinite recursion
 * @returns Array of component input metadata from the class and its base classes
 */
function extractInputsFromInheritanceChain(
    classDeclaration: any,
    visitedClasses = new Set<string>()
): ComponentInputMetadata[] {
    const className = classDeclaration.getName();
    if (!className || visitedClasses.has(className)) {
        return [];
    }

    visitedClasses.add(className);
    const inputs: ComponentInputMetadata[] = [];

    // Extract inputs from current class
    for (const property of classDeclaration.getProperties()) {
        const initializer = property.getInitializer();

        if (initializer && Node.isCallExpression(initializer)) {
            const callExpression = initializer as CallExpression;
            const functionName = callExpression.getExpression().getText();

            let kind: "input" | "model" | "output" | null = null;

            if (functionName.startsWith("input")) {
                kind = "input";
            } else if (functionName.startsWith("model")) {
                kind = "model";
            } else if (functionName === "output") {
                kind = "output";
            }

            if (kind) {
                const inputName = property.getName();
                let inputType = "any";

                // Try to get type from the explicit generic argument first
                const typeArguments = callExpression.getTypeArguments();
                if (typeArguments.length > 0) {
                    inputType = typeArguments[0].getText();
                } else {
                    const fullType = property.getType().getText();
                    inputType = simplifyType(fullType);
                }

                let description = "";
                const jsDocs = property.getJsDocs();
                if (jsDocs.length > 0) {
                    const mainDoc = jsDocs[0];
                    const descriptionTag = mainDoc
                        .getTags()
                        .find((tag: JSDocTag) => tag.getTagName() === "description");
                    if (descriptionTag) {
                        description = descriptionTag.getCommentText()?.toString().trim() || "";
                    }
                }

                inputs.push({
                    name: inputName,
                    type: inputType,
                    description: description,
                    kind: kind
                });
            }
        }
    }

    // Extract inputs from base classes
    const baseClass = classDeclaration.getBaseClass();
    if (baseClass) {
        const baseInputs = extractInputsFromInheritanceChain(baseClass, visitedClasses);
        inputs.push(...baseInputs);
    }

    return inputs;
}

async function extractComponentMetadata() {
    const project = new Project({
        tsConfigFilePath: path.join(projectPath, "tsconfig.lib.json"), // Or tsconfig.json if applicable
        skipFileDependencyResolution: false // Enable full type resolution to follow inheritance
    });

    const allComponentMetadata: { [componentName: string]: ComponentMetadata } = {};

    // Get all TypeScript source files across the package's feature folders
    const pattern = `${projectPath.replaceAll("\\", "/")}/**/*.ts`;
    const sourceFiles = project.getSourceFiles(pattern);

    for (const sourceFile of sourceFiles) {
        // Find classes that have a @Component decorator
        for (const classDeclaration of sourceFile.getClasses()) {
            const componentDecorator = classDeclaration.getDecorator("Component");
            const directiveDecorator = classDeclaration.getDecorator("Directive");
            const resultDecorator = componentDecorator || directiveDecorator;

            if (resultDecorator) {
                const componentName = classDeclaration.getName();
                if (!componentName) continue; // Skip if class has no name

                let selector = "";
                const decoratorArguments = resultDecorator.getArguments();
                if (decoratorArguments.length > 0 && Node.isObjectLiteralExpression(decoratorArguments[0])) {
                    const properties = decoratorArguments[0].getProperties();
                    const selectorProperty = properties.find(
                        prop => Node.isPropertyAssignment(prop) && prop.getName() === "selector"
                    );
                    if (
                        selectorProperty &&
                        Node.isPropertyAssignment(selectorProperty) &&
                        Node.isStringLiteral(selectorProperty.getInitializer())
                    ) {
                        selector = selectorProperty.getInitializer()?.getText() || "";
                    }
                }

                // Extract inputs from the entire inheritance chain
                const componentInputs = extractInputsFromInheritanceChain(classDeclaration);

                // Remove duplicates (keep the most derived version)
                const uniqueInputs: ComponentInputMetadata[] = [];
                const seenInputs = new Set<string>();

                for (const input of componentInputs) {
                    if (!seenInputs.has(input.name)) {
                        seenInputs.add(input.name);
                        uniqueInputs.push(input);
                    }
                }

                if (uniqueInputs.length > 0) {
                    allComponentMetadata[componentName] = {
                        name: componentName,
                        selector: selector,
                        inputs: uniqueInputs
                    };
                }
            }
        }
    }

    // Write the extracted metadata to a JSON file
    fs.writeFileSync(outputPath, JSON.stringify(allComponentMetadata, null, 2));
    console.log(`Successfully extracted component metadata to: ${outputPath}`);
}

extractComponentMetadata().catch(console.error);

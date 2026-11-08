import {
    ClassDeclaration,
    EnumDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    Node,
    Project,
    Scope,
    SyntaxKind,
    TypeAliasDeclaration,
    TypeFormatFlags,
    VariableDeclaration
} from "ts-morph";
import type {
    CallExpression,
    Decorator,
    JSDocableNode,
    JSDocTag,
    MethodDeclaration,
    MethodSignature,
    PropertySignature,
    SourceFile,
    Type,
    TypeNode
} from "ts-morph";

/**
 * Reads what an entry point exports from its `public-api.ts`, so the reference pages describe what consumers can import
 * and nothing else. `generate-api-docs.ts` turns the result into markdown.
 */

export type ApiSymbolKind =
    "class" | "component" | "constant" | "directive" | "enum" | "function" | "interface" | "pipe" | "service" | "type";

export interface ApiMember {
    /** The name consumers bind, when an input or output is aliased. */
    readonly alias?: string;
    readonly defaultValue?: string;
    readonly description: string;
    readonly name: string;
    readonly optional?: boolean;
    readonly readonly?: boolean;
    readonly required?: boolean;
    readonly twoWay?: boolean;
    readonly type: string;
}

export interface ApiMethod {
    readonly description: string;
    readonly name: string;
    readonly signature: string;
}

export interface ApiEnumMember {
    readonly description: string;
    readonly name: string;
    readonly value: string;
}

export interface ApiTemplateContext {
    readonly members: readonly ApiMember[];
    readonly type: string;
}

export interface ApiSymbol {
    readonly description: string;
    readonly enumMembers?: readonly ApiEnumMember[];
    readonly exportAs?: string;
    readonly extends?: readonly string[];
    /** The form control contract it implements, when it has one. */
    readonly implements?: readonly string[];
    readonly inputs?: readonly ApiMember[];
    readonly kind: ApiSymbolKind;
    readonly methods?: readonly ApiMethod[];
    readonly name: string;
    readonly outputs?: readonly ApiMember[];
    readonly pipeName?: string;
    readonly properties?: readonly ApiMember[];
    readonly selector?: string;
    /** The declaration's own source, for type aliases, functions and constants. */
    readonly signature?: string;
    /** What a template directive's `let-` variables can read, from its `ngTemplateContextGuard`. */
    readonly templateContext?: ApiTemplateContext;
    readonly typeParameters?: readonly string[];
}

/** Whether a class is exported by some entry point, so its own section can describe the members it passes down. */
export type IsPublicClass = (declaration: ClassDeclaration) => boolean;

const LIFECYCLE_METHOD = /^ng[A-Z]/;
const FORM_CONTROL_METHODS = new Set(["registerOnChange", "registerOnTouched", "setDisabledState", "writeValue"]);
const SIGNAL_QUERY = /^(contentChild|contentChildren|viewChild|viewChildren)\b/;
const FORM_CONTROL_CONTRACT = /^(ControlValueAccessor|FormCheckboxControl|FormValueControl)\b/;
const COMMENT = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;
const IMPORT_PREFIX = /import\((?:"[^"]*"|'[^']*')\)\./g;

interface DocComment {
    readonly defaultValue?: string;
    readonly description: string;
    readonly internal: boolean;
}

/** Drops comments and collapses whitespace, so a declaration reads on one line. */
function oneLine(text: string): string {
    return text.replace(COMMENT, " ").replace(/\s+/g, " ").trim();
}

function cleanType(text: string): string {
    return oneLine(text.replace(IMPORT_PREFIX, ""));
}

/**
 * Prints what a variant type comes down to. `ButtonVariantProps["look"]` tells a reader nothing, and the styling types
 * aren't documented, so the values are spelled out. They're sorted, because the compiler's own union order depends on
 * the order it met them in, and the generated files have to match on every platform. A variant's `null | undefined`
 * is dropped: it's what leaves the input unset, which the default column already says.
 */
function expandVariantType(type: Type, context: Node): string {
    const text = cleanType(type.getNonNullableType().getText(context, TypeFormatFlags.NoTruncation));
    const parts = splitTopLevelUnion(text);
    return parts.every(part => /^(".*"|\d+|true|false)$/.test(part))
        ? [...parts].sort((first, second) => first.localeCompare(second, "en")).join(" | ")
        : text;
}

function splitTopLevelUnion(text: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if ("<([{".includes(char)) {
            depth++;
        } else if (">)]}".includes(char) && text[index - 1] !== "=") {
            depth--;
        } else if (char === "|" && depth === 0) {
            parts.push(text.slice(start, index).trim());
            start = index + 1;
        }
    }
    parts.push(text.slice(start).trim());
    return parts;
}

/**
 * A tag's text as it's written, without the tag name and the leading `*`s. The compiler's own reading drops the line
 * break after an inline `{@link}`, so on an LF checkout the next line's first word ran into the link.
 */
function tagTextOf(tag: JSDocTag): string {
    return tag
        .getText()
        .replace(/^@\S+/, "")
        .split(/\r?\n/)
        .map(line => line.replace(/^\s*\*(?!\/)\s?/, ""))
        .join("\n")
        .replace(/\s*\*\/\s*$/, "")
        .trim();
}

/**
 * Reads a JSDoc block. The library has two habits, an `@description` tag and a plain comment, and either is the
 * description. A leading `@deprecated` note is kept, because consumers need to see it where they read the member.
 *
 * `@internal` and `@hidden` both keep a declaration out of the docs. `@internal` also strips it from the published
 * typings, so it only suits what no other entry point imports. `@hidden`, as in TypeDoc, leaves the typings alone, for
 * plumbing that the library's own entry points share but consumers have no use for.
 */
function readDoc(node: JSDocableNode): DocComment {
    const doc = node.getJsDocs().at(-1);
    if (!doc) {
        return { description: "", internal: false };
    }
    const tags = doc.getTags();
    const tagText = (name: string): string | undefined => {
        const tag = tags.find(candidate => candidate.getTagName() === name);
        return tag == null ? undefined : tagTextOf(tag);
    };
    const description = tagText("description") ?? doc.getDescription().trim().replace(/\r\n/g, "\n");
    const deprecated = tags.some(tag => tag.getTagName() === "deprecated")
        ? `**Deprecated.** ${tagText("deprecated") ?? ""}`.trim()
        : "";
    return {
        defaultValue: tagText("default"),
        description: [deprecated, description].filter(Boolean).join(" "),
        internal: tags.some(tag => tag.getTagName() === "internal" || tag.getTagName() === "hidden")
    };
}

function typeParametersOf(declaration: ClassDeclaration | InterfaceDeclaration): readonly string[] | undefined {
    const parameters = declaration.getTypeParameters().map(parameter => oneLine(parameter.getText()));
    return parameters.length > 0 ? parameters : undefined;
}

function isLiteralDefault(node: Node | undefined): node is Node {
    if (!node) {
        return false;
    }
    if (Node.isArrayLiteralExpression(node)) {
        return node.getElements().length === 0;
    }
    if (Node.isPrefixUnaryExpression(node)) {
        return node.getOperatorToken() === SyntaxKind.MinusToken && Node.isNumericLiteral(node.getOperand());
    }
    return (
        (Node.isIdentifier(node) && node.getText() === "undefined") ||
        Node.isNumericLiteral(node) ||
        Node.isTrueLiteral(node) ||
        Node.isFalseLiteral(node) ||
        Node.isNullLiteral(node) ||
        Node.isStringLiteral(node) ||
        Node.isNoSubstitutionTemplateLiteral(node)
    );
}

function splitTopLevel(args: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < args.length; index++) {
        const char = args[index];
        if ("<([{".includes(char)) {
            depth++;
        } else if (">)]}".includes(char) && args[index - 1] !== "=") {
            depth--;
        } else if (char === "," && depth === 0) {
            parts.push(args.slice(start, index).trim());
            start = index + 1;
        }
    }
    parts.push(args.slice(start).trim());
    return parts;
}

/** What a binding may pass or an event carries, given the type of the `input()`, `model()` or `output()` field. */
function memberTypeFromSignal(type: Type, context: Node): string {
    const text = cleanType(type.getText(context));
    const match = /^(\w+)<(.+)>$/.exec(text);
    if (!match) {
        return text;
    }
    const args = splitTopLevel(match[2]);
    if (match[1] === "InputSignalWithTransform" && args.length === 2) {
        return args[1] === "unknown" || args[1] === "any" ? args[0] : args[1];
    }
    return args[0];
}

function readDeclaredType(node: TypeNode, context: Node): string {
    const text = cleanType(node.getText());
    return /VariantProps\b/.test(text) ? expandVariantType(node.getType(), context) : text;
}

function aliasOf(call: CallExpression, optionsIndex: number): string | undefined {
    const options = call.getArguments()[optionsIndex];
    if (!options || !Node.isObjectLiteralExpression(options)) {
        return undefined;
    }
    const alias = options.getProperty("alias");
    const value = alias && Node.isPropertyAssignment(alias) ? alias.getInitializer() : undefined;
    return value && Node.isStringLiteral(value) ? value.getLiteralValue() : undefined;
}

function signatureOf(method: MethodDeclaration | MethodSignature): string {
    const typeParameters = method.getTypeParameters().map(parameter => parameter.getText());
    const generics = typeParameters.length > 0 ? `<${typeParameters.join(", ")}>` : "";
    const parameters = method
        .getParameters()
        .map(parameter => oneLine(parameter.getText()))
        .join(", ");
    const returnType = method.getReturnTypeNode()?.getText() ?? cleanType(method.getReturnType().getText(method));
    return `${method.getName()}${generics}(${parameters}): ${oneLine(returnType)}`;
}

function isAngularClass(declaration: ClassDeclaration): boolean {
    return ["Component", "Directive", "Pipe"].some(name => declaration.getDecorator(name) !== undefined);
}

/**
 * The class and the library classes whose members it shows, most derived first. A plain class stops at a public base,
 * because thirty event classes repeating `preventDefault()` says less than "extends `PreventableEvent`". An Angular
 * class always shows what it inherits, since that is what its template accepts.
 */
function classChain(declaration: ClassDeclaration, isPublicClass: IsPublicClass): ClassDeclaration[] {
    const chain: ClassDeclaration[] = [];
    let current: ClassDeclaration | undefined = declaration;
    while (current && !current.getSourceFile().isInNodeModules()) {
        chain.push(current);
        const base: ClassDeclaration | undefined = current.getBaseClass();
        current = base && !isAngularClass(declaration) && isPublicClass(base) ? undefined : base;
    }
    return chain;
}

function byName<T extends { readonly alias?: string; readonly name: string }>(items: readonly T[]): T[] {
    const seen = new Set<string>();
    return items
        .filter(item => {
            const isNew = !seen.has(item.name);
            seen.add(item.name);
            return isNew;
        })
        .sort((first, second) => (first.alias ?? first.name).localeCompare(second.alias ?? second.name, "en"));
}

/**
 * On a component or directive, only documented properties and methods count as API. Many are public only so the
 * template or a sibling can reach them, and a JSDoc comment is how a member says it's meant for consumers. A plain
 * class has no template, so what's public on it is its API.
 */
function readClassMembers(
    declaration: ClassDeclaration,
    isPublicClass: IsPublicClass
): Pick<ApiSymbol, "inputs" | "methods" | "outputs" | "properties"> {
    const documentedOnly = isAngularClass(declaration);
    const inputs: ApiMember[] = [];
    const outputs: ApiMember[] = [];
    const properties: ApiMember[] = [];
    const methods: ApiMethod[] = [];

    for (const current of classChain(declaration, isPublicClass)) {
        for (const property of current.getProperties()) {
            const name = property.getName();
            if (name.startsWith("#") || property.getScope() !== Scope.Public) {
                continue;
            }
            const doc = readDoc(property);
            if (doc.internal) {
                continue;
            }
            const initializer = property.getInitializer();
            const call = initializer && Node.isCallExpression(initializer) ? initializer : undefined;
            const callee = call?.getExpression().getText() ?? "";

            if (call && /^(input|model)(\.required)?$/.test(callee)) {
                const isRequired = callee.endsWith(".required");
                const defaultNode = isRequired ? undefined : call.getArguments()[0];
                const typeArguments = call.getTypeArguments();
                const declared = typeArguments.length === 1 ? readDeclaredType(typeArguments[0], property) : undefined;
                inputs.push({
                    alias: aliasOf(call, isRequired ? 0 : 1),
                    // A literal in the code can't be out of date. The tag is for what the code can't say, such as an expression.
                    defaultValue: isLiteralDefault(defaultNode) ? defaultNode.getText() : doc.defaultValue,
                    description: doc.description,
                    name,
                    required: isRequired || undefined,
                    twoWay: callee.startsWith("model") || undefined,
                    type: declared ?? memberTypeFromSignal(property.getType(), property)
                });
            } else if (call && /^(output|outputFromObservable)$/.test(callee)) {
                outputs.push({
                    alias: aliasOf(call, callee === "output" ? 0 : 1),
                    description: doc.description,
                    name,
                    type: memberTypeFromSignal(property.getType(), property)
                });
            } else if (
                !SIGNAL_QUERY.test(callee) &&
                !/^inject\b/.test(callee) &&
                (doc.description || !documentedOnly)
            ) {
                properties.push({
                    description: doc.description,
                    name,
                    readonly: property.isReadonly() || undefined,
                    type: cleanType(property.getTypeNode()?.getText() ?? property.getType().getText(property))
                });
            }
        }
        // Event classes declare most of what they carry as constructor parameters.
        for (const parameter of current.getConstructors().at(0)?.getParameters() ?? []) {
            if (parameter.isParameterProperty() && parameter.getScope() === Scope.Public && !documentedOnly) {
                properties.push({
                    description: "",
                    name: parameter.getName(),
                    optional: parameter.isOptional() || undefined,
                    readonly: parameter.isReadonly() || undefined,
                    type: cleanType(parameter.getTypeNode()?.getText() ?? parameter.getType().getText(parameter))
                });
            }
        }
        for (const accessor of current.getGetAccessors()) {
            const name = accessor.getName();
            const doc = readDoc(accessor);
            if (
                name.startsWith("#") ||
                accessor.getScope() !== Scope.Public ||
                doc.internal ||
                (documentedOnly && !doc.description)
            ) {
                continue;
            }
            properties.push({
                description: doc.description,
                name,
                readonly: current.getSetAccessor(name) ? undefined : true,
                type: cleanType(accessor.getReturnTypeNode()?.getText() ?? accessor.getReturnType().getText(accessor))
            });
        }
        for (const method of current.getMethods()) {
            const name = method.getName();
            const doc = readDoc(method.getOverloads()[0] ?? method);
            if (
                name.startsWith("#") ||
                method.getScope() !== Scope.Public ||
                doc.internal ||
                (documentedOnly && !doc.description) ||
                LIFECYCLE_METHOD.test(name) ||
                FORM_CONTROL_METHODS.has(name)
            ) {
                continue;
            }
            const overloads = method.getOverloads();
            const signatures =
                overloads.length > 0 ? overloads.filter(overload => !readDoc(overload).internal) : [method];
            signatures.forEach((signature, index) =>
                methods.push({
                    description: doc.description,
                    // Overloads share a name, and the table lists each one.
                    name: index === 0 ? name : `${name}#${index}`,
                    signature: signatureOf(signature)
                })
            );
        }
    }
    return {
        inputs: byName(inputs),
        methods: byName(methods),
        outputs: byName(outputs),
        properties: byName(properties)
    };
}

function decoratorOptions(decorator: Decorator): Map<string, string> {
    const options = new Map<string, string>();
    const argument = decorator.getArguments()[0];
    if (argument && Node.isObjectLiteralExpression(argument)) {
        for (const property of argument.getProperties()) {
            if (Node.isPropertyAssignment(property)) {
                const value = property.getInitializer();
                if (value && (Node.isStringLiteral(value) || Node.isNoSubstitutionTemplateLiteral(value))) {
                    options.set(property.getName(), oneLine(value.getLiteralValue()));
                }
            }
        }
    }
    return options;
}

/** Reads the context a template directive declares through its static `ngTemplateContextGuard`. */
function readTemplateContext(declaration: ClassDeclaration): ApiTemplateContext | undefined {
    const guard = declaration.getStaticMethod("ngTemplateContextGuard");
    const predicate = guard?.getReturnTypeNode();
    if (!predicate || !Node.isTypePredicate(predicate)) {
        return undefined;
    }
    const typeNode = predicate.getTypeNode();
    if (!typeNode) {
        return undefined;
    }
    const members = typeNode
        .getType()
        .getProperties()
        .map((property): ApiMember => {
            const source = property.getDeclarations().at(0);
            return {
                description: source && Node.isJSDocable(source) ? readDoc(source).description : "",
                name: property.getName(),
                optional: property.isOptional() || undefined,
                type: cleanType(property.getTypeAtLocation(typeNode).getText(typeNode))
            };
        });
    return { members: byName(members), type: oneLine(typeNode.getText()) };
}

function readClass(name: string, declaration: ClassDeclaration, isPublicClass: IsPublicClass): ApiSymbol {
    const decorators = new Map(declaration.getDecorators().map(decorator => [decorator.getName(), decorator]));
    const angular = decorators.get("Component") ?? decorators.get("Directive") ?? decorators.get("Pipe");
    const options = angular ? decoratorOptions(angular) : new Map<string, string>();
    let kind: ApiSymbolKind = "class";
    if (decorators.has("Component")) {
        kind = "component";
    } else if (decorators.has("Directive")) {
        kind = "directive";
    } else if (decorators.has("Pipe")) {
        kind = "pipe";
    } else if (decorators.has("Injectable")) {
        kind = "service";
    }
    const base = declaration.getBaseClass();
    const contract = declaration
        .getImplements()
        .map(item => oneLine(item.getText()))
        .filter(item => FORM_CONTROL_CONTRACT.test(item));
    return {
        description: readDoc(declaration).description,
        exportAs: options.get("exportAs"),
        extends: base?.getName() && isPublicClass(base) ? [base.getName() ?? ""] : undefined,
        implements: contract.length > 0 ? contract : undefined,
        kind,
        name,
        pipeName: kind === "pipe" ? options.get("name") : undefined,
        selector: options.get("selector"),
        templateContext: readTemplateContext(declaration),
        typeParameters: typeParametersOf(declaration),
        ...readClassMembers(declaration, isPublicClass)
    };
}

function readPropertyType(property: PropertySignature): string {
    const node = property.getTypeNode();
    return node ? readDeclaredType(node, property) : cleanType(property.getType().getText(property));
}

function readInterface(name: string, declaration: InterfaceDeclaration): ApiSymbol {
    const properties = declaration
        .getProperties()
        .filter(property => !readDoc(property).internal)
        .map((property): ApiMember => ({
            description: readDoc(property).description,
            name: property.getName(),
            optional: property.hasQuestionToken() || undefined,
            readonly: property.isReadonly() || undefined,
            type: readPropertyType(property)
        }));
    const methods = declaration
        .getMethods()
        .filter(method => !readDoc(method).internal)
        .map((method): ApiMethod => ({
            description: readDoc(method).description,
            name: method.getName(),
            signature: signatureOf(method)
        }));
    return {
        description: readDoc(declaration).description,
        extends: declaration.getExtends().map(item => oneLine(item.getText())),
        kind: "interface",
        methods: byName(methods),
        name,
        properties: byName(properties),
        typeParameters: typeParametersOf(declaration)
    };
}

function readTypeAlias(name: string, declaration: TypeAliasDeclaration): ApiSymbol {
    const generics = declaration.getTypeParameters().map(parameter => parameter.getText());
    const typeText = declaration.getTypeNode()?.getText() ?? "unknown";
    return {
        description: readDoc(declaration).description,
        kind: "type",
        name,
        signature: `type ${name}${generics.length > 0 ? `<${generics.join(", ")}>` : ""} = ${oneLine(typeText)};`
    };
}

function readEnum(name: string, declaration: EnumDeclaration): ApiSymbol {
    return {
        description: readDoc(declaration).description,
        enumMembers: declaration.getMembers().map(member => ({
            description: readDoc(member).description,
            name: member.getName(),
            value: JSON.stringify(member.getValue()) ?? ""
        })),
        kind: "enum",
        name
    };
}

function readFunction(name: string, declaration: FunctionDeclaration): ApiSymbol {
    const signatures = declaration.getOverloads().length > 0 ? declaration.getOverloads() : [declaration];
    const text = signatures.map(signature => {
        const generics = signature.getTypeParameters().map(parameter => parameter.getText());
        const parameters = signature
            .getParameters()
            .map(parameter => oneLine(parameter.getText()))
            .join(", ");
        const returnType =
            signature.getReturnTypeNode()?.getText() ?? cleanType(signature.getReturnType().getText(signature));
        return `function ${name}${generics.length > 0 ? `<${generics.join(", ")}>` : ""}(${parameters}): ${oneLine(returnType)};`;
    });
    return {
        description: readDoc(signatures[0]).description,
        kind: "function",
        name,
        signature: text.join("\n")
    };
}

function readConstant(name: string, declaration: VariableDeclaration): ApiSymbol {
    const statement = declaration.getVariableStatement();
    return {
        description: statement ? readDoc(statement).description : "",
        kind: "constant",
        name,
        signature: `const ${name}: ${cleanType(declaration.getTypeNode()?.getText() ?? declaration.getType().getText(declaration))};`
    };
}

function isInternal(declaration: Node): boolean {
    return Node.isJSDocable(declaration) && readDoc(declaration).internal;
}

/** Reads everything a `public-api.ts` exports. A name exported as both a type and a value appears once. */
export function readEntryPoint(sourceFile: SourceFile, isPublicClass: IsPublicClass = () => false): ApiSymbol[] {
    const symbols: ApiSymbol[] = [];
    for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
        const declaration = declarations.at(0);
        // Styling exports are derived from the inputs, which the reference already lists.
        if (!declaration || isInternal(declaration) || /Variant(Input|Props)$/.test(name)) {
            continue;
        }
        if (declaration instanceof ClassDeclaration) {
            symbols.push(readClass(name, declaration, isPublicClass));
        } else if (declaration instanceof InterfaceDeclaration) {
            symbols.push(readInterface(name, declaration));
        } else if (declaration instanceof TypeAliasDeclaration) {
            symbols.push(readTypeAlias(name, declaration));
        } else if (declaration instanceof EnumDeclaration) {
            symbols.push(readEnum(name, declaration));
        } else if (declaration instanceof FunctionDeclaration) {
            symbols.push(readFunction(name, declaration));
        } else if (declaration instanceof VariableDeclaration) {
            symbols.push(readConstant(name, declaration));
        }
    }
    return symbols;
}

export function createLibraryProject(libraryDirectory: string): Project {
    return new Project({ tsConfigFilePath: `${libraryDirectory}/tsconfig.lib.json` });
}

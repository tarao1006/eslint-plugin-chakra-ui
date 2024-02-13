"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "requireSpecificComponentRule", {
    enumerable: true,
    get: function() {
        return requireSpecificComponentRule;
    }
});
const _utils = require("@typescript-eslint/utils");
const _isChakraElement = require("../lib/isChakraElement");
const _getImportDeclaration = require("../lib/getImportDeclaration");
const _findSpecificComponent = require("../lib/findSpecificComponent");
const _eslintutils = require("@typescript-eslint/utils/eslint-utils");
const requireSpecificComponentRule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforces the usage of specific Chakra component.",
            recommended: "recommended",
            requiresTypeChecking: true,
            url: "https://github.com/yukukotani/eslint-plugin-chakra-ui/blob/main/docs/rules/require-specific-component.md"
        },
        messages: {
            requireSpecificComponent: "'{{invalidComponent}}' with attribute '{{attribute}}' could be replaced by '{{validComponent}}'."
        },
        schema: [],
        fixable: "code"
    },
    defaultOptions: [],
    create: (ctx)=>{
        const { report, getSourceCode } = ctx;
        const parserServices = (0, _eslintutils.getParserServices)(ctx, false);
        return {
            JSXOpeningElement (node) {
                if (!(0, _isChakraElement.isChakraElement)(node, parserServices)) {
                    return;
                }
                const sourceCode = getSourceCode();
                const componentName = sourceCode.getText(node.name);
                if (componentName !== "Box") {
                    return;
                }
                for (const attribute of node.attributes){
                    if (attribute.type !== _utils.AST_NODE_TYPES.JSXAttribute || attribute.value == null) {
                        continue;
                    }
                    const specificComponent = (0, _findSpecificComponent.findSpecificComponent)(componentName, sourceCode.getText(attribute.name), sourceCode.getText(attribute.value));
                    if (specificComponent == null) {
                        continue;
                    }
                    return report({
                        node: node,
                        messageId: "requireSpecificComponent",
                        data: {
                            invalidComponent: componentName,
                            validComponent: specificComponent,
                            attribute: sourceCode.getText(attribute)
                        },
                        fix (fixer) {
                            const renameStartTag = fixer.replaceText(node.name, specificComponent);
                            return [
                                renameStartTag,
                                createFixToRenameEndTag(node, specificComponent, fixer),
                                createFixToRemoveAttribute(attribute, node, fixer),
                                createFixToInsertImport(node, specificComponent, parserServices, fixer)
                            ].filter((v)=>!!v);
                        }
                    });
                }
            }
        };
    }
};
function createFixToRenameEndTag(jsxNode, validComponent, fixer) {
    var _jsxNode_parent;
    const endNode = (_jsxNode_parent = jsxNode.parent) === null || _jsxNode_parent === void 0 ? void 0 : _jsxNode_parent.closingElement;
    return endNode ? fixer.replaceText(endNode.name, validComponent) : null;
}
function createFixToRemoveAttribute(attribute, jsxNode, fixer) {
    const attributeIndex = jsxNode.attributes.findIndex((a)=>a === attribute);
    if (attributeIndex === 0 && jsxNode.attributes.length === 1) {
        // in case of only one attribute
        // remove attribute and extra space
        const startAttributeRangeWithSpaces = jsxNode.name.range[1];
        const tagCloserLength = jsxNode.selfClosing ? attribute.loc.end.line <= jsxNode.loc.end.line ? 3 // `\n/>`
         : 2 // `/>`
         : 1; // `>`
        const endAttributeRangeWithSpaces = jsxNode.range[1] - tagCloserLength;
        return fixer.removeRange([
            startAttributeRangeWithSpaces,
            endAttributeRangeWithSpaces
        ]);
    }
    if (attributeIndex === jsxNode.attributes.length - 1) {
        // in case of last attribute
        const prevAttribute = jsxNode.attributes[attributeIndex - 1];
        return fixer.removeRange([
            prevAttribute.range[1],
            attribute.range[1]
        ]);
    } else {
        const nextAttribute = jsxNode.attributes[attributeIndex + 1];
        return fixer.removeRange([
            attribute.range[0],
            nextAttribute.range[0]
        ]);
    }
}
function createFixToInsertImport(jsxNode, validComponent, parserServices, fixer) {
    const importDecl = (0, _getImportDeclaration.getImportDeclarationOfJSX)(jsxNode, parserServices);
    if (!importDecl) {
        throw new Error("No ImportDeclaration found.");
    }
    const sameNameSpecifier = importDecl.specifiers.find((sp)=>sp.type === _utils.AST_NODE_TYPES.ImportSpecifier && sp.local.name === validComponent);
    if (sameNameSpecifier != null) {
        // in case of already imported
        return null;
    }
    const last = importDecl.specifiers[importDecl.specifiers.length - 1];
    if (importDecl.loc.start.line !== last.loc.start.line) {
        // in case of multi line
        const indent = " ".repeat(last.loc.start.column);
        return fixer.insertTextAfter(last, `,\n${indent}${validComponent}`);
    } else {
        return fixer.insertTextAfter(last, `, ${validComponent}`);
    }
}

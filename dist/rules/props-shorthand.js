"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "propsShorthandRule", {
    enumerable: true,
    get: function() {
        return propsShorthandRule;
    }
});
const _utils = require("@typescript-eslint/utils");
const _isChakraElement = require("../lib/isChakraElement");
const _getShorthand = require("../lib/getShorthand");
const _eslintutils = require("@typescript-eslint/utils/eslint-utils");
const propsShorthandRule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforces the usage of shorthand Chakra component props.",
            recommended: "recommended",
            requiresTypeChecking: true,
            url: "https://github.com/yukukotani/eslint-plugin-chakra-ui/blob/main/docs/rules/props-shorthand.md"
        },
        messages: {
            enforcesShorthand: "Prop '{{invalidName}}' could be replaced by the '{{validName}}' shorthand.",
            enforcesNoShorthand: "Shorthand prop '{{invalidName}}' could be replaced by the '{{validName}}'."
        },
        schema: [
            {
                type: "object",
                properties: {
                    noShorthand: {
                        type: "boolean",
                        default: false
                    },
                    applyToAllComponents: {
                        type: "boolean",
                        default: false
                    }
                }
            }
        ],
        fixable: "code"
    },
    defaultOptions: [
        {}
    ],
    create: (ctx)=>{
        const { report, getSourceCode, options } = ctx;
        const { noShorthand = false, applyToAllComponents = false } = options[0] || {};
        const parserServices = !applyToAllComponents ? (0, _eslintutils.getParserServices)(ctx, false) : undefined;
        return {
            JSXOpeningElement (node) {
                if (parserServices && !(0, _isChakraElement.isChakraElement)(node, parserServices)) {
                    return;
                }
                for (const attribute of node.attributes){
                    if (attribute.type !== _utils.AST_NODE_TYPES.JSXAttribute) {
                        continue;
                    }
                    const sourceCode = getSourceCode();
                    const componentName = sourceCode.getText(node.name);
                    const propName = attribute.name.name.toString();
                    const newPropName = noShorthand ? (0, _getShorthand.getNonShorthand)(componentName, propName) : (0, _getShorthand.getShorthand)(componentName, propName);
                    if (newPropName) {
                        report({
                            node: node,
                            messageId: noShorthand ? "enforcesNoShorthand" : "enforcesShorthand",
                            data: {
                                invalidName: propName,
                                validName: newPropName
                            },
                            fix (fixer) {
                                const sourceCode = getSourceCode();
                                const newAttributeText = getAttributeText(attribute, newPropName, sourceCode);
                                return fixer.replaceText(attribute, newAttributeText);
                            }
                        });
                    }
                }
            }
        };
    }
};
function getAttributeText(attribute, key, sourceCode) {
    if (attribute.value) {
        const valueText = sourceCode.getText(attribute.value);
        return `${key}=${valueText}`;
    } else {
        return key;
    }
}

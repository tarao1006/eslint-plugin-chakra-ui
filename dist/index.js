"use strict";
const _propsorder = require("./rules/props-order");
const _propsshorthand = require("./rules/props-shorthand");
const _requirespecificcomponent = require("./rules/require-specific-component");
module.exports = {
    rules: {
        "props-order": _propsorder.propsOrderRule,
        "props-shorthand": _propsshorthand.propsShorthandRule,
        "require-specific-component": _requirespecificcomponent.requireSpecificComponentRule
    }
};

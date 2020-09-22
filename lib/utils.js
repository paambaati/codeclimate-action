"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areObjectsEqual = exports.getOptionalString = void 0;
const core_1 = require("@actions/core");
exports.getOptionalString = (name, defaultValue = '') => core_1.getInput(name, { required: false }) || defaultValue;
exports.areObjectsEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

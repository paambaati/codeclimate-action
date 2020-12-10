"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areObjectsEqual = exports.getOptionalString = void 0;
const core_1 = require("@actions/core");
const getOptionalString = (name, defaultValue = '') => core_1.getInput(name, { required: false }) || defaultValue;
exports.getOptionalString = getOptionalString;
const areObjectsEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);
exports.areObjectsEqual = areObjectsEqual;

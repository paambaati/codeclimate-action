"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
exports.getOptionalString = (name, def = '') => core_1.getInput(name, { required: false }) || def;
exports.areObjectsEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

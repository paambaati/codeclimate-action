import { getInput } from '@actions/core';

export const getOptionalString = (name: string, defaultValue = '') =>
  getInput(name, { required: false }) || defaultValue;

export const areObjectsEqual = (
  obj1: object | [],
  obj2: object | []
): boolean => JSON.stringify(obj1) === JSON.stringify(obj2);

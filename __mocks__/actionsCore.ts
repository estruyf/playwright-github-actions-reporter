// @actions/core v3 is ESM-only and cannot be resolved by Jest
export const info = jest.fn();
export const warning = jest.fn();
export const error = jest.fn();
export const setFailed = jest.fn();
export const setOutput = jest.fn();
export const summary = {};

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.camelCase = camelCase;
var snakeCaseRe = /_([a-z])/g;
function camelCase(str) {
  return str.replace(snakeCaseRe, function (_m, l) {
    return l.toUpperCase();
  });
}
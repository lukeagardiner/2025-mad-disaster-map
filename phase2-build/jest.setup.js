// mocks XMLHttpRequest as jest runs in node

global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
global.Blob = global.Blob || function () {};
global.File = global.File || function () {};
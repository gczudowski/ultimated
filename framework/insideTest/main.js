require('babel-register')({
    "presets": ["es2015", "es2016", "stage-2"]
});

require('babel-polyfill');

require('./testsEntryPoint');
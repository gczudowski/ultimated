require('babel-register')({
    "presets": ["es2015", "es2016", "stage-2"],
    "plugins": [
        ["babel-root-slash-import", {
            "rootPathSuffix": ".ultimated/tests"
        }]
    ]
});

require('babel-polyfill');

require('./testsEntryPoint');
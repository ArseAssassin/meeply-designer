var OFF = 0, WARN = 1, ERROR = 2;

module.exports = exports = {
    "env": {
    },

    "globals": {
        "React": false,
        "log": false,
        "r": false,
        "threadLast": false,
        "words": false,
        "modifiersToClass": false,
        "Group": false,
        "VGroup": false,
        "HGroup": false,
        "switchboard": false,
        "kefir": false,
        "routes": false,
        "Icon": false,
        "cancel": false,
        "withName": false
    },

    "extends": "react-app",

    "rules": {
        "import/no-webpack-loader-syntax": 0,
        "react/jsx-no-undef": 0
    }
};

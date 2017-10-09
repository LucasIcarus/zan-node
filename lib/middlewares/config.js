'use strict';

var _defaultsDeep = require('lodash/defaultsDeep');

var _defaultsDeep2 = _interopRequireDefault(_defaultsDeep);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

module.exports = function (config = {}) {
    const CONFIG_PATH = config.CONFIG_PATH;
    const NODE_ENV = config.NODE_ENV;
    let defaultConfig = {};
    let envConfig = {};

    if (_fs2.default.existsSync(`${CONFIG_PATH}/common.js`)) {
        defaultConfig = require(`${CONFIG_PATH}/common.js`);
    } else if (_fs2.default.existsSync(`${CONFIG_PATH}/config.default.js`)) {
        defaultConfig = require(`${CONFIG_PATH}/config.default.js`);
    }

    if (_fs2.default.existsSync(`${CONFIG_PATH}/config.${NODE_ENV}.js`)) {
        envConfig = require(`${CONFIG_PATH}/config.${NODE_ENV}.js`);
    }

    const obj = (0, _defaultsDeep2.default)({}, envConfig, defaultConfig);
    return (() => {
        var _ref = _asyncToGenerator(function* (ctx, next) {
            ctx.getConfig = function (name) {
                let arr = name.split('.');
                let result = obj;
                let i = 0;
                while (arr[i]) {
                    result = result[arr[i]];
                    i++;
                }
                return result;
            };
            yield next();
        });

        return function (_x, _x2) {
            return _ref.apply(this, arguments);
        };
    })();
};
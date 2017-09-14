'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _util = require('../lib/util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const routerDebug = (0, _debug2.default)('zan:router');

function getAllControllers(basePath, controllers = {}) {
    const items = _fs2.default.readdirSync(basePath).filter(item => {
        return item.indexOf('.') !== 0;
    });

    for (let i = 0; i < items.length; i++) {
        let absolutePath = _path2.default.join(basePath, items[i]);
        let stat = _fs2.default.statSync(absolutePath);
        if (stat.isDirectory()) {
            getAllControllers(absolutePath, controllers);
        } else if (stat.isFile() && items[i].indexOf('.js') === items[i].length - 3) {
            let requireContent = require(absolutePath);
            let key = absolutePath.split('controllers/')[1];

            if ((0, _isFunction2.default)(requireContent)) {
                controllers[key] = {
                    controller: new requireContent()
                };
            } else if ((0, _isPlainObject2.default)(requireContent) && requireContent.default) {
                if ((0, _isFunction2.default)(requireContent.default)) {
                    controllers[key] = {
                        controller: new requireContent.default()
                    };
                } else {
                    controllers[key] = {
                        controller: requireContent.default
                    };
                }
            } else {
                controllers[key] = {
                    controller: requireContent
                };
            }
        }
    }

    return controllers;
};

/**
 * .json 结尾的表示接口请求
 * .html 或无后缀的表示页面请求
 */
module.exports = config => {
    let controllers = getAllControllers(config.CONTROLLERS_PATH);
    routerDebug(controllers);

    return (() => {
        var _ref = _asyncToGenerator(function* (ctx, next) {
            let requestDesc = (0, _util.parseRequest)(ctx);

            routerDebug(requestDesc);
            if (controllers[requestDesc.file] && controllers[requestDesc.file].controller[requestDesc.funcName]) {
                yield controllers[requestDesc.file].controller[requestDesc.funcName](ctx, next);
            } else {
                yield next();
            }
        });

        return function (_x, _x2) {
            return _ref.apply(this, arguments);
        };
    })();
};
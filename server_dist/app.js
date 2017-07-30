'use strict';

var _zan = require('@youzan/zan');

var _zan2 = _interopRequireDefault(_zan);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * CDN_PATH 静态资源 CDN 域名
 * VERSION_LIST version 文件配置列表
 */
const config = {
    SERVER_ROOT: __dirname,
    NODE_PORT: 8201,
    STATIC_PATH: '../static/local/',
    KEYS: ['your-key', 'your-secret'],
    CDN_PATH: '//b.yzcdn.cn',
    VERSION_LIST: ['./config/version_css.json', './config/version_wap_css.json', './config/version_js.json', './config/version_wap_js.json'],
    beforeLoadMiddlewares() {}
};

let zan = new _zan2.default(config);
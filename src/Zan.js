import path from 'path';
import fs from 'fs';
import Koa from 'koa';
import debug from 'debug';
import defaultsDeep from 'lodash/defaultsDeep';
import uniq from 'lodash/uniq';
import ip from 'ip';
import boxen from 'boxen';
import middlewares from './config/middlewares';
import router from './middlewares/router';
import router2 from './middlewares/router2';
import router3 from './middlewares/router3';
import pkg from '../package.json';
import BusinessError from './base/BusinessError';
import ParamsError from './base/ParamsError';
import Validator from './base/Validator';
import Controller from './base/Controller';
import Service from './base/Service';
import Router from 'koa-router';
import viewEnv from './middlewares/nunjucks/env';
import rewrite from './middlewares/rewrite';

class Zan {

    get defaultConfig() {
        return {
            KEYS: ['im a newer secret', 'i like turtle'],
            NODE_ENV: this.NODE_ENV,
            NODE_PORT: this.NODE_PORT,
            FAVICON_PATH: path.join(this.SERVER_ROOT, 'favicon.ico'),
            STATIC_PATH: path.join(this.SERVER_ROOT, '../static'),
            CODE_PATH: path.join(this.SERVER_ROOT, 'constants/code.js'),
            CONFIG_PATH: path.join(this.SERVER_ROOT, 'config'),
            SEO_PATH: path.join(this.SERVER_ROOT, 'constants/site.js'),
            VIEW_PATH: path.join(this.SERVER_ROOT, 'views'),
            ROUTERS_PATH: path.join(this.SERVER_ROOT, 'routes'),
            CONTROLLERS_PATH: path.join(this.SERVER_ROOT, 'controllers'),
            XSS_WHITELISTS: [],
            CDN_PATH: '//www.cdn.com',
            beforeLoadMiddlewares() {},
            MIDDLEWARES_PATH: path.join(this.SERVER_ROOT, 'middlewares'),
            // iron 目录结构
            IRON_DIR: false,
            SRC_PATH: path.join(this.SERVER_ROOT, 'src')
        };
    }

    constructor(config) {
        this.config = config || {};
        this.NODE_ENV = process.env.NODE_ENV || this.config.NODE_ENV || 'development';
        this.NODE_PORT = process.env.NODE_PORT || this.config.NODE_PORT || 8201;
        let defaultServerRoot;
        if (this.NODE_ENV === 'development') {
            defaultServerRoot = path.join(process.cwd(), 'server');
        } else {
            defaultServerRoot = path.join(process.cwd(), 'server_dist');
        }
        this.config.SERVER_ROOT = this.config.SERVER_ROOT || defaultServerRoot;
        this.SERVER_ROOT = this.config.SERVER_ROOT;
        if (this.config.STATIC_PATH) {
            this.config.STATIC_PATH = path.join(this.SERVER_ROOT, this.config.STATIC_PATH);
        }
        this.config.ZAN_VERSION = pkg.version;
        this.config = defaultsDeep({}, config, this.defaultConfig);
        this.middlewares = middlewares(this.config);

        this.app = new Koa();
        this.app.config = this.config;
        this.app.keys = this.config.KEYS;
        this.app.env = this.NODE_ENV;

        this.loadVersionMap();
        this.run();

        return this;
    }

    // 自动加载静态资源 Version 文件
    loadVersionMap() {
        let versionFiles = fs.readdirSync(this.config.CONFIG_PATH)
            .filter((item) => {
                return /^version.*\.json$/.test(item);
            });
        let VERSION_LIST = [];
        let VERSION_MAP = {};
        for (let i = 0; i < versionFiles.length; i++) {
            VERSION_LIST[i] = path.join(this.config.CONFIG_PATH, versionFiles[i]);
        }

        for (let i = 0; i < VERSION_LIST.length; i++) {
            let parsed = path.parse(VERSION_LIST[i]);
            VERSION_MAP[parsed.name] = require(VERSION_LIST[i]);
        }

        this.config.VERSION_MAP = VERSION_MAP;
        this.config.VERSION_LIST = VERSION_LIST;
    }

    // 自动加载业务中间件
    // >= 0.0.17 自动加载
    // 低版本 手动在 server/app.js 下配置
    autoLoadMiddlewares() {
        const middlewareDebug = debug('zan:middleware');
        const middlewares = require(this.config.MIDDLEWARES_PATH);
        if (Array.isArray(middlewares)) {
            for (let i = 0; i < middlewares.length; i++) {
                this.middlewares.push({
                    name: middlewares[i].name || 'anonymous',
                    fn: middlewares[i]
                });
            }
        } else {
            this.config.beforeLoadMiddlewares.call(this);
        }

        for (let i = 0; i < this.middlewares.length; i++) {
            middlewareDebug(this.middlewares[i].name);
            this.app.use(this.middlewares[i].fn);
        }
    }

    run() {
        this.autoLoadMiddlewares();

        router({
            app: this.app,
            path: this.config.ROUTERS_PATH
        });
        if (this.config.IRON_DIR) {
            this.app.use(router3(this.config));
        } else {
            this.app.use(router2(this.config));
        }

        let defaultErrorCallback = (err) => {
            console.log('<ERROR>');
            console.log(err);
        };

        this.app.on('error', this.config.ERROR_CALLBACK || defaultErrorCallback);

        this.app.listen(this.NODE_PORT, () => {
            if (this.NODE_ENV === 'development') {
                let msg = `服务启动成功!

- Zan框架版本：         ${pkg.version}
- NODE_ENV:             ${this.NODE_ENV}
- NODE_PORT:            ${this.NODE_PORT}
- Local:                http://127.0.0.1:${this.NODE_PORT}
- On Your Network:      http://${ip.address()}:${this.NODE_PORT}`;
                if (process.env.HTTP_PROXY && process.env.HTTPS_PROXY) {
                    msg += `\n- HTTP_PROXY            ${process.env.HTTP_PROXY}`;
                    msg += `\n- HTTPS_PROXY           ${process.env.HTTPS_PROXY}`;
                }
                console.log(boxen(msg, {
                    padding: {
                        left: 2,
                        right: 2,
                        top: 0,
                        bottom: 1
                    },
                    margin: 1,
                    borderColor: 'green',
                    borderStyle: 'classic'
                }));
            } else {
                console.log(`NODE_ENV = ${this.NODE_ENV}`);
                console.log(`NODE_PORT = ${this.NODE_PORT}`);
            }
        });
    }
}

exports.BusinessError = BusinessError;
exports.ParamsError = ParamsError;
exports.Validator = Validator;
exports.validator = new Validator();
exports.router = new Router();
exports.Controller = Controller;
exports.Service = Service;
exports.viewEnv = viewEnv;
exports.rewrite = rewrite;

export default Zan;
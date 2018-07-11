"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
*	Types modules.
*	Contain all new interface for the entire program
*/
const logger_1 = require("../lib/logger");
function isStringMap(obj) {
    if (typeof (obj) != 'object')
        return false;
    for (let key in obj) {
        if (typeof (key) != 'string')
            return false;
        if (typeof (obj[key]) != 'string')
            return false;
    }
    return true;
}
exports.isStringMap = isStringMap;
function isClientConfig(obj) {
    if (typeof (obj) != 'object') {
        logger_1.logger.log('error', `Client config content is not an "object" type`);
        return false;
    }
    if (Object.keys(obj).length !== 2) {
        logger_1.logger.log('error', `Number of keys is not correct: ${Object.keys(obj).length} given, 2 expected`);
        return false;
    }
    if (!obj.hasOwnProperty('warehouseAddress')) {
        logger_1.logger.log('error', `Missing key in config server file: "warehouseAddress"`);
        return false;
    }
    if (!obj.hasOwnProperty('portSocket')) {
        logger_1.logger.log('error', `Missing key in config server file: "portSocket"`);
        return false;
    }
    for (let key in obj) {
        if (typeof (key) != 'string') {
            logger_1.logger.log('error', `Key "${key}" is not a string format`);
            return false;
        }
        if (key === 'portSocket') {
            if (typeof (obj[key]) != 'number') {
                logger_1.logger.log('error', `Key "${key}" value is not a number format`);
                return false;
            }
        }
        else {
            if (typeof (obj[key]) != 'string') {
                logger_1.logger.log('error', `Key "${key}" value is not a string format`);
                return false;
            }
        }
    }
    return true;
}
exports.isClientConfig = isClientConfig;
function isServerConfig(obj) {
    if (typeof (obj) !== 'object') {
        logger_1.logger.log('error', `Server config content is not an "object" type`);
        return false;
    }
    if (Object.keys(obj).length !== 9) {
        logger_1.logger.log('error', `Number of keys is not correct: ${Object.keys(obj).length} given, 9 expected`);
        return false;
    }
    if (!obj.hasOwnProperty('previousCacheDir')) {
        logger_1.logger.log('error', `Missing key in config server file: "previousCacheDir"`);
        return false;
    }
    if (!obj.hasOwnProperty('accountDBName')) {
        logger_1.logger.log('error', `Missing key in config server file: "accountDBName"`);
        return false;
    }
    if (!obj.hasOwnProperty('password')) {
        logger_1.logger.log('error', `Missing key in config server file: "password"`);
        return false;
    }
    if (!obj.hasOwnProperty('databaseName')) {
        logger_1.logger.log('error', `Missing key in config server file: "databaseName"`);
        return false;
    }
    if (!obj.hasOwnProperty('databaseAddress')) {
        logger_1.logger.log('error', `Missing key in config server file: "databaseAddress"`);
        return false;
    }
    if (!obj.hasOwnProperty('portCouch')) {
        logger_1.logger.log('error', `Missing key in config server file: "portCouch"`);
        return false;
    }
    if (!obj.hasOwnProperty('portExpress')) {
        logger_1.logger.log('error', `Missing key in config server file: "portExpress"`);
        return false;
    }
    if (!obj.hasOwnProperty('portSocket')) {
        logger_1.logger.log('error', `Missing key in config server file: "portSocket"`);
        return false;
    }
    if (!obj.hasOwnProperty('warehouseAddress')) {
        logger_1.logger.log('error', `Missing key in config server file: "warehouseAddress"`);
        return false;
    }
    for (let key in obj) {
        if (typeof (key) != 'string') {
            logger_1.logger.log('error', `Key "${key}" is not a string format`);
            return false;
        }
        if (key === 'portCouch' || key === 'portExpress' || key === 'portSocket') {
            if (typeof (obj[key]) != 'number') {
                logger_1.logger.log('error', `Key "${key}" value is not a number format`);
                return false;
            }
        }
        else if (key === 'previousCacheDir') {
            if (!Array.isArray(obj[key])) {
                logger_1.logger.log('error', `Key "${key}" value is not an array format`);
                return false;
            }
        }
        else {
            if (typeof (obj[key]) != 'string') {
                logger_1.logger.log('error', `Key "${key}" value is not a string format`);
                return false;
            }
        }
    }
    return true;
}
exports.isServerConfig = isServerConfig;

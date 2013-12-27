var Class = require('js-class');

/** @class
 * @description A single App being monitored
 */
var MonitoredApp = Class({
    constructor: function (appEntity, monitor) {
        this._entity = appEntity;
        this._monitor = monitor;
    },

    /** @function
     * @description put App to running state
     */
    start: function () {

    },

    /** @function
     * @description put App to stopped state
     */
    stop: function () {

    },

    /** @function
     * @description check if anything changed for the App
     */
    update: function (appEntity) {

    },

    /** @function
     * @description stop monitoring the App
     */
    detach: function () {

    }
});

module.exports = MonitoredApp;

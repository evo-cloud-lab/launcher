var Class  = require('js-class'),
    neuron = require('evo-neuron'),
    idioms = require('evo-idioms'),

    AppMonitor = require('./AppMonitor');

var Program = Class(neuron.Program, {
    constructor: function () {
        neuron.Program.prototype.constructor.call(this, 'monitor', {
            neuron: {
                connects: ['connector', 'cubes', 'governor', 'ambience']
            }
        });
        this.connector = new idioms.ConnectorClient(this.neuron);
        this.appmonitor = new AppMonitor(this);
    }
}, {
    statics: {
        run: function () {
            new Program().run();
        }
    }
});

module.exports = Program;

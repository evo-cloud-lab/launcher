var Class    = require('js-class'),
    async    = require('js-class'),
    elements = require('evo-elements'),
    Utils      = elements.Utils,
    DelayedJob = elements.DelayedJob,
    idioms   = require('evo-idioms'),

    MonitoredApp = require('./MonitoredApp');

var AppMonitor = Class({
    constructor: function (program) {
        this.connector = program.connector;
        this.logger = program.logger;

        this._entities = new idioms.EntityStore(program.neuron);

        this._apps = new idioms.PartitionDict(
            new idioms.PartitionMonitor(this.connector, 'apps'),
            this.onPartitionsChanged.bind(this)
        );

        // _scanJob keeps scanning apps in the background periodically
        this._scanJob = new DelayedJob(
            this._scanApps.bind(this),
            program.options['scan-interval'] || 3000
        );

        // _partitioner is used for master mode
        this._partitioner = new idioms.ClusterPartitioner('apps');

        this._states = new idioms.ConnectorStates(this.connector, {
            master: {
                update: this._masterUpdate
            },
            member: {
                update: this._memberUpdate
            },
            context: this
        });
        this._states.start();
    },

    onPartitionsChanged: function (removals) {
        removals.forEach(function (dict) {
            for (var key in dict) {
                dict[key].detach();
            }
        });
        this._apps.commitToMonitor();
        this._scanJob.reschedule(0);
    },

    _scanApps: function (done) {
        if (this._apps.partCount <= 0) {
            done();
            return;
        }

        // TODO incremental scan instead of full scan

        this._entities.partitionScan('apps',
                                     this._apps.parts.begin,
                                     this._apps.parts.count,
                                     function (err, apps) {
            async.series([
                function (next) {
                    !err && Array.isArray(apps) ? this._processApps(apps, next) : next();
                }.bind(this),
            ], function () {
                this._scanJob.schedule();
                done();
            }.bind(this));
        }.bind(this));
    },

    _processApps: function (apps, done) {
        apps = apps.filter(function (app) {
            return app.data.state == 'active';
        }).reduce(function (result, app) {
            result[app.id] = app;
            return result;
        }, {});
        var monitoredApps = this._apps.select();
        var changes = Utils.diff(Object.keys(monitoredApps), Object.keys(apps), { common: true });
        changes[0].forEach(function (appId) {
            monitoredApps[appId].stop();
        });
        changes[1].forEach(function (appId) {
            this._startApp(apps[appId]);
        }, this);
        changes[2].forEach(function (appId) {
            monitoredApps[appId].update(apps[appId]);
        });
        done();
    },

    _startApp: function (app) {
        new MonitoredApp(app, this).start();
    },

    _clusterUpdated: function (clusterInfo) {

    },

    _masterUpdate: function (clusterInfo) {
        var states = this._partitioner.partition(clusterInfo);
        states && this.connector.expects(states);
        this._clusterUpdated(clusterInfo);
    },

    _memberUpdate: function (clusterInfo) {
        this._clusterUpdated(clusterInfo);
    }
});

module.exports = AppMonitor;

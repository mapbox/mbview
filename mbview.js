var express = require('express');
var app = express();
var MBTiles = require('mbtiles');
var path = require('path');
var q = require('d3-queue').queue();
var utils = require('./utils');
var objectAssign = require('object-assign');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

var tilesets = {};

module.exports = {

    loadTiles: function (file, config, callback) {
        new MBTiles(file, function(err, tiles) {
            if (err) throw err;
            tiles.getInfo(function (err, data) {
                if (err) throw err;
                if (!config.quiet) {
                    console.log('*** Metadata found in the MBTiles');
                    console.log(data);
                }
                // Save reference to tiles
                tilesets[data.name] = tiles;
                // Extends the configuration object with new parameters found
                config = objectAssign({}, config, utils.metadata(data));
                // d3-queue.defer pattern to return the result of the task
                callback(null, config);
            });
        });
    },

    /**
     * Defer loading of multiple MBTiles and spin up server.
     * Will conflate configurations found in the sources.
     * @param {Object} basic configuration, e.g. port
     * @param {Function} a callback with the server configuration loaded
     */
    serve: function (config, callback) {
        var loadTiles = this.loadTiles;
        var listen = this.listen;

        config.mbtiles.forEach(function (file) {
            if (!config.quiet) console.log('*** Reading from', file);
            q.defer(loadTiles, file, config);
        });
        q.awaitAll(function (error, configs) {
            if (error) throw error;
            if (!config.quiet) console.log('*** Config', config);

            var finalConfig = configs.reduce(function (prev, curr) {
              return utils.mergeConfigurations(prev, curr);
            }, {});

            listen(finalConfig, callback);
        });
    },

    listen: function (config, onListen) {
        app.get('/', function (req, res) {
            res.render('map', config);
        });

        app.get('/:source/:z/:x/:y.pbf', function (req, res) {
            var p = req.params;
            if (!config.quiet) console.log('Serving', p.z + '/' + p.x + '/' + p.y);

            tilesets[p.source].getTile(p.z, p.x, p.y, function (err, tile, headers) {
                if (err) {
                    res.end();
                } else {
                    if (!config.quiet) console.log(headers);
                    res.writeHead(200, headers);
                    res.end(tile);
                }
            });
        });

        config.server = app.listen(config.port, function () {
            onListen(null, config);
        });
    }
};

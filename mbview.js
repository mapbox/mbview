var express = require('express');
var app = express();
var MBTiles = require('mbtiles');
var path = require('path');
var q = require('d3-queue').queue();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

var tilesets = {};

module.exports = {

    loadTiles: function (file, config, callback) {
        var name = path.basename(file, '.mbtiles');

        new MBTiles(file, function(err, tiles) {
            if (err) throw err;
            tilesets[name] = tiles;

            tiles.getInfo(function (err, data) {
                if (err) throw err;
                if (!config.quiet) {
                    console.log('*** Metadata found in the MBTiles');
                    console.log(data);
                }

                // NOTE: final map config is taken from last loaded file
                config.maxzoom = data.maxzoom;
                config.zoom = data.center.pop();
                config.center = data.center;

                // Support multiple sources
                config.sources = config.sources || {};
                var key = data.id || name;
                config.sources[key] = {};
                // TODO: use array to support multiple layers
                config.sources[key].layers = data.vector_layers[0].id;

                // d3-queue.defer pattern to return the result of the task
                callback(null);
            });
        });
    },

    /**
     * Defer loading of multiple MBTiles and spin up server.
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
        q.await(function (error) {
            if (error) throw error;
            if (!config.quiet) console.log('*** Config', config);
            listen(config, callback);
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

        app.listen(config.port, function () {
            onListen(null, config);
        });
    }
};

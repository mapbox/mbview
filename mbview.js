var express = require('express');
var app = express();
var MBTiles = require('mbtiles');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

module.exports = {

    /**
     * Create a MBTiles interface, grab some metadata and spin up server.
     * @param {Object} basic configuration, e.g. port
     * @param {Function} a callback with the server configuration loaded
     */
    serve: function (config, callback) {
        if (!config.quiet) console.log('*** Reading from', config.mbtiles);
        var listen = this.listen;

        new MBTiles(config.mbtiles, function(err, tiles) {
            if (err) throw err;
            tiles.getInfo(function (err, data) {
                if (err) throw err;

                if (!config.quiet) {
                    console.log('*** Metadata found in the MBTiles');
                    console.log(data);
                }

                config.maxzoom = data.maxzoom;
                config.zoom = data.center.pop();
                config.center = data.center;
                config.sourceId = data.id;
                config.sourceLayer = data.vector_layers[0].id;

                listen(config, tiles, callback);
            });
        });
    },

    listen: function (config, tiles, onListen) {
        app.get('/', function (req, res) {
            res.render('map', config);
        });

        app.get('/debug/:z/:x/:y.pbf', function (req, res) {
            var p = req.params;
            if (!config.quiet) console.log('Serving', p.z + '/' + p.x + '/' + p.y);

            tiles.getTile(p.z, p.x, p.y, function (err, tile, headers) {
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

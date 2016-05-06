var argv = require('minimist')(process.argv.slice(2));

if (!argv.mbtiles) {
    console.log(usage());
    process.exit(1);
}

var express = require('express');
var app = express();
var MBTiles = require('mbtiles');
var path = require('path');
var tiles = null;
var config = {
    center: [-122.42709159851074, 37.75987547727969],
    port: argv.port || 3000,
    sourceLayer: path.basename(argv.mbtiles, '.mbtiles'),
    sourceId: 'default',
    zoom: 12
};

function usage () {
    var text = [];
    text.push('usage: node server.js [options]');
    text.push('');
    text.push(' --mbtiles path to mbtiles file');
    text.push(' --port sets port to use');
    text.push(' --help prints this message');
    text.push('');
    return text.join('\n');
}

function loadTiles(path) {
    console.log('*** Reading from', path);

    const mb = new MBTiles(path, function(err, mbtiles) {
        if (err) throw err;
        tiles = mbtiles;
        mbtiles.getInfo((err, data) => {
            if (err) throw err;
            console.log('*** Metadata found in the MBTiles');
            console.log(data);
            // MBTiles returns center as [lon, lat, zoom]
            config.zoom = data.center.pop();
            config.center = data.center;
            // SEE server input in console for more info on these params
            config.sourceId = data.id;
            config.sourceLayer = data.vector_layers[0].id;
        });
    });

}

app.get('/', (req, res) => {
    res.render('map', { config: config });
});

app.get('/debug/:z/:x/:y.pbf', (req, res) => {
    var p = req.params;
    console.log('Serving', p.z + '/' + p.x + '/' + p.y);
    tiles.getTile(p.z, p.x, p.y, (err, tile, headers) => {
        if (err) {
            console.error(err);
            res.end();
        } else {
            console.log(headers);
            res.setHeader('Content-Type', headers['Content-Type']);
            res.setHeader('Content-Encoding', headers['Content-Encoding']);
            res.setHeader('Last-Modified', headers['Last-Modified']);
            res.send(tile);
        }
    });
});

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.listen(config.port, function () {
    console.log('Listening on http://localhost:' + config.port);
    loadTiles(argv.mbtiles);
});

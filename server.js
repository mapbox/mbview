var argv = require('minimist')(process.argv.slice(2));
var express = require('express');
var app = express();
var MBTiles = require('mbtiles');
var tiles = null;
var port = argv.port || 3000;

if (!argv.mbtiles) {
    console.log(usage());
    process.exit(1);
}

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

/**
*
* References:
* https://github.com/mapbox/node-mbtiles/blob/master/lib/mbtiles.js#L149
*
*/
function loadTiles(path) {
    console.log('*** Reading from', path);

    const mb = new MBTiles(path, function(err, mbtiles) {
        if (err) throw err;
        tiles = mbtiles;
        mbtiles.getInfo((err, data) => {
            if (err) throw err;
            console.log('*** Metadata found in the MBTiles');
            console.log(data);
        });
    });

}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
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

app.listen(port, function () {
    console.log('Listening on http://localhost:' + port);
    loadTiles(argv.mbtiles);
});

var argv = require('minimist')(process.argv.slice(2));
var path = require('path');

if (!argv.mbtiles) {
    console.log(usage());
    process.exit(1);
}

function usage () {
    var text = [];
    text.push('usage: node cli.js [options]');
    text.push('');
    text.push(' --mbtiles path to mbtiles file');
    text.push(' --port sets port to use');
    text.push(' --help prints this message');
    text.push('');
    return text.join('\n');
}

var MBView = require('./mbview');
var params = {
    center: argv.center || [-122.42, 37.75],
    mbtiles: argv.mbtiles,
    port: argv.port || 3000,
    sourceLayer: argv.sourceLayer || path.basename(argv.mbtiles, '.mbtiles'),
    sourceId: 'default',
    zoom: 12
};

MBView.serve(params, function (err, config) {
    console.log('Listening on http://localhost:' + config.port);
});

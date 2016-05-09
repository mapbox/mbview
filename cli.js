#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var open = require('open');
var fs = require('fs');

var mbtiles = argv._;

if (!mbtiles.length) {
    console.log(usage());
    process.exit(1);
}

try {
    mbtiles.forEach(function (f) { fs.statSync(f).isFile() });
} catch(e) {
    return console.error(e);
}

argv.basemap = argv.basemap || argv.base || argv.map || 'dark';

function usage () {
    var text = [];
    text.push('usage: mbview [options] [files]');
    text.push('');
    text.push(' --port sets port to use (default: 3000)');
    text.push(' --quiet or -q supress all logging except the address to visit');
    text.push(' -n don\'t automatically open the browser on start');
    text.push(' --basemap or --base or --map sets the basemap style (default: dark)');
    text.push(' --help prints this message');
    text.push('');
    return text.join('\n');
}

var MBView = require('./mbview');

var params = {
    center: argv.center || [-122.42, 37.75],
    mbtiles: mbtiles,
    port: argv.port || 3000,
    zoom: 12,
    quiet: argv.q || argv.quiet,
    basemap: argv.basemap
};

MBView.serve(params, function (err, config) {
    console.log('Listening on http://localhost:' + config.port);
    if (!argv.n) open('http://localhost:' + config.port);
});

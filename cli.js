#!/usr/bin/env node

/* eslint-disable no-console */
'use strict';

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['n', 'quiet', 'q']
});
const open = require('open');
const fs = require('fs');
const utils = require('./utils');

const mbtiles = argv._;
const accessToken = argv.MapboxAccessToken ||
  process.env.MAPBOX_ACCESS_TOKEN ||
  process.env.MapboxAccessToken;

if (argv.version || argv.v) {
  console.log(utils.version());
  process.exit(0);
} else if (!mbtiles.length) {
  console.log(utils.usage());
  process.exit(1);
} else if (!accessToken) {
  console.log('missing access token, try `export MAPBOX_ACCESS_TOKEN=...`');
  process.exit(1);
}

try {
  mbtiles.forEach((f) => { fs.statSync(f).isFile(); });
} catch (e) {
  return console.error(e);
}

argv.basemap = argv.basemap || argv.base || argv.map || 'dark';


const MBView = require('./mbview');

const params = {
  center: argv.center || [-122.42, 37.75],
  mbtiles: mbtiles,
  port: argv.port || 3000,
  zoom: 12,
  quiet: argv.q || argv.quiet,
  basemap: argv.basemap,
  accessToken: accessToken
};

MBView.serve(params, (err, config) => {
  console.log('Listening on http://localhost:' + config.port);
  if (!argv.n) open('http://localhost:' + config.port);
});

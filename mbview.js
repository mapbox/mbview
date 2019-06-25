/* eslint-disable no-console */
'use strict';

const express = require('express');
const app = express();
const MBTiles = require('@mapbox/mbtiles');
const q = require('d3-queue').queue();
const utils = require('./utils');
const objectAssign = require('object-assign');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

module.exports = {

  /**
   * Load a tileset and return a reference with metadata
   * @param {object} file reference to the tileset
   * @param {function} callback that returns the resulting tileset object
   */
  loadTiles: function (file, callback) {
    new MBTiles(file, ((err, tiles) => {
      if (err) throw err;
      tiles.getInfo((err, info) => {
        if (err) throw err;

        const tileset = objectAssign({}, info, {
          tiles: tiles
        });

        callback(null, tileset);
      });
    }));
  },

  /**
  * Defer loading of multiple MBTiles and spin up server.
  * Will merge all the configurations found in the sources.
  * @param {object} config for the server, e.g. port
  * @param {function} callback with the server configuration loaded
  */
  serve: function (config, callback) {
    const loadTiles = this.loadTiles;
    const listen = this.listen;

    config.mbtiles.forEach((file) => {
      q.defer(loadTiles, file);
    });

    q.awaitAll((error, tilesets) => {
      if (error) throw error;
      const finalConfig = utils.mergeConfigurations(config, tilesets);
      listen(finalConfig, callback);
    });
  },

  listen: function (config, onListen) {
    const format = config.tiles._info.format;

    app.get('/', (req, res) => {
      if (format === 'pbf') {
        res.render('vector', config);
      } else {
        res.render('raster', config);
      }
    });

    app.get('/:source/:z/:x/:y.' + format, (req, res) => {
      const p = req.params;

      const tiles = config.sources[p.source].tiles;
      tiles.getTile(p.z, p.x, p.y, (err, tile, headers) => {
        if (err) {
          res.end();
        } else {
          res.writeHead(200, headers);
          res.end(tile);
        }
      });
    });

    config.server = app.listen(config.port, () => {
      onListen(null, config);
    });
  }
};

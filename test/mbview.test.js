var MBView = require('../mbview');
var test = require('tape').test;

test('mbview.loadTiles', function (t) {
  t.plan(3);

  var config = {};
  var tileset = __dirname + '/../examples/baja-highways.mbtiles';

  MBView.loadTiles(tileset, config, function (err, config) {
    var source = config.sources['baja-highways.mbtiles'];
    var center = [-117.037354, 32.537551];
    t.deepEqual(config.center, center, 'sets center');
    t.equal(config.maxzoom, 14, 'sets maxzoom');
    t.equal(source.layers, 'bajahighways', 'tileset has one layer');
  });
});

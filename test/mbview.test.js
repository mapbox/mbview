var MBView = require('../mbview');
var request = require('supertest');
var test = require('tape').test;

var server = null;

test('MBView.loadTiles', function (t) {
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

test('MBView.serve', function (t) {
  t.plan(4);

  var tileset = __dirname + '/../examples/baja-highways.mbtiles';
  var params = {
    basemap: 'dark',
    mbtiles: [tileset],
    port: 9000
  };

  MBView.serve(params, function (err, config) {
    t.error(err, 'should start server with no error');
    server = config.server;

    request('localhost:9000')
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function (err, res) {
        var match = res.text.match(/bajahighways-lines/)[0];
        t.true(match, 'loads a map with tileset layers');
      });

    request('localhost:9000')
      .get('/#14/32.5376/-117.0374')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function (err, res) {
        t.error(err, 'responds to Mapbox GL JS panning');
      });

    request('localhost:9000')
      .get('/baja-highways.mbtiles/14/2864/6624.pbf')
      .expect('Content-Type', 'application/x-protobuf')
      .end(function (err, res) {
        t.error(err, 'serves protobufs');
      });
  });
});

test('teardown', function (t) {
  server.close();
  t.end();
});


const MBView = require('../mbview');
const request = require('supertest');
const test = require('tape').test;

let server = null;

test('MBView.loadTiles', (t) => {
  t.plan(6);

  let mb = __dirname + '/../examples/baja-highways.mbtiles';

  MBView.loadTiles(mb, (err, tileset) => {
    const center = [-117.037354, 32.537551, 14];
    const layers = tileset.vector_layers;
    t.deepEqual(tileset.center, center, 'sets center');
    t.equal(tileset.maxzoom, 14, 'sets maxzoom');
    t.equal(layers[0].id, 'bajahighways', 'tileset has one layer');
  });

  mb = __dirname + '/fixtures/twolayers.mbtiles';
  MBView.loadTiles(mb, (err, tileset) => {
    const layers = tileset.vector_layers;
    t.true(tileset, 'loads tileset');
    t.equal(layers[0].id, 'hospitales', 'loads first layer');
    t.equal(layers[1].id, 'playas', 'loads second layer');
  });
});

test('MBView.serve', (t) => {
  t.plan(8);

  const params = {
    basemap: 'dark',
    mbtiles: [
      __dirname + '/../examples/baja-highways.mbtiles',
      __dirname + '/fixtures/twolayers.mbtiles',
      __dirname + '/fixtures/038.mbtiles'
    ],
    port: 9000,
    accessToken: 'pk.foo.bar'
  };

  MBView.serve(params, (err, config) => {
    const source = Object.keys(config.sources)[2];
    t.error(err, 'should start server with no error');
    server = config.server;

    request('localhost:9000')
      .get('/config.js')
      .expect('Content-Type', 'application/javascript; charset=UTF-8')
      .end((err, res) => {
        const { text } = res;
        console.log({ text });
        t.true(text.includes('bajahighways'), 'loads a map with lines from first tileset');
        t.true(text.includes('hospitales'), 'loads points from first layer in second tileset');
        t.true(text.includes('playas'), 'loads points from second layer in second tileset');
      });

    request('localhost:9000')
      .get('/#14/32.5376/-117.0374')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .end((err, res) => {
        t.true(res.text.includes('menu-container'), 'should have a menu');
        t.error(err, 'responds to Mapbox GL JS panning');
      });

    request('localhost:9000')
      .get('/baja-highways.mbtiles/14/2864/6624.pbf')
      .expect('Content-Type', 'application/x-protobuf')
      .end((err) => {
        t.error(err, 'serves protobufs for ' + source);
      });

    request('localhost:9000')
      .get('/' + source + '/14/2864/6624.pbf')
      .expect(200)
      .end((err) => {
        t.error(err, 'serves protobufs for ' + source);
      });
  });
});

test('teardown', (t) => {
  server.close();
  t.end();
});

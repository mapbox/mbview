var test = require('tape').test;
var fs = require('fs');
var utils = require('../utils');
var objectAssign = require('object-assign');

var fixtures = {
  metadata: JSON.parse(fs.readFileSync(__dirname + '/fixtures/metadata.json'))
};

function mockMetadata (name) {
  return objectAssign({}, fixtures.metadata, {
    basename: name + '.mbtiles',
    center: [32, -120, 14],
    name: name + '.mbtiles',
    vector_layers: [{ id: name }]
  });
}

test('mergeConfigurations', function (t) {
  var config = {
    port: 3000
  };

  var tilesets = [
    mockMetadata('sf02'),
    mockMetadata('sf03'),
    mockMetadata('sf04')
  ];

  var got = utils.mergeConfigurations(config, tilesets);
  var want = ['sf02.mbtiles', 'sf03.mbtiles', 'sf04.mbtiles'];

  t.equal(got.port, 3000, 'retains original configuration');
  t.equal(got.zoom, 14, 'got zoom level from first tileset');
  t.equal(got.center[0], 32, 'sets center from first tileset');
  t.deepEqual(Object.keys(got.sources), want, 'gets three sfs');
  t.equal(got.sources['sf03.mbtiles'].maxzoom, 14, 'metadata per source');

  t.end();
});

test('usage', function (t) {
  var got = utils.usage();
  t.true(got.match(/usage/), 'returns some instructions');
  t.true(got.length > 100, 'lots of instructions');
  t.end();
});

test('version', function (t) {
  var got = utils.version();
  t.true(got.match(/^\d+\.\d+\.\d+$/), 'finds basic semver in package.json');
  t.end();
});

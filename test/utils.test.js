var test = require('tape').test;
var fs = require('fs');
var utils = require('../utils');
var objectAssign = require('object-assign');

var fixtures = {
  metadata: JSON.parse(fs.readFileSync(__dirname + '/fixtures/metadata.json'))
};

function mockMetadata (name) {
  return objectAssign({}, fixtures.metadata, {
    name: name + '.mbtiles',
    vector_layers: [{ id: name }]
  });
}

test('metadata', function (t) {
  var metadata = utils.metadata(fixtures.metadata);
  var source = metadata.sources['sf-01.mbtiles'];
  var want = {
    description: '',
    fields: {},
    id: 'sf01',
    maxzoom: 14,
    minzoom: 0
  };
  t.equal(metadata.zoom, 14, 'grabs zoom from tileset center');
  t.deepEqual(source.layers[0], want, 'has a SF layer');
  t.end();
});

test('updateConfig', function (t) {
  var meta = utils.metadata;
  var mock = mockMetadata;
  var merg = utils.mergeConfigurations;

  var got = meta(mock('sf02'));
  got = merg(got, meta(mock('sf03')));
  got = merg(got, meta(mock('sf04')));
  var want = {
    'sf02.mbtiles': { layers: [ { id: 'sf02' } ] },
    'sf03.mbtiles': { layers: [ { id: 'sf03' } ] },
    'sf04.mbtiles': { layers: [ { id: 'sf04' } ] }
  };

  t.deepEqual(got.sources, want, 'gets three sfs');
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

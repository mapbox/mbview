var test = require('tape').test;
var fs = require('fs');
var utils = require('../utils');

const fixtures = {
  metadata: JSON.parse(fs.readFileSync(__dirname + '/fixtures/metadata.json'))
};

function mockMetadata (name) {
  return Object.assign({}, fixtures.metadata, {
    name: name + '.mbtiles',
    vector_layers: [{ id: name }]
  });
}

test('metadata', function (t) {
  var got = utils.metadata(fixtures.metadata);
  t.equal(got.zoom, 14, 'grabs zoom from tileset center');
  t.deepEqual(got.sources['sf-01.mbtiles'].layers, 'sf01', 'has a SF layer');
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
    'sf02.mbtiles': { layers: 'sf02' },
    'sf03.mbtiles': { layers: 'sf03' },
    'sf04.mbtiles': { layers: 'sf04' }
  };

  t.deepEqual(got.sources, want, 'gets three friscos');
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

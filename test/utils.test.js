var test = require('tape').test;
var utils = require('../utils');

test('version', function (t) {
  var got = utils.version();
  t.true(got.match(/^\d+\.\d+\.\d+$/), 'finds basic semver in package.json');
  t.end();
});

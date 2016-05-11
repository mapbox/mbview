var test = require('tape').test;
var utils = require('../utils');

test('version', function (t) {
  var got = utils.version();
  var want = '1.3.0';
  t.equal(got, want, 'finds 1.3.0 in package.json');
  t.end();
});

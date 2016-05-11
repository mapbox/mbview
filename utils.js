var fs = require('fs');

/**
 * Get module version from the package.json file
 * @return {String} version number
 */
module.exports.version = function () {
  var data = fs.readFileSync(__dirname + '/package.json');
  return JSON.parse(data).version;
};

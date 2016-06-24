var fs = require('fs');
var objectAssign = require('object-assign');

/**
 * Extract some metadata from MBTiles
 * TODO: use array to support multiple layers (as we do with sources)
 * @return {Object} the metadata we need for the viewer
 */
module.exports.metadata = function (data) {
  var meta = objectAssign({}, data);
  var res = {
    maxzoom: meta.maxzoom,
    zoom: meta.center.pop(),
    center: meta.center,
    sources: {}
  };
  res.sources[meta.name] = { layers: meta.vector_layers };
  return res;
};

/**
 * Merge configuration objects
 * Will not overwrite hash of sources
 * @param {Object} previous configuration
 * @param {Object} new configuration
 * @return {Object} updated config object w sources appended
 */
module.exports.mergeConfigurations = function (config, newConfig) {
  return objectAssign({}, config, newConfig, {
    sources: objectAssign({}, config.sources, newConfig.sources)
  });
};

/**
 * Get usage instructions
 * @return {String} the instructions to run this thing
 */
module.exports.usage = function () {
  var u = [];
  u.push('usage: mbview [options] [files]');
  u.push('');
  u.push(' --port sets port to use (default: 3000)');
  u.push(' --quiet or -q supress all logging except the address to visit');
  u.push(' -n don\'t automatically open the browser on start');
  u.push(' --basemap, --base or --map sets the basemap style (default: dark)');
  u.push(' --version returns module version');
  u.push(' --help prints this message');
  u.push('');
  return u.join('\n');
};

/**
 * Get module version from the package.json file
 * @return {String} version number
 */
module.exports.version = function () {
  var data = fs.readFileSync(__dirname + '/package.json');
  return JSON.parse(data).version;
};

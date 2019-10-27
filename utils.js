

const fs = require('fs');
const objectAssign = require('object-assign');
const dedent = require('dedent');

/**
 * Merge a configuration with tileset objects and
 * set 'smart' defaults based on these sources, e.g. center, zoom
 * @param {object} config passed to the mbview server
 * @param {array} tilesets of objects extracted from the mbtiles
 * @return {object} updated config object with sources appended
 */
module.exports.mergeConfigurations = function (config, tilesets) {
  const tilehash = tilesets.reduce((prev, curr) => {
    const c = {};
    c[curr.basename] = curr;
    return objectAssign({}, prev, c);
  }, {});
  const smart = objectAssign({}, config, tilesets[0]);
  const centerZoom = smart.center.pop();
  smart.zoom = smart.zoom || centerZoom;
  smart.center.push(smart.zoom);
  return objectAssign({}, smart, {
    sources: tilehash
  });
};

/**
 * Get usage instructions
 * @return {String} the instructions to run this thing
 */
module.exports.usage = function () {
  return dedent`
    usage: mbview [options] [files]
    
    --port sets port to use (default: 3000)
    --center sets the map center (default: "-122.42,37.75")
    --quiet or -q supress all logging except the address to visit
    -n don\'t automatically open the browser on start
    --basemap, --base or --map sets the basemap style (default: dark)
    --version returns module version
    --help prints this message
  `;
};

/**
 * Get module version from the package.json file
 * @return {String} version number
 */
module.exports.version = function () {
  const data = fs.readFileSync(__dirname + '/package.json');
  return JSON.parse(data).version;
};

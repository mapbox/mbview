/* global CENTER, ZOOM, BASEMAP, SOURCES, PORT, ACCESS_TOKEN */
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/assembly/dist/assembly.js' // loads svg sprites
import '@mapbox/assembly/dist/assembly.css'

if (ACCESS_TOKEN) mapboxgl.accessToken = ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: Boolean(ACCESS_TOKEN) && navigator.onLine && BASEMAP,
  center: CENTER,
  zoom: ZOOM,
  hash: true,
  maxZoom: 30
});

const layers = {
  pts: [],
  lines: [],
  polygons: [],
  raster: []
}

const lightColors = [
  'FC49A3', // pink
  'CC66FF', // purple-ish
  '66CCFF', // sky blue
  '66FFCC', // teal
  '00FF00', // lime green
  'FFCC66', // light orange
  'FF6666', // salmon
  'FF0000', // red
  'FF8000', // orange
  'FFFF66', // yellow
  '00FFFF'  // turquoise
];

function randomColor(colors) {
  const randomNumber = parseInt(Math.random() * colors.length);
  return colors[randomNumber];
}

map.on('load', function () {
  Object.entries(SOURCES).forEach(function ([sid, source]) {

    if (source.format === 'pbf' && source.vector_layers && source.vector_layers.length) {
      map.addSource(sid, {
        type: 'vector',
        tiles: [
          `http://localhost:${PORT}/${sid}/{z}/{x}/{y}.pbf`
        ],
        maxzoom: SOURCES[sid].maxzoom
      });

      (source.vector_layers || []).forEach(function (layer) {

        const layerColor = '#' + randomColor(lightColors);

        map.addLayer({
          'id': `${layer.id}-polygons`,
          'type': 'fill',
          'source': sid,
          'source-layer': layer.id,
          'filter': ["==", "$type", "Polygon"],
          'layout': {},
          'paint': {
            'fill-opacity': 0.1,
            'fill-color': layerColor
          }
        });

        map.addLayer({
          'id': `${layer.id}-polygons-outline`,
          'type': 'line',
          'source': sid,
          'source-layer': layer.id,
          'filter': ["==", "$type", "Polygon"],
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': layerColor,
            'line-width': 1,
            'line-opacity': 0.75
          }
        });

        map.addLayer({
          'id': `${layer.id}-lines`,
          'type': 'line',
          'source': sid,
          'source-layer': layer.id,
          'filter': ["==", "$type", "LineString"],
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': layerColor,
            'line-width': 1,
            'line-opacity': 0.75
          }
        });

        map.addLayer({
          'id': `${layer.id}-pts`,
          'type': 'circle',
          'source': sid,
          'source-layer': layer.id,
          'filter': ["==", "$type", "Point"],
          'paint': {
            'circle-color': layerColor,
            'circle-radius': 2.5,
            'circle-opacity': 0.75
          }
        });

        layers.polygons.push(`${layer.id}-polygons`);
        layers.polygons.push(`${layer.id}-polygons-outline`);
        layers.lines.push(`${layer.id}-lines`);
        layers.pts.push(`${layer.id}-pts`);

      });
    } else if (source.format === 'png') {
      map.addSource(
        sid, {
        type: 'raster',
        tiles: [`http://localhost:${PORT}/${sid}/{z}/{x}/{y}.png`]
      })
      map.addLayer({
        id: `${sid}-layer`,
        type: 'raster',
        source: sid,
      })
      layers.raster.push(`${sid}-layer`)
    }
  })
});


function displayValue(value) {
  if (typeof value === 'undefined' || value === null) return value;
  if (typeof value === 'object' ||
    typeof value === 'number' ||
    typeof value === 'string') return value.toString();
  return value;
}

function renderProperty(propertyName, property) {
  return `
    <div class="mbview_property">
      <div class="mbview_property-name">${propertyName}</div>
      <div class="mbview_property-value">${displayValue(property)}</div>
    </div>
  `;
}

function renderLayer(layerId) {
  return `<div class="mbview_layer">${layerId}</div>`;
}

function renderProperties(feature) {
  const sourceProperty = renderLayer(feature.layer['source-layer'] || feature.layer.source);
  const idProperty = renderProperty('$id', feature.id);
  const typeProperty = renderProperty('$type', feature.geometry.type);
  const properties = Object.keys(feature.properties).map(function (propertyName) {
    return renderProperty(propertyName, feature.properties[propertyName]);
  });
  return (feature.id ? [sourceProperty, idProperty, typeProperty]
    : [sourceProperty, typeProperty]).concat(properties).join('');
}

function renderFeatures(features) {
  return features.map(function (ft) {
    return `<div class="mbview_feature">${renderProperties(ft)}</div>`;
  }).join('');
}

function renderPopup(features) {
  return `<div class="mbview_popup">${renderFeatures(features)}</div>`;
}

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

let wantPopup = false;

map.on('mousemove', function (e) {
  // set a bbox around the pointer
  const selectThreshold = 3;
  const queryBox = [
    [
      e.point.x - selectThreshold,
      e.point.y + selectThreshold
    ], // bottom left (SW)
    [
      e.point.x + selectThreshold,
      e.point.y - selectThreshold
    ] // top right (NE)
  ];

  const features = map.queryRenderedFeatures(queryBox, {
    layers: layers.polygons.concat(layers.lines.concat(layers.pts))
  }) || [];
  map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

  if (!features.length || !wantPopup) {
    popup.remove();
  } else {
    popup.setLngLat(e.lngLat)
      .setHTML(renderPopup(features))
      .addTo(map);
  }
});



// Show and hide hamburger menu as needed
const menuBtn = document.querySelector("#menu");
const menu = document.querySelector("#menu-container");
menuBtn.addEventListener('click', function () {
  popup.remove();
  if (menuBtn.className.indexOf('active') > -1) {
    //Hide Menu
    menuBtn.className = '';
    menu.style.display = 'none';
  } else {
    //Show Menu
    menuBtn.className = 'active';
    menu.style.display = 'block';

  }
}, false);

// Menu-Filter Module
function menuFilter() {
  if (document.querySelector("#filter-all").checked) {
    paint(layers.pts, 'visible');
    paint(layers.lines, 'visible');
    paint(layers.polygons, 'visible');
  } else if (document.querySelector("#filter-pts").checked) {
    paint(layers.pts, 'visible');
    paint(layers.lines, 'none');
    paint(layers.polygons, 'none');
  } else if (document.querySelector("#filter-lines").checked) {
    paint(layers.pts, 'none');
    paint(layers.lines, 'visible');
    paint(layers.polygons, 'none');
  } else if (document.querySelector("#filter-polygons").checked) {
    paint(layers.pts, 'none');
    paint(layers.lines, 'none');
    paint(layers.polygons, 'visible');
  }

  function paint(layers, val) {
    layers.forEach(function (layer) {
      map.setLayoutProperty(layer, 'visibility', val)
    });
  }
}

function menuPopup() {
  wantPopup = document.querySelector("#show-popup").checked;
}

document.getElementById('menu-filter').addEventListener('change', menuFilter)
document.getElementById('menu-popup').addEventListener('change', menuPopup)

window.app = { map, layers, get wantPopup() { return wantPopup }, popup }
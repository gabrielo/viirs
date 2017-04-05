var map;
var gl;
var viirs;
var mapMatrix = new Float32Array(16);
var pixelsToWebGLMatrix = new Float32Array(16);
var minEpoch = new Date('1971-01-01').getTime();
var maxEpoch = new Date('2071-01-01').getTime();

var mapOptions = {
  zoom: 2,
  center: new google.maps.LatLng(0.0, 0.0),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles:
[
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      },
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "administrative.neighborhood",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
]
};

var canvasLayerOptions = {
  resizeHandler: resize,
  animate: true,
  updateHandler: update
};

function update() {
  var mapProjection = map.getProjection();
  mapMatrix.set(pixelsToWebGLMatrix);
  var scale = canvasLayer.getMapScale();
  scaleMatrix(mapMatrix, scale, scale);
  var translation = canvasLayer.getMapTranslation();
  translateMatrix(mapMatrix, translation.x, translation.y);  

  var countryLevelZoom = 10;
  var countryPointSizePixels = 8;

  var blockLevelZoom = 18;
  var blockPointSizePixels = 40;

  var pointSize = countryPointSizePixels * Math.pow(blockPointSizePixels / countryPointSizePixels, (map.zoom - countryLevelZoom) / (blockLevelZoom - countryLevelZoom));

  viirs.draw(mapMatrix, {pointSize: pointSize, minEpoch: minEpoch/1000.0, maxEpoch: maxEpoch/1000.0});
}

function resize() {
  console.log('resize');
  var w = gl.canvas.width;
  var h = gl.canvas.height;
  gl.viewport(0, 0, w, h);
  // matrix which maps pixel coordinates to WebGL coordinates
  pixelsToWebGLMatrix.set([2/w, 0,   0, 0,
    0,  -2/h, 0, 0,
    0,   0,   0, 0,
    -1,   1,   0, 1]);
}

function init() {
  var mapDiv = document.getElementById('map-div');
  map = new google.maps.Map(mapDiv, mapOptions);

  canvasLayerOptions.map = map;
  canvasLayer = new CanvasLayer(canvasLayerOptions);

  // initialize WebGL
  gl = canvasLayer.canvas.getContext('experimental-webgl');
  gl.getExtension("OES_standard_derivatives");
  viirs = new Viirs(gl);
  getBin('data/viirs-2016.bin', function(array) {
    viirs.setBuffer(array);    
  })
  setKeys();
}

function setKeys() {
  window.onkeydown = function (e) {
    var code = e.keyCode ? e.keyCode : e.which;
    console.log(code);
    if (code == 32) {
      minEpoch = new Date('1971-01-01').getTime();
      maxEpoch = new Date('2071-01-01').getTime();
    }
    else if (code == 81) {
      minEpoch = new Date('2015-12-31').getTime();
      maxEpoch = new Date('2016-02-01').getTime();
    }
    else if (code == 87) {
      minEpoch = new Date('2016-01-31').getTime();
      maxEpoch = new Date('2016-03-01').getTime();
    }
    else if (code == 69) {
      minEpoch = new Date('2016-02-28').getTime();
      maxEpoch = new Date('2016-04-01').getTime();
    }
    else if (code == 82) {
      minEpoch = new Date('2016-03-31').getTime();
      maxEpoch = new Date('2016-05-01').getTime();
    }
    else if (code == 84) {
      minEpoch = new Date('2016-04-30').getTime();
      maxEpoch = new Date('2016-06-01').getTime();
    }
    else if (code == 89) {
      minEpoch = new Date('2016-05-30').getTime();
      maxEpoch = new Date('2016-07-01').getTime();
    }
    else if (code == 85) {
      minEpoch = new Date('2016-06-30').getTime();
      maxEpoch = new Date('2016-08-01').getTime();
    }
    else if (code == 73) {
      minEpoch = new Date('2016-07-31').getTime();
      maxEpoch = new Date('2016-09-01').getTime();
    }
    else if (code == 79) {
      minEpoch = new Date('2016-08-31').getTime();
      maxEpoch = new Date('2016-10-01').getTime();
    }
    else if (code == 80) {
      minEpoch = new Date('2016-09-30').getTime();
      maxEpoch = new Date('2016-11-01').getTime();
    }
    else if (code == 65) {
      minEpoch = new Date('2016-10-31').getTime();
      maxEpoch = new Date('2016-12-01').getTime();
    }
    else if (code == 83) {
      minEpoch = new Date('2016-11-30').getTime();
      maxEpoch = new Date('2017-01-01').getTime();
    } else {
      minEpoch = new Date('1971-01-01').getTime();
      maxEpoch = new Date('2071-01-01').getTime();
    }
  };  
}

function getBin(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('get', url, true);
    xhr.onload = function () {
      var float32Array = new Float32Array(this.response);
      callback(float32Array);
    };
    xhr.send();
}


function scaleMatrix(matrix, scaleX, scaleY) {
  matrix[0] *= scaleX;
  matrix[1] *= scaleX;
  matrix[2] *= scaleX;
  matrix[3] *= scaleX;
  matrix[4] *= scaleY;
  matrix[5] *= scaleY;
  matrix[6] *= scaleY;
  matrix[7] *= scaleY;
}

function translateMatrix(matrix, tx, ty) {
  matrix[12] += matrix[0]*tx + matrix[4]*ty;
  matrix[13] += matrix[1]*tx + matrix[5]*ty;
  matrix[14] += matrix[2]*tx + matrix[6]*ty;
  matrix[15] += matrix[3]*tx + matrix[7]*ty;
}
document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', function () {  google.maps.event.trigger(map, 'resize') }, false);


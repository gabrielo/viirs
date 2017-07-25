var map;
var gl;
var viirs;
var mapMatrix = new Float32Array(16);
var pixelsToWebGLMatrix = new Float32Array(16);
var minEpoch = new Date('1971-01-01').getTime();
var maxEpoch = new Date('2071-01-01').getTime();
var timeSlider;

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

  var maxEpoch = timeSlider.getCurrentTime();
  var minEpoch = timeSlider.getCurrentTime() - timeSlider.span_;
  viirs.draw(mapMatrix, {pointSize: pointSize, minEpoch: minEpoch/1000.0, maxEpoch: maxEpoch/1000.0});
  timeSlider.animate();

}

function resize() {
  var w = gl.canvas.width;
  var h = gl.canvas.height;
  gl.viewport(0, 0, w, h);
  // matrix which maps pixel coordinates to WebGL coordinates
  pixelsToWebGLMatrix.set([2/w, 0,   0, 0,
    0,  -2/h, 0, 0,
    0,   0,   0, 0,
    -1,   1,   0, 1]);
}

function initTimeSlider() {
  var timeSlider = new TimeSlider({
    startTime: new Date("2012-02-04").getTime(),
    endTime: new Date("2017-02-28").getTime(),
    dwellAnimationTime: 0 * 1000,
    increment: 24*60*60*1000,
    span: 21*60*60*30*1000,
    formatCurrentTime: function(date) {
      return date.yyyymmdd();
    },
    animationRate: {
      fast: 20,
      medium: 40,
      slow: 80
    }
  });  
  return timeSlider;
}

function init() {
  var mapDiv = document.getElementById('map-div');
  map = new google.maps.Map(mapDiv, mapOptions);

  canvasLayerOptions.map = map;
  canvasLayer = new CanvasLayer(canvasLayerOptions);

  timeSlider = initTimeSlider();

  // initialize WebGL
  gl = canvasLayer.canvas.getContext('experimental-webgl');
  gl.getExtension("OES_standard_derivatives");
  viirs = new Viirs(gl);
  viirs.getBin('../data/viirs-2012_03.bin', function(array) {
    viirs.setBuffer(array);    
    timeSlider.play();
  })
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

Date.prototype.yyyymmdd = function(stepsize) {
  if (stepsize == undefined) stepsize = -1;
  
  var yyyy = this.getUTCFullYear().toString();                                    
  var mm = (this.getUTCMonth()+1).toString();
  var dd  = this.getUTCDate().toString();             
  var res = yyyy;
  if (stepsize < 365*24*60*60) res += '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
  return res;
};  

Date.prototype.yyyy_mm = function(stepsize) {
  if (stepsize == undefined) stepsize = -1;
  
  var yyyy = this.getUTCFullYear().toString();                                    
  var mm = (this.getUTCMonth()+1).toString();
  var res = yyyy;
  if (stepsize < 365*24*60*60) res += '_' + (mm[1]?mm:"0"+mm[0]);
  return res;
};  

document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', function () {  google.maps.event.trigger(map, 'resize') }, false);


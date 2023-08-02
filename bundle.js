(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

mapboxToken = "pk.eyJ1Ijoib3NwYW5lbCIsImEiOiJjamhhOG0yZ2EwOGJ3MzBxcDY3eXZ1dGprIn0.ZQVprI8zqlpnJCSZ67VtXg";
maptilerKey = "ERvtrxcxNj4ebSr0PUqK";

mapLayers = generateMapLayers(mapboxToken);

var imageDiv, previewDiv, mapDiv, dpiText;

var dpi = 200;
var minDpi = 100;
var maxDpi = 320;
var dpiStep = 20;
function a4width() {return 8 * dpi;}
function a4height() {return 11 * dpi;}

function setDPI(container) {
    container.value = "DPI: " + dpi.toString();
}
function createTextControl(store) {
    var container = L.DomUtil.create('input', 'leaflet-control-display leaflet-bar-part leaflet-bar');
    container.type = "button";
    setDPI(container);
    if (store) store(container);
    return container;
}

function createButtonControl(map, name, fun) {
    var container = L.DomUtil.create('input', 'leaflet-bar-part leaflet-bar leaflet-control-display');
    container.type = "button";
    container.value = name;
    container.onclick = function(){
        fun(map);
    };
    container.ondblclick = function (event) {
        event.stopPropagation();
        return false;
    };
    return container;
}



function createButton(pos, name, fun) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            return createButtonControl(map, name, fun);
        }
    };
}

function createControlGroup(pos, buttons) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div');
            for (var b in buttons) {
                var item = buttons[b](map);
                container.appendChild(item);
            }
            return container;
        }
    };
}

function createOutput(pos, name, store) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div');
            container.id = name;
            if (store) store(container);
            return container;
        }

    }
}

function createText(pos, getter, store) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            return createTextControl(getter, store);
        },
    };
}

function selectedLayerDef(map) {
    var layerDef = mapLayers.routes;
    var found = false;
    map.eachLayer(function(l) {
        if (map.hasLayer(l)) {
            //try to find URL
            if (!found) {
                Object.keys(mapLayers).forEach(mi => {
                    // TODO: check style properly
                    if (
                        l._url && mapLayers[mi].url === l._url ||
                        l.options && l.options.style && mapLayers[mi].style === l.options.style ||
                        l.options && l.options.style && mapLayers[mi].mtStyle === l.options.style
                    ) {
                        layerDef = mapLayers[mi];
                        found = true;
                    }
                });
            }
        }
    });
    return layerDef;
}

function sizeMapRenderContainer(mapContainer, dx, dy) {
    mapContainer.style.width = dx + "px";
    mapContainer.style.height = dy + "px";
    mapContainer.style.position = "fixed";
    mapContainer.style.left = "-" + (dx + 20) + "px";
    //mapContainer.style.display = "none";
}

function createMapRenderContainer(name, dx, dy) {
    var mapContainer = L.DomUtil.create('div', name);
    sizeMapRenderContainer(mapContainer, dx, dy);
    return mapContainer;
}

var cacheRenderMapGL;

var cacheRenderMap;
var cacheRenderMapURL;

var cacheMapContainer;
var cacheRenderMapWidth;
var cacheRenderMapHeight;

function createMapRender(map, name, dx, dy, pos, zoom, cache) {
    var layerDef = selectedLayerDef(map);
    // TODO: find the layer and update it on URL change?
    if (cache && !cacheRenderMap || cacheRenderMapWidth !== dx || cacheRenderMapHeight !== dy || cacheRenderMapURL !== layerDef.url) {
        if (cacheRenderMap) {
            cacheRenderMap.remove();
        }
        var mapContainer = createMapRenderContainer(name, dx, dy);
        mapDiv.innerHTML = '';
        mapDiv.appendChild(mapContainer);
        var renderMap = L.map(mapContainer, {
            preferCanvas: true,
            attributionControl: false,
            zoomControl: false,
            scrollWheelZoom: false,
            exportControl: false
        });
        renderMap.setView(pos, zoom);
        var layer = tileLayer(layerDef);
        layer.addTo(renderMap);
        cacheRenderMap = renderMap;
        cacheMapContainer = mapContainer;
        cacheRenderMapWidth = dx;
        cacheRenderMapHeight = dy;
        cacheRenderMapURL = layerDef.url;
        return renderMap;
    } else {
        cacheRenderMap.setView(pos, zoom);
        return cacheRenderMap;

    }
}

function createMapRenderGL(map, name, dx, dy, pos, zoom, cache) {
    var layerDef = selectedLayerDef(map);
    var centerGL = [pos.lng, pos.lat];
    if (cache && !cacheRenderMapGL || cacheRenderMapWidth !== dx || cacheRenderMapHeight !== dy) {
        if (cacheRenderMapGL) {
            cacheRenderMapGL.remove();
        }
        var mapContainer = createMapRenderContainer(name, dx, dy);
        mapDiv.innerHTML = '';
        mapDiv.appendChild(mapContainer);
        var renderMap = new mapboxgl.Map({
            container: mapContainer,
            center: centerGL,
            style: layerDef.style,
            fadeDuration: 0, // disable symbol transitions for faster response (idle otherwise takes quite long)
            bearing: 0,
            maxZoom: 24,
            zoom: zoom - 1,
            pitch: 0,
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true
        });
        cacheRenderMapGL = renderMap;
        cacheMapContainer = mapContainer;
        cacheRenderMapWidth = dx;
        cacheRenderMapHeight = dy;
        return renderMap;
    } else {
        sizeMapRenderContainer(cacheMapContainer, dx, dy);
        cacheRenderMapGL.setStyle(layerDef.style);
        cacheRenderMapGL.setCenter(centerGL);
        cacheRenderMapGL.setZoom(zoom - 1);
        return cacheRenderMapGL;
    }
}

function createMapRenderTiler(map, name, dx, dy, pos, zoom, cache) {
            var layerDef = selectedLayerDef(map);
            var centerGL = [pos.lng, pos.lat];
            if (cache && !cacheRenderMapGL || cacheRenderMapWidth !== dx || cacheRenderMapHeight !== dy) {
                if (cacheRenderMapGL) {
                    cacheRenderMapGL.remove();
                }
                var mapContainer = createMapRenderContainer(name, dx, dy);
                mapDiv.innerHTML = '';
                mapDiv.appendChild(mapContainer);
                var renderMap = new maptilersdk.Map({
                    container: mapContainer,
                    center: centerGL,
                    style: layerDef.mtStyle,
                    fadeDuration: 0, // disable symbol transitions for faster response (idle otherwise takes quite long)
                    bearing: 0,
                    maxZoom: 24,
                    zoom: zoom - 1,
                    pitch: 0,
                    interactive: false,
                    attributionControl: false,
                    preserveDrawingBuffer: true
                });
                cacheRenderMapGL = renderMap;
                cacheMapContainer = mapContainer;
                cacheRenderMapWidth = dx;
                cacheRenderMapHeight = dy;
                return renderMap;
            } else {
                sizeMapRenderContainer(cacheMapContainer, dx, dy);
                cacheRenderMapGL.setStyle(layerDef.style);
                cacheRenderMapGL.setCenter(centerGL);
                cacheRenderMapGL.setZoom(zoom - 1);
                return cacheRenderMapGL;
            }
        }

function previewSize(d, zoom) {
    var dx = d.x;
    var dy = d.y;
    while (zoom > 0 && (dx > 900 || dy > 600)) {
        zoom -= 1;
        dx /= 2;
        dy /= 2;
    }
    return {dx: dx, dy: dy, zoom: zoom};
}

var previewDimFun;

function currentMapDim() {
    return mymap.getSize();
}


function displayCanvas(canvas, xs, ys, bounds) {
    drawLines(canvas, bounds);

    var img = document.createElement('img');
    img.width = xs;
    img.height = ys;
    img.className = "image_output";
    img.src = canvas.toDataURL();
    imageDiv.innerHTML = '';
    imageDiv.appendChild(img);
    mapDiv.innerHTML = '';
}

function fixLongitude(lng) {
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    return lng;
}
function fixPos(pos) {
    return {
        lat: pos.lat,
        lng: fixLongitude(pos.lng)
    };
}

function saveFun(map) {
    // different handling needed for Mapbox GL
    var layerDef = selectedLayerDef(map);
    var dim = previewDimFun;
    var renderMap;
    var spinner = L.DomUtil.create('div', 'loader');
    imageDiv.innerHTML = "";
    imageDiv.appendChild(spinner);
    if (dim) {
        var d = dim();
        if (layerDef.mtStyle) {
            renderMap = createMapRenderTiler(map, 'render-map', d.x, d.y, fixPos(map.getCenter()), map.getZoom());
            renderMap.once("idle", function() {
                var canvas = renderMap.getCanvas();
                var d = dim ? dim : currentMapDim;
                var ps = previewSize(d(), map.getZoom());
                displayCanvas(canvas, ps.dx / 2, ps.dy / 2, renderMap.getBounds());
                renderMap.remove();
            })
        } else if (layerDef.style) {
            renderMap = createMapRenderGL(map, 'render-map', d.x, d.y, fixPos(map.getCenter()), map.getZoom());
            renderMap.once("idle", function() {
                var canvas = renderMap.getCanvas();
                var d = dim ? dim : currentMapDim;
                var ps = previewSize(d(), map.getZoom());
                displayCanvas(canvas, ps.dx / 2, ps.dy / 2, renderMap.getBounds());
                renderMap.remove();
            })

        } else {
            renderMap = createMapRender(map, 'render-map', d.x, d.y, fixPos(map.getCenter()), map.getZoom());
            var aMap = dim ? renderMap : map;
            leafletImage(aMap, function (err, canvas) {
                var d = dim ? dim : currentMapDim;
                var ps = previewSize(d(), map.getZoom());
                displayCanvas(canvas, ps.dx / 2, ps.dy / 2);
                renderMap.remove();
            }, dim);
        }
    }
}

function selectPreviewFun(map, dim) {
    previewDimFun = dim;

    updatePreview(map);
}

function updatePreview(map) {
    if (previewDimFun && map.getZoom() > 8) {
        previewFun(map, previewDimFun);
    } else {
        previewDiv.innerHTML = '';
    }
}

function previewCanvas(canvas, xs, ys, bounds) {
    drawLines(canvas, bounds);

    var img = document.createElement('img');
    img.width = xs;
    img.height = ys;
    img.className = "image_output";
    img.src = canvas.toDataURL();

    previewDiv.innerHTML = '';
    previewDiv.appendChild(img);
    mapDiv.innerHTML = '';
}

function previewFun(map, dim) {

    var ps = previewSize(dim(), map.getZoom());

    var dx = ps.dx;
    var dy = ps.dy;
    var zoom = ps.zoom;

    var layerDef = selectedLayerDef(map);
    var renderMap;

    if (layerDef.mtStyle) {
        renderMap = createMapRenderTiler(map, 'preview-map', dx, dy, fixPos(map.getCenter()), zoom, true);
        var renderedHandler = function() {
            var canvas = renderMap.getCanvas();
            previewCanvas(renderMap.getCanvas(), dx / 2, dy / 2, renderMap.getBounds());
        };
        renderMap.once("idle", renderedHandler);
    } else if (layerDef.style) {
        renderMap = createMapRenderGL(map, 'preview-map', dx, dy, fixPos(map.getCenter()), zoom, true);
        var renderedHandler = function() {
            var canvas = renderMap.getCanvas();
            previewCanvas(renderMap.getCanvas(), dx / 2, dy / 2, renderMap.getBounds());
        };
        renderMap.once("idle", renderedHandler);
    } else {
        renderMap = createMapRender(map, 'preview-map', dx, dy, fixPos(map.getCenter()), zoom, true);
        leafletImage(renderMap, function (err, canvas) {
            // now you have canvas
            previewCanvas(canvas, dx / 2, dy / 2);
        }, dim);
    }
}

function adjustDpi(map, steps) {
    var newDpi = dpi + dpiStep * steps;
    newDpi = Math.max(newDpi, minDpi);
    newDpi = Math.min(newDpi, maxDpi);
    dpi = newDpi;
    setDPI(dpiText);
    updatePreview(map);
}

function landscapeDim() {
    return {x: a4height(), y: a4width()};
}
function portraitDim() {
    return {x: a4width(), y: a4height()};
}

L.Map.mergeOptions({
    exportControl: true
});

L.Map.addInitHook(function () {
    if (this.options.exportControl) {

        // noinspection JSSuspiciousNameCombination
        var createControls = [
            createControlGroup("bottomleft", [
                function(map){return createButtonControl(map, "Print", function(map){saveFun(map)})},
            ]),
            createControlGroup("bottomleft", [
                function(map){return createButtonControl(map, "Window", function(map){selectPreviewFun(map, undefined)})},
                function(map){return createButtonControl(map, "A4 Landscape", function(map){selectPreviewFun(map, landscapeDim)})},
                function(map){return createButtonControl(map, "A4 Portrait", function(map){selectPreviewFun(map, portraitDim)})},
            ]),
            createControlGroup(
                "bottomleft", [
                    function(map){return createButtonControl(map, "+", function(map){adjustDpi(map, +1)})},
                    function(map){return createTextControl(function(x){dpiText = x})},
                    function(map){return createButtonControl(map, "-", function(map){adjustDpi(map, -1)})},
                ]),
            createOutput("bottomleft", "image-map", function(x){mapDiv = x}),
            createOutput("bottomleft", "preview", function(x){previewDiv = x}),
            createOutput("bottomleft", "image", function(x){imageDiv = x}),
        ];
        for (var c in createControls) {
            var ci = createControls[c];
            var cc = L.Control.extend(ci);
            var ccn = new cc();
            this.addControl(ccn);
        }

        var map = this;
        map.on("moveend", function () {
            updatePreview(map);
        });
    }
});

var vertexShader2D = `
    attribute vec2 aVertexPosition; 
    void main()
    { 
        gl_Position = vec4(aVertexPosition, 0.0, 1.0); 
    }
`;

var fragmentShader2D = `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    uniform vec4 uColor;
    
    void main() {
        gl_FragColor = uColor;
    }
`;


function drawLines(canvas, bounds) {
    if (!bounds) return;
    if (!canvas.getContext) return;
    var gl = canvas.getContext("webgl");
    if (!gl) return;

    var v = vertexShader2D;
    var f = fragmentShader2D;

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, v);
    gl.compileShader(vs);

    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, f);
    gl.compileShader(fs);

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    var lng = (bounds._ne.lng + bounds._sw.lng) / 2;
    var lat = (bounds._ne.lat + bounds._sw.lat) / 2;

    // meridian is always the same length
    var degree = Math.PI / 180;
    var meridian = 20003.930;
    var equator = 40075.160;
    var parallel = Math.cos(lat*degree) * equator;

    var boundsLngDist = (bounds._ne.lng - bounds._sw.lng);
    var boundsLatDist = (bounds._ne.lat - bounds._sw.lat);

    var canvasHeightKm = meridian * (boundsLatDist / 180);
    var canvasWidthKm = parallel * (boundsLngDist / 360);

    var linesV = Math.ceil(canvasWidthKm);
    var linesH = Math.ceil(canvasHeightKm);

    var kmInPixelsH = canvas.width / canvasWidthKm;
    var kmInPixelsV = canvas.height / canvasHeightKm;

    if (kmInPixelsH > 15 && kmInPixelsV > 15) {
        var alpha = (Math.min(kmInPixelsH, kmInPixelsV) - 15) / 30;
        if (alpha > 1) alpha = 1;
        var vertexData = new Array(linesV * 4 + linesH * 4);
        var l;
        for (l = 0; l < linesV; l++) {
            var xs = (l / canvasWidthKm) * 2 - 1;
            vertexData[l * 4] = xs;
            vertexData[l * 4 + 1] = -1;
            vertexData[l * 4 + 2] = xs;
            vertexData[l * 4 + 3] = +1;
        }

        for (l = 0; l < linesH; l++) {
            var ys = (l / canvasHeightKm) * 2 - 1;
            vertexData[linesV * 4 + l * 4] = -1;
            vertexData[linesV * 4 + l * 4 + 1] = ys;
            vertexData[linesV * 4 + l * 4 + 2] = +1;
            vertexData[linesV * 4 + l * 4 + 3] = ys;
        }

        var vertices = Float32Array.from(vertexData);

        var vbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        var itemSize = 2;
        var numItems = vertices.length / itemSize;

        gl.useProgram(program);

        program.uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4fv(program.uColor, [0.8 * alpha, 0.25 * alpha, 0.0, 0.8 * alpha]);

        program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
        gl.enableVertexAttribArray(program.aVertexPosition);
        gl.vertexAttribPointer(program.aVertexPosition, itemSize, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINES, 0, numItems);

        gl.disable(gl.BLEND);
    }
}

},{"leaflet-image":3}],2:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3_queue = global.d3_queue || {})));
}(this, function (exports) { 'use strict';

  var version = "2.0.3";

  var slice = [].slice;

  var noabort = {};

  function Queue(size) {
    if (!(size >= 1)) throw new Error;
    this._size = size;
    this._call =
    this._error = null;
    this._tasks = [];
    this._data = [];
    this._waiting =
    this._active =
    this._ended =
    this._start = 0; // inside a synchronous task callback?
  }

  Queue.prototype = queue.prototype = {
    constructor: Queue,
    defer: function(callback) {
      if (typeof callback !== "function" || this._call) throw new Error;
      if (this._error != null) return this;
      var t = slice.call(arguments, 1);
      t.push(callback);
      ++this._waiting, this._tasks.push(t);
      poke(this);
      return this;
    },
    abort: function() {
      if (this._error == null) abort(this, new Error("abort"));
      return this;
    },
    await: function(callback) {
      if (typeof callback !== "function" || this._call) throw new Error;
      this._call = function(error, results) { callback.apply(null, [error].concat(results)); };
      maybeNotify(this);
      return this;
    },
    awaitAll: function(callback) {
      if (typeof callback !== "function" || this._call) throw new Error;
      this._call = callback;
      maybeNotify(this);
      return this;
    }
  };

  function poke(q) {
    if (!q._start) try { start(q); } // let the current task complete
    catch (e) { if (q._tasks[q._ended + q._active - 1]) abort(q, e); } // task errored synchronously
  }

  function start(q) {
    while (q._start = q._waiting && q._active < q._size) {
      var i = q._ended + q._active,
          t = q._tasks[i],
          j = t.length - 1,
          c = t[j];
      t[j] = end(q, i);
      --q._waiting, ++q._active;
      t = c.apply(null, t);
      if (!q._tasks[i]) continue; // task finished synchronously
      q._tasks[i] = t || noabort;
    }
  }

  function end(q, i) {
    return function(e, r) {
      if (!q._tasks[i]) return; // ignore multiple callbacks
      --q._active, ++q._ended;
      q._tasks[i] = null;
      if (q._error != null) return; // ignore secondary errors
      if (e != null) {
        abort(q, e);
      } else {
        q._data[i] = r;
        if (q._waiting) poke(q);
        else maybeNotify(q);
      }
    };
  }

  function abort(q, e) {
    var i = q._tasks.length, t;
    q._error = e; // ignore active callbacks
    q._data = undefined; // allow gc
    q._waiting = NaN; // prevent starting

    while (--i >= 0) {
      if (t = q._tasks[i]) {
        q._tasks[i] = null;
        if (t.abort) try { t.abort(); }
        catch (e) { /* ignore */ }
      }
    }

    q._active = NaN; // allow notification
    maybeNotify(q);
  }

  function maybeNotify(q) {
    if (!q._active && q._call) q._call(q._error, q._data);
  }

  function queue(concurrency) {
    return new Queue(arguments.length ? +concurrency : Infinity);
  }

  exports.version = version;
  exports.queue = queue;

}));
},{}],3:[function(require,module,exports){
/* global L */

var queue = require('d3-queue').queue;

var cacheBusterDate = +new Date();

// leaflet-image
module.exports = function leafletImage(map, callback) {

    var hasMapbox = !!L.mapbox;

    var dimensions = map.getSize(),
        layerQueue = new queue(1);

    var canvas = document.createElement('canvas');
    canvas.width = dimensions.x;
    canvas.height = dimensions.y;
    var ctx = canvas.getContext('2d');

    // dummy canvas image when loadTile get 404 error
    // and layer don't have errorTileUrl
    var dummycanvas = document.createElement('canvas');
    dummycanvas.width = 1;
    dummycanvas.height = 1;
    var dummyctx = dummycanvas.getContext('2d');
    dummyctx.fillStyle = 'rgba(0,0,0,0)';
    dummyctx.fillRect(0, 0, 1, 1);

    // layers are drawn in the same order as they are composed in the DOM:
    // tiles, paths, and then markers
    map.eachLayer(drawTileLayer);
    map.eachLayer(drawEsriDynamicLayer);

    if (map._pathRoot) {
        layerQueue.defer(handlePathRoot, map._pathRoot);
    } else if (map._panes) {
        var firstCanvas = map._panes.overlayPane.getElementsByTagName('canvas').item(0);
        if (firstCanvas) { layerQueue.defer(handlePathRoot, firstCanvas); }
    }
    map.eachLayer(drawMarkerLayer);
    layerQueue.awaitAll(layersDone);

    function drawTileLayer(l) {
        if (l instanceof L.TileLayer) layerQueue.defer(handleTileLayer, l);
        else if (l._heat) layerQueue.defer(handlePathRoot, l._canvas);
    }

    function drawMarkerLayer(l) {
        if (l instanceof L.Marker && l.options.icon instanceof L.Icon) {
            layerQueue.defer(handleMarkerLayer, l);
        }
    }

    function drawEsriDynamicLayer(l) {
        if (!L.esri) return;

        if (l instanceof L.esri.DynamicMapLayer) {
            layerQueue.defer(handleEsriDymamicLayer, l);
        }
    }

    function done() {
        callback(null, canvas);
    }

    function layersDone(err, layers) {
        if (err) throw err;
        layers.forEach(function (layer) {
            if (layer && layer.canvas) {
                ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        done();
    }

    function handleTileLayer(layer, callback) {
        // `L.TileLayer.Canvas` was removed in leaflet 1.0
        var isCanvasLayer = (L.TileLayer.Canvas && layer instanceof L.TileLayer.Canvas),
            canvas = document.createElement('canvas');

        canvas.width = dimensions.x;
        canvas.height = dimensions.y;

        var ctx = canvas.getContext('2d'),
            bounds = map.getPixelBounds(),
            zoom = map.getZoom(),
            tileSize = layer.options.tileSize;

        if (zoom > layer.options.maxZoom ||
            zoom < layer.options.minZoom ||
            // mapbox.tileLayer
            (hasMapbox &&
                layer instanceof L.mapbox.tileLayer && !layer.options.tiles)) {
            return callback();
        }

        var tileBounds = L.bounds(
            bounds.min.divideBy(tileSize)._floor(),
            bounds.max.divideBy(tileSize)._floor()),
            tiles = [],
            j, i,
            tileQueue = new queue(1);

        for (j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
            for (i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                tiles.push(new L.Point(i, j));
            }
        }

        tiles.forEach(function (tilePoint) {
            var originalTilePoint = tilePoint.clone();

            if (layer._adjustTilePoint) {
                layer._adjustTilePoint(tilePoint);
            }

            var tilePos = originalTilePoint
                .scaleBy(new L.Point(tileSize, tileSize))
                .subtract(bounds.min);

            if (tilePoint.y >= 0) {
                if (isCanvasLayer) {
                    var tile = layer._tiles[tilePoint.x + ':' + tilePoint.y];
                    tileQueue.defer(canvasTile, tile, tilePos, tileSize);
                } else {
                    var url = addCacheString(layer.getTileUrl(tilePoint));
                    tileQueue.defer(loadTile, url, tilePos, tileSize);
                }
            }
        });

        tileQueue.awaitAll(tileQueueFinish);

        function canvasTile(tile, tilePos, tileSize, callback) {
            callback(null, {
                img: tile,
                pos: tilePos,
                size: tileSize
            });
        }

        function loadTile(url, tilePos, tileSize, callback) {
            var im = new Image();
            im.crossOrigin = '';
            im.onload = function () {
                callback(null, {
                    img: this,
                    pos: tilePos,
                    size: tileSize
                });
            };
            im.onerror = function (e) {
                // use canvas instead of errorTileUrl if errorTileUrl get 404
                if (layer.options.errorTileUrl != '' && e.target.errorCheck === undefined) {
                    e.target.errorCheck = true;
                    e.target.src = layer.options.errorTileUrl;
                } else {
                    callback(null, {
                        img: dummycanvas,
                        pos: tilePos,
                        size: tileSize
                    });
                }
            };
            im.src = url;
        }

        function tileQueueFinish(err, data) {
            data.forEach(drawTile);
            callback(null, { canvas: canvas });
        }

        function drawTile(d) {
            ctx.drawImage(d.img, Math.floor(d.pos.x), Math.floor(d.pos.y),
                d.size, d.size);
        }
    }

    function handlePathRoot(root, callback) {
        var bounds = map.getPixelBounds(),
            origin = map.getPixelOrigin(),
            canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        var ctx = canvas.getContext('2d');
        var pos = L.DomUtil.getPosition(root).subtract(bounds.min).add(origin);
        try {
            ctx.drawImage(root, pos.x, pos.y, canvas.width - (pos.x * 2), canvas.height - (pos.y * 2));
            callback(null, {
                canvas: canvas
            });
        } catch(e) {
            console.error('Element could not be drawn on canvas', root); // eslint-disable-line no-console
        }
    }

    function handleMarkerLayer(marker, callback) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            pixelBounds = map.getPixelBounds(),
            minPoint = new L.Point(pixelBounds.min.x, pixelBounds.min.y),
            pixelPoint = map.project(marker.getLatLng()),
            isBase64 = /^data\:/.test(marker._icon.src),
            url = isBase64 ? marker._icon.src : addCacheString(marker._icon.src),
            im = new Image(),
            options = marker.options.icon.options,
            size = options.iconSize,
            pos = pixelPoint.subtract(minPoint),
            anchor = L.point(options.iconAnchor || size && size.divideBy(2, true));

        if (size instanceof L.Point) size = [size.x, size.y];

        var x = Math.round(pos.x - size[0] + anchor.x),
            y = Math.round(pos.y - anchor.y);

        canvas.width = dimensions.x;
        canvas.height = dimensions.y;
        im.crossOrigin = '';

        im.onload = function () {
            ctx.drawImage(this, x, y, size[0], size[1]);
            callback(null, {
                canvas: canvas
            });
        };

        im.src = url;

        if (isBase64) im.onload();
    }

    function handleEsriDymamicLayer(dynamicLayer, callback) {
        var canvas = document.createElement('canvas');
        canvas.width = dimensions.x;
        canvas.height = dimensions.y;

        var ctx = canvas.getContext('2d');

        var im = new Image();
        im.crossOrigin = '';
        im.src = addCacheString(dynamicLayer._currentImage._image.src);

        im.onload = function() {
            ctx.drawImage(im, 0, 0);
            callback(null, {
                canvas: canvas
            });
        };
    }

    function addCacheString(url) {
        // If it's a data URL we don't want to touch this.
        if (isDataURL(url) || url.indexOf('mapbox.com/styles/v1') !== -1) {
            return url;
        }
        return url + ((url.match(/\?/)) ? '&' : '?') + 'cache=' + cacheBusterDate;
    }

    function isDataURL(url) {
        var dataURLRegex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
        return !!url.match(dataURLRegex);
    }

};

},{"d3-queue":2}]},{},[1]);

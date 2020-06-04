/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

mapboxToken = "pk.eyJ1Ijoib3NwYW5lbCIsImEiOiJjamhhOG0yZ2EwOGJ3MzBxcDY3eXZ1dGprIn0.ZQVprI8zqlpnJCSZ67VtXg";

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
                    if (l._url && mapLayers[mi].url === l._url || l.options && l.options.style && mapLayers[mi].style === l.options.style) {
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
        if (layerDef.style) {
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

    if (layerDef.style) {
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

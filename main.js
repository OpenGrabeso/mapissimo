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
    var layerDef = mapLayers[0];
    var found = false;
    map.eachLayer(function(l) {
        //try to find URL
        if (!found) {
            for (var mi = 0; mi < mapLayers.length; mi++) {
                if (mapLayers[mi].url === l._url) {
                    layerDef = mapLayers[mi];
                    found = true;
                    break;
                }
            }
        }
    });
    return layerDef;
}

function createMapRenderContainer(name, dx, dy) {
    var mapContainer = L.DomUtil.create('div', name);
    mapContainer.style.width = dx + "px";
    mapContainer.style.height = dy + "px";
    mapContainer.style.position = "fixed";
    mapContainer.style.left = "-" + (dx + 20) + "px";
    //mapContainer.style.display = "none";
    return mapContainer;
}

function createMapRender(map, name, dx, dy, pos, zoom) {
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
    var layerDef = selectedLayerDef(map);
    var layer = tileLayer(layerDef);
    layer.addTo(renderMap);
    renderMap.setView(pos, zoom);
    return renderMap;
}

function createMapRenderGL(map, name, dx, dy, pos, zoom) {
    var mapContainer = createMapRenderContainer(name, dx, dy);
    mapDiv.innerHTML = '';
    mapDiv.appendChild(mapContainer);
    var layerDef = selectedLayerDef(map);

    var centerGL = [pos.lng, pos.lat];

    var renderMap = new mapboxgl.Map({
        container: mapContainer,
        center: centerGL,
        style: layerDef.style,
        bearing: 0,
        maxZoom: 24,
        zoom: zoom - 1,
        pitch: 0,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true
    });

    return renderMap;
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

function displayCanvas(canvas, xs, ys) {
    var img = document.createElement('img');
    img.width = xs;
    img.height = ys;
    img.className = "image_output";
    img.src = canvas.toDataURL();
    imageDiv.innerHTML = '';
    imageDiv.appendChild(img);
    mapDiv.innerHTML = '';
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
            renderMap = createMapRenderGL(map, 'render-map', d.x, d.y, map.getCenter(), map.getZoom());
            renderMap.once("load", function() {
                var canvas = renderMap.getCanvas();

                var d = dim ? dim : currentMapDim;
                var ps = previewSize(d(), map.getZoom());
                displayCanvas(canvas, ps.dx / 2, ps.dy / 2);
                renderMap.remove();
            })

        } else {
            renderMap = createMapRender(map, 'render-map', d.x, d.y, map.getCenter(), map.getZoom());
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

function previewCanvas(canvas, xs, ys) {
    if (canvas.getContext) {
        drawLines(canvas);
    }

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
        renderMap = createMapRenderGL(map, 'preview-map', dx, dy, map.getCenter(), zoom);
        renderMap.once("load", function() {
            var canvas = renderMap.getCanvas();
            previewCanvas(renderMap.getCanvas(), dx / 2, dy / 2);
            renderMap.remove();
        })
    } else {
        renderMap = createMapRender(map, 'preview-map', dx, dy, map.getCenter(), zoom);
        leafletImage(renderMap, function (err, canvas) {
            // now you have canvas
            previewCanvas(canvas, dx / 2, dy / 2);
            renderMap.remove();
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


function drawLines(canvas) {
    var gl = canvas.getContext("webgl");

    gl.viewport(0, 0, canvas.width, canvas.height);

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

    var aspect = canvas.width / canvas.height;

    var vertices = new Float32Array([
        -0.5, 0.5 * aspect, 0.5, 0.5 * aspect, 0.5, -0.5 * aspect, // Triangle 1
        -0.5, 0.5 * aspect, 0.5, -0.5 * aspect, -0.5, -0.5 * aspect // Triangle 2
    ]);

    var vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var itemSize = 2;
    var numItems = vertices.length / itemSize;

    gl.useProgram(program);

    program.uColor = gl.getUniformLocation(program, "uColor");
    gl.uniform4fv(program.uColor, [0.0, 0.3, 0.0, 1.0]);

    program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.aVertexPosition);
    gl.vertexAttribPointer(program.aVertexPosition, itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, numItems);
}

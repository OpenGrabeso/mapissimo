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

function createMapRenderContainer(name, dx, dy, hide) {
    var mapContainer = L.DomUtil.create('div', name);
    mapContainer.style.width = dx + "px";
    mapContainer.style.height = dy + "px";
    if (hide) {
        mapContainer.style.position = "fixed";
        mapContainer.style.left = "-" + mapContainer.style.width;
    } else {

    }
    //mapContainer.style.display = "none";
    return mapContainer;
}

function createMapRender(map, name, dx, dy, pos, zoom) {
    var mapContainer = createMapRenderContainer(name, dx, dy, true);
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
    var mapContainer = createMapRenderContainer(name, dx, dy, true);
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

var printedMap;

function saveFunGL(map, layerDef) {
    var dim = previewDimFun;
    if (!dim) return; // MapBox print not supported without dimensions
    var d = dim();
    var spinner = L.DomUtil.create('div', 'loader');
    imageDiv.innerHTML = "";
    imageDiv.appendChild(spinner);

    // Calculate pixel ratio
    var actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {return dpi / 96}
    });

    var container = createMapRenderContainer('render-map', d.x, d.y, true);

    var center = map.getCenter();
    var centerGL = [center.lng, center.lat];

    var renderMapGL = new mapboxgl.Map({
        container: container,
        center: centerGL,
        style: layerDef.style,
        bearing: 0,
        maxZoom: 24,
        zoom: map.getZoom() - 1 + Math.log2(dpi) - Math.log2(96),
        pitch: 0,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true
    });

    if (printedMap) {
        printedMap.remove();
    }

    var handler =  function () {
        renderMapGL.off('render', handler);
        renderMapGL.resize();
    };
    var loadHandler =  function () {
        renderMapGL.resize();
        var canvas = renderMapGL.getCanvas();
        imageDiv.innerHTML = '';
        imageDiv.appendChild(container);

        var ps = previewSize(d, map.getZoom());
        var img = document.createElement('img');
        img.width = ps.dx / 2;
        img.height = ps.dy / 2;
        img.className = "image_output";
        img.src = canvas.toDataURL();
        imageDiv.innerHTML = '';
        imageDiv.appendChild(img);
        mapDiv.innerHTML = '';
        renderMapGL.off('load', loadHandler);

        Object.defineProperty(window, 'devicePixelRatio', {
            get: function() {return actualPixelRatio}
        });
    };

    renderMapGL.on('render', handler);
    renderMapGL.on('load', loadHandler);

    printedMap = renderMapGL;

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
    {

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
                })

            } else {
                renderMap = createMapRender(map, 'render-map', d.x, d.y, map.getCenter(), map.getZoom());
                var aMap = dim ? renderMap : map;
                leafletImage(aMap, function (err, canvas) {
                    var d = dim ? dim : currentMapDim;
                    var ps = previewSize(d(), map.getZoom());
                    displayCanvas(canvas, ps.dx / 2, ps.dy / 2);
                }, dim);
            }
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

var previewMap;
var previewDX, previewDY;

function previewFun(map, dim) {

    var ps = previewSize(dim(), map.getZoom());

    var dx = ps.dx;
    var dy = ps.dy;
    var zoom = ps.zoom;

    var layerDef = selectedLayerDef(map);
    if (layerDef.style) {

        dx /= 2;
        dy /= 2;

        var container = createMapRenderContainer('preview-map', dx, dy);

        var center = map.getCenter();
        var centerGL = [center.lng, center.lat];

        var bounds = map.getBounds();
        var boundsGL = [
            [bounds._southWest.lng, bounds._southWest.lat],
            [bounds._northEast.lng, bounds._northEast.lat]
        ];
        if (dx !== previewDX || dy !== previewDY || previewStyle !== layerDef.style) {
            var dpiZoom = Math.log2(dpi) - Math.log2(96);

            var renderMapGL = new mapboxgl.Map({
                container: container,
                style: layerDef.style,
                bearing: 0,
                maxZoom: 24,
                center: centerGL,
                zoom: map.getZoom() - 4 + dpiZoom,
                pitch: 0,
                interactive: false,
                attributionControl: false,
                preserveDrawingBuffer: true
            });
            var handler = function () {
                renderMapGL.resize();
                renderMapGL.off('render', handler);
            };
            renderMapGL.on('render', handler);
            if (previewMap) {
                previewMap.remove();
            }
            previewMap = renderMapGL;
            previewDiv.innerHTML = "";
            previewDiv.appendChild(container);
            previewDX = dx;
            previewDY = dy;
            previewStyle = layerDef.style;
        } else {
            // move only, no need to resize
            previewMap.fitBounds(boundsGL, {animate: false});
        }

        mapDiv.innerHTML = '';
    } else {
        var renderMap = createMapRender(map,'preview-map', dx, dy, map.getCenter(), zoom);

        leafletImage(renderMap, function (err, canvas) {
            // now you have canvas
            var img = document.createElement('img');
            img.width = dx / 2;
            img.height = dy / 2;
            img.className = "image_output";
            img.src = canvas.toDataURL();

            if (previewMap) {
                previewMap.remove();
            }
            previewMap = renderMap;

            previewDiv.innerHTML = '';
            previewDiv.appendChild(img);
            mapDiv.innerHTML = '';
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

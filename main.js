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

function createMapRender(name, dx, dy, pos, zoom) {
    var mapContainer = L.DomUtil.create('div', name);
    mapContainer.style.position = "fixed";
    mapContainer.style.width = dx + "px";
    mapContainer.style.height = dy + "px";
    mapContainer.style.left = "-" + mapContainer.style.width;
    //mapContainer.style.display = "none";
    mapDiv.innerHTML = '';
    mapDiv.appendChild(mapContainer);
    var renderMap = L.map(mapContainer, {
        preferCanvas: true,
        attributionControl: false,
        zoomControl: false,
        scrollWheelZoom: false,
        exportControl: false
    });
    var layerDef = mapLayers[0];
    mymap.eachLayer(function(l) {
        //try to find URL
        for (var mi = 0; mi < mapLayers.length; mi ++) {
            if (mapLayers[mi].url === l._url) {
                layerDef = mapLayers[mi];
                break;
            }
        }
    });
    var layer = tileLayer(layerDef);
    layer.addTo(renderMap);
    renderMap.setView(pos, zoom);
    return renderMap;
}
function saveFun(dim) {
    return function(map) {

        var renderMap;
        var spinner = L.DomUtil.create('div', 'loader');
        imageDiv.innerHTML = "";
        imageDiv.appendChild(spinner);
        if (dim) {
            var d = dim();
            renderMap = createMapRender('render-map', d.x, d.y, map.getCenter(), map.getZoom())
        }
        var aMap = dim ? renderMap : mymap;
        leafletImage(aMap, function(err, canvas) {
            // now you have canvas
            var img = document.createElement('img');
            var dimensions = aMap.getSize();
            var maxPreviewSize = 200;
            var maxDim = Math.max(dimensions.x, dimensions.y);
            var scale = maxDim > maxPreviewSize ? maxPreviewSize / maxDim : 1;
            img.width = Math.ceil(dimensions.x * scale);
            img.height = Math.ceil(dimensions.y * scale);
            img.className = "image_output";
            img.src = canvas.toDataURL();
            imageDiv.innerHTML = '';
            imageDiv.appendChild(img);
            mapDiv.innerHTML = '';
        }, dim);
    };
}

var previewDimFun;

function selectPreviewFun(map, dim) {
    previewDimFun = dim;

    updatePreview(map);
}

function updatePreview(map) {
    if (previewDimFun) {
        previewFun(map, previewDimFun);
    }
}

function previewFun(map, dim) {
    var maxPreviewRenderSize = 800;

    var d = dim();
    var dx = d.x;
    var dy = d.y;
    var zoom = map.getZoom();
    while (dx > maxPreviewRenderSize || dy > maxPreviewRenderSize) {
        zoom -= 1;
        dx /= 2;
        dy /= 2;
    }

    var renderMap = createMapRender('preview-map', dx, dy, map.getCenter(), zoom);

    leafletImage(renderMap, function(err, canvas) {
        // now you have canvas
        var img = document.createElement('img');
        img.width = dx / 2;
        img.height = dy / 2;
        img.className = "image_output";
        img.src = canvas.toDataURL();
        previewDiv.innerHTML = '';
        previewDiv.appendChild(img);
        mapDiv.innerHTML = '';
    }, dim);
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
                function(map){return createButtonControl(map, "Window", saveFun())},
                function(map){return createButtonControl(map, "A4 Landscape", saveFun(landscapeDim))},
                function(map){return createButtonControl(map, "A4 Portrait", saveFun(portraitDim))},
                ]),
            createControlGroup("bottomleft", [
                function(map){return createButtonControl(map, "A4 Landscape Preview", function(map){selectPreviewFun(map, landscapeDim)})},
                function(map){return createButtonControl(map, "A4 Portrait Preview", function(map){selectPreviewFun(map, portraitDim)})},
            ]),
            createControlGroup(
                "bottomleft", [
                    function(map){return createButtonControl(map, "+", function(map){adjustDpi(map, +1)})},
                    function(map){return createTextControl(function(x){dpiText = x})},
                    function(map){return createButtonControl(map, "-", function(map){adjustDpi(map, -1)})},
                ],
            ),
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

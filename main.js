/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

var imageDiv, mapDiv, dpiText;

var dpi = 200;
var minDpi = 100;
var maxDpi = 300;
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

function saveFun(dim) {
    return function(map) {

        var spinner = L.DomUtil.create('div', 'loader');
        imageDiv.innerHTML = "";
        imageDiv.appendChild(spinner);
        if (dim) {
            var d = dim();
            var mapContainer = L.DomUtil.create('div', 'render-map');
            mapContainer.style.position = "fixed";
            mapContainer.style.width = d.x + "px";
            mapContainer.style.height = d.y + "px";
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
            var layerDef = AdditionalMapLayers[0];
            mymap.eachLayer(function(l) {
                //try to find URL
                for (var mi = 0; mi < AdditionalMapLayers.length; mi ++) {
                    if (AdditionalMapLayers[mi].url === l._url) {
                        layerDef = AdditionalMapLayers[mi];
                        break;
                    }
                }
            });
            var layer = tileLayer(layerDef);
            layer.addTo(renderMap);
            renderMap.setView(map.getCenter(), map.getZoom());
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

function adjustDpi(steps) {
    var newDpi = dpi + dpiStep * steps;
    newDpi = Math.max(newDpi, minDpi);
    newDpi = Math.min(newDpi, maxDpi);
    dpi = newDpi;
    setDPI(dpiText);
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
                function(map){return createButtonControl(map, "A4 Landscape", saveFun(function(){return {x: a4height(), y: a4width()}}))},
                function(map){return createButtonControl(map, "A4 Portrait", saveFun(function(){return {x: a4width(), y: a4height()}}))},
                ]),
            createControlGroup(
                "bottomleft", [
                    function(map){return createButtonControl(map, "+", function(){adjustDpi(+1)})},
                    function(map){return createTextControl(function(x){dpiText = x})},
                    function(map){return createButtonControl(map, "-", function(){adjustDpi(-1)})},
                ],
            ),
            createOutput("bottomleft", "image-map", function(x){mapDiv = x}),
            createOutput("bottomleft", "image", function(x){imageDiv = x}),
        ];
        for (var c in createControls) {
            var ci = createControls[c];
            var cc = L.Control.extend(ci);
            var ccn = new cc();
            this.addControl(ccn);
        }
    }
});


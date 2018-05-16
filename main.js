/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

var imageDiv, mapDiv;

function createButton(pos, name, fun) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('input');
            container.type = "button";
            container.value = name;
            container.onclick = fun;
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
            store(container);
            return container;
        }

    }
}

function saveFun(dim) {
    return function() {

        var spinner = L.DomUtil.create('div', 'loader');
        imageDiv.innerHTML = "";
        imageDiv.appendChild(spinner);
        if (dim) {
            var mapContainer = L.DomUtil.create('div', 'render-map');
            mapContainer.style.position = "fixed";
            mapContainer.style.width = dim.x + "px";
            mapContainer.style.height = dim.y + "px";
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

var dpi = 200;
var a4width = 8 * dpi;
var a4height = 11 * dpi;

L.Map.mergeOptions({
    exportControl: true
});

L.Map.addInitHook(function () {
    if (this.options.exportControl) {

        // noinspection JSSuspiciousNameCombination
        var createControls = [
            createOutput("bottomleft", "image-map", function(x){mapDiv = x}),
            createOutput("bottomleft", "image", function(x){imageDiv = x}),
            createButton("bottomleft", "Save...", saveFun()),
            createButton("bottomleft", "A4 Landscape", saveFun({x: a4height, y: a4width})),
            createButton("bottomleft", "A4 Portrait", saveFun({x: a4width, y: a4height})),
            createButton("bottomleft", "DPI +", function(){}),
            createButton("bottomleft", "DPI -", function(){}),
        ];
        for (var c in createControls) {
            var ci = createControls[c];
            var cc = L.Control.extend(ci);
            var ccn = new cc();
            this.addControl(ccn);
        }
    }
});

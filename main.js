/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

var imageDiv, mapDiv;

function createButton(pos, name, dim) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('input');
            container.type = "button";
            container.value = name;
            container.onclick = function() {

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
            return container;
        }
    }
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

var dpi = 200;
var a4width = 8 * dpi;
var a4height = 11 * dpi;

L.Control.OutputMap = L.Control.extend(createOutput("bottomleft", "image-map", function(x){mapDiv = x}));
L.Control.Output = L.Control.extend(createOutput("bottomleft", "image", function(x){imageDiv = x}));
L.Control.Save = L.Control.extend(createButton("bottomleft", "Save..."));
L.Control.SaveLandscape = L.Control.extend(createButton("bottomleft", "A4 Landscape", {x: a4height, y: a4width}));
// noinspection JSSuspiciousNameCombination
L.Control.SavePortrait = L.Control.extend(createButton("bottomleft", "A4 Portrait", {x: a4width, y: a4height}));

L.Map.mergeOptions({
    exportControl: true
});

L.Map.addInitHook(function () {
    if (this.options.exportControl) {
        this.exportControl = new L.Control.Save();
        this.exportControlLandscape = new L.Control.SaveLandscape();
        this.exportControlPortrait = new L.Control.SavePortrait();
        this.addControl(this.exportControlLandscape);
        this.addControl(this.exportControlPortrait);
        this.addControl(this.exportControl);
        this.addControl(new L.Control.OutputMap());
        this.addControl(new L.Control.Output());
    }
});

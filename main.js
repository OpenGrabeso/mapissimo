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
                if (dim) {
                    var mapContainer = L.DomUtil.create('div', 'render-map');
                    mapContainer.style.position = "fixed";
                    mapContainer.style.width = dim.x + "px";
                    mapContainer.style.height = dim.y + "px";
                    mapContainer.style.x = "-" + mapContainer.style.width;
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
                    img.width = dimensions.x / 4;
                    img.height = dimensions.y / 4;
                    img.className = "image_output";
                    img.src = canvas.toDataURL();
                    imageDiv.innerHTML = '';
                    imageDiv.appendChild(img);
                }, dim);
            };
            return container;
        }
    }
}

function createOutput(pos) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div');
            container.id = "images";
            imageDiv = container;
            container = L.DomUtil.create('div');
            container.id = "images-map";
            mapDiv = container;
            return container;
        }

    }
}

var a4width = 2480/2;
var a4height = 3508/2;

L.Control.Save = L.Control.extend(createButton("bottomleft", "Save..."));
L.Control.SaveLandscape = L.Control.extend(createButton("bottomleft", "A4 Landscape", {x: a4height, y: a4width}));
// noinspection JSSuspiciousNameCombination
L.Control.SavePortrait = L.Control.extend(createButton("bottomleft", "A4 Portrait", {x: a4width, y: a4height}));
L.Control.Output = L.Control.extend(createOutput("bottomleft"));

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
        this.addControl(new L.Control.Output());
    }
});




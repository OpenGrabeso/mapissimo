/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

var cloneLayer = require('leaflet-clonelayer');

var imageDiv;

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
                    mapContainer.position = "absolute";
                    mapContainer.style.width = dim.x + "px";
                    mapContainer.style.height = dim.y + "px";
                    imageDiv.innerHTML = '';
                    imageDiv.appendChild(mapContainer);
                    var renderMap = L.map(mapContainer, {
                        attributionControl: false,
                        zoomControl: false,
                        scrollWheelZoom: false,
                        exportControl: false
                    });
                    cloneLayer(baseMaps[AdditionalMapLayers[0].name]).addTo(renderMap);
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
            return container;
        }

    }
}

var a4width = 2480 / 4;
var a4height = 3508 / 4;

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




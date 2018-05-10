/*
 * Export map bitmap (into images DOM)
 */

//var leafletImage = require('./lib/leaflet.image.js');
var leafletImage = require('../leaflet-image-custom/index.js');

var imageDiv;

function createButton(pos, name, dim) {
    return {
        options: {
            position: pos
        },

        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('input');
            container.type = "button";
            container.value = name;
            container.onclick = function() {
                leafletImage(mymap, function(err, canvas) {
                    // now you have canvas
                    var img = document.createElement('img');
                    var dimensions = dim || mymap.getSize();
                    img.width = dimensions.x / 10;
                    img.height = dimensions.y / 10;
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
            this._map = map;
            var container = L.DomUtil.create('div');
            container.id = "images";
            imageDiv = container;
            return container;
        }

    }
}

var a4width = 2480;
var a4height = 3508;

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




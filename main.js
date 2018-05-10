/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

var imageDiv;

function createButton(pos, name, dimX, dimY) {
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
                    var dimensions = mymap.getSize();
                    img.width = dimensions.x / 10;
                    img.height = dimensions.y / 10;
                    img.className = "image_output";
                    img.src = canvas.toDataURL();
                    imageDiv.innerHTML = '';
                    imageDiv.appendChild(img);
                });
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


var a4width = 1654;
var a4height = 2339;

L.Control.Save = L.Control.extend(createButton("bottomleft", "Save..."));
L.Control.SaveLandscape = L.Control.extend(createButton("bottomleft", "A4 Landscape", a4width, a4height ));
L.Control.SavePortrait = L.Control.extend(createButton("bottomleft", "A4 Portrait", a4height, a4width));
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

/*
 * Export map bitmap (into images DOM)
 */

var leafletImage = require('leaflet-image');

L.Control.Export = L.Control.extend({
    options: {
        position: 'topleft'
    },

    onAdd: function (map) {
        this._map = map;
        var container = L.DomUtil.create('input');
        container.type="button";
        container.value = "Save...";
        container.onclick = function() {


            leafletImage(mymap, function(err, canvas) {
                // now you have canvas
                var img = document.createElement('img');
                var dimensions = mymap.getSize();
                img.width = dimensions.x;
                img.height = dimensions.y;
                img.src = canvas.toDataURL();
                document.getElementById('images').innerHTML = '';
                document.getElementById('images').appendChild(img);
            });
        };
        return container;
    },

});

L.Map.mergeOptions({
    exportControl: true
});

L.Map.addInitHook(function () {
    if (this.options.exportControl) {
        this.exportControl = new L.Control.Export();
        this.addControl(this.exportControl);
    }
});

L.control.exportControl = function (options) {
    return new L.Control.Export(options);
};



/*
 * L.Control.ZoomDisplay shows the current map zoom level
 */

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
            console.log("Save me ...");
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
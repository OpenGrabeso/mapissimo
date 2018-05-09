// from https://github.com/jieter/Leaflet.Grid
/*
 * L.Grid displays a grid of lat/lng lines on the map.
 */

L.Grid = L.LayerGroup.extend({
    options: {

        // Path style for the grid lines
        lineStyle: {
            stroke: true,
            color: '#C33',
            opacity: 0.6,
            weight: 1.5
        },

        // Redraw on move or moveend
        redraw: 'move'
    },

    fixedPoint: [0, 0], // lat, lng

    initialize: function (options) {
        L.LayerGroup.prototype.initialize.call(this);
        L.Util.setOptions(this, options);

    },

    onAdd: function (map) {
        this._map = map;

        var grid = this.redraw();
        this._map.on('viewreset '+ this.options.redraw, function () {
            grid.redraw();
        });

        this.eachLayer(map.addLayer, map);
    },

    onRemove: function (map) {
        // remove layer listeners and elements
        map.off('viewreset '+ this.options.redraw, this.map);
        this.eachLayer(this.removeLayer, this);
    },

    redraw: function () {
        // pad the bounds to make sure we draw the lines a little longer
        this._bounds = this._map.getBounds().pad(0.05);

        var grid_box = this._bounds;
        var avg_y = (grid_box._northEast.lat + grid_box._southWest.lat) * 0.5;

        // Meridian length is always the same
        var meridian = 20003930.0;
        var equator = 40075160;
        var parallel = Math.cos(avg_y * Math.PI / 180) * equator;

        var grid_distance = 1000.0;

        var grid_step_x = grid_distance / parallel * 360;
        var grid_step_y = grid_distance / meridian * 180;

        var size = this._map.getSize();
        var minSize = Math.max(size.x, size.y);
        var minLineDistance = 20;
        var maxLines = minSize / minLineDistance;

        var latLines = this._latLines(grid_step_y, maxLines);
        var lngLines = this._lngLines(grid_step_x, maxLines);

        this.eachLayer(this.removeLayer, this);

        if (latLines.length > 0 && lngLines.length > 0) {
            var grid = [];
            var i;
            for (i in latLines) {
                if (Math.abs(latLines[i]) > 90) {
                    continue;
                }
                grid.push(this._horizontalLine(latLines[i]));
            }

            for (i in lngLines) {
                grid.push(this._verticalLine(lngLines[i]));
            }

            for (i in grid) {
                this.addLayer(grid[i]);
            }
        }
        return this;
    },

    _latLines: function (yticks, maxLines) {
        return this._lines(
            this._bounds.getSouth(),
            this._bounds.getNorth(),
            yticks, maxLines, 0
        );
    },
    _lngLines: function (xticks, maxLines) {
        return this._lines(
            this._bounds.getWest(),
            this._bounds.getEast(),
            xticks, maxLines, 1
        );
    },

    _lines: function (low, high, ticks, maxLines, baseIndex) {
        var delta = high - low;

        var lowAligned = Math.floor((low - this.fixedPoint[baseIndex])/ ticks) * ticks + this.fixedPoint[baseIndex];

        this.fixedPoint[baseIndex] = Math.floor(((low + high) / 2 - this.fixedPoint[baseIndex])/ ticks) * ticks + this.fixedPoint[baseIndex];

        var lines = [];

        if ( delta / ticks <= maxLines) {
            for (var i = lowAligned; i <= high; i += ticks) {
                lines.push(i);
            }
        }
        return lines;
    },

    _verticalLine: function (lng) {
        return new L.Polyline([
            [this._bounds.getNorth(), lng],
            [this._bounds.getSouth(), lng]
        ], this.options.lineStyle);
    },
    _horizontalLine: function (lat) {
        return new L.Polyline([
            [lat, this._bounds.getWest()],
            [lat, this._bounds.getEast()]
        ], this.options.lineStyle);
    },

});

L.grid = function (options) {
    return new L.Grid(options);
};

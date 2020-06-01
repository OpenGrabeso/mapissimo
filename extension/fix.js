/*
 * Map switcher for Strava website.
 *
 * Copyright © 2016 Tomáš Janoušek.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

document.arrive(".leaflet-container", {onceOnly: false, existing: true}, function () {
	function tileLayer(l) {
        var r;
        if (l.style) {
            console.log("Create tileLayer style " + l.style);
            r = L.mapboxGL({accessToken: l.token, style: l.style});
        } else {
            console.log("Create tileLayer url " + l.url);
            r = L.tileLayer(l.url, l.opts);
        }
        if (l.overlay) {
            var o;
            if (l.overlay.style) {
                o = L.mapboxGL({accessToken: l.overlay.token, style: l.overlay.style});
            } else {
                o = L.tileLayer(l.overlay.url, l.overlay.opts);
            }
            if (l.grid) {
                r = L.layerGroup([r, o, L.grid()]);
            } else {
                r = L.layerGroup([r, o]);
			}
        } else if (l.grid) {
            r = L.layerGroup([r, L.grid()]);
        }
		return r;
	}

	function addLayers(map) {
        Object.entries(AdditionalMapLayers).forEach(([type, l]) => map.layers[type] = tileLayer(l));
	}

	var layerNames =
		{terrain: Strava.I18n.Locale.t("strava.maps.google.custom_control.terrain")
		,standard: Strava.I18n.Locale.t("strava.maps.google.custom_control.standard")
		,satellite: Strava.I18n.Locale.t("strava.maps.google.custom_control.satellite")
		};
    Object.entries(AdditionalMapLayers).forEach(([type, l]) => {
        console.log("AdditionalMapLayers " + l.name)
        layerNames[type] = l.name
    });

	var activityOpts = jQuery('#map-type-control .options');
	if (activityOpts.length) {
		Strava.Maps.CustomControlView.prototype.handleMapTypeSelector = function (t) {
			const type = this.$$(t.target).data("map-type-id");
			const selected = this.$("#selected-map");
			selected.data("map-type-id", type);
			selected.text(layerNames[type]);
			return this.changeMapType(type);
		};

		var once = true;
		Strava.Maps.Mapbox.CustomControlView.prototype.changeMapType = function(t){
			var map = this.map();

			if (once) {
				once = false;

				addLayers(map);

				// this is needed for the right handleMapTypeSelector to be called
				this.delegateEvents();
			}

            console.log("changeMapType " + t)
			localStorage.stravaMapSwitcherPreferred = t;
			return map.setLayer(t);
		};

		function button(t) {
		    console.log("button " + t + ":" + layerNames[t])
			return jQuery('<li>')
				.append(jQuery('<a class="map-type-selector">')
				.data("map-type-id", t)
				.text(layerNames[t]));
		}

		activityOpts.css({"max-height": "250px", "right": 0});
		activityOpts.prepend(button("standard"));

		Object.keys(AdditionalMapLayers).forEach(t => activityOpts.append(button(t)));

		var preferredMap = localStorage.stravaMapSwitcherPreferred;

		// make sure delegateEvents is run at least once
		activityOpts.find(':first a').click();
		activityOpts.removeClass("open-menu");
		activityOpts.parent().removeClass("active");

		// select preferred map type
		if (preferredMap) {
			var mapLinks = activityOpts.find('a.map-type-selector');
			mapLinks.filter((_, e) => jQuery(e).data("map-type-id") === preferredMap).click();
			activityOpts.removeClass("open-menu");
			activityOpts.parent().removeClass("active");
		}
	}

	var explorerMapFilters = jQuery('#segment-map-filters form');
	if (explorerMapFilters.length) {
		var once = false;
		function explorerFound(e) {
			if (once)
				return;
			once = true;

			addLayers(e.map);

			function setMapType(t) {
                console.log("mapbox: explorerMapFilters " + t)
				localStorage.stravaMapSwitcherPreferred = t;
				e.map.setLayer(t);
			}

			var nav = jQuery('#segment-map-filters');
			nav.css({height: 'auto'});
			var clr = jQuery('<div>');
			clr.css({clear: 'both', "margin-bottom": '1em'});
			nav.append(clr);
			function addButton(name, type) {
			    console.log("addButton " + name + ":" + type);
				var b = jQuery("<div class='button btn-xs'>").text(name);
				b.click(() => { setMapType(type); });
				clr.append(b);
			}
			addButton("Standard", "standard");
			addButton("Terrain", "terrain");
			addButton("Satellite", "satellite");
			Object.entries(AdditionalMapLayers).forEach(([type, l]) => addButton(l.name, type));

			if (MapSwitcherDonation)
				clr.append(jQuery("<div class='button btn-xs'>").append(MapSwitcherDonation));

			var preferredMap = localStorage.stravaMapSwitcherPreferred;
			if (preferredMap) {
				setTimeout(() => { setMapType(preferredMap); });
			}
		}

		var old_navigate = Strava.Explorer.Navigation.prototype.navigate;
		Strava.Explorer.Navigation.prototype.navigate = function(){
			old_navigate.call(this);
			explorerFound(this.explorer);
			Strava.Explorer.Navigation.prototype.navigate = old_navigate;
		};
		explorerMapFilters.trigger('submit');
	}
});

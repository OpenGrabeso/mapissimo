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

var AdditionalMapLayers = (function(){
	var osmAttr = '&copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
	var thunderforestAttr = osmAttr + ', Tiles courtesy of <a href="http://www.thunderforest.com/" target="_blank">Andy Allan</a>';
	var mtbMapAttr = osmAttr + ', Tiles courtesy of <a href="http://mtbmap.cz/" target="_blank">mtbmap.cz</a>';
	var osmCzAttr = ', Tiles courtesy of <a href="https://openstreetmap.cz" target="_blank">openstreetmap.cz</a>';
	var mapyCzOnlyAttr = '&copy; <a href="https://www.seznam.cz/" target="_blank">Seznam.cz, a.s</a>';
	var mapyCzAttr = mapyCzOnlyAttr + ', ' + osmAttr;
	var openTopoAttr = osmAttr + ', Tiles courtesy of <a href="https://opentopomap.org" target="_blank">OpenTopoMap.org</a>';
    var mapboxAttr = osmAttr + ', Tiles courtesy of <a href="https://www.mapbox.com" target="_blank">Mapbox.com</a>';
	return [
        {type: "tracks", name: "Tracks (+Mapy.cz)",
            url: "https://api.mapbox.com/styles/v1/ospanel/cjgpk2b1q001n2rt3vz2yvve2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3RyYXZhIiwiYSI6IlpoeXU2U0UifQ.c7yhlZevNRFCqHYm6G6Cyg",
            opts: {maxZoom: 20, maxNativeZoom: 19, attribution: mapboxAttr},
            overlay:
                {url: "https://m{s}.mapserver.mapy.cz/hybrid-trail_bike-m/{z}-{x}-{y}",
                    opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, subdomains: "1234", attribution: mapyCzOnlyAttr}
				},
        },
		{type: "openstreetmap", name: "OpenStreetMap",
			url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			opts: {maxZoom: 20, maxNativeZoom: 19, attribution: osmAttr}},
		{type: "opencyclemap", name: "OpenCycleMap",
			url: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png",
			opts: {maxZoom: 20, attribution: thunderforestAttr}},
		{type: "mtbmap", name: "mtbmap.cz",
			url: "http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png",
			opts: {minZoom: 3, maxZoom: 20, maxNativeZoom: 18, attribution: mtbMapAttr}},
		{type: "mapycz", name: "mapy.cz",
			url: "https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}",
			opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr}},
		{type: "mapyczbing", name: "mapy.cz Aerial",
			url: "https://m{s}.mapserver.mapy.cz/bing/{z}-{x}-{y}",
			opts: {minZoom: 2, maxZoom: 20, subdomains: "1234", attribution: mapyCzAttr},
			overlay:
				{url: "https://m{s}.mapserver.mapy.cz/hybrid-trail_bike-m/{z}-{x}-{y}",
					opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, subdomains: "1234", attribution: mapyCzAttr}}},
		{type: "opentopo", name: "OpenTopo (+Mapy.cz)",
			url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
			opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 15, attribution: openTopoAttr},
			overlay:
				{url: "https://m{s}.mapserver.mapy.cz/hybrid-trail_bike-m/{z}-{x}-{y}",
					opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, subdomains: "1234", attribution: mapyCzOnlyAttr}}},
		{type: "opentopocz", name: "OpenTopo (+OSM.cz)",
			url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
			opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 15, attribution: openTopoAttr},
			overlay:
				{url: "https://tile.poloha.net/kct/{z}/{x}/{y}.png",
					opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, subdomains: "1234", attribution: osmCzAttr}}},
	];
})();
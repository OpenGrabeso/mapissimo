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

function generateMapLayers(token){
	var osmAttr = '&copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
	var mtbMapAttr = osmAttr + ', Tiles courtesy of <a href="http://mtbmap.cz/" target="_blank">mtbmap.cz</a>';
	var osmCzAttr = ', Tiles courtesy of <a href="https://openstreetmap.cz" target="_blank">openstreetmap.cz</a>';
    var stravaAttr = ', Heatmap courtesy of <a href="https://www.strava.com" target="_blank">Strava</a>';
	var mapyCzOnlyAttr = '&copy; <a href="https://www.seznam.cz/" target="_blank">Seznam.cz, a.s</a>';
	var mapyCzAttr = mapyCzOnlyAttr + ', ' + osmAttr;
	var openTopoAttr = osmAttr + ', Tiles courtesy of <a href="https://opentopomap.org" target="_blank">OpenTopoMap.org</a>';
    var mapboxAttr = osmAttr + ', Tiles courtesy of <a href="https://www.mapbox.com" target="_blank">Mapbox.com</a>';
    var cuzkAttr = '&copy; <a href="http://geoportal.cuzk.cz" target="_blank">ČÚZK</a>';
    return [
        {type: "routes", name: "Tracks&Routes",
            // NG style - cjh226q3j0rtd2roxwnwlwy13
            style: "mapbox://styles/ospanel/cjkbfwccz11972rmt4xvmvme6",
            token: "pk.eyJ1Ijoic3RyYXZhIiwiYSI6IlpoeXU2U0UifQ.c7yhlZevNRFCqHYm6G6Cyg",
            opts: {maxZoom: 20, maxNativeZoom: 19, attribution: mapboxAttr},
            grid: true,
        },
        {type: "mapboxoutdoors", name: "Mapbox Outdoors",
            // NG style - cjh226q3j0rtd2roxwnwlwy13
            style: "mapbox://styles/mapbox/outdoors-v10",
            token: "pk.eyJ1Ijoic3RyYXZhIiwiYSI6IlpoeXU2U0UifQ.c7yhlZevNRFCqHYm6G6Cyg",
            opts: {maxZoom: 20, maxNativeZoom: 19, attribution: mapboxAttr},
            grid: true,
        },
        {type: "routesheat", name: "Tracks&Routes+Heatmap",
            style: "mapbox://styles/ospanel/cjkbfwccz11972rmt4xvmvme6",
            token: "pk.eyJ1Ijoic3RyYXZhIiwiYSI6IlpoeXU2U0UifQ.c7yhlZevNRFCqHYm6G6Cyg",
            opts: {maxZoom: 20, maxNativeZoom: 19, attribution: mapboxAttr},
            grid: true,
            overlay:
                {url: "https://heatmap-external-{s}.strava.com/tiles/run/bluered/{z}/{x}/{y}.png?px=256",
                    opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 12, subdomains: "abc", opacity: 0.6, transparency: 'true', attribution: stravaAttr}}
        },
		{type: "openstreetmap", name: "OpenStreetMap",
			url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			opts: {maxZoom: 20, maxNativeZoom: 19, attribution: osmAttr}},
        {type: "zmcr", name: "Základní mapy ČR",
            url: "http://ags.cuzk.cz/arcgis/rest/services/zmwm/MapServer/tile/{z}/{y}/{x}",
            opts: {minZoom: 7, maxZoom: 20, maxNativeZoom: 20, attribution: cuzkAttr},
            grid: true
        },
        {type: "zmcrosm", name: "Základní mapy ČR (+Routes)",
            url: "http://ags.cuzk.cz/arcgis/rest/services/zmwm/MapServer/tile/{z}/{y}/{x}",
            opts: {minZoom: 7, maxZoom: 20, maxNativeZoom: 19, attribution: cuzkAttr},
            grid: true,
            overlay: {
                style: "mapbox://styles/ospanel/cjysnpihs01im1cqser992tha",
                token: "pk.eyJ1Ijoic3RyYXZhIiwiYSI6IlpoeXU2U0UifQ.c7yhlZevNRFCqHYm6G6Cyg",
                opts: {minZoom: 7, maxZoom: 20, maxNativeZoom: 19, attribution: mapboxAttr}
            }
        },
        {type: "mtbmap", name: "mtbmap.cz",
			url: "http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png",
			opts: {minZoom: 3, maxZoom: 20, maxNativeZoom: 18, attribution: mtbMapAttr}},
		{type: "mapycz", name: "mapy.cz",
			url: "https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}",
			opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr}},
        {type: "mapyczwinter", name: "mapy.cz - Winter",
            url: "https://mapserver.mapy.cz/winter-m/{z}-{x}-{y}",
            opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr}},
		{type: "mapyczbing", name: "mapy.cz Aerial",
			url: "https://m{s}.mapserver.mapy.cz/bing/{z}-{x}-{y}",
			opts: {minZoom: 2, maxZoom: 20, subdomains: "1234", attribution: mapyCzAttr},
			overlay:
				{url: "https://m{s}.mapserver.mapy.cz/hybrid-trail_bike-m/{z}-{x}-{y}",
					opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, subdomains: "1234", attribution: mapyCzAttr}}},
		{type: "opentopocz", name: "OpenTopo (+OSM.cz)",
			url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
			opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 15, attribution: openTopoAttr},
            grid: true,
			overlay:
				{url: "https://tile.poloha.net/kct/{z}/{x}/{y}.png",
					opts: {minZoom: 2, maxZoom: 20, maxNativeZoom: 18, subdomains: "1234", attribution: osmCzAttr}}},
	];
};

var AdditionalMapLayers = generateMapLayers("pk.eyJ1Ijoic3RyYXZhIiwiYSI6IlpoeXU2U0UifQ.c7yhlZevNRFCqHYm6G6Cyg"); // Strava mapbox access token

var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');


var myMap = L.map('map').setView([37.8, -96], 4);

var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);


function stateStyle(feature) {
    return {
        fillColor: '#FFFF00', //getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.3
    };
}


Promise.all([
    d3.json('../dataset/states.json')
]).then(function (data) {
    var states = data[0];

    L.geoJson(states, {style: stateStyle}).addTo(myMap);
    readyToDraw(states);
});


function readyToDraw(states) {


}


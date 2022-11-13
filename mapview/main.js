var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');

var show_attr = 'conf_cases';

var myMap = L.map('map').setView([37.8, -96], 4);

var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(myMap);


var choroScale = d3.scaleThreshold()
	.domain([1000, 20000, 50000, 100000000, 200000000, 500000000])
	.range(d3.schemeYlOrRd[8]);


function stateStyle(f) {
    return {
        fillColor: choroScale(f.properties.values[show_attr]),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

var state_coords;
var dataset;

Promise.all([
    d3.json('../dataset/states.json'),
    d3.csv('../dataset/state-time_filtered.csv')
]).then(function (data) {
    state_coords = data[0];
    dataset = data[1];
    

    // time format 
    var time_parse = d3.timeParse('%m/%d/%Y');
    dataset.forEach(function(d, i) {
        dataset[i].submission_date = time_parse(d.submission_date);
    });
    var min_time = d3.max(dataset, function(d) {return d.submission_date;});
    var max_time = d3.max(dataset, function(d) {return d.submission_date;});


    readyToDraw();
});

function readyToDraw() {
    // copy the state_coords to states
    var states = structuredClone(state_coords);

    // filter dataset
    filtered_dataset = dataset.filter(function(d, i) {
        return true; //d.state == 'Maryland';
    });

    counts = {};
    // sum up the filtered data
    for(var i = 0; i < filtered_dataset.length; i++) {
        var d = filtered_dataset[i];
        if(counts[d.state] == undefined) {
            counts[d.state] = 0;
        }
        counts[d.state] += +d[show_attr];
    }

    // load into states dict for geoJson
    for(var i = 0; i < states.features.length; i++) {
        state_name = states.features[i].properties['NAME'];
        states.features[i].properties.values = {}
        states.features[i].properties.values[show_attr] = counts[state_name];
    }
    L.geoJson(states, {style: stateStyle}).addTo(myMap);

}


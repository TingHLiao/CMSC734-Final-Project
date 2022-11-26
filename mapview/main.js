var map = d3.select('#map');
var mapWidth = +map.attr('width');
var mapHeight = +map.attr('height');

var show_attr = 'conf_cases';
// conf_death

var myMap = L.map('map').setView([37.8, -96], 4);

// var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// }).addTo(myMap);
var tiles = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
}).addTo(myMap);


var choroScale = d3.scaleThreshold()
	// .domain([1000, 20000, 50000, 100000000, 200000000, 500000000])
    .domain([1000, 8000, 30000, 50000, 800000, 1000000])
	.range(d3.schemeYlOrRd[8]);
var choroScale_death = d3.scaleThreshold()
    .domain([100, 1000, 30000, 50000, 500000, 800000])
	.range(d3.schemeBlues[9]);
var choroScale_vac = d3.scaleThreshold()
    .domain([0, 1, 80000, 5000000, 50000000, 100000000, 20000000, 50000000])
	.range(d3.schemeBuGn[9]);


function stateStyle(f) {
    if (show_attr == 'conf_cases')
        return {
            fillColor: choroScale(f.properties.values[show_attr]),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    else if (show_attr == 'conf_death'){
        return {
            fillColor: choroScale_death(f.properties.values[show_attr]),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }
    else
        return {
            fillColor: choroScale_vac(f.properties.values[show_attr]),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
}

var state_coords;
var layer = null;
var dataset;

// time slider
var filter_min_date;
var filter_max_date;
var date_interpolate_func;
var display_date_format = d3.timeFormat('%m/%d/%Y');
function sliderSlidingListener(handler, value) {
    /*if(handler == 0)
        filter_min_date = structuredClone(date_interpolate_func(value));
    else
        filter_max_date = structuredClone(date_interpolate_func(value));
    readyToDraw();*/
    return display_date_format(date_interpolate_func(value));
}
function sliderStopListener(value0, value1) {
    filter_min_date = structuredClone(date_interpolate_func(value0));
    filter_max_date = structuredClone(date_interpolate_func(value1));
    readyToDraw();
}

Promise.all([
    d3.json('../dataset/states.json'),
    d3.csv('../dataset/merge.csv')
]).then(function (data) {
    state_coords = data[0];
    dataset = data[1];

    // time format 
    var time_parse = d3.timeParse('%Y/%m/%d');
    dataset.forEach(function(d, i) {
        dataset[i].date = time_parse(d.date);
    });
    filter_min_date = time_parse('2020/01/22'); //d3.min(dataset, function(d) {return d.date;});
    filter_max_date = d3.max(dataset, function(d) {return d.date;});
    date_interpolate_func = d3.interpolateDate(filter_min_date, filter_max_date);

    readyToDraw();
});

var show_attr_mapping = {
    'conf_cases': 'new_case',
    'conf_death': 'new_death',
    'vac_cnt': 'daily_vaccinations'
};

function readyToDraw() {
    // copy the state_coords to states
    var states = structuredClone(state_coords);

    // filter dataset
    var filtered_dataset = dataset.filter(function(d, i) {
        return d.date >= filter_min_date && d.date <= filter_max_date;
    });
    counts = {};
    // sum up the filtered data
    attr = show_attr_mapping[show_attr];
    for(var i = 0; i < filtered_dataset.length; i++) {
        var d = filtered_dataset[i];
        if(counts[d.state] == undefined) {
            counts[d.state] = 0;
        }
        counts[d.state] += +d[attr];
    }

    // load into states dict for geoJson
    for(var i = 0; i < states.features.length; i++) {
        state_name = states.features[i].properties['NAME'];
        states.features[i].properties.values = {}
        states.features[i].properties.values[show_attr] = counts[state_name];
    }
    if(layer != null)
        myMap.removeLayer(layer);
    layer = L.geoJson(states, {style: stateStyle}).addTo(myMap);

}



d3.selectAll('.btn-group > .btn.btn-secondary')
    .on('click', function() {
        var newMapType = d3.select(this).attr('data-type');

        d3.selectAll('.btn.btn-secondary.active').classed('active', false);

        showOnMap(newMapType);
        // console.log(newMapType);
    });


function showOnMap(type) {
    switch(type) {
        case 'cleared':
            break;
        case 'conf_cases':
            show_attr = 'conf_cases';
            readyToDraw();
            break;
        case 'conf_death':
            show_attr = 'conf_death';
            readyToDraw();
            break;
        case 'vac_cnt':
            show_attr = 'vac_cnt';
            readyToDraw();
            break;
    }
}

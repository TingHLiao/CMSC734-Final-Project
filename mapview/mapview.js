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

const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    // console.log(props)
    var [key, value] = props ? Object.entries(props.values) : [null, null];
    if(value  == null ) value=0;
    const contents = props ? `<b>${props.NAME}</b><br />${key[1]}` : 'Hover over a state';
    this._div.innerHTML = `<h4>US COVID-19 Data</h4>${contents}`;
};

info.addTo(myMap);

function hover(state) {
    var layer = state.target;

    layer.setStyle({
        weight: 2,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
    info.update(layer.feature.properties);
}

function dehover(state) {
    layer.resetStyle(state.target);
    info.update();
}

function show_state(e) {
    var name = e.target.feature.properties.NAME;
    // console.log($('#select-state'))
    var sel = document.getElementById("select-state");
    for(var i = 0; i < sel.options.length; i++) {
        var opt = sel.options[i];
        if (opt.text == name){
            console.log(opt.text)
            opt.selected = !opt.selected;
        }
    }

    changeStates(sel);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: hover,
        mouseout: dehover,
        click: show_state
    });
}

function draw_map(dataset, min_data, max_data, attr) {
    // copy the state_coords to states
    var states = structuredClone(state_coords);

    counts = {};
    // sum up the filtered data
    /*
    dataset_rollup = d3.nest()
        .key(function(d) {return d.state;})
        .rollup(function(d) {
            return d3.sum(d, function(e) {return +e[attr];})
        })
        .entries(dataset);
    
    counts = {};
    for(var i = 0; i < dataset_rollup.length; i++) {
        counts[dataset_rollup[i].key] = dataset_rollup[i].value;
    }*/
    counts = {};
    if(slider_mode == 'time') {
        for(var i = 0; i < min_data.length; i++) {
            counts[min_data[i].state] = +min_data[i][attr];
        }
    } else {

    }

    // load into states dict for geoJson
    for(var i = 0; i < states.features.length; i++) {
        state_name = states.features[i].properties['NAME'];
        states.features[i].properties.values = {}
        states.features[i].properties.values[show_attr] = counts[state_name];
    }
    if(layer != null) {
        //myMap.removeLayer(layer);
        layer.eachLayer(function(f) {
            var state_name = f.feature.properties['NAME'];
            f.feature.properties.values[show_attr] = counts[state_name]; 
            f.setStyle(stateStyle(f.feature));
        })
    } else {
        layer = L.geoJson(states, {style: stateStyle, onEachFeature: onEachFeature}).addTo(myMap);
    }
        
    
}






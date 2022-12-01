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

var choroScale_cases_time = d3.scaleThreshold()
    .domain([10, 50, 200, 2000, 5000, 10000, 20000, 50000, 90000, 150000, 300000])
	.range(d3.schemeYlOrRd[9]);

var choroScale_cases_period = d3.scaleThreshold()
    .domain([500, 5000, 25000, 80000, 250000, 1000000, 2000000, 5000000, 8000000])
	.range(d3.schemeYlOrRd[9]);

var choroScale_death_time = d3.scaleThreshold()
    .domain([0, 2, 5, 10, 25, 50, 80, 120, 200, 500, 800])
	.range(d3.schemeBlues[9]);

var choroScale_death_period = d3.scaleThreshold()
    .domain([20, 100, 500, 2000, 8000, 20000, 40000, 60000, 80000, 100000])
	.range(d3.schemeBlues[9]);

var choroScale_vac_time = d3.scaleThreshold()
    .domain([100, 300, 1000, 3000, 8000, 20000, 40000, 80000, 160000, 350000, 500000])
    .range(d3.schemeBuGn[9]);

var choroScale_vac_period = d3.scaleThreshold()
    .domain([1000, 10000, 50000, 200000, 500000, 2000000, 5000000, 10000000, 50000000])
	.range(d3.schemeBuGn[9]);
    
var choroScale_inpatient_time = d3.scaleThreshold()
    .domain([ 10, 25, 50, 100, 200, 500, 800, 1200, 5000])
    .range(d3.schemeRdPu[9]);

var choroScale_inpatient_period = d3.scaleThreshold()
    .domain([1000, 3000, 10000, 50000, 200000, 500000, 2000000, 5000000])
	.range(d3.schemeRdPu[9]);

var choroScale_exc_death_time = d3.scaleThreshold()
    .domain([0, 3, 10, 25, 60, 110, 160, 200, 300, 400]) 
    .range(d3.schemePurples[9]);

var choroScale_exc_death_period = d3.scaleThreshold()
    .domain([100, 500, 1500, 3000, 5000, 10000, 25000, 50000, 100000, 150000])
	.range(d3.schemeBuGn[9]);

function stateStyle(f) {
    var color_style = null;
    if(show_attr == 'conf_cases') {
        if (slider_mode == 'time') color_style = choroScale_cases_time;
        else color_style = choroScale_cases_period;
    } else if (show_attr == 'conf_death') {
        if (slider_mode == 'time') color_style = choroScale_death_time;
        else color_style = choroScale_death_period;
    } else if (show_attr == 'vac_cnt') {
        if (slider_mode == 'time') color_style = choroScale_vac_time;
        else color_style = choroScale_vac_period;
    } else if (show_attr == 'exc_death') {
        if (slider_mode == 'time') color_style = choroScale_exc_death_time;
        else color_style = choroScale_exc_death_period;
    } else if (show_attr == 'inpatient') {
        if (slider_mode == 'time') color_style = choroScale_inpatient_time;
        else color_style = choroScale_inpatient_period;
    }
    return {
        fillColor: color_style(f.properties.values[show_attr]),
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
    if(props == undefined) {
        info._div.hidden = true;
        return;
    }
    info._div.hidden = false;
    value = props.values[show_attr];
    var contents;
    if(value == undefined)
        info._div.hidden = true;
    else{
        info._div.hidden = false;
        contents = props ? `<b>${props.NAME}</b><br />${value}` : 'Hover over a state';
    }
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
    var sel = document.getElementById("select-state");
    for(var i = 0; i < sel.options.length; i++) {
        var opt = sel.options[i];
        if (opt.text == name){
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

function draw_map(dataset, attr) {
    // copy the state_coords to states
    var states = structuredClone(state_coords);

    counts = {};
    // sum up the filtered data
    // console.log(dataset);
    dataset_rollup = d3.nest()
        .key(function(d) {return d.state;})
        .rollup(function(d) {
            return d3.sum(d, function(e) {return +e[attr];})
        })
        .entries(dataset);
    
    counts = {};
    for(var i = 0; i < dataset_rollup.length; i++) {
        counts[dataset_rollup[i].key] = dataset_rollup[i].value;
    }
    // console.log(counts);
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






var select_secondary_view = 'connected_scatter';


var dataset;
var state_coords;
var filtered_dataset;

// time slider
var filter_min_date;
var filter_max_date;
var date_interpolate_func;
var date_format = d3.timeFormat('%Y/%m/%d');

function sliderSlidingListener(values) {
    updateDateRange(values);

    return [date_format(date_interpolate_func(values[0])), 
            date_format(date_interpolate_func(values[1]))];
}

function updateDateRange(values) {
    console.log(values);
    filter_min_date = structuredClone(date_format(date_interpolate_func(values[0])));
    filter_max_date = structuredClone(date_format(date_interpolate_func(values[1])));
    console.log(filter_max_date, filter_min_date);
    update();
}

// initialize dataset and two views
Promise.all([
    d3.csv('dataset/merge.csv'),
    d3.json('../dataset/states.json'),
]).then(function (data) {
    dataset = data[0];
    state_coords = data[1];

    // time format 
    var time_parse = d3.timeParse('%Y/%m/%d');
    filter_min_date = '2020/01/22'; //d3.min(dataset, function(d) {return d.date;});
    filter_max_date = d3.max(dataset, function(d) {return d.date;});
    date_interpolate_func = d3.interpolateDate(time_parse(filter_min_date), time_parse(filter_max_date));
    changeSliderMode("time");
    update();
});

function update() {
    // filter dataset
    filtered_dataset = dataset.filter(function(d, i) {
        return d.date >= filter_min_date && d.date <= filter_max_date;
    });
    show_map(show_attr);
    show_secondary_view();
}

function show_secondary_view() {
    d3.select('#secondary_svg').selectAll('*').remove();

    load_connected_scatter(filtered_dataset);
}

var primary_view_attr_mapping = {
    'conf_cases': 'new_case',
    'conf_death': 'new_death',
    'vac_cnt': 'daily_vaccinations'
};

var show_attr = 'conf_cases';

d3.selectAll('.btn-group > .btn.btn-secondary')
    .on('click', function() {
        show_attr = d3.select(this).attr('data-type');

        d3.selectAll('.btn.btn-secondary.active').classed('active', false);

        show_map(show_attr);
    });
function show_map(show_attr) {
    attr = primary_view_attr_mapping[show_attr];
    draw_map(filtered_dataset, attr);
}
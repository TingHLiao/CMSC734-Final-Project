var select_secondary_view = 'connected_scatter';
var select_secondary_x_axis, select_secondary_y_axis;

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
    show_secondary_view_options();
    update();
});


// update both views
function update() {
    // filter dataset
    filtered_dataset = dataset.filter(function(d, i) {
        return d.date >= filter_min_date && d.date <= filter_max_date;
    });
    show_map(show_attr);
    show_secondary_view();
}

/* primary view start */
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
/* primary view end */

/* secondary view start */

secondary_options = {
    'time': {
        'scatter plot': {
            'x': ['h', 'i', 'j'],
            'y': ['k', 'l', 'm'],
        },
        'stacked bar chart': {
            'x': ['o', 'p', 'q'],
            'y': [],
        },
        'parallel coordinate': {
            'x': [],
            'y': [],
        },
    },
    'period': {
        'connected scatter plot': {
            'x': ['a', 'b', 'c'],
            'y': ['e', 'f', 'g'],
        },
        'scatter plot': {
            'x': ['h', 'i', 'j'],
            'y': ['k', 'l', 'm'],
        },
        'stacked bar chart': {
            'x': ['o', 'p', 'q'],
            'y': [],
        },
        'parallel coordinate': {
            'x': [],
            'y': [],   
        },
    }
}


function show_secondary_view_options() {
    valid_options = Object.keys(secondary_options[slider_mode]);
    var options = $('option[name="secondary-option"]');
    for(var i = 0; i < options.length; i++) {
        if(i < valid_options.length) {
            $(options[i]).show();
            $(options[i]).text(valid_options[i]);
        } else {
            $(options[i]).hide();
        }
    }
    
    change_secondary_view();
}

function change_secondary_view() {
    var selected = document.getElementById('secondary-select').value;
    selected = Object.keys(secondary_options[slider_mode])[+selected];
    
    // x-axis 
    valid_xaxis_options = secondary_options[slider_mode][selected]['x'];
    if(valid_xaxis_options.length > 0) {
        var x_options = $('option[name="secondary-option-x"]');
        $('#secondary-div-x').show();
        for(var i = 0; i < x_options.length; i++) {
            if(i < valid_xaxis_options.length) {
                $(x_options[i]).show();
                $(x_options[i]).text(valid_xaxis_options[i]);
            } else {
                $(x_options[i]).hide();
            }
        }
    } else {
        $('#secondary-div-x').hide();
    }
    // y-axis
    valid_yaxis_options = secondary_options[slider_mode][selected]['y'];
    if(valid_yaxis_options.length > 0) {
        var y_options = $('option[name="secondary-option-y"]');
        $('#secondary-div-y').show();
        for(var i = 0; i < y_options.length; i++) {
            if(i < valid_yaxis_options.length) {
                $(y_options[i]).show();
                $(y_options[i]).text(valid_yaxis_options[i]);
            } else {
                $(y_options[i]).hide();
            }
        }
    } else {
        $('#secondary-div-y').hide();
    }
    console.log(selected);
    select_secondary_view = selected;

    change_secondary_axis();
    show_secondary_view();
}

function change_secondary_axis() {
    var selected_x = document.getElementById('secondary-select-x').value;
    selected_x = secondary_options[slider_mode][select_secondary_view]['x'][+selected_x];

    var selected_y = document.getElementById('secondary-select-y').value;
    selected_y = secondary_options[slider_mode][select_secondary_view]['y'][+selected_y];

    select_secondary_x_axis = selected_x;
    select_secondary_y_axis = selected_y;
}

function show_secondary_view() {
    console.log(select_secondary_view, select_secondary_x_axis, select_secondary_y_axis);
    d3.select('#secondary_svg').selectAll('*').remove();
    if(select_secondary_view == 'connected scatter plot') {
        load_connected_scatter(filtered_dataset);
    }
}
/* secondary view end */

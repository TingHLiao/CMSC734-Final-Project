var select_secondary_view = 'connected_scatter';
var select_secondary_x_axis, select_secondary_y_axis, select_secondary_radius;

var dataset;
var state_coords;
var filtered_dataset;
var min_data;
var max_data;

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
    // console.log(values);
    filter_min_date = structuredClone(date_format(date_interpolate_func(values[0])));
    filter_max_date = structuredClone(date_format(date_interpolate_func(values[1])));
    // console.log(filter_max_date, filter_min_date);
    update();
}

// initialize dataset and two views
Promise.all([
    d3.csv('dataset/merge_accum.csv'),
    d3.json('dataset/states.json'),
]).then(function (data) {
    dataset = data[0];
    state_coords = data[1];

    // time format 
    var time_parse = d3.timeParse('%Y/%m/%d');
    dataset.forEach(d => {
        d.date = date_format(d3.timeParse('%m/%d/%Y')(d.date));
        //d.date = date_format(time_parse(d.date));
    });

    filter_min_date = '2020/01/22'; //d3.min(dataset, function(d) {return d.date;});
    filter_max_date = d3.max(dataset, function(d) {return d.date;});
    date_interpolate_func = d3.interpolateDate(time_parse(filter_min_date), time_parse(filter_max_date));

    $('#select-state').val('All');
    $('select[multiple]').multiselect('refresh');
    changeSliderMode("period");
    select_data_attr(document.getElementsByName('btn-attr')[0], 'conf_cases');
    show_secondary_view_options();
    update();
});


// update both views
function update() {
    // filter dataset
    filtered_dataset = dataset.filter(function(d, i) {
        var date_bool = d.date >= filter_min_date && d.date <= filter_max_date;
        var state_bool = true;
        if(select_all_states == false) {
            state_bool = select_certain_states.includes(d.state_abbrev);
            //console.log(state_bool);
        }
        return date_bool && state_bool;
    });
    
    min_data = dataset.filter(function(d, i) {
        var date_bool = d.date == filter_min_date;
        var state_bool = true;
        if(select_all_states == false) {
            state_bool = select_certain_states.includes(d.state_abbrev);
            //console.log(state_bool);
        }
        return date_bool && state_bool;
    })

    max_data = dataset.filter(function(d, i) {
        var date_bool = d.date == filter_max_date;
        var state_bool = true;
        if(select_all_states == false) {
            state_bool = select_certain_states.includes(d.state_abbrev);
            //console.log(state_bool);
        }
        return date_bool && state_bool;
    })
    
    show_map(show_attr);
    show_secondary_view();
}

/* primary view start */
var primary_view_attr_mapping = {
    'conf_cases': 'new_case',
    'conf_death': 'new_death',
    'vac_cnt': 'daily_vaccinations',
    'exc_death': 'total_Excess Estimate',
    'inpatient': 'inpatient_beds_used_covid',
};

var show_attr = 'conf_cases';

function select_data_attr(btn, attr) {
    show_attr = attr;
    var btns = document.getElementsByName('btn-attr');
    for(var i = 0; i < btns.length; i++) {
        set_inactive(btns[i]);
    }
    set_active(btn);
    show_map(show_attr);
    show_secondary_view();
}

function show_map(show_attr) {
    attr = primary_view_attr_mapping[show_attr];
    // console.log(attr);
    draw_map(filtered_dataset, attr);
}
/* primary view end */

/* secondary view start */

secondary_options = {
    'time': {
        'bubble chart': {
            'x': ['New confirmed cases', 'New death', 'New vaccinations counts', 'COVID inpatient beds', 'Excess death'],
            'y': ['New death', 'New confirmed cases', 'New vaccinations counts', 'COVID inpatient beds', 'Excess death'],
            'r': ['-', 'New death', 'New confirmed cases', 'New vaccinations counts', 'COVID inpatient beds', 'Excess death']
        },
        'bar chart': {
            'x': [],
            'y': [],
            'r': [],
        },
    },
    'period': {
        'connected scatter plot': {
            'x': ['New confirmed cases', 'New death', 'New vaccinations counts', 'COVID inpatient beds', 'Excess death'],
            'y': ['New death', 'New confirmed cases', 'New vaccinations counts', 'COVID inpatient beds', 'Excess death'],
            'r': [],
        },
        'bar chart': {
            'x': [],
            'y': [],
            'r': [],
        },
    }
}

var secondary_name_mapping = {
    'New confirmed cases': 'new_case',
    'New death': 'new_death',
    'New vaccinations counts': 'daily_vaccinations',
    'COVID inpatient beds': 'inpatient_beds_used_covid',
    'Excess death': 'total_Excess Estimate',
};


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
    // r-axis
    valid_raxis_options = secondary_options[slider_mode][selected]['r'];
    if(valid_raxis_options.length > 0) {
        var r_options = $('option[name="secondary-option-r"]');
        $('#secondary-div-r').show();
        for(var i = 0; i < r_options.length; i++) {
            if(i < valid_raxis_options.length) {
                $(r_options[i]).show();
                $(r_options[i]).text(valid_raxis_options[i]);
            } else {
                $(r_options[i]).hide();
            }
        }
    } else {
        $('#secondary-div-r').hide();
    }
    // console.log(selected);
    select_secondary_view = selected;

    change_secondary_axis();
}

function change_secondary_axis() {
    var selected_x = document.getElementById('secondary-select-x').value;
    selected_x = secondary_options[slider_mode][select_secondary_view]['x'][+selected_x];

    var selected_y = document.getElementById('secondary-select-y').value;
    selected_y = secondary_options[slider_mode][select_secondary_view]['y'][+selected_y];
    
    var selected_r = document.getElementById('secondary-select-r').value;
    selected_r = secondary_options[slider_mode][select_secondary_view]['r'][+selected_r];
    
    $('#sort-toggle').hide();
    if (select_secondary_view == 'bar chart') {
        $('#sort-toggle').show();
    }
    
    select_secondary_x_axis = selected_x;
    select_secondary_y_axis = selected_y;
    select_secondary_radius = selected_r;
    show_secondary_view();
}

function show_secondary_view() {
    // console.log(select_secondary_view, select_secondary_x_axis, select_secondary_y_axis);
    d3.select('#secondary_svg').selectAll('*').remove();
    if(select_secondary_view == 'connected scatter plot' || select_secondary_view == 'bubble chart') {
        if(slider_mode == 'period')
            load_connected_scatter(filtered_dataset, select_secondary_x_axis, select_secondary_y_axis);
        else
            load_scatter(filtered_dataset, select_secondary_x_axis, select_secondary_y_axis, select_secondary_radius);

    }
    else if (select_secondary_view == 'bar chart') {
        load_bar_chart(filtered_dataset, filter_min_date, filter_max_date);
    }
}
/* secondary view end */

var select_all_states = true;
var select_certain_states = [];
function changeStates(sel) {
    if (sel.options[0].selected && !select_all_states){
        for(var i = 1; i < sel.options.length; i++) {
            var opt = sel.options[i];
            opt.selected = false;
        }
        select_certain_states = [];
        select_all_states = true;
        $('select[multiple]').multiselect('refresh');
    } else{
    sel.options[0].selected = false;
    $('select[multiple]').multiselect('refresh');
    select_certain_states = [];
    for(var i = 1; i < sel.options.length; i++) {
        var opt = sel.options[i];

        if(opt.selected) {
            select_certain_states.push(opt.value);
        }
    }
        select_all_states = false;
    }
    if(select_certain_states.length == 0) {
        select_all_states = true;
        sel.options[0].selected = true;
        $('select[multiple]').multiselect('refresh');
    }
    // console.log(select_all_states, select_certain_states);
    update();

}
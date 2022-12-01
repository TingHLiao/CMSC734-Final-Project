var single_value = 0.2;
var range_values = [0, 1];
$("#slider-range").slider({
  range: true,
  orientation: "horizontal",
  min: 0,
  max: 1,
  values: [0, 1],
  step: 0.001,

  slide: function (event, ui) {
    if (ui.values[0] == ui.values[1]) {
      return false;
    }
    range_values = ui.values;
    update_slider_tag(range_values);
  },

  stop: function(event, ui) {
  }
});

$("#slider-single").slider({
  range: false,
  orientation: "horizontal",
  min: 0,
  max: 1,
  value: single_value,
  step: 0.001,

  slide: function (event, ui) {
    if(is_animate) {
      changeSliderMode('time');
    }
    single_value = ui.value;
    update_slider_tag(single_value);

  },

  stop: function(event, ui) {
      //sliderStopListener(ui.value);
  }
});

var is_animate = false;
function animateSlider() {

  // console.log(is_animate);
  if(is_animate == false) {
    is_animate = true;
    //set_inactive(document.getElementById('btn-time'));
    //set_inactive(document.getElementById('btn-period'));
    set_active(document.getElementById('btn-animation'));
    animateCallback();
    if(slider_mode == 'period') {
      range_values[1] = 0;
    }
    document.getElementById('btn-animation').innerHTML = 'Pause animation';
  } else {
    is_animate = false;
    set_inactive(document.getElementById('btn-animation'));
    /*if(slider_mode == 'period') {
      set_active(document.getElementById('btn-period'));
    } else {
      set_active(document.getElementById('btn-time'));
    }*/
    document.getElementById('btn-animation').innerHTML = 'Play animation';
  }
}
function animateCallback() {
  if(slider_mode == 'time') {
    single_value = single_value + 0.001;
    $('#slider-single').slider('option', 'value', single_value);
    update_slider_tag(single_value);

    if(single_value > 1)
      single_value = 0;
  } else {
    range_values[1] = range_values[1] + 0.001;
    $('#slider-range').slider('option', 'values', range_values);
    update_slider_tag(range_values);
    if(range_values[1] > 1) range_values[1] = 0;
  }
  
  
  if(is_animate)
    setTimeout(animateCallback, 80);
}

var slider_mode = 'time';
$('#slider-range').hide();

function changeSliderMode(mode) {

  if(mode != 'animate') {
    set_inactive(document.getElementById('btn-time'));
    set_inactive(document.getElementById('btn-period'));
    set_inactive(document.getElementById('btn-animation'));
  }

  if(mode == 'time') {
    slider_mode = 'time';
    set_active(document.getElementById('btn-time'));
    $('#slider-single').show();
    $('#slider-range').hide();
    updateDateRange(single_value);
  } else if (mode == 'period_par'){
    slider_mode = 'period_par';
    set_active(document.getElementById('btn-period'));
    $('#slider-single').hide();
    $('#slider-range').show();
    updateDateRange(range_values);
  } else if (mode == 'period') {
    slider_mode = 'period';
    set_active(document.getElementById('btn-period'));
    $('#slider-single').hide();
    $('#slider-range').show();
    updateDateRange(range_values);
  }
  update_slider_tag();

  if(mode == 'animate') {
    animateSlider();
  } else if (mode != 'period_par'){
    is_animate = false;
    document.getElementById('btn-animation').innerHTML = 'Play animation';
  }

}

function update_slider_tag() {
  if(slider_mode == 'time') {
    $("#slider-value1").css('left', "" + (330*single_value - 72*single_value) + "px");
    $("#slider-value2").hide();
    $("#slider-value1").text(sliderSlidingListener([single_value, single_value])[0]);
  } else {
    $("#slider-value2").show();
    $("#slider-value1").css('left', "" + (330*range_values[0] - 72*range_values[0]) + "px");
    $("#slider-value2").css('left', "" + (330*range_values[1] - 72*range_values[1]) + "px");
    dates = sliderSlidingListener(range_values);
    $("#slider-value1").text(dates[0]);
    $("#slider-value2").text(dates[1]);
  }
}


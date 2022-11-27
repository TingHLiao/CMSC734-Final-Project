var single_value = 0.5;
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
    single_value = ui.value;
    update_slider_tag(single_value);
  },

  stop: function(event, ui) {
      //sliderStopListener(ui.value);
  }
});


var slider_mode = 'time';
$('#slider-range').hide();
function changeSliderMode(mode) {
  slider_mode = mode;
  if(mode == 'time') {
    $('#slider-single').show();
    $('#slider-range').hide();
    updateDateRange(single_value);
  } else {
    $('#slider-single').hide();
    $('#slider-range').show();
    updateDateRange(range_values);
  }
  update_slider_tag();
  
}

function update_slider_tag() {
  if(slider_mode == 'time') {
    $("#slider-value1").css('left', "" + 100*single_value + "%");
    $("#slider-value2").hide();
    $("#slider-value1").text(sliderSlidingListener([single_value, single_value])[0]);
  } else {
    $("#slider-value2").show();
    $("#slider-value1").css('left', "" + 100*range_values[0] + "%");
    $("#slider-value2").css('left', "" + 100*range_values[1] + "%");
    dates = sliderSlidingListener(range_values);
    $("#slider-value1").text(dates[0]);
    $("#slider-value2").text(dates[1]);
  }
}

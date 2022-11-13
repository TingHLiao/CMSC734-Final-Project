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
      
      $("#slider_min").text(sliderSlidingListener(0, ui.values[0]));
      $("#slider_max").text(sliderSlidingListener(1, ui.values[1]));
    },

    stop: function(event, ui) {
        sliderStopListener(ui.values[0], ui.values[1]);
    }
  });

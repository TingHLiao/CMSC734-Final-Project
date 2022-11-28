
let total_width = 1200;
$('#slider-resize').slider({
    range: false,
    orientation: "horizontal",
    min: 0,
    max: 1,
    value: 700/1200,
    step: 0.01,
  
    slide: function (event, ui) {
        var primary_width = total_width * ui.value;
        var secondary_width = total_width * (1 - ui.value);
        
        $("#float-child-primary").css('width', '' + primary_width + 'px');
        $("#child-primary").css('width', '' + primary_width + 'px');
        $("#control-panel-1").css('width', '' + (primary_width - 40) + 'px');
        
        $("#map").css('width', '' + primary_width + 'px');
        $("#float-child-secondary").css('width', '' + secondary_width + 'px');
        $("#child-secondary").css('width', '' + secondary_width + 'px');
        
    },
  
    stop: function(event, ui) {
    }
});
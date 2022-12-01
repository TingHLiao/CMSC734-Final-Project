var width = document.body.clientWidth,
    height = d3.max([document.body.clientHeight-540, 240]);

var m = [60, 0, 10, 0],
    w = width - m[1] - m[3],
    h = height - m[0] - m[2],
    xscale = d3.scale.ordinal().rangePoints([0, w], 1),
    yscale = {},
    dragging = {},
    line = d3.line(),
    axis = d3.axisLeft().ticks(1+height/50),
    data,
    foreground,
    background,
    highlighted,
    dimensions,                           
    legend,
    render_speed = 50,
    brush_count = 0,
    excluded_groups = [];

var colors = {
    "Alaska": [185,56,73],
    "Alabama": [37,50,75],
    "Arkansas": [325,50,39],
    "Arizona": [10,28,67],
    "California": [271,39,57],
    "Colorado": [56,58,73],
    "Connecticut": [28,100,52],
    "District of Columbia": [41,75,61],
    "Delaware": [60,86,61],
    "Florida": [30,100,73],
    "Georgia": [318,65,67],
    "Hawaii": [274,30,76],
    "Iowa": [20,49,49],
    "Idaho": [334,80,84],
    "Illinois": [185,80,45],
    "Indiana": [10,30,42],
    "Kansas": [339,60,49],
    "Kentucky": [359,69,49],
    "Louisiana": [204,70,41],
    "Massachusetts": [1,100,79],
    "Maryland": [189,57,75],
    "Maine": [110,57,70],
    "Michigan": [214,55,79],
    "Minnesota": [339,60,75],
    "Missouri": [120,56,40],
    "Mississippi": [115, 11, 76],
    "Montana": [225, 53, 32],
    "North Carolina": [210, 50, 8],
    "North Dakota": [185, 79, 13],
    "Nebraska": [0, 0, 28],
    "New Hampshire": [70, 37, 49],
    "New Jersey": [125, 17, 26],
    "New Mexico": [194, 10, 46],
    "Nevada": [151, 22, 39],
    "New York": [201, 34, 46],
    "Ohio": [233, 81, 20],
    "Oklahoma": [26, 92, 41],
    "Oregon": [193, 4, 64],
    "Pennsylvania": [344, 34, 34],
    "Rhode Island": [75, 58, 24],
    "South Carolina": [2, 100, 17],
    "South Dakota": [38, 31, 42],
    "Tennessee": [164, 54, 30],
    "Texas": [316, 38, 47],
    "Utah": [207, 23, 44],
    "Virginia": [186, 34, 15],
    "Vermont": [156, 57, 71],
    "Washington": [185, 21, 21],
    "Wisconsin": [346, 51, 62],
    "West Virginia": [120, 5, 16],
    "Wyoming": [33, 80, 68]
};

// Scale chart and canvas height
d3.select("#chart")
    .style("height", (h + m[0] + m[2]) + "px")

d3.selectAll("canvas")
    .attr("width", w)
    .attr("height", h)
    .style("padding", m.join("px ") + "px");


// Foreground canvas for primary view
foreground = document.getElementById('foreground').getContext('2d');
foreground.globalCompositeOperation = "destination-over";
foreground.strokeStyle = "rgba(0,100,160,0.1)";
foreground.lineWidth = 1.7;
foreground.fillText("Loading...",w/2,h/2);

// Highlight canvas for temporary interactions
highlighted = document.getElementById('highlight').getContext('2d');
highlighted.strokeStyle = "rgba(0,100,160,1)";
highlighted.lineWidth = 4;

// Background canvas
background = document.getElementById('background').getContext('2d');
background.strokeStyle = "rgba(0,100,160,0.1)";
background.lineWidth = 1.7;

// SVG for ticks, labels, and interactions
var svg = d3.select("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

// time slider
var filter_min_date;
var filter_max_date;
var min_data;
var max_data;
var date_interpolate_func;
var flag = false;
var scale_flag = false;
var date_format = d3.timeFormat('%Y/%m/%d');
function set_inactive(btn) {
  // dum funciton
}
function set_active(btn) {
  // dum funciton
}
function sliderSlidingListener(values) {
    updateDateRange(values);

    return [date_format(date_interpolate_func(values[0])), 
            date_format(date_interpolate_func(values[1]))];
}

function updateDateRange(values) {
    filter_min_date = structuredClone(date_format(date_interpolate_func(values[0])));
    filter_max_date = structuredClone(date_format(date_interpolate_func(values[1])));
    // console.log(filter_max_date, filter_min_date);
    if (!flag)
      return
    update();
}

Promise.all([
    d3.csv('../dataset/merge_accum.csv')
]).then(function (data) {
    dataset = data[0];
    // time format 
    var time_parse = d3.timeParse('%Y/%m/%d');
    dataset.forEach(d => {
        d.date = date_format(d3.timeParse('%m/%d/%Y')(d.date));
    });

    filter_min_date = '2020/01/22';
    filter_max_date = d3.max(dataset, function(d) {return d.date;});
    date_interpolate_func = d3.interpolateDate(time_parse(filter_min_date), time_parse(filter_max_date));
    changeSliderMode("period_par");

    var i = 0;
    for (var key in colors) {
      if (i > 10){
        excluded_groups.push(key);
      }
      i++;
    };
    flag = true;
    update();
});
function update() {
  // filtered_dataset = dataset.filter(function(d, i) {
  //   var date_bool = d.date >= filter_min_date && d.date <= filter_max_date;
  //   return date_bool;
  // });

  min_data = dataset.filter(function(d, i) {
      var date_bool = d.date == filter_min_date;
      return date_bool;
  })

  max_data = dataset.filter(function(d, i) {
      var date_bool = d.date == filter_max_date;
      return date_bool;
  })


  data = [];
  data_min = [];
  for (var key in colors) {
      data.push({"state": key})
      data_min.push({"state": key})
  };

  for(var i = 0; i < min_data.length; i++) {
    // console.log(min_data[i])
    for (var k in min_data[i]) {
      // console.log(k)
      if(k == 'total_new_case' || k == 'total_new_death' || k == 'total_daily_vaccinations' || k == 'total_inpatient_beds_used' || k == 'total_inpatient_beds_used_covid'){
        for(var i = 0; i < data.length; i++) {
          if(data_min[i].state == min_data[i].state) {
              if(data_min[i][k] == undefined) {
                data_min[i][k] = 0;
              }
              // console.log(data[i][k])
              data_min[i][k] = parseFloat(min_data[i][k]);
          }
        }
      }
    }
  }

  for(var i = 0; i < max_data.length; i++) {
    for (var k in max_data[i]) {
      if(k == 'total_new_case' || k == 'total_new_death' || k == 'total_daily_vaccinations' || k == 'total_inpatient_beds_used' || k == 'total_inpatient_beds_used_covid'){
        for(var i = 0; i < data.length; i++) {
          if(data[i].state == max_data[i].state) {
              data[i][k] = parseFloat(max_data[i][k]) - data_min[i][k];
          }
        }
      }
    }
  }
   
  // console.log(data)

  // Extract the list of numerical dimensions and create a scale for each.
  if(!scale_flag){
  xscale.domain(dimensions = d3.keys(data[0]).filter(function(k) {
      return (_.isNumber(data[0][k])) && (yscale[k] = d3.scaleSqrt()
      .domain(d3.extent(data, function(d) { return +d[k]; }))
      .range([h, 0]));
  }).sort());
  scale_flag = true;
  }
  // console.log(data)

    // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
  .data(dimensions)
  .enter().append("svg:g")
  .attr("class", "dimension")
  .attr("transform", function(d) { return "translate(" + xscale(d) + ")"; })
  .call(d3.drag()
    .on("start", function(d) {
      dragging[d] = this.__origin__ = xscale(d);
      this.__dragged__ = false;
      d3.select("#foreground").style("opacity", "0.35");
    })
    .on("drag", function(d) {
      dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
      dimensions.sort(function(a, b) { return position(a) - position(b); });
      xscale.domain(dimensions);
      g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
      brush_count++;
      this.__dragged__ = true;

      // Feedback for axis deletion if dropped
      if (dragging[d] < 12 || dragging[d] > w-12) {
        d3.select(this).select(".background").style("fill", "#b00");
      } else {
        d3.select(this).select(".background").style("fill", null);
      }
    })
    .on("end", function(d) {
      if (!this.__dragged__) {
        // no movement, invert axis
        var extent = invert_axis(d);

      } else {
        // reorder axes
        d3.select(this).transition().attr("transform", "translate(" + xscale(d) + ")");
      }

      // remove axis if dragged all the way left
      if (dragging[d] < 12 || dragging[d] > w-12) {
        remove_axis(d,g);
      }

      xscale.domain(dimensions);
      update_ticks(d, extent);

      // rerender
      d3.select("#foreground").style("opacity", null);
      
      brush();
      delete this.__dragged__;
      delete this.__origin__;
      delete dragging[d];
    }))

    // Add an axis and title.
    g.append("svg:g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
    .append("svg:text")
    .attr("text-anchor", "middle")
    .attr("y", function(d,i) { return i%2 == 0 ? -14 : -30 } )
    .attr("x", 0)
    .attr("class", "label")
    .text(String)
    .append("title")
        .text("Click to invert. Drag to reorder");


    legend = create_legend(colors,brush);
  
    // Render full foreground
    brush();
}
// copy one canvas to another, grayscale
function gray_copy(source, target) {
  var pixels = source.getImageData(0,0,w,h);
  target.putImageData(grayscale(pixels),0,0);
}

// http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
function grayscale(pixels, args) {
  var d = pixels.data;
  for (var i=0; i<d.length; i+=4) {
    var r = d[i];
    var g = d[i+1];
    var b = d[i+2];
    var v = 0.2126*r + 0.7152*g + 0.0722*b;
    d[i] = d[i+1] = d[i+2] = v
  }
  return pixels;
};

function create_legend(colors,brush) {
  // create legend
  var legend_data = d3.select("#legend")
    .html("")
    .selectAll(".row")
    .data( _.keys(colors).sort() )

  // filter by group
  var legend = legend_data
    .enter().append("div")
      .attr("title", "Hide group")
      .on("click", function(d) { 
        // toggle food group
        if (_.contains(excluded_groups, d)) {
          d3.select(this).attr("title", "Hide group")
          excluded_groups = _.difference(excluded_groups,[d]);
          // console.log(excluded_groups)
          brush();
        } else {
          d3.select(this).attr("title", "Show group")
          excluded_groups.push(d);
          // console.log(excluded_groups)
          brush();
        }
      });

  legend
    .append("span")
    .style("background", function(d,i) { return color(d,0.85)})
    .attr("class", "color-bar");

  legend
    .append("span")
    // .attr("class", "tally")
    // .text(function(d,i) { return 0});  

  legend
    .append("span")
    .text(function(d,i) { return " " + d});  

  return legend;
}
 
// render polylines i to i+render_speed 
function render_range(selection, i, max, opacity) {
  selection.slice(i,max).forEach(function(d) {
    path(d, foreground, color(d.state,opacity));
  });
};

// simple data table
function data_table(sample) {
  // sort by first column
  var sample = sample.sort(function(a,b) {
    var col = d3.keys(a)[0];
    return a[col] < b[col] ? -1 : 1;
  });

  var table = d3.select("#food-list")
    .html("")
    .selectAll(".row")
      .data(sample)
    .enter().append("div")
      .on("mouseover", highlight)
      .on("mouseout", unhighlight);

  table
    .append("span")
      .attr("class", "color-block")
      .style("background", function(d) { return color(d.state,0.85) })

  table
    .append("span")
      .text(function(d) { return d.state; })
}

// Adjusts rendering speed 
function optimize(timer) {
  var delta = (new Date()).getTime() - timer;
  render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
  render_speed = Math.min(render_speed, 300);
  return (new Date()).getTime();
}

// Feedback on rendering progress
function render_stats(i,n,render_speed) {
  d3.select("#rendered-count").text(i);
  d3.select("#rendered-bar")
    .style("width", (100*i/n) + "%");
  d3.select("#render-speed").text(render_speed);
}

// Feedback on selection
function selection_stats(opacity, n, total) {
  d3.select("#data-count").text(total);
  d3.select("#selected-count").text(n);
  d3.select("#selected-bar").style("width", (100*n/total) + "%");
  d3.select("#opacity").text((""+(opacity*100)).slice(0,4) + "%");
}

// Highlight single polyline
function highlight(d) {
  d3.select("#foreground").style("opacity", "0.25");
  d3.selectAll(".row").style("opacity", function(p) { return (d.state == p) ? null : "0.3" });
  path(d, highlighted, color(d.state,1));
}

// Remove highlight
function unhighlight() {
  d3.select("#foreground").style("opacity", null);
  d3.selectAll(".row").style("opacity", null);
  highlighted.clearRect(0,0,w,h);
}

function invert_axis(d) {
  // save extent before inverting
  // if (!yscale[d].brush.empty()) {
  //   var extent = yscale[d].brush.extent();
  // }
  if (yscale[d].inverted == true) {
    yscale[d].range([h, 0]);
    d3.selectAll('.label')
      .filter(function(p) { return p == d; })
      .style("text-decoration", null);
    yscale[d].inverted = false;
  } else {
    yscale[d].range([0, h]);
    d3.selectAll('.label')
      .filter(function(p) { return p == d; })
      .style("text-decoration", "underline");
    yscale[d].inverted = true;
  }
  return null;
}

function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  ctx.beginPath();
  var x0 = xscale(0)-15,
      y0 = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
  ctx.moveTo(x0,y0);
  dimensions.map(function(p,i) {
    var x = xscale(p),
        y = yscale[p](d[p]);
    var cp1x = x - 0.88*(x-x0);
    var cp1y = y0;
    var cp2x = x - 0.12*(x-x0);
    var cp2y = y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    x0 = x;
    y0 = y;
  });
  ctx.lineTo(x0+15, y0);                               // right edge
  ctx.stroke();
};

function color(d,a) {
  var c = colors[d];
  return ["hsla(",c[0],",",c[1],"%,",c[2],"%,",a,")"].join("");
}

function position(d) {
  var v = dragging[d];
  return v == null ? xscale(d) : v;
}


function brush() {
  var selected = [];
  data
    .filter(function(d) {
      return !_.contains(excluded_groups, d.state);
    })
    .map(function(d) {
    //   return actives.every(function(p, dimension) {
    //     return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1];
    //   }) ? selected.push(d) : null;
    return selected.push(d);
    });

  var tallies = _(selected)
    .groupBy(function(d) { return d.state; })
// var tallies = d3.group(selected, d => d.state);
  // include empty groups
  _(colors).each(function(v,k) { tallies[k] = tallies[k] || []; });
  legend
    .style("text-decoration", function(d) { return _.contains(excluded_groups,d) ? "line-through" : null; })
    .attr("class", function(d) {
      return (tallies[d].length > 0)
           ? "row"
           : "row off";
    });

  legend.selectAll(".color-bar")
    .style("width", function(d) {
      return Math.ceil(600*tallies[d].length/data.length) + "px"
    });

  legend.selectAll(".tally")
    .text(function(d,i) { return tallies[d].length });  

  // Render selected lines
  paths(selected, foreground, brush_count, true);
}

// render a set of polylines on a canvas
function paths(selected, ctx, count) {
  var n = selected.length,
      i = 0,
      opacity = d3.min([2/Math.pow(n,0.3),1]),
      timer = (new Date()).getTime();

  selection_stats(opacity, n, data.length)

  shuffled_data = _.shuffle(selected);

  data_table(shuffled_data.slice(0,25));

  ctx.clearRect(0,0,w+1,h+1);

  // render all lines until finished or a new brush event
  function animloop(){
    if (i >= n || count < brush_count) return true;
    var max = d3.min([i+render_speed, n]);
    render_range(shuffled_data, i, max, opacity);
    render_stats(max,n,render_speed);
    i = max;
    timer = optimize(timer);  // adjusts render_speed
  };

  d3.timer(animloop);
}

// transition ticks for reordering, rescaling and inverting
function update_ticks(d, extent) {
  show_ticks();

  // update axes
  d3.selectAll(".axis")
    .each(function(d,i) {
      // hide lines for better performance
      d3.select(this).selectAll('line').style("display", "none");

      // transition axis numbers
      d3.select(this)
        .transition()
        .duration(720)
        .call(axis.scale(yscale[d]));

      // bring lines back
      d3.select(this).selectAll('line').transition().delay(800).style("display", null);

      d3.select(this)
        .selectAll('text')
        .style('font-weight', null)
        .style('font-size', null)
        .style('display', null);
    });
}

// Rescale to new dataset domain
function rescale() {
  // reset yscales, preserving inverted state
  dimensions.forEach(function(d,i) {
    if (yscale[d].inverted) {
      yscale[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([0, h]);
      yscale[d].inverted = true;
    } else {
      yscale[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([h, 0]);
    }
  });

  update_ticks();

  // Render selected data
  paths(data, foreground, brush_count);
}

// Get polylines within extents
function actives() {
  var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
      extents = actives.map(function(p) { return yscale[p].brush.extent(); });

  // filter extents and excluded groups
  var selected = [];
  data
    .filter(function(d) {
      return !_.contains(excluded_groups, d.state);
    })
    .map(function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? selected.push(d) : null;
  });

  // free text search
  var query = d3.select("#search")[0][0].value;
  if (query > 0) {
    selected = search(selected, query);
  }

  return selected;
}


// scale to window size
window.onresize = function() {
  width = document.body.clientWidth,
  height = d3.max([document.body.clientHeight-500, 220]);

  w = width - m[1] - m[3],
  h = height - m[0] - m[2];

  d3.select("#chart")
      .style("height", (h + m[0] + m[2]) + "px")

  d3.selectAll("canvas")
      .attr("width", w)
      .attr("height", h)
      .style("padding", m.join("px ") + "px");

  d3.select("svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
    .select("g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
  
  xscale = d3.scale.ordinal().rangePoints([0, w], 1).domain(dimensions);
  dimensions.forEach(function(d) {
    yscale[d].range([h, 0]);
  });

  d3.selectAll(".dimension")
    .attr("transform", function(d) { return "translate(" + xscale(d) + ")"; })
  // update brush placement
  d3.selectAll(".brush")
    .each(function(d) { d3.select(this).call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush)); })
  brush_count++;

  // update axis placement
  axis = axis.ticks(1+height/50),
  d3.selectAll(".axis")
    .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); });

  // render data
  brush();
};


function remove_axis(d,g) {
  dimensions = _.difference(dimensions, [d]);
  xscale.domain(dimensions);
  g.attr("transform", function(p) { return "translate(" + position(p) + ")"; });
  g.filter(function(p) { return p == d; }).remove(); 
  update_ticks();
}


// function hide_ticks() {
//   d3.selectAll(".axis g").style("display", "none");
//   //d3.selectAll(".axis path").style("display", "none");
//   d3.selectAll(".background").style("visibility", "hidden");
//   d3.selectAll("#hide-ticks").attr("disabled", "disabled");
//   d3.selectAll("#show-ticks").attr("disabled", null);
// };

function show_ticks() {
  d3.selectAll(".axis g").style("display", null);
  //d3.selectAll(".axis path").style("display", null);
  d3.selectAll(".background").style("visibility", null);
  d3.selectAll("#show-ticks").attr("disabled", "disabled");
  d3.selectAll("#hide-ticks").attr("disabled", null);
};
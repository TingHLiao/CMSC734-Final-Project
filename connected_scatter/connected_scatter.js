
var dataset_rollup;

function rollup_func(d, xaxis, yaxis) {
  var x_func = d3.sum(d, function(e) {return +e[secondary_name_mapping[xaxis]];});
  var y_func = d3.sum(d, function(e) {return +e[secondary_name_mapping[yaxis]];});
  return {
    x: x_func,
    y: y_func,
  };
}
var line_items = [];
var color;
var keys;

function load_connected_scatter(_dataset, xaxis, yaxis) {
  var X = [];
  var Y = [];
  var dataset_lines = [];
  keys = [];
  last_month_min = filter_max_date.slice(0, 8) + '00';
  last_month_max = filter_max_date.slice(0, 8) + '31';
  last_month = dataset.filter(function(d, i) {
    var date_bool = d.date >= last_month_min && d.date <= last_month_max;
    var state_bool = true;
    if(select_all_states == false) {
        state_bool = select_certain_states.includes(d.state_abbrev);
    }
    return date_bool && state_bool;
  });

  if(select_all_states) {
    dataset_rollup = d3.nest()
      .key(function(d) {return d.date.slice(0, 7);})
      .rollup(function(d) {
        return rollup_func(d, xaxis, yaxis);
      })
      .entries(_dataset);
    
    last_month = d3.nest()
      .key(function(d) {return d.date.slice(0, 7);})
      .rollup(function(d) {
        return rollup_func(d, xaxis, yaxis);
      })
      .entries(last_month);

    X = d3.map(dataset_rollup, d=>d.value.x);
    Y = d3.map(dataset_rollup, d=>d.value.y);
    
    dataset_lines = [dataset_rollup];
    var cur_day = filter_max_date.slice(8);
    var inter_weight = 1 - (+cur_day / 30);
    var last_x = X[X.length - 2] * inter_weight + last_month[0].value.x * (1 - inter_weight);
    var last_y = Y[Y.length - 2] * inter_weight + last_month[0].value.y * (1 - inter_weight);
    X.push(last_x);
    Y.push(last_y);
    keys.push('All states');
  } else {
    dataset_rollup = d3.nest()
      .key(function(d) {return d.state_abbrev})
      .key(function(d) {return d.date.slice(0, 7);})
      .rollup(function(d) {
        return rollup_func(d, xaxis, yaxis);
      })
      .entries(_dataset);
    
    last_month = d3.nest()
      .key(function(d) {return d.state_abbrev})
      .key(function(d) {return d.date.slice(0, 7);})
      .rollup(function(d) {
        return rollup_func(d, xaxis, yaxis);
      })
      .entries(last_month);
    
    // console.log(dataset_rollup);
    for(var i = 0; i < dataset_rollup.length; i++) {
      xi = d3.map(dataset_rollup[i].values, d=>d.value.x);
      yi = d3.map(dataset_rollup[i].values, d=>d.value.y);
      X = X.concat(xi);
      Y = Y.concat(yi);
      
      var cur_day = filter_max_date.slice(8);
      var inter_weight = 1 - (+cur_day / 30);
      var last_x = xi[xi.length - 2] * inter_weight + last_month[i].values[0].value.x * (1 - inter_weight);
      var last_y = yi[yi.length - 2] * inter_weight + last_month[i].values[0].value.y * (1 - inter_weight);
      X.push(last_x);
      Y.push(last_y);
      dataset_lines.push(dataset_rollup[i].values);
      keys.push(dataset_rollup[i].key);
    }
    // console.log(keys);
  }
  //console.log(dataset_rollup); 

  color = d3.scaleOrdinal()
      .domain(keys)
      .range(d3.schemeSet2);

  make_plot(X=X, Y=Y, xLabel=xaxis, yLabel=yaxis);

  line_items = [];
  for(var i = 0; i < dataset_lines.length; i++) {
    
    if(select_all_states) {
      end_value = last_month[0].value;
      //console.log(end_value);
    } else {
      //console.log(keys[i], last_month[i]);
      end_value = last_month[i].values[0].value;
      //console.log(end_value);
    }
    var x = d3.map(dataset_lines[i], d=>d.value.x);
    var y = d3.map(dataset_lines[i], d=>d.value.y);
    var key = keys[i];

    if(d3.sum(x) < 0 || d3.sum(y) < 0) continue;

    render_state = key;
    item = add_line(
      X=x, 
      Y=y, 
      T=d3.map(dataset_lines[i], d=>d.key),
      O=d3.map(dataset_lines[i], d=>'top'),
      stroke=color(key))
    line_items.push(item);
  }
  
  add_legend(keys, color);
}

var end_value = null;
var render_state = null;

function add_legend(keys, color) {
  var svg = d3.select("#secondary_svg")
  const x_offset = 550;
  const y_offset = 50;
  svg.selectAll("mydots")
    .data(keys)
    .enter()
    .append("circle")
    .attr("cx", x_offset)
    .attr("cy", function(d,i){ return y_offset + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("r", 7)
    .style("fill", function(d){ return color(d)})

  svg.selectAll("mylabels")
  .data(keys)
  .enter()
  .append("text")
  .attr("x", x_offset + 20)
  .attr("y", function(d,i){ return y_offset + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
  .style("fill", function(d){ return color(d)})
  .text(function(d){ return d})
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle")
}

var xScale;
var yScale;

function length(path) {
  return d3.create("svg:path").attr("d", path).node().getTotalLength();
}

function animate(line, path, label, I, duration=10000) {
  if (duration > 0) {
    const l = length(line(I));

    path
        .interrupt()
        .attr("stroke-dasharray", `0,${l}`)
      .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("stroke-dasharray", `${l},${l}`);

    label
        .interrupt()
        .attr("opacity", 0)
        .transition()
        .delay(i => length(line(I.filter(j => j <= i))) / l * (duration - 125))
        .attr("opacity", 1)
        .transition()
        .delay(i => length(line(I.filter(j => j <= i))) / l * (duration + 125))
        .attr("opacity", 0);
  }
}

function show_all_pairs(i) {
  if(slider_mode == 'period'){
    for(var j = 0; j < line_items.length; j++) {
      d3.select(line_items[j][2]._groups[0][i]).style('opacity', "100%");
      d3.select(line_items[j][4]._groups[0][i]).attr('r', 6);
      d3.select(line_items[j][4]._groups[0][i]).attr('fill', color(keys[j]));
    }
  }
}

function hide_all_pairs(i) {
  if(slider_mode == 'period') {
    for(var j = 0; j < line_items.length; j++) {
      d3.select(line_items[j][2]._groups[0][i]).style('opacity', "0%");
      d3.select(line_items[j][4]._groups[0][i]).attr('r', 3);
      d3.select(line_items[j][4]._groups[0][i]).attr('fill', '#fff');
    }
  }
  
}

function add_line(
  X = [],
  Y = [],
  T = [],
  O = [],
  stroke = "currentColor", // stroke color of line and dots
  fill = "white", // fill color of dots
  r = 3, // (fixed) radius of dots, in pixels
  line_index,
  curve = d3.curveCatmullRom, // curve generator for the line
  strokeWidth = 2, // stroke width of line and dots
  strokeLinecap = "round", // stroke line cap of line
  strokeLinejoin = "round", // stroke line join of line
  halo = "#fff", // halo color for the labels
  haloWidth = 6, // halo width for the labels
) {
  var I = d3.range(X.length);

  var len = X.length;
  if(slider_mode == 'period' && len > 1 && end_value != null) {
    var last_x = X[len - 1];
    var last_y = Y[len - 1];
    var last_x2 = X[len - 2];
    var last_y2 = Y[len - 2];
    //console.log(X[len-1], Y[len-1]);
    
    var cur_day = filter_max_date.slice(8);
    var inter_weight = 1 - (+cur_day / 30);
    X[len - 1] = last_x2 * inter_weight + end_value.x * (1 - inter_weight);
    Y[len - 1] = last_y2 * inter_weight + end_value.y * (1 - inter_weight);
    if(select_all_states)
      T[len - 1] = filter_max_date;
    else
      T[len - 1] = render_state + ' ' + filter_max_date;
  }

  // console.log(X, Y, T, O, I);

  // Construct the line generator.
  if(X.length > 1) {
    var line = d3.line()
      .curve(curve)
      .x(i => xScale(X[i]))
      .y(i => yScale(Y[i]));
  }
  

  var svg = d3.select("#secondary_svg");
  
  if(X.length > 1)
    var path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-linecap", strokeLinecap)
        .attr("d", line(I));
  
  var circles = svg.append("g")
      .attr("fill", fill)
      .attr("stroke", stroke)
      .attr("stroke-width", 1)
      .selectAll("g")
      .data(I)
      .join("g")
      .on('mouseover', function(d, i) {
        if (radius != undefined) {
          text_ele = d3.select(this)
            .append('text')
            .text('' + radius[line_index])
            .attr("transform", i => `translate(${xScale(X[i])},${yScale(Y[i])})`)

          text_ele.attr('dx', "-5px")
            .attr('dy', '10px')
            .attr("fill", "black")
            .attr('stroke-width', 0)
            .style('font-size', '12px');
        }
      })
      .on('mouseleave', function(d, i) {
        if (radius != undefined) {
          d3.select(this).selectAll('text').remove();
        }
      })
      .append('circle')
      .attr("cx", i => xScale(X[i]))
      .attr("cy", i => yScale(Y[i]))
      .attr("r", r)
      .style('opacity', function(d, i) {
        if(slider_mode == 'time'){
          if(raduis != undefined)
            return '' + (100 * r / 25) + '%';
          else
            return '50%';
        }
      })
      .on('mouseover', function(d, i) {
        show_all_pairs(i);
      })
      .on('mouseleave', function(d, i) {
        hide_all_pairs(i);
      });

  var label = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(I)
      .join("g")
      .classed('show-when-hover', true)
      .attr("transform", i => `translate(${xScale(X[i])},${yScale(Y[i])})`);

  if(slider_mode == 'time')
    label.classed('show-when-hover', false);
  else {
    d3.select(label._groups[0][len - 1])
      .classed('show-when-hover', false)
      .style('opacity', '100%');
  }

  if (T) label.append("text")
      .text(i => T[i])
      .each(function(i) {
        const t = d3.select(this);
        switch (O[i]) {
          case "bottom": t.attr("text-anchor", "middle").attr("dy", "1.4em"); break;
          case "left": t.attr("dx", "-0.5em").attr("dy", "0.32em").attr("text-anchor", "end"); break;
          case "right": t.attr("dx", "0.5em").attr("dy", "0.32em").attr("text-anchor", "start"); break;
          default: t.attr("text-anchor", "middle").attr("dy", "-0.7em"); break;
        }
        t.attr('fill', stroke);
      })
      .call(text => text.clone(true))
      .attr("fill", stroke)
      .attr("stroke", halo)
      .attr("stroke-width", haloWidth);

  return [line, path, label, I, circles];
}

function make_plot(
  X = [], // given d in data, returns the (quantitative) x-value
  Y = [], // given d in data, returns the (quantitative) y-value
  xLabel, // a label for the x-axis
  yLabel, // a label for the y-axis
  r = 3,
  width = 660, // outer width, in pixels
  height = 640, // outer height, in pixels
  inset = r * 2, // inset the default range, in pixels
  insetTop = inset, // inset the default y-range
  insetRight = inset, // inset the default x-range
  insetBottom = inset, // inset the default y-range
  insetLeft = inset, // inset the default x-range
  marginTop = 40, // top margin, in pixels
  marginRight = 20, // right margin, in pixels
  marginBottom = 40, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
  xFormat = d3.format(".2s"), // a format specifier string for the x-axis
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
  yFormat = d3.format(".2s"), // a format specifier string for the y-axis
  ) {
  
  if(slider_mode == 'time') {
    marginBottom = 80;
    yRange = [height - marginBottom - insetBottom, marginTop + insetTop];
  }

  xDomain = [0, 1.1 * d3.max(X)];
  yDomain = [0, 1.1 * d3.max(Y)];
  
   // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);//d3.nice(...d3.extent(X), width / 80);
  if (yDomain === undefined) yDomain = d3.extent(Y);//d3.nice(...d3.extent(Y), height / 50);

  // Construct scales and axes.
  xScale = xType(xDomain, xRange);
  yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
  const yAxis = d3.axisLeft(yScale).ticks(height / 50, yFormat);

  // Construct the line generator.

  const svg = d3.select("#secondary_svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("y2", marginTop + marginBottom - height)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", width)
          .attr("y", 40)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .attr('font-size', 14)
          .text(xLabel));

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 30)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr('font-size', 14)
          .text(yLabel))

}
var raduis;
function load_scatter(dataset, xaxis, yaxis, raxis) {
  // console.log(xaxis, yaxis);
  var X = [];
  var Y = [];
  var dataset_lines = [];
  keys = [];
  // console.log(dataset);
  // console.log(xaxis, yaxis);
  
  //console.log(dataset_rollup); 

  keys = d3.map(dataset, d=>d.state_abbrev);
  color = d3.scaleOrdinal()
      .domain(keys)
      .range(d3.schemeSet2);
    
  X = d3.map(dataset, d=>d[secondary_name_mapping[xaxis]]);
  Y = d3.map(dataset, d=>d[secondary_name_mapping[yaxis]]);

  if(raxis != '-') {
    radius = d3.map(dataset, d=>d[secondary_name_mapping[raxis]]);
    r_scale = d3.scaleLinear()
      .domain([0, d3.max(radius)]) // unit: km
      .range([3, 25]);
  } else {
    radius = undefined;
  }
  // console.log(X);
  // console.log(Y);
  // console.log(keys);
  make_plot(X=X, Y=Y, xLabel=xaxis, yLabel=yaxis);

  line_items = [];
  // console.log(X.length);
  for(var i = 0; i < X.length; i++) {
    // console.log(keys[i]);
    var r = 3;
    if(raxis != '-') {
      r = r_scale(radius[i]);
    }
    if(X[i] < 0 || Y[i] < 0) continue;
    item = add_line(
      [X[i]], 
      [Y[i]], 
      [keys[i]],
      d3.map([X[i]], d=>'top'),
      "black",
      "#1f77b4",
      r,
      i)
    //animate(item[0], item[1], item[2], item[3]);
    line_items.push(item);
  }
}
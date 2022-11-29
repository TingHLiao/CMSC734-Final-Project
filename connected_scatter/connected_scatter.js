
var dataset_rollup;

var rollup_method = {
'new_case': 'sum',
'new_death': 'sum',
'total_vaccinations': 'max',
'daily_vaccinations': 'sum',
}

function rollup_func(d, xaxis, yaxis) {
  let x_rollup = rollup_method[xaxis];
  if(x_rollup == 'sum') {
    var x_func = d3.sum(d, function(e) {return +e[xaxis];})
  } else if(x_rollup == 'max') {
    var x_func = d3.max(d, function(e) {return +e[xaxis];})
  }
  let y_rollup = rollup_method[yaxis];
  if(y_rollup == 'sum') {
    var y_func = d3.sum(d, function(e) {return +e[yaxis];})
  } else if(y_rollup == 'max') {
    var y_func = d3.max(d, function(e) {return +e[yaxis];})
  }
  return {
    x: x_func,
    y: y_func,
  };
}

function load_connected_scatter(dataset, xaxis, yaxis) {
  console.log(xaxis, yaxis);
  var X = [];
  var Y = [];
  var dataset_lines = [];
  if(select_all_states) {
    dataset_rollup = d3.nest()
      .key(function(d) {return d.date.slice(0, 7);})
      .rollup(function(d) {
        return rollup_func(d, xaxis, yaxis);
      })
      .entries(dataset);
    
    X = d3.map(dataset_rollup, d=>d.value.x);
    Y = d3.map(dataset_rollup, d=>d.value.y);
    
    dataset_lines = [dataset_rollup];
  } else {
    dataset_rollup = d3.nest()
      .key(function(d) {return d.state_abbrev})
      .key(function(d) {return d.date.slice(0, 7);})
      .rollup(function(d) {
        return rollup_func(d, xaxis, yaxis);
      })
      .entries(dataset);
    console.log(dataset_rollup);
    for(var i = 0; i < dataset_rollup.length; i++) {
      X = X.concat(d3.map(dataset_rollup[i].values, d=>d.value.x));
      Y = Y.concat(d3.map(dataset_rollup[i].values, d=>d.value.y));
      dataset_lines.push(dataset_rollup[i].values);
    }

  }
  //console.log(dataset_rollup); 

  make_plot(X=X, Y=Y);
  for(var i = 0; i < dataset_lines.length; i++) {
    var x = d3.map(dataset_lines[i], d=>d.value.x);
    var y = d3.map(dataset_lines[i], d=>d.value.y);
    items = add_line(
      X=x, 
      Y=y, 
      T=d3.map(dataset_lines[i], d=>d.key),
      O=d3.map(dataset_lines[i], d=>'top'))
  }
  
  
  //console.log(items);
  //animate(items[0], items[1], items[2], items[3]);
}

var xScale;
var yScale;

function length(path) {
  return d3.create("svg:path").attr("d", path).node().getTotalLength();
}

function animate(line, path, label, I, duration=5000) {
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
        .attr("opacity", 1);
  }    
}

function add_line(
  X = [],
  Y = [],
  T = [],
  O = [],
  r = 3, // (fixed) radius of dots, in pixels
  curve = d3.curveCatmullRom, // curve generator for the line
  fill = "white", // fill color of dots
  stroke = "currentColor", // stroke color of line and dots
  strokeWidth = 2, // stroke width of line and dots
  strokeLinecap = "round", // stroke line cap of line
  strokeLinejoin = "round", // stroke line join of line
  halo = "#fff", // halo color for the labels
  haloWidth = 6, // halo width for the labels
  duration = 0, // intro animation in milliseconds (0 to disable)
  run_animate = false,
) {
  var I = d3.range(X.length);

  // Construct the line generator.
  var line = d3.line()
      .curve(curve)
      .x(i => xScale(X[i]))
      .y(i => yScale(Y[i]));

  var svg = d3.select("#secondary_svg");

  var path = svg.append("path")
      .attr("fill", "none")
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-linecap", strokeLinecap)
      .attr("d", line(I));
  
    svg.append("g")
      .attr("fill", fill)
      .attr("stroke", stroke)
      .attr("stroke-width", strokeWidth)
    .selectAll("circle")
    .data(I)
    .join("circle")
      .attr("cx", i => xScale(X[i]))
      .attr("cy", i => yScale(Y[i]))
      .attr("r", r);

  var label = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(I)
    .join("g")
      .attr("transform", i => `translate(${xScale(X[i])},${yScale(Y[i])})`);

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
      })
      .call(text => text.clone(true))
      .attr("fill", "none")
      .attr("stroke", halo)
      .attr("stroke-width", haloWidth);

  return [line, path, label, I];
}

function make_plot(
  X = [], // given d in data, returns the (quantitative) x-value
  Y = [], // given d in data, returns the (quantitative) y-value
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
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  xType = d3.scaleLinear, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft + insetLeft, width - marginRight - insetRight], // [left, right]
  xFormat = d3.format(".2s"), // a format specifier string for the x-axis
  xLabel, // a label for the x-axis
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom - insetBottom, marginTop + insetTop], // [bottom, top]
  yFormat = d3.format(".2s"), // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
  ) {

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
          .attr("y", marginBottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
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
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel));
}
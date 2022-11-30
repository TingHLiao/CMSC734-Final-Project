var map_attr  = {
    'conf_cases': 'new_case',
    'conf_death': 'new_death',
    'vac_cnt': 'daily_vaccinations'
};
var map_attr_2  = {
    'conf_cases': 'tot_cases',
    'conf_death': 'tot_death',
    'vac_cnt': 'daily_vaccinations'
};

function load_bar_chart(dataset, filter_min_date, filter_max_date) {
    var is_time = filter_max_date == filter_min_date; // time or period
    if (is_time) {
        load_bar_chart_time(dataset);
    }
    else {
        load_bar_chart_period(dataset);
    }
}

function load_bar_chart_time(dataset) {
    var attr = map_attr[show_attr];
    var time_parse = d3.timeParse('%Y/%m/%d');
    var dates = [];
    var states = [];
    var x, y, color_scale, max_new_cases, svg, xAxis, yAxis;
    var map_color = { 
        'conf_cases': 'darkorange',
        'conf_death': 'steelblue',
        'vac_cnt': 'forestgreen'
    };

    //-------------------------------------------------------------------------------------------------------------------------
    data=dataset;
    dates = [...new Set(data.map(function(d) { return d.date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
    max_new_cases = d3.max(data, function(d){return +d[attr];});
    min_new_cases = d3.min(data, function(d){return +d[attr];});

    svg = d3.select("#secondary_svg"),
    margin = {top: 65, left: 35, bottom: 10, right: 10};

    // width = +svg.attr("width") - margin.left - margin.right,
    // height = +svg.attr("height") - margin.top - margin.bottom;
    width = 700 - margin.left - margin.right;
    height = 660 - margin.top - margin.bottom;

	x = d3.scaleBand()
		.range([margin.left, width - margin.right])
		.padding(0.1)

	y = d3.scaleLinear()
		.rangeRound([height - margin.bottom, margin.top])

    color_scale = d3.scaleLinear()
        .range([30, 100]);

	xAxis = svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.attr("class", "x-axis")

	yAxis = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("class", "y-axis")

    updateChart(filter_min_date, 0)


    //-----------------------------------------------------------------------------
    function updateChart(input, speed) {

        var filtered_data = data.filter(function(d) { if( d.date == input) { return d; } });

        
        // filtered_data.forEach(function(d) {
        //     if (d.new_case == NaN) {d.new_case = 0;}
        //     if (d.new_death == NaN) {d.new_death = 0;}
        //     d.new_diff = d.new_case - d.new_death
        //     return d
        // })

        filtered_data.sort(d3.select("#sort").property("checked")
            ? (a, b) => b[attr] - a[attr]
            : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))

        //Axis
        x.domain(filtered_data.map(d => d.state));
        y.domain([0,max_new_cases]);
        color_scale.domain([min_new_cases, max_new_cases]);

        svg.selectAll(".x-axis")
            .transition()
            .duration(speed)
            .call(d3.axisBottom(x).tickSizeOuter(0))
                .selectAll("text")
                .attr("font-size", "8px")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

        svg.selectAll(".y-axis")
            .transition()
            .duration(speed)
            .call(d3.axisLeft(y).ticks(null, "s"));
        //Axis---------------------------------------------------------
        var bars = svg.selectAll(".bar-chart-rect")
            .data(filtered_data);

        bars.exit().remove();

        var barsEnter = bars.enter()
            .append("g")
            .attr("class", "bar-chart-rect")


        barsEnter.append('rect')
            .attr("class", "bar-label-group-bar")
            .attr("width", x.bandwidth())
            .attr("x", d => x(d.state))
            .attr("fill", map_color[show_attr])
        
            barsEnter.append('text')
                .attr("class","bar-label-group-label")

        bars = bars.merge(barsEnter)
        .transition().duration(speed)

        bars.select('.bar-label-group-bar').attr("width", x.bandwidth())
            .attr("x", d => x(d.state))
            .attr("y", d => y(d[attr]))
            .attr("height", d => height - margin.bottom - y(d[attr]))
            .attr("opacity", d => `${color_scale(d[attr])}%`)

        bars.select('.bar-label-group-label')
                .attr("transform", function(d){
                    return `translate(${x(d.state) + x.bandwidth() / 2 +1},${y(d[attr]) - 10}) ` 
                })
                .text(d => d[attr]);


    }
    var checkbox = d3.select("#sort")
        .on("click", function() {
            updateChart(filter_min_date, 500)
            // updateChart(select.property("value"), 500)
        });
};


function load_bar_chart_period(dataset) {
    var attr = map_attr_2[show_attr];
    var time_parse = d3.timeParse('%Y/%m/%d');
    var dates = [];
    var states = [];
    var x, y, color_scale, max_new_cases, svg, xAxis, yAxis;
    var map_color = { 
        'conf_cases': 'darkorange',
        'conf_death': 'steelblue',
        'vac_cnt': 'forestgreen'
    };

    //-------------------------------------------------------------------------------------------------------------------------
    data=dataset;
    dates = [...new Set(data.map(function(d) { return d.date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
    max_new_cases = d3.max(data, function(d){return +d[attr];});
    min_new_cases = d3.min(data, function(d){return +d[attr];});

    svg = d3.select("#secondary_svg"),
    margin = {top: 65, left: 35, bottom: 10, right: 10};

    // width = +svg.attr("width") - margin.left - margin.right,
    // height = +svg.attr("height") - margin.top - margin.bottom;
    width = 700 - margin.left - margin.right;
    height = 660 - margin.top - margin.bottom;

	x = d3.scaleBand()
		.range([margin.left, width - margin.right])
		.padding(0.1)

	y = d3.scaleLinear()
		.rangeRound([height - margin.bottom, margin.top])

    color_scale = d3.scaleLinear()
        .range([30, 100]);

	xAxis = svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.attr("class", "x-axis")

	yAxis = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("class", "y-axis")

    updateChart(filter_min_date, filter_max_date, 0)


    //-----------------------------------------------------------------------------
    function updateChart(input, input2, speed) {

        var filtered_data = data.filter(function(d) { if( d.date == input || d.date == input2) { return d; } });
        // console.log("filtered_data:  "+filtered_data.map(d => d.state))

        filtered_data.forEach(function(d) {
            if (d[attr] == '') {d[attr] = 0;}
            d.diff = d.new_case - d.new_death
            return d
        })

        // filtered_data.sort(d3.select("#sort").property("checked")
        //     ? (a, b) => b.tot_cases - a.tot_cases
        //     : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))

        //Axis
        x.domain(filtered_data.map(d => d.state));
        y.domain([0,max_new_cases]);
        color_scale.domain([min_new_cases, max_new_cases]);

        svg.selectAll(".x-axis")
            .transition()
            .duration(speed)
            .call(d3.axisBottom(x).tickSizeOuter(0))
                .selectAll("text")
                .attr("font-size", "8px")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

        svg.selectAll(".y-axis")
            .transition()
            .duration(speed)
            .call(d3.axisLeft(y).ticks(null, "s"));
        //Axis---------------------------------------------------------

        var bars = svg.selectAll("rect")
            .data(filtered_data);

        bars.exit().remove();
    
        var new_bars = bars.enter().append("rect")
            .attr("width", x.bandwidth())
            .attr("fill", map_color[show_attr])

        new_bars.merge(bars)
            .transition().duration(speed)
            .attr("width", x.bandwidth())
                .attr("x", d => x(d.state))
                .attr("y", d => y(d[attr]))
                .attr("height", d => height - margin.bottom - y(d[attr]))
                .attr("opacity", d => `${color_scale(d[attr])}%`)

        var text = svg.selectAll(".text-number")
            .data(filtered_data, d => d.state);

        text.exit().remove()

        text.enter().append("text")
            .attr("class", "text-number")
            // .attr("text-anchor", "left")
            .merge(text)
        .transition().duration(speed)
            .attr("transform", function(d){
                return `translate(${x(d.state) + x.bandwidth() / 2 + 3},${y(d[attr]) - 5}) rotate(-90)` 
            })
            .attr("font-size", "10px")
            .text(d => d[attr]);
    }

    // var checkbox = d3.select("#sort")
    //     .on("click", function() {
    //         updateChart(dates[date_slider.value], 500)
    //         // updateChart(select.property("value"), 500)
    //     });
};

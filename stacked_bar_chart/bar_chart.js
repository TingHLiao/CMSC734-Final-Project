function load_bar_chart(dataset, filter_min_date, filter_max_date) {
    var is_time = filter_max_date == filter_min_date; // time or period
    if (is_time) {
        load_bar_chart_time(dataset, filter_min_date, filter_max_date);
    }
    else {
        load_bar_chart_period(dataset, filter_min_date, filter_max_date);
    }
}


function load_bar_chart_time(dataset, filter_min_date, filter_max_date) {
    var time_parse = d3.timeParse('%Y/%m/%d');
    var dates = [];
    var states = [];
    var x, y, z,max_new_cases, svg, xAxis, yAxis;

    //-------------------------------------------------------------------------------------------------------------------------
    data=dataset;
    dates = [...new Set(data.map(function(d) { return d.date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
    max_new_cases = d3.max(data, function(d){return +d['new_case'];});

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

        // filtered_data.sort(d3.select("#sort").property("checked")
        //     ? (a, b) => b.tot_cases - a.tot_cases
        //     : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))

        //Axis
        x.domain(filtered_data.map(d => d.state));
        y.domain([0,max_new_cases]);

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
            .attr("fill", "steelblue")

        new_bars.merge(bars)
            .transition().duration(speed)
            .attr("width", x.bandwidth())
                .attr("x", d => x(d.state))
                .attr("y", d => y(d.new_case))
                .attr("height", d => height - margin.bottom - y(d.new_case))

        var text = svg.selectAll(".text-number")
            .data(filtered_data, d => d.state);

        text.exit().remove()

        text.enter().append("text")
            .attr("class", "text-number")
            // .attr("text-anchor", "left")
            .merge(text)
        .transition().duration(speed)
            .attr("transform", function(d){
                return `translate(${x(d.state) + x.bandwidth() / 2 +1},${y(d.new_case) - 5}) rotate(-90)` 
            })
            .attr("font-size", "10px")
            .text(d => d.new_case);
    }
    //-----------------------------------------------------------------------------
    var select = d3.select("#date")
        .on("change", function() {
            updateChart(this.value, 500)
        });

    // var checkbox = d3.select("#sort")
    //     .on("click", function() {
    //         updateChart(dates[date_slider.value], 500)
    //         // updateChart(select.property("value"), 500)
    //     });

    // date_slider.oninput = function() {
    //     date_slider_output.innerHTML = dates[date_slider.value];
    //     updateChart(dates[date_slider.value], 50);
    // }
};



function load_bar_chart_period(dataset, filter_min_date, filter_max_date) {
    var keys_p = ['tot_death', 'tot_diff'];

    var time_parse = d3.timeParse('%Y/%m/%d');
    var dates = [];
    var states = [];
    var x, y, z,max_tot_cases, svg, xAxis, yAxis;

    //-------------------------------------------------------------------------------------------------------------------------
    data=dataset;
    dates = [...new Set(data.map(function(d) { return d.date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
    max_tot_cases = d3.max(data, function(d){return +d['tot_cases'];});

    svg = d3.select("#secondary_svg"),
    margin = {top: 65, left: 35, bottom: 0, right: 10},

    // width = +svg.attr("width") - margin.left - margin.right,
    // height = +svg.attr("height") - margin.top - margin.bottom;
    width = 700 - margin.left - margin.right,
    height = 660 - margin.top - margin.bottom;

	x = d3.scaleBand()
		.range([margin.left, width - margin.right])
		.padding(0.1)

	y = d3.scaleLinear()
		.rangeRound([height - margin.bottom, margin.top])

	xAxis = svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.attr("class", "x-axis")

	yAxis = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("class", "y-axis")

	z = d3.scaleOrdinal()
		.range([ "darkorange","steelblue"])
		.domain(keys_p);

    updateChart(filter_min_date, 0)


    //-----------------------------------------------------------------------------
    function updateChart(input, speed) {
   
        // var filtered_data = data.filter(function(d) { if( d.submission_date == input) { return d; } });
        var filtered_data = data.filter(function(d) { if( d.date == input) { return d; } });


        filtered_data.forEach(function(d) {
            if (d.tot_cases == NaN) {d.tot_cases = 0;}
            if (d.tot_death == NaN) {d.tot_death = 0;}
            d.tot_diff = d.tot_cases - d.tot_death
            return d
        })

        // filtered_data.sort(d3.select("#sort").property("checked")
        //     ? (a, b) => b.tot_cases - a.tot_cases
        //     : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))

        //Axis
        x.domain(filtered_data.map(d => d.state));
        y.domain([0,max_tot_cases]);

        svg.selectAll(".x-axis")
            .transition()
            .duration(speed)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        svg.selectAll(".y-axis")
            .transition()
            .duration(speed)
            .call(d3.axisLeft(y).ticks(null, "s"));
        //Axis---------------------------------------------------------

        var group = svg.selectAll("g.layer")
            .data(d3.stack().keys(keys_p)(filtered_data), d => d.key)

        group.exit().remove()

        group.enter().append("g")
            .classed("layer", true)
            .attr("fill", d => z(d.key));

        var bars = svg.selectAll("g.layer").selectAll("rect")
            .data(d => d, e => e.data.state);

        bars.exit().remove()
        
        bars.enter().append("rect")
            .attr("width", x.bandwidth()*.8)
            .merge(bars)
        .transition().duration(speed)
            .attr("x", d => x(d.data.state))
            .attr("y", function(d) {

                // console.log( "ddddddd"+d[1]);
                // console.log( "yyyyyyy"+d);
                return  y(d[1]);
            })
            
            // d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1])) //d[0] is tot_death, d[1] is tot_diff

        var text = svg.selectAll(".text-number")
            .data(filtered_data, d => d.state);

        text.exit().remove()

        text.enter().append("text")
            .attr("class", "text-number")
            // .attr("text-anchor", "left")
            .merge(text)
        .transition().duration(speed)
            .attr("transform", function(d){
                return `translate(${x(d.state) + x.bandwidth() / 2 +1},${y(d.tot_cases) - 5}) rotate(-90)` 
            })
            .attr("font-size", "10px")
            .text(d => d.tot_cases);
    }
    //-----------------------------------------------------------------------------
    var select = d3.select("#date")
        .on("change", function() {
            updateChart(this.value, 500)
        });

    // var checkbox = d3.select("#sort")
    //     .on("click", function() {
    //         updateChart(dates[date_slider.value], 500)
    //         // updateChart(select.property("value"), 500)
    //     });

    // date_slider.oninput = function() {
    //     date_slider_output.innerHTML = dates[date_slider.value];
    //     updateChart(dates[date_slider.value], 50);
    // }
};
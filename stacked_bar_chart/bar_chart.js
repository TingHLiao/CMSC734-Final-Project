var map_attr  = {
    'conf_cases': 'new_case',
    'conf_death': 'new_death',
    'vac_cnt': 'daily_vaccinations',
    'exc_death': 'total_Excess Estimate',
    'inpatient': 'inpatient_beds_used_covid'
};

var choroScale_cases_time = d3.scaleThreshold()
    .domain([10, 50, 200, 2000, 5000, 10000, 20000, 50000, 90000, 150000, 300000])
	.range(d3.schemeYlOrRd[9]);

var choroScale_cases_period = d3.scaleThreshold()
    .domain([500, 5000, 25000, 80000, 250000, 1000000, 2000000, 5000000, 8000000])
	.range(d3.schemeYlOrRd[9]);

var choroScale_death_time = d3.scaleThreshold()
    .domain([2, 5, 10, 25, 50, 80, 120, 200, 500, 800, 1200])
	.range(d3.schemeBlues[9]);

var choroScale_death_period = d3.scaleThreshold()
    .domain([20, 100, 500, 2000, 8000, 20000, 40000, 60000, 80000, 100000])
	.range(d3.schemeBlues[9]);

var choroScale_vac_time = d3.scaleThreshold()
    .domain([100, 300, 1000, 3000, 8000, 20000, 40000, 80000, 160000, 350000, 500000])
    .range(d3.schemeBuGn[9]);

var choroScale_vac_period = d3.scaleThreshold()
    .domain([1000, 10000, 50000, 200000, 500000, 2000000, 5000000, 10000000, 50000000])
	.range(d3.schemeBuGn[9]);
    
var choroScale_inpatient_time = d3.scaleThreshold()
    .domain([ 10, 25, 50, 100, 200, 500, 800, 1200, 5000])
    .range(d3.schemeRdPu[9]);

var choroScale_inpatient_period = d3.scaleThreshold()
    .domain([1000, 3000, 10000, 50000, 200000, 500000, 2000000, 5000000])
	.range(d3.schemeRdPu[9]);

var choroScale_exc_death_time = d3.scaleThreshold()
    .domain([100, 1000, 5000, 20000, 40000, 80000, 160000, 350000, 500000])
    .range(d3.schemePurples[9]);

var choroScale_exc_death_period = d3.scaleThreshold()
    .domain([1000, 10000, 50000, 200000, 500000, 2000000, 5000000, 10000000, 50000000])
	.range(d3.schemePurples[9]);

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
        'conf_cases': choroScale_cases_time,
        'conf_death': choroScale_death_time,
        'vac_cnt': choroScale_vac_time,
        'exc_death': choroScale_exc_death_time,
        'inpatient': choroScale_inpatient_time
    };

    //-------------------------------------------------------------------------------------------------------------------------
    data=dataset;
    dates = [...new Set(data.map(function(d) { return d.date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
    svg = d3.select("#secondary_svg"),
    margin = {top: 65, left: 35, bottom: 10, right: 10};

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
        max_new_cases = d3.max(data, function(d){return +d[attr];});
        min_new_cases = d3.min(data, function(d){return +d[attr];});
        
        var is_empty = true;
        filtered_data.forEach(function(d) {
            if (d[attr] != 0) {is_empty = false;}
        })
        filtered_data.forEach(function(d) {
            if (d[attr] == NaN || d[attr] <0) {d[attr] = 0;}
            return d
        })

        // --------------------- Sort ---------------------
        filtered_data.sort(d3.select("#sort").property("checked")
            ? (a, b) => b[attr] - a[attr]
            : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))
        // --------------------- Sort ---------------------
        
        // --------------------- Axis ---------------------
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
        // --------------------- Axis ---------------------

        if (!is_empty) {
            // --------------------- bars ---------------------
            var bars = svg.selectAll(".bar-chart-rect")
            .data(filtered_data);

            bars.exit().remove();

            var barsEnter = bars.enter()
            .append("g")
            .attr("class", "bar-chart-rect")

            barsEnter.append('rect')
            .attr("class", "bar-label-group-bar")
            .attr("width", x.bandwidth())

            .attr("height", 0)
            .attr("x", d => x(d.state))
            .attr("fill", d => map_color[show_attr](d[attr]))

            barsEnter.append('text')
            .attr("class","bar-label-group-label")

            bars = bars.merge(barsEnter)
            .transition().duration(speed)

            bars.select('.bar-label-group-bar').attr("width", x.bandwidth())
            .attr("x", d => x(d.state))
            .attr("y", d => y(d[attr]))
            .attr("height", d => height - margin.bottom - y(d[attr]))
            // .attr("opacity", d => `${color_scale(d[attr])}%`)

            bars.select('.bar-label-group-label')
            .attr("transform", function(d){
                return `translate(${x(d.state) + x.bandwidth() / 2 +1},${y(d[attr]) - 10}) ` 
            })
            .text(d => d[attr]);
            // --------------------- bars ---------------------
        }
        
    }
    var checkbox = d3.select("#sort")
        .on("click", function() {
            updateChart(filter_min_date, 500)
            // updateChart(select.property("value"), 500)
        });
};


function load_bar_chart_period(dataset) {
    var attr = map_attr[show_attr];
    var time_parse = d3.timeParse('%Y/%m/%d');
    var dates = [];
    var states = [];
    var x, y, color_scale, max_new_cases, svg, xAxis, yAxis;
    var map_color = { 
        'conf_cases': choroScale_cases_period,
        'conf_death': choroScale_death_period,
        'vac_cnt': choroScale_vac_period,
        'exc_death': choroScale_exc_death_period,
        'inpatient': choroScale_inpatient_period
    };

    //-------------------------------------------------------------------------------------------------------------------------
    data=dataset;
    dates = [...new Set(data.map(function(d) { return d.date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
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
        
        dataset_rollup = d3.nest()
            .key(function (d) { return d.state; })
            .rollup(function (d) {
                return d3.sum(d, function (e) { return +e[attr]; })
            })
            .entries(dataset);

        state_summed_up_value_pair = {};
        for(var i = 0; i < dataset_rollup.length; i++) {
            state_summed_up_value_pair[dataset_rollup[i].key] = dataset_rollup[i].value;
        }
        
        max_new_cases = d3.max(Object.values(state_summed_up_value_pair));
        min_new_cases = d3.min(Object.values(state_summed_up_value_pair));

        // --------------------- Sort ---------------------
        filtered_data.sort(d3.select("#sort").property("checked")
            ? (a, b) => state_summed_up_value_pair[b.state] - state_summed_up_value_pair[a.state]
            : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))
        // --------------------- Sort ---------------------

        // --------------------- Axis ---------------------
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
        // --------------------- Axis ---------------------

        // --------------------- bars ---------------------
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
            .attr("fill", d => map_color[show_attr](state_summed_up_value_pair[d.state]))
        
        barsEnter.append('text')
            .attr("class","bar-label-group-label")

        bars = bars.merge(barsEnter)
            .transition().duration(speed)

        bars.select('.bar-label-group-bar').attr("width", x.bandwidth())
            .attr("x", d => x(d.state))
            .attr("y", d => y(state_summed_up_value_pair[d.state]))
            .attr("height", d => height - margin.bottom - y(state_summed_up_value_pair[d.state]))
            // .attr("opacity", d => `${color_scale(state_summed_up_value_pair[d.state])}%`)

        bars.select('.bar-label-group-label')
            .attr("transform", function(d){
                return `translate(${x(d.state) + x.bandwidth() / 2 +1},${y(state_summed_up_value_pair[d.state]) - 10}) ` 
            })
            .text(d => state_summed_up_value_pair[d.state]);
        // --------------------- bars ---------------------
    }
    var checkbox = d3.select("#sort")
        .on("click", function() {
            updateChart(filter_min_date, 500)
            // updateChart(select.property("value"), 500)
        });
};


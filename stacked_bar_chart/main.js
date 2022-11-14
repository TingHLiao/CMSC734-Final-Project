var keys = ['tot_death', 'diff'];
var display_date_format = d3.timeFormat('%m/%d/%Y');
var time_parse = d3.timeParse('%m/%d/%Y');

d3.csv('../dataset/state-time.csv').then(d => chart(d))
    
function chart(data) {
    var dates = [...new Set(data.map(function(d) { return d.submission_date; }).sort(function(a, b) {return  d3.ascending(time_parse(a),time_parse(b));}))];
    var states = [...new Set(data.sort(function(a, b) {return  d3.ascending(a.state, b.state);}).map(function(d) { return d.state; }))]
    
	var options = d3.select("#date").selectAll("option")
		.data(dates)
	.enter().append("option")
		.text(d => d)
    
    var max_tot_cases = d3.max(data, function(d){return +d['tot_cases'];});

    //-------------------------------------
    var svg = d3.select("#chart"),
		margin = {top: 35, left: 35, bottom: 0, right: 0},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;

	var x = d3.scaleBand()
		.range([margin.left, width - margin.right])
		.padding(0.1)

	var y = d3.scaleLinear()
		.rangeRound([height - margin.bottom, margin.top])

	var xAxis = svg.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.attr("class", "x-axis")

	var yAxis = svg.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.attr("class", "y-axis")

	var z = d3.scaleOrdinal()
		.range([ "darkorange","steelblue"])
		.domain(keys);
    //-------------------------------------

   

    updateChart(d3.select("#date").property("value"), 0)

    //-----------------------------------------------------------------------------
    function updateChart(input, speed) {
        var filtered_data = data.filter(function(d) { if( d.submission_date == input) { return d; } });

        filtered_data.forEach(function(d) {
            if (d.tot_cases == NaN) {d.tot_cases = 0;}
            if (d.tot_death == NaN) {d.tot_death = 0;}
			d.diff = d.tot_cases - d.tot_death
			return d
		})

        filtered_data.sort(d3.select("#sort").property("checked")
            ? (a, b) => b.tot_cases - a.tot_cases
            : (a, b) => states.indexOf(a.state) - states.indexOf(b.state))

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
			.data(d3.stack().keys(keys)(filtered_data), d => d.key)

        group.exit().remove()

		group.enter().append("g")
			.classed("layer", true)
			.attr("fill", d => z(d.key));

		var bars = svg.selectAll("g.layer").selectAll("rect")
			.data(d => d, e => e.data.state);

		bars.exit().remove()
        
		bars.enter().append("rect")
			.attr("width", x.bandwidth())
			.merge(bars)
		.transition().duration(speed)
			.attr("x", d => x(d.data.state))
			.attr("y", d => y(d[1]))
			.attr("height", d => y(d[0]) - y(d[1]))

		var text = svg.selectAll(".text")
			.data(filtered_data, d => d.state);

		text.exit().remove()

		text.enter().append("text")
			.attr("class", "text")
			.attr("text-anchor", "middle")
			.merge(text)
		.transition().duration(speed)
			.attr("x", d => x(d.state) + x.bandwidth() / 2)
			.attr("y", d => y(d.tot_cases) - 5)
			.text(d => d.tot_cases)
        
    }
    //-----------------------------------------------------------------------------

    var select = d3.select("#date")
		.on("change", function() {
			updateChart(this.value, 500)
		})

	var checkbox = d3.select("#sort")
		.on("click", function() {
			updateChart(select.property("value"), 500)
		})
}
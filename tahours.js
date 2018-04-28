var svg = d3.select("svg"),
	margin = {top: 20, right: 80, bottom: 30, left: 50},
	width = svg.attr("width") - margin.left - margin.right,
	height = svg.attr("height") - margin.top - margin.bottom,
	g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	z = d3.scaleOrdinal(d3.schemeCategory10);

var line = d3.line()
	.curve(d3.curveBasis)
	.x(function(d,i) {console.log((d.date)+" -> "+x(d.date)); return x(d.date); })
	.y(function(d,i) {return y(d.hours); });

d3.csv("data/tahours4.csv", type, function(error, TAdata) {
  if (error) throw error;
  var date_i_list = [
  20170201,20170202,20170203,20170204,20170205,20170206,20170207,20170208,20170209,20170210,20170211,20170212,20170213,20170214,20170215,20170216,
20170217,20170218,20170219,20170220,20170221,20170222,20170223,20170224,20170225,20170226,20170227,20170228,20170301,20170302,20170303,20170304,
20170305,20170306,20170307,20170308,20170309,20170310,20170311,20170312,20170313,20170314,20170315,20170316,20170317,20170318,20170319,20170320,
20170321,20170322,20170323,20170324,20170325,20170326,20170327,20170328,20170329,20170330,20170331,20170401,20170402,20170403,20170404,20170405,
20170406,20170407,20170408,20170409,20170410,20170411,20170412,20170413,20170414,20170415,20170416,20170417,20170418,20170419,20170420,20170421,
20170422,20170423,20170424,20170425,20170426,20170427,20170428,20170429,20170430,20170501,20170502,20170503,20170504,20170505,20170506,20170507,
20170508,20170509,20170510,20170511,20170512,20170513,20170514,20170515]
	
  var columns = [316]
  var data = []
	columns.forEach(function(studentID,id) {
		var object = {};
		object["id"] = studentID;
		object["values"] = [];
		object["values"] = date_i_list.map(function(date,i) {
			var x = date%100;
			var y = (date%10000-x)/100
			var z = 2017
			console.log(x,y,z)
			return {
				"date": new Date(z,y,x),
				"hours": 0
			}
		})

		TAdata.map(function(d,i) {
			if(d["Username"]==object["id"]) {
				var index = (date_i_list.indexOf(d["Timestamp"]))
				object["values"][index]["hours"] = d["Time Spent"]
			}
		})
		data.push(object);
	})

  var cities = data
  console.log(data)

  var data = [
  {date: new Date(2017, 2, 1), value: 93.24},
  {date: new Date(2017, 5, 15), value: 95.35}
];

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([
		d3.min(cities, function(c) { return d3.min(c.values, function(d) { return d.hours; }); }),
		d3.max(cities, function(c) { return d3.max(c.values, function(d) { return d.hours; }); })
  ]);
  z.domain(cities.map(function(c) { return c.id; }));

	g.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	g.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(y))
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("fill", "#000")
		.text("hours, ºF");

  var city = g.selectAll(".city")
	.data(cities)
	.enter().append("g")
	.attr("class", "city");

  city.append("path")
  .attr("class", "line")
  .attr("d", function(d) { return line(d.values); })
  .style("stroke", function(d) { return z(d.id); });

  city.append("text")
  .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
  .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.hours) + ")"; })
  .attr("x", 3)
  .attr("dy", "0.35em")
  .style("font", "10px sans-serif")
  .text(function(d) { return d.id; });
});

function type(d, _, columns) {
  d.date = parseTime(d.date);
  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}
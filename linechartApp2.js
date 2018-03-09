	var choices = new Set()

	var svg = d3.select("svg"),
			margin = {top: 20, right: 80, bottom: 30, left: 50},
			width = svg.attr("width") - margin.left - margin.right,
			height = svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var parseTime = d3.timeParse("%Y%m%d%H%M");

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]),
			z = d3.scaleOrdinal(d3.schemeCategory20);

	var line = d3.line()
			.curve(d3.curveBasis)
			.x(function(d) { var temp = new Date(d.date); return x(temp); })
			.y(function(d) { return y(d.temperature); });

	d3.csv("data/temperature5.csv", type, function(error, data) {
		if (error) throw error;

		var dataToRepresent = data.columns.slice(1).map(function(id) {
			return {
				id: id,
				values: data.map(function(d) {
					return {date: new Date(d.date), temperature: d[id]};
				})
			};
		});


		clusters = 4
		maxiterations = 50
		dataClusters = kmeans(dataToRepresent,clusters,maxiterations)
		// findOptimalCluster(dataToRepresent, maxiterations)
		// calculateSumSquareDistance(studentClusters,students)

		var clusteredData = dataClusters.map(function(d,i) {
			return {
				id: "C"+i,
				values: d
			};
		})

		originalData = dataToRepresent
		dataToRepresent = clusteredData
	 
		x.domain(d3.extent(data, function(d) { return d.date; }));

		// y.domain([
		// 	d3.min(dataToRepresent, function(c) { return d3.min(c.values, function(d) { return d.temperature; }); }),
		// 	d3.max(dataToRepresent, function(c) { return d3.max(c.values, function(d) { return d.temperature; }); })
		// ]);

		y.domain([0,75]);

		z.domain(dataToRepresent.map(function(c) { return c.id; }));

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
				.text("Temperature, ºF");

		var city = g.selectAll(".city")
			.data(dataToRepresent)
			.enter().append("g")
				.attr("class", "city");

		city.append("path")
				.attr("class", "line")
				.attr("d", function(d) { return line(d.values); })
				.style("stroke", function(d) { return z(d.id); })
				.on("mouseover", mouseOverFunction)
				.on("mouseout", mouseOutFunction)
				.on("mousemove", mouseMoveFunction)

		// city.append("path")
		//   .attr("class", "line")
		//   .attr("d", function(d) { return line(d.values); })
		//   .style("stroke", function(d,i) {
		//     var x = getRGBIndex(i)
		//     var r = Math.floor((x/Object.keys(labels).length*123)%255);
		//     var g = Math.floor((x/Object.keys(labels).length*345)%255);
		//     var b = Math.floor((x/Object.keys(labels).length*567)%255);
		//     return "rgb("+r+","+g+","+b+")"
		//   })
		//   .style("stroke-width", "2px")
		//   .on("mouseover", mouseOverFunction)
		//   .on("mouseout", mouseOutFunction)
		//   .on("mousemove", mouseMoveFunction)

		city.append("text")
				.datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
				.attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
				.attr("x", 3)
				.attr("dy", "0.35em")
				.style("font", "10px sans-serif")
				.text(function(d) { return d.id; });
	});

	function mouseOutFunction() {
		d3.select(this)
			.style("stroke-width","1px")   
	}

	function mouseOverFunction(d,i) {
		d3.select(this)
			.style("stroke-width","10px") 
		currentLabel = labels[i]
		// boxplotdata = getBoxPlotData()
		stackbardata = 	getStackedBarData(currentLabel)

	}

	function mouseMoveFunction(d,i) {
		d3.select(this)
			.style("stroke-width","5px") 
	}

	function type(d, _, columns) {
		d.date = parseTime(d.date);
		for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
		return d;
	}

	function kmeans(dataset,clusters,maxIterations) {

		numFeatures = dataset[0]["values"].map(function(d) {
			return d.date;
		})
		var centroids = getRandomCentroids(numFeatures, clusters)
		
		// Initialize book keeping vars.
		iterations = 0
		oldCentroids = null

		while(iterations <= maxIterations) {
				// Save old centroids for convergence test. Book keeping.
				oldCentroids = centroids
				iterations = iterations + 1
				// Assign labels to each datapoint based on centroids
				labels = getLabels(dataset, centroids)
				// Assign centroids based on datapoint labels
				centroids = getCentroids(dataset, labels, clusters)
				
		// We can get the labels too by calling getLabels(dataset, centroids)
		}
		return centroids
	}

	function getRandomCentroids(numFeatures, k) {
		var result = []
		for (var i = 0; i < k; i++) {
			result[i] = []
			numFeatures.map(function(d) {
				var x = {}

				x["date"] = d;
				x["temperature"] = (Math.random()*75);
				result[i].push(x)
			})
		}
		return result;
	}

	function getLabels(dataset, centroids) {
		var result = []
		var labelSet = {}
		for (var id = 0; id < dataset.length; id++) {
			var min = 1000

			for (var j = 0; j < centroids.length; j++) {
				var dist = DTWDistance(dataset[id]["values"],centroids[j])
				// var dist = EuclideanDistance(dataset[id]["values"],centroids[j])
				if(dist < min) {
					min = dist;
					result[id] = j;
				}
			}
			if(labelSet[result[id]] == undefined) {
				labelSet[result[id]] = []
			}
			labelSet[result[id]].push(id)
		}   
		return labelSet
	}

	function DTWDistance(s1, s2) {
		var DTW = []
		for (var i = 0; i < s1.length; i++) {
			DTW[i] = {}
			for (var j = 0; j < s2.length; j++) {
				DTW[i][j] = 0;
			}
		}
		for(var i=1;i<s1.length;i++) {
		 DTW[i][0] = Infinity
		}
		for(var i=1;i<s2.length;i++) {
		 DTW[0][i] = Infinity
		}
		
		for (var i = 1; i < s1.length; i++) {
			for (var j = 1; j < s2.length; j++) {
				var dist = (s1[i].temperature - s2[j].temperature)*(s1[i].temperature - s2[j].temperature)
				DTW[i][j] = dist + Math.sqrt(Math.min(DTW[i-1][j],DTW[i][j-1],DTW[i-1][j-1]));
			}
		}

		var result = Math.sqrt(DTW[s1.length-1][s2.length-1])
		return result
	}

	function EuclideanDistance(s1, s2) {
		var result = 0;
		for (var i = 0; i < s1.length; i++) {
			var x = (s1[i].temperature - s2[i].temperature)
			result +=  x*x; 
		}
		return Math.sqrt(result/s1.length)
	}

	function getCentroids(dataset, labels, k) {

		var keys = Object.keys(labels)
		var result = []
		for (var i = 0; i < k; i++) {
			if(labels[i] == undefined) {
				result[i] = []
				numFeatures.map(function(d) {
					var x = {}
					x["date"] = d;
					x["temperature"] = Math.random()*100;
					result[i].push(x)
				})

			} else {
				result[i] = []

				numFeatures.map(function(d,i1) {
					var x = {}
					x["date"] = d;
					// var y = 1
					// labels[i].forEach(function(d1) {
					//   y = y * dataset[d1]["values"][i1]["temperature"]
					// });
					// x["temperature"] = Math.pow(y,1/labels[i].length)
					// result[i].push(x)

					var y = 0
					labels[i].forEach(function(d1) {
						y = y + dataset[d1]["values"][i1]["temperature"]
					});
					x["temperature"] = y/labels[i].length
					result[i].push(x)
				})
			}

		}

		return result
	}

	function findOptimalCluster(students, iterations) {
			// For Clusters ranging from 1 - 20, find the sum of square differences and store in a map
			var elbowMap = {}
			for (var i = 1; i <= 10; i++) {
				var clusters = kmeans(students,i,iterations)
				elbowMap[i] = calculateSumSquareDistance(clusters, students)
			}
			console.log(elbowMap)
		}

		function calculateSumSquareDistance(clusters, studentData) {
			var label_iterator = Object.keys(labels)
			var x = 0
			label_iterator.forEach(function(d,i1) {
				labels[d].forEach(function(e,i2) {
					x = x + getSquareDifference(d,e,studentData[e]["values"],clusters[i1])
				})
			})
			return x
		}

		function getSquareDifference(i1, i2, arr1, arr2) {

			var result = 0
			arr1.forEach(function(d,i) {
				result = result + Math.sqrt(Math.abs(arr1[i].temperature - arr2[i].temperature))
			})
			return result
		}

		function getRGBIndex(d) {
			for (var i = 0; i < Object.keys(labels).length; i++) {
				if(labels[Object.keys(labels)[i]].includes(d)) {
					return i
				}
			}
		}

	function getQuartileData(indexes) {
		result = []
		var inter = {}
		numFeatures.forEach(function(d,i) {
			inter[d] = []
		})


		originalData.forEach(function(d,i) {
			if(indexes.includes(i)) {
				d.values.forEach(function(d1,i1) {
					inter[d1.date].push(d1.temperature)	
				})
			}
		})

		numFeatures.forEach(function(d,i) {
			inter[d].sort()
			var resultElement = {}
			resultElement["date"] = d
			resultElement["min"] = inter[d][0]
			resultElement["fquartile"] = inter[d][Math.floor(indexes.length*0.25)] - inter[d][0]
			resultElement["median"] = inter[d][Math.floor(indexes.length*0.5)] - inter[d][Math.floor(indexes.length*0.25)]
			resultElement["tquartile"] = inter[d][Math.floor(indexes.length*0.75)] - inter[d][Math.floor(indexes.length*0.5)]
			resultElement["max"] = inter[d][indexes.length-1] - inter[d][Math.floor(indexes.length*0.75)]
			result.push(resultElement)
		})

		return result

	}


	function getBoxPlotData() {

		arr = getFilteredUsers(currentLabel,choices)
	
		var t = d3.transition()
				.duration(750);

		var result = arr.map(function(d) {
			var x = {}
			originalData[d]["values"].forEach(function(e) {
					x[e.date]= e.temperature
			})
			return x
		})

		d3.selectAll(".box").remove()

		var box_labels = true
		var box_margin = {top: 10, right: 50, bottom: 20, left: 50}
		var box_width = 1500 - box_margin.left - box_margin.right
		var box_height = 250 - box_margin.top - box_margin.bottom
		var box_min = Infinity
		var box_max = -Infinity
		var box_data = [];

		numFeatures.map(function(d,i) {
			box_data[i] = []
		})

		numFeatures.map(function(d,i) {
			box_data[i][0] = d
			box_data[i][1] = []
		})
			
		result.forEach(function(x) {

		var box_v = []

		numFeatures.map(function(d,i) {
			box_v[i] = x[d]
		})

		box_v.sort()
		
		var rowbox_max = box_v[box_v.length-1]
		var rowbox_min = box_v[0]


		box_v.forEach(function(d,i) {
			box_data[i][1].push(d);
		})

		 // add more rows if your csv file has more columns
		 
		if (rowbox_max > box_max) box_max = rowbox_max;
		if (rowbox_min < box_min) box_min = rowbox_min; 
		});
			
		var box_chart = d3.box()
			.whiskers(iqr(1.5))
			.height(box_height) 
			.domain([box_min, box_max])
			.showLabels(box_labels);

		var box_svg = d3.select(".viz-body").append("svg")
			.attr("width", box_width + box_margin.left + box_margin.right)
			.attr("height", box_height + box_margin.top + box_margin.bottom)
			.attr("class", "box")    
			.append("g")
			.attr("transform", "translate(" + box_margin.left + "," + box_margin.top + ")");

		box_x = d3.scaleTime().range([0, box_width])
		box_x.domain(d3.extent(box_data, function(d) {return d[0]; }));

		var box_xAxis = d3.axisBottom(box_x)

		var box_y = d3.scaleLinear()
			.domain([box_min, box_max])
			.range([box_height + box_margin.top, 0 + box_margin.top]);
		
		var box_yAxis = d3.axisLeft(box_y)

		box_svg.selectAll(".box")    
			.data(box_data)
			.enter().append("g")
			.attr("transform", function(d) { return "translate(" +  box_x(d[0])  + "," + box_margin.top + ")"; } )
			.call(box_chart.width(5));
	 
		box_svg.append("text")
			.attr("x", (box_width / 2))             
			.attr("y", 0 + (box_margin.top / 2))
			.attr("text-anchor", "middle")  
			.style("font-size", "18px")
			.style("font-family", "Cabin") 
			.text("Distribution of Scores within Cluster")

		box_svg.append("g")
			.attr("class", "y axis")
			.call(box_yAxis)
			.append("text") // and text1
			.attr("transform", "rotate(+90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.style("font-size", "16px") 
			.text("Scores");    
		
		box_svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (box_height  + box_margin.top + 10) + ")")
			.call(box_xAxis)
			.append("text")             // text label for the x axis
			.attr("x", (box_width / 2) )
			.attr("y",  10 )
			.attr("dy", ".71em")
			.style("text-anchor", "middle")
			.style("font-size", "16px") 
			.text("Quarter"); 

		function iqr(k) {
			return function(d, i) {
			var q1 = d.quartiles[0],
				q3 = d.quartiles[2],
				iqr = (q3 - q1) * k,
				i = -1,
				j = d.length;
			while (d[++i] < q1 - iqr);
			while (d[--j] > q3 + iqr);
			return [i, j];
			};
		}

		function getFilteredUsers(currentLabel,choices) {
			// Returm Array of Indices
			if(choices.size == 0) {
				return currentLabel
			} else {
				var results = new Set()
				choices.forEach(function(d,i) {
					catWiseStudentData[d].forEach(function(d1,i1) {
					var index = getStudentIndex(d1,currentLabel)
					if(index != -1) {
						results.add(index)
					}
					})
				})
				let array = Array.from(results);
				return array
			}
		}

		function getStudentIndex(student,currentLabel) {
			for (var i = 0; i < originalData.length; i++) {
				if(originalData[i]["id"] == student && currentLabel.includes(i)) {
					return i
				}
			}
			return -1
		}
	}

function getStackedBarData(currentLabel) {

	var result = getQuartileData(currentLabel)
	d3.select("#stacked").select("g").remove()
	d3.select(".stream-body").append("svg")
	var svg = d3.select(".stream-body").select("svg").attr("id","stacked"),
		margin = {top: 20, right: 80, bottom: 30, left: 50},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom,
	
	g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		// var margin = {top: 20, right: 150, bottom: 50, left: 40},
		//     width = 600 - margin.left - marginStacked.right,
		//     height = 500 - margin.top - marginStacked.bottom;
		//
		//
		// var svg = d3.select("#stacked").append("svg")
		//     .attr("width", widthStacked + marginStacked.left + marginStacked.right)
		//     .attr("height", heightStacked + marginStacked.top + marginStacked.bottom)
		//   .append("g")
		//     .attr("transform", "translate(" + marginStacked.left + "," + marginStacked.top + ")");

	var x = d3.scaleTime().range([0, width])

	var y = d3.scaleLinear()
			.rangeRound([height, 0]);

	var z = d3.scaleOrdinal(d3.schemeCategory20);
			// .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	var stack = d3.stack();

	// d3.csv("data/segments_table2.csv", type, function(error, data) {
	//   if (error) throw error;

	  // console.log(data)
	  // data.sort(function(a, b) { return b.total - a.total; });
	  // var columns = data.columns;

		// console.log(result)

		data = result
		var columns = Object.keys(result[0])
		
		x.domain(d3.extent(data, function(d) { return d.date; }));

		// y.domain([0, d3.max(data, function(d) { console.log(d); return d.total; })]).nice();

		y.domain([0,75]);
		z.domain(columns.slice(1));



		g.selectAll(".serie")
			.data(stack.keys(columns.slice(1))(data))
			.enter().append("g")
			.attr("class", "serie")
			.attr("fill", function(d) { return z(d.key); })
			.selectAll("rect")
			.data(function(d) { return d; })
			.enter().append("rect")
			.attr("x", function(d) { return x(d.data.date); })
			.attr("y", function(d) { return y(d[1]); })
			.attr("height", function(d) { return y(d[0]) - y(d[1]); })
			.attr("width", 3);

		g.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));

		g.append("g")
			.attr("class", "axis axis--y")
			.call(d3.axisLeft(y).ticks(10, "s"))
			.append("text")
			.attr("x", 2)
			.attr("y", y(y.ticks(10).pop()))
			.attr("dy", "0.35em")
			.attr("text-anchor", "start")
			.attr("fill", "#000")
			.text("Temperature");

		var legend = g.selectAll(".legend")
			.data(columns.slice(1).reverse())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
			.style("font", "10px sans-serif");

		legend.append("rect")
			.attr("x", width + 18)
			.attr("width", 18)
			.attr("height", 18)
			.attr("fill", z);

		legend.append("text")
			.attr("x", width + 44)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("text-anchor", "start")
			.text(function(d) { return d; });
	// });

	function type(d, i, columns) {
		for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
		d.total = t;
		return d;
	}
} 


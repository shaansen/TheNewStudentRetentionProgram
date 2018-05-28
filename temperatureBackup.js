	var choices = new Set()
	var labelsOnBasisOfPerformance
	var numFeatures

	var svg = d3.select(".viz-body").select("svg"),
			margin = {top: 20, right: 80, bottom: 30, left: 50},
			width = svg.attr("width") - margin.left - margin.right,
			height = svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var parseTime = d3.timeParse("%Y%m%d%H%M");

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]),
			z = d3.scaleOrdinal(d3.schemeCategory10);

	var line = d3.line()
			.curve(d3.curveBasis)
			.x(function(d) { var temp = new Date(d.date); return x(temp); })
			.y(function(d) { return y(d.temperature); });

	var filterLimits = {
		"x0" : new Date('December 17, 1995 03:24:00'),
		"x1" : new Date('December 17, 2995 03:24:00'),
		"y0" : 0,
		"y1" : 300
	}

	var filterCriteria = []
	var currentLabel
	var dataSecondary

	getFilterData()
	getLineData()	

	function getLineData() {

		d3.csv("data/temperature/temperature8.csv", type, function(error, data) {
		if (error) throw error;

		var dataToRepresent = data.columns.slice(1).map(function(id) {
			return {
				id: id,
				values: data.map(function(d) {
					return {date: new Date(d.date), temperature: d[id]};
				})
			};
		});

		clusters = 5
		maxiterations = 1000
		numFeatures = dataToRepresent[0]["values"].map(function(d) {
			return d.date;
		})

		dataClusters = kmeans(dataToRepresent,clusters,maxiterations)
		// findOptimalCluster(dataToRepresent, maxiterations)
		// calculateSumSquareDistance(dataClusters,dataToRepresent)

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

		y.domain([0,80]);

		z.domain(dataToRepresent.map(function(c,i) { return i; }));

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
				.text("Value");

		var city = g.selectAll(".city")
			.data(dataToRepresent)
			.enter().append("g")
			.attr("class", "city");

		city.append("path")
			.attr("class", "line")
			.attr("d", function(d) { return line(d.values); })
			.style("stroke", function(d,i) {return z(i); })
			.style("stroke-width","5px") 
			.on("mouseover", mouseOverFunction)
			.on("mouseout", mouseOutFunction)
			.on("mousemove", mouseMoveFunction)
			.on("click", selectLine)


		// city.append("path")
		// 	.attr("class", "line")
		// 	.attr("d", function(d) {return line(d.values) })
		// 	.style("stroke", function(d,i) {
		// 		var x = getLabelNumber(labelsOnBasisOfPerformance,i)
		// 		console.log(i,x)
		// 		return z(x)
		// 	})
		// 	.style("stroke-width","5px") 
		// 	.on("mouseover", mouseOverFunction)
		// 	.on("mouseout", mouseOutFunction)
		// 	.on("mousemove", mouseMoveFunction)
		// 	.on("click", selectLine)
				// .style("stroke", "black")

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
	}

function getLabelNumber(labelsOnBasisOfPerformance,id) {
	var result;
	Object.keys(labelsOnBasisOfPerformance).forEach(function(d1,i1) {
		if(labelsOnBasisOfPerformance[d1].includes(id)) {
			// console.log(id,labelsOnBasisOfPerformance[d1],"->",i1)
			result =  i1;
		}
	})
	return result;
}

	
function mouseOutFunction() {
	d3.select(".viz-body").selectAll(".line")
	 .style("stroke-opacity",function(d1,i1) {
			 return "1";
	 }) 

	d3.select(".filter-body").selectAll(".officeHourline")
	 .style("stroke-width",function(d1,i1) {
			 return "1.5px"
	 }) 
	 .style("stroke-opacity","1") 

	 d3.select(".filter-body").selectAll(".officeHourlineMin")
	 .style("stroke-width",function(d1,i1) {
			 return "4px"
	 }) 
	 .style("stroke-opacity","1") 

	 d3.select(".filter-body").selectAll(".officeHourlineMax")
	 .style("stroke-width",function(d1,i1) {
			 return "0.5px"
	 }) 
	 .style("stroke-opacity","1") 
	 // .style("stroke", "black")

	d3.select(this)
		.style("stroke-width","5px")   
	// tooltip.style("visibility", "hidden") 

	d3.selectAll(".navbarRects")
	 .attr("width","10px") 

	d3.selectAll(".navbarTexts")
	 .attr("font-weight","normal") 
}

function compareCentroidsTo(centroids, oldCentroids) {
	return _.isEqual(centroids,oldCentroids);
}

function mouseOverFunction(d,i) {

	d3.select(".viz-body").selectAll(".line")
	 .style("stroke-opacity",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "0.30";
		 }
	 }) 

	d3.select(".filter-body").selectAll(".officeHourline")
	 .style("stroke-width",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "1.5px"
		 } else {
			 return "6px"
		 }
	 }) 
	 .style("stroke-opacity",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "0.30";
		 }
	 }) 


	 d3.select(".filter-body").selectAll(".officeHourlineMin")
	 .style("stroke-width",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "4px"
		 } else {
			 return "6px"
		 }
	 }) 
	 .style("stroke-opacity",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "0.30";
		 }
	 }) 

	 d3.select(".filter-body").selectAll(".officeHourlineMax")
	 .style("stroke-width",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "0.5px"
		 } else {
			 return "4px"
		 }
	 }) 
	 .style("stroke-opacity",function(d1,i1) {
		 if(d.id != d1.id) {
			 return "0.30";
		 }
	 }) 


	 d3.selectAll(".navbarRects")
	 .attr("width",function(d1,i1) {
	 	if(d1 != i) {
			 return "10px"
		 } else {
			 return "20px"
		 }
	 })

	 d3.selectAll(".navbarTexts")
	 .attr("font-weight",function(d1,i1) {
	 	if(d1 != i) {
			 return "normal"
		 } else {
			 return "bold"
		 }
	 }) 

	 // .style("stroke", "black")

	d3.select(this)
		.style("stroke-width","6px") 
	currentLabel = labelsOnBasisOfPerformance[i]
}

function mouseMoveFunction() {
	var year = x.invert(d3.mouse(this)[0])
	var y = getEventName(year)

	tooltip.style("top", (event.pageY-30)+"px")
	.style("visibility", "visible") 
	.style("left",(event.pageX - 50)+"px")
	.text(y)
	.style("background-color","grey")
	.style("padding","5px 5px 5px 5px")
	.style("color","white")
	.style("font-family","Cabin")
	.style("font-size","11px")
}

	function selectLine(d,i) {
		d3.select(".viz-body").selectAll(".line")
			.style("stroke-opacity",function(d1,i1) {
				if(i != i1) {
					return "0.10";
				}
			}) 
			
				
		currentLabel = labels[i]
		// boxplotdata = getBoxPlotData()
		getStackedBarData(currentLabel,filterCriteria)

	}

	// function mouseMoveFunction(d,i) {
	// 	d3.select(this)
	// 		.style("stroke-width","5px") 
	// }

	function type(d, _, columns) {
		d.date = parseTime(d.date);
		for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
		return d;
	}

function kmeans(dataset,clusters,maxIterations) {

	
	var centroids = getRandomCentroids(numFeatures, clusters)
	
	// Initialize book keeping vars.
	iterations = 0
	oldCentroids = null

	while(iterations <= maxIterations && !compareCentroidsTo(centroids,oldCentroids)) {
		
		// Save old centroids for convergence test. Book keeping.
		oldCentroids = centroids
		iterations = iterations + 1
		// Assign labels to each datapoint based on centroids

		labels = getLabels(dataset, centroids)
		// Assign centroids based on datapoint labels
		centroids = getCentroids(dataset, labels, clusters)
		// We can get the labels too by calling getLabels(dataset, centroids)

	}
	
	labelsOnBasisOfPerformance = labels
	
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
		var min = Infinity
		for (var j = 0; j < centroids.length; j++) {
			// var dist = EuclideanDistance(dataset[id]["values"],centroids[j])
			var dist = DTWDistance(dataset[id]["values"],centroids[j])
			// var dist = ManhattanDistance(dataset[id]["values"],centroids[j])
			// var dist = MinkowskiDistance(dataset[id]["values"],centroids[j],10)
			// var dist = ChebyshevDistance(dataset[id]["values"],centroids[j])

			
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
	
	for (var j = 0; j < centroids.length; j++) {
		if(labelSet[j] == undefined) {
			labelSet[j] = []
		}		
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
	return Math.sqrt(result)
}

function ManhattanDistance(s1, s2) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x = (s1[i].temperature - s2[i].temperature) >= 0 ? (s1[i].temperature - s2[i].temperature) : - (s1[i].temperature - s2[i].temperature)
		result +=  x; 
	}
	return result
}

function MinkowskiDistance(s1, s2,p ) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x = (s1[i].temperature - s2[i].temperature) >= 0 ? (s1[i].temperature - s2[i].temperature) : - (s1[i].temperature - s2[i].temperature)
		x = Math.log(x)/p
		x = Math.exp(x)
		result +=  x; 
	}
	return Math.exp(result,p)
}

function ChebyshevDistance(s1, s2) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x = (s1[i].temperature - s2[i].temperature) >= 0 ? (s1[i].temperature - s2[i].temperature) : - (s1[i].temperature - s2[i].temperature)
		
		result =  Math.max(x,result); 
	}
	return result
}

	function getCentroids(dataset, labels, k) {

	var keys = Object.keys(labels)
	var result = []
	
	for (var i = 0; i < k; i++) {
		if(labels[i].length == 0) {
			result[i] = []
			numFeatures.map(function(d) {
				var x = {}
				x["date"] = d;
				x["temperature"] = Math.random()*100;
				result[i].push(x)
			})

		} else {
			result[i] = []
			numFeatures.forEach(function(d,i1) {
				var x = {}
				x["date"] = d;
				// var y = 1 // Using Multiplication
				var  y = 0; // Using log in place of multiplication
				labels[i].forEach(function(d1) {
					y = y + Math.log(dataset[d1]["values"][i1]["temperature"])
					
				});
				x["temperature"] = Math.exp(y/labels[i].length)
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
				result = result + (arr1[i].temperature - arr2[i].temperature)*(arr1[i].temperature - arr2[i].temperature)
			})
			return Math.sqrt(result)
		}

		function getRGBIndex(d) {
			for (var i = 0; i < Object.keys(labels).length; i++) {
				if(labels[Object.keys(labels)[i]].includes(d)) {
					return i
				}
			}
		}

	function getQuartileData(indexes,filterCriteria) {
		result = []
		var inter = {}
		numFeatures.forEach(function(d,i) {
			inter[d] = []
		})

		var x0 = filterLimits["x0"]
		var x1 = filterLimits["x1"]
		var y0 = filterLimits["y0"]
		var y1 = filterLimits["y1"]


		originalStudentData.forEach(function(d,i) {
			if(filterCriteria!=undefined && indexes.includes(i) && (filterCriteria.length == 0 || filterCriteria.includes(i))) {
				d.values.forEach(function(d1,i1) {
					inter[d1.date].push(d1.scores) 
				})
			}
		})

		numFeatures.forEach(function(d,i) {
			inter[d].sort(function(a, b){return a - b});
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


	/*function getBoxPlotData() {

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
			.text("Distribution of temperature within Cluster")

		box_svg.append("g")
			.attr("class", "y axis")
			.call(box_yAxis)
			.append("text") // and text1
			.attr("transform", "rotate(+90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.style("font-size", "16px") 
			.text("temperature");    
		
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
	}*/

function getStackedBarData(currentLabel,filterCriteria) {
	var result = getQuartileData(currentLabel,filterCriteria)
	d3.selectAll(".serie").remove()
	d3.select(".stream-body").append("svg")
	// var svgStacked = d3.select(".stream-body").select("svg").attr("id","stacked"),
	// 	margin = {top: 20, right: 80, bottom: 30, left: 50},
	// 	width = +svg.attr("width") - margin.left - margin.right,
	// 	height = +svg.attr("height") - margin.top - margin.bottom,
	
	g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	// d3.select(".serie").moveToBack();
	// d3.selectAll(".line").moveToFront();

	// var x = d3.scaleTime().range([0, width])

	// var y = d3.scaleLinear()
	// 		.rangeRound([height, 0]);

	var z = d3.interpolateRdYlBu();
	var stack = d3.stack();
	data = result
	var columns = Object.keys(result[0])
	
	// x.domain(d3.extent(data, function(d) { return d.date; }));
	// y.domain([0,75]);
	g.selectAll(".serie")
		.data(stack.keys(columns.slice(1))(data))
		.enter().append("g")
		.attr("class", "serie")
		.attr("fill", function(d,i) { return getRectangleColors(i) })
		.attr("fill-opacity", "0.5")
		.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
		.attr("x", function(d) { return x(d.data.date); })
		.attr("y", function(d) { return y(d[1]); })
		.attr("height", function(d) { return y(d[0]) - y(d[1]); })
		.attr("width", 25)
		

		// g.append("g")
		// 	.attr("class", "axis axis--x")
		// 	.attr("transform", "translate(0," + height + ")")
		// 	.call(d3.axisBottom(x));

		// g.append("g")
		// 	.attr("class", "axis axis--y")
		// 	.call(d3.axisLeft(y).ticks(10, "s"))
		// 	.append("text")
		// 	.attr("x", 2)
		// 	.attr("y", y(y.ticks(10).pop()))
		// 	.attr("dy", "0.35em")
		// 	.attr("text-anchor", "start")
		// 	.attr("fill", "#000")
		// 	.text("Temperature");

	// var legend = g.selectAll(".legend")
	// 	.data(columns.slice(1).reverse())
	// 	.enter().append("g")
	// 	.attr("class", "legend")
	// 	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
	// 	.style("font", "10px sans-serif");

	// legend.append("rect")
	// 	.attr("x", width + 18)
	// 	.attr("width", 18)
	// 	.attr("height", 18)
	// 	.attr("fill", z);

	// legend.append("text")
	// 	.attr("x", width + 44)
	// 	.attr("y", 9)
	// 	.attr("dy", ".35em")
	// 	.attr("text-anchor", "start")
	// 	.text(function(d) { return d; });

	function type(d, i, columns) {
		for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
		d.total = t;
		return d;
	}
} 


function getRectangleColors(i) {
	switch (i) {
		case 0:
			return "#fff";
		case 1:
			// return "#fff";
			return "#000068";
		case 2:
			return "#0000ff";
		case 3:
			return "#ff0000";
		case 4:
			// return "#fff";
			return "#720202";
		
	}
}

function getFilterData() {

	var x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]),
			z = d3.scaleOrdinal(d3.schemeCategory20);

	var line = d3.line()
			.curve(d3.curveBasis)
			.x(function(d) { var temp = new Date(d.date); return x(temp); })
			.y(function(d) { return y(d.temperature); });

	d3.csv("data/temperature/humidity.csv", type, function(error, data) {
		if (error) throw error;

		var svg = d3.select(".filter-body").select("svg"),
			margin = {top: 20, right: 80, bottom: 30, left: 50},
			width = svg.attr("width") - margin.left - margin.right,
			height = svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		var brush = d3.brush().on("end", brushended).extent([[0, 0], [width, height]]),
	    idleTimeout,
	    idleDelay = 10000;

		var dataToRepresent = data.columns.slice(1).map(function(id) {
			return {
 				values: data.map(function(d) {
					return {date: new Date(d.date), humidity: d[id]};
				})
			};
		});

		dataSecondary = dataToRepresent

		x.range([0, width]),
		y.range([height, 0]),
		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain([0,100]);
		z.domain(dataToRepresent.map(function(c,i) { return c.id; }));
		var line = d3.line()
			.curve(d3.curveBasis)
			.x(function(d,i) { var temp = new Date(d.date); return x(temp); })
			.y(function(d,i) { return y(d.humidity); });

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
				.text("Humidity");

		var city = g.selectAll(".filter-city")
			.data(dataToRepresent)
			.enter().append("g")
			.attr("class", "filter-city");

		city.append("path")
				.attr("class", "line")
				.attr("d", function(d) { return line(d.values); })
				.style("stroke", function(d,i) {return z(i)})
				.style("stroke-width","1px") 



		city.append("text")
				.datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
				.attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.humidity) + ")"; })
				.attr("x", 3)
				.attr("dy", "0.35em")
				.style("font", "10px sans-serif")
				.text(function(d) { return d.id; });

		svg.append("g")
    .attr("class", "brush")
    .call(brush)

		function brushended() {
			var s = d3.event.selection;
		  if (!s) {
		    if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
		    // x.domain(x0);
		    // y.domain(y0);
		  } else {
		  	var x0 = x.invert(s[0][0])
		  	var x1 = x.invert(s[1][0])
		  	x0.setHours(x0.getHours() - 12);
		  	x1.setHours(x1.getHours() - 12);
		  	var y0 = y.invert(s[0][1])+7
		  	var y1 = y.invert(s[1][1])+7
		  	var filterLimits = {
		  		"x0" : x0,
		  		"y0" : y0,
		  		"x1" : x1,
		  		"y1" : y1,
		  	}
		  }
		  update(filterLimits);
		}

		function idled() {
		  idleTimeout = null;
		}

		function update(filterLimits) {
			filterCriteria = getFilteredLabels(dataSecondary, filterLimits)
			getStackedBarData(currentLabel, filterCriteria)
		}

		function getFilteredLabels(data, filters) {

			var x0 = filters["x0"]
			var x1 = filters["x1"]
			var y0 = filters["y0"]
			var y1 = filters["y1"]

			var set = new Set()

			data.forEach(function(d,i) {
				d.values.forEach(function(d1,i1) {
					if(d1.date > x0 && d1.date < x1 && d1.humidity < y0 && d1.humidity > y1) {
						set.add(i)
					}
				})
			})

			var result = Array.from(set);
			return result
		}

	});


}
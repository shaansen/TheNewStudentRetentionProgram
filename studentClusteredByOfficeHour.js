	var choices = new Set()

	var svg = d3.select(".viz-body").select("svg"),
			margin = {top: 20, right: 80, bottom: 30, left: 50},
			width = svg.attr("width") - margin.left - margin.right,
			height = svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
		y = d3.scaleLinear().range([height, 0]),
		z = d3.scaleOrdinal(d3.schemeCategory10);

var yellow = d3.interpolateYlGn(), // "rgb(255, 255, 229)"
		yellowGreen = d3.interpolateYlGn(0.5), // "rgb(120, 197, 120)"
		green = d3.interpolateYlGn(1); // "rgb(0, 69, 41)"

var line = d3.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.scores); });
		// .curve(d3.curveBasis)

var filterLimits = {
	"x0" : new Date('December 17, 1995 03:24:00'),
	"x1" : new Date('December 17, 2995 03:24:00'),
	"y0" : 0,
	"y1" : 300
}
		
var tipBox
var tooltip
var completeDateList
var dateSet
var date_i_list = [20170201,20170202,20170203,20170204,20170205,20170206,20170207,20170208,20170209,20170210,20170211,20170212,20170213,20170214,20170215,20170216,
20170217,20170218,20170219,20170220,20170221,20170222,20170223,20170224,20170225,20170226,20170227,20170228,20170301,20170302,20170303,20170304,
20170305,20170306,20170307,20170308,20170309,20170310,20170311,20170312,20170313,20170314,20170315,20170316,20170317,20170318,20170319,20170320,
20170321,20170322,20170323,20170324,20170325,20170326,20170327,20170328,20170329,20170330,20170331,20170401,20170402,20170403,20170404,20170405,
20170406,20170407,20170408,20170409,20170410,20170411,20170412,20170413,20170414,20170415,20170416,20170417,20170418,20170419,20170420,20170421,
20170422,20170423,20170424,20170425,20170426,20170427,20170428,20170429,20170430,20170501,20170502,20170503,20170504,20170505,20170506,20170507,
20170508,20170509,20170510,20170511,20170512,20170513,20170514,20170515]
var labelsOnBasisOfPerformance
// -----------------------------------------------------------------------------------------
//
// Code to read Calendar and Map dates to events
//
// -----------------------------------------------------------------------------------------

// Calendar data contains the values of all the 
// dates mapped to their events and the aggregate total score of the events till then
var calendarData = {}

// dateList contains the sequence of dates of events in an array
var dateList = []
var longDateToShortDate = {}

// cTotal contains the accumulative total for all the events that have occured till that date
var cTotal = 0

// this is the list of columns that need to be displayed in the visualization
var columns = ["date",106,286,288,196,181,301,154,331,300,119,283,160,296,266,324,299,220,280,349,138,258,214,236,363,211,151,248,348,145,143,322,257,276,323,
320,159,253,167,136,252,303,217,142,351,231,259,171,369,134,221,199,261,250,133,311,198,162,186,339,271,200,290,307,230,330,291,120,184,265,202,212,157,360,107,229,135,213,256,338,315,206,325,298,104,188,115,357,268,150,126,356,147,178,305,219,267,237,105,
254,103,232,193,131,226,146,293,197,209,192,121,335,175,264,239,328,306,361,297,117,240,148,346,169,144,182,228,140,347,272,370,114,364,210,345,368,176,113,163,295,179,287,218,309,249,161,277,255,110,222,358,241,354,124,334,365,355,128,353,350,215,170,242,
275,125,164,112,180,224,173,156,194,284,101,247,172,132,141,149,111,235,227,102,155,129,336,337,158,183,185,174,216,127,130,289,278,269,342,282,187,312,327,340,326,263,373,123,201,116,270,109,366,152,238,122,165,207,100,244,190,329,314,205,313,153,168,274,
308,245,352,344,225,204,108,367,118,341,137,319,262,203,304,343,234,333,281,371,317,139,191,177,302,246,223,332,273,372,292,310,321,208,233,189,279,260,243,195,318,362,316,294,251,166,285,359]
var irregDatesToRegDates = []
var quartilePreData
var quartilePostData
var numFeatures
var boxplotdata
var originalStudentData
var helpSeekingCSVdata = []
var catWiseStudentData = []
var studentWiseTAdata = []
var choices = new Set()
var filterCriteria = []
var currentLabel
var dataSecondary
var listOfEvents = ["HW1","LAB2","OTHERS","HW2","HW3","LAB3","LAB4","HW4","LAB5","PROJ1","LAB6","LAB7",
										"Midterm","HW5","LAB8","PROJ2","LAB9","HW6","LAB10","PROJ3","LAB13"]
var hourSpent = {
	1: "< 5 minutes",
	2: "6 - 15 minutes",
	3: "16 - 30 minutes",
	4: "31 - 60 minutes",
	5: "> 60 minutes",
	6: "Not Attended",
}

var filteredSet = []


var clusters = 8
var maxiterations = 50


// getLineData()
getFilterData()

function getLineData() {
	// Below code parses the calendar csv to mark events on the basis of the date
	// and give descriptions of the events that have occured
	// with the cummulative total score till that event
	d3.csv('data/calendar.csv')
		.row(function(d) {
			return {
				date: parseInt(d["Date"]),
				description: d["Description"],
				total: +d["Total"]
			};
		})
		.get(function(error, csv) {
			if (!error) {
				csv.forEach(function(d,i) {
					cTotal = cTotal + d.total
					dateList.push(d.date)
					calendarData[d.date] = {}
					calendarData[d.date]["description"] = d.description
					calendarData[d.date]["total"] = cTotal
					longDateToShortDate[parseTime(d.date)] = d.date
				});
			} else {
				// handle error
			}
		});

	Object.keys(hourSpent).map(function(d,i) {
		catWiseStudentData[hourSpent[d]] = new Set()
	})



	// Below code basically parses the studentGrade data to create normalized scores of the students till that date
	d3.csv("data/grades2.csv", type, function(error, studentGradeData) {
		if (error) throw error;
		
		studentGradeData.forEach(function(d,i) {
			if(filteredSet.length === 0 || filteredSet.includes(parseInt(d.Username))) {
				var total = 0
				for (var i = 0; i < dateList.length; i++) {
					var x = (calendarData[dateList[i]].description)
					var y = (calendarData[dateList[i]].total)
					total = total + d[x]
					d[x] = total/y*100
				}
			columns.push(d.Username)
			}
		})

		completeDateList = getCompleteDateList(dateList)
	
		var dataForVisualization = convertIrregToReg(completeDateList,studentGradeData,calendarData)
		data = dataForVisualization
		
		students = columns.slice(1).map(function(id) {
			return {
				id: id,
				values: data.map(function(d) {
					return {date: d.date, scores: d[id]};
				})
			};
		});

		console.log(students)
		studentClusters = kmeans(students,clusters,maxiterations,"scores")
		// findOptimalCluster(students, maxiterations)
		// calculateSumSquareDistance(studentClusters,students)

		var clusteredData = studentClusters.map(function(d,i) {
			return {
				id: "C"+i,
				values: d
			};
		})

		originalStudentData = students
		students = clusteredData
		

		x.domain(d3.extent(data, function(d) {return d.date; }));
		y.domain([0,110])
		z.domain(students.map(function(c,i) {return c.id; }));

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
			.text("Scores");

		tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")

		var studentData = g.selectAll(".studentData")
			.data(students)
			.enter().append("g")
			.attr("class", "studentData");

		// studentData.append("path")
		//   .attr("class", "line")
		//   .attr("d", function(d) { return line(d.values); })
		//   .style("stroke", function(d,i) {
		//     var x = getRGBIndex(i)
		//     var r = Math.floor((x/Object.keys(labels).length*123)%255);
		//     var g = Math.floor((x/Object.keys(labels).length*345)%255);
		//     var b = Math.floor((x/Object.keys(labels).length*567)%255);
		//     console.log(r+" | "+g+" | "+b)
		//     return "rgb("+r+","+g+","+b+")"
		//   })
		//   .style("stroke-width", "2px")
		//   .on("mouseover", mouseOverFunction)
		//   .on("mouseout", mouseOutFunction)
		//   .on("mousemove", mouseMoveFunction)

		studentData.append("path")
		  .attr("class", "line")
		  .attr("d", function(d) { return line(d.values); })
		  .style("stroke", function(d) {return z(d.id); })
		  .style("stroke-width", "2px")
		  .on("mouseover", mouseOverFunction)
		  .on("mouseout", mouseOutFunction)
		  .on("mousemove", mouseMoveFunction)
		  .on("click", selectLine)

		// studentData.append("path")
		// 	.attr("class", "line")
		// 	.attr("d", function(d) { return line(d.values); })
		// 	.style("stroke", function(d,i) {var x = getRGBIndex(i);return z(x); })
		// 	.style("stroke-width", "2px")
		// 	.on("mouseover", mouseOverFunction)
		// 	.on("mouseout", mouseOutFunction)
		// 	.on("mousemove", mouseMoveFunction)
		// 	.on("click", selectLine)

		studentData.append("text")
			.datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
			.attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.scores) + ")"; })
			.attr("x", 3)
			.attr("dy", "0.35em")
			.style("font", "10px")
			.text(function(d) { return d.id; });

		
	})
}
	
	function mouseOutFunction() {
		d3.select(this)
			.style("stroke-width","2px")   
		// tooltip.style("visibility", "hidden") 
	}

	function mouseOverFunction(d,i) {
		d3.select(this)
			.style("stroke-width","10px") 
		currentLabel = labels[i]
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

				if(d.id != d1.id) {
					return "0.60";
				}
			}) 

		d3.select(".filter-body").selectAll(".officeHourline")
			.style("stroke-width",function(d1,i1) {
				if(d.id != d1.id) {
					return "1.5px"
				} else {
					return "10px"
				}
			}) 
			// .style("stroke", "black")
				
		currentLabel = labels[i]
		getStackedBarData(currentLabel,filterCriteria)

	}

	function getSimpleDate(d) {
		var mm = d.getMonth() + 1; // getMonth() is zero-based
		var dd = d.getDate();
		return [d.getFullYear(),
						(mm>9 ? '' : '0') + mm,
						(dd>9 ? '' : '0') + dd
					 ].join('');
	};

	function getEventName(year) {
		var y = new Date(year)
		y.setHours( 0,0,0,0 )
		return calendarData[getSimpleDate(irregDatesToRegDates[y])]["description"] + " - "+y.getMonth()+"/"+y.getDay()+"/"+y.getFullYear()
	}

	function type(d, _, columns) {
		d.date = parseTime(d.date);
		for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
		return d;
	}

	// ----------------------------------------------------------------------------------------------
	// Reads in all the Events at the Irregular Dates and converts them to Regular Spaced Dates
	// The purpose of this conversion is to use it for DTW Clustering
	function convertIrregToReg(completeDateList,studentGradeData,calendarData) {

		var dataForVisualization = []
		var date_j = 0;
		completeDateList.forEach(function(date_i,i) {
				var element = {}
				irregDatesToRegDates[date_i] = parseTime(dateList[date_j])
				element["date"] = date_i
				if(date_i >= parseTime(dateList[date_j+1]-1)) {
					date_j = date_j + 1;
				}
				
				if(dateList[date_j] !== undefined) {
					var x = calendarData[dateList[date_j]].description
					for (var i = 0; i < studentGradeData.length; i++) {
						var username = studentGradeData[i]["Username"] 
						if(filteredSet.length===0 || filteredSet.includes(parseInt(username))) {
							element[username] = studentGradeData[i][x]
						}
					}

					dataForVisualization.push(element)  
				}
		})
		return dataForVisualization
	}

	// ----------------------------------------------------------------------------------------------
	// This function reads in the list of Dates from the events and creates a list of all the dates
	// between the first date and the last date
	// ----------------------------------------------------------------------------------------------
	function getCompleteDateList(dateList) {
		var date_i = dateList[0]
		dateSet = new Set()
		var completeDateList = []
		date_i_list.map(function(date_i,i) {
			if(parseTime(date_i) <= parseTime(dateList[dateList.length-1])) {
				if(!dateSet.has(parseTime(date_i).toString())) {
					dateSet.add(parseTime(date_i).toString())
					completeDateList.push(parseTime(date_i));
				}
			}	
		})
		
		return completeDateList
	}


	// ----------------------------------------------------------------------------------------------
	// 
	//   
	// ----------------------------------------------------------------------------------------------
	function kmeans(dataset,clusters,maxIterations,type) {

		numFeatures = dataset[0]["values"].map(function(d) {
			return d.date;
		})
		var centroids = getRandomCentroids(numFeatures, clusters, type)
		
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
				centroids = getCentroids(dataset, labels, clusters, type)
				
		// We can get the labels too by calling getLabels(dataset, centroids)
		}
		labelsOnBasisOfPerformance = labels
		return centroids
	}
	
	function getRandomCentroids(numFeatures, k, type) {
		var result = []
		for (var i = 0; i < k; i++) {
			result[i] = []
			numFeatures.map(function(d) {
				var x = {}
				var min = 0
				var max = 50
				x["date"] = d;
				x[type] = min+Math.random()*(max - min);
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
				var dist = (s1[i].scores - s2[j].scores)*(s1[i].scores - s2[j].scores)
				DTW[i][j] = dist + Math.sqrt(Math.min(DTW[i-1][j],DTW[i][j-1],DTW[i-1][j-1]));
			}
		}

		var result = Math.sqrt(DTW[s1.length-1][s2.length-1])
		return result
	}

	function EuclideanDistance(s1, s2) {
		var result = 0;

		for (var i = 0; i < s1.length; i++) {
			var x = (s1[i].scores - s2[i].scores)
			result +=  x*x; 
		}
		return Math.sqrt(result/s1.length)
	}

	function getCentroids(dataset, labels, k, type) {

		var keys = Object.keys(labels)
		var result = []
		quartilePreData = []
		
		for (var i = 0; i < k; i++) {
			quartilePreData[i] = {}
			numFeatures.map(function(d) {
					quartilePreData[i][d] = []
				})
		}

		for (var i = 0; i < k; i++) {
			//quartilePreData[i] = {}
			if(labels[i] == undefined) {
				result[i] = []
				numFeatures.map(function(d) {
					var x = {}
					x["date"] = d;
					x[type] = Math.random()*100;
					//quartilePreData[i][d] = []
					result[i].push(x)
				})

			} else {
				result[i] = []

				numFeatures.map(function(d,i1) {
					var x = {}
					x["date"] = d;
					var y = 1
					labels[i].forEach(function(d1) {
						y = y * dataset[d1]["values"][i1][type]
						quartilePreData[i][d].push(dataset[d1]["values"][i1][type])
					});
					x[type] = Math.pow(y,1/labels[i].length)
					result[i].push(x)
				})
			}
		}
		return result
	}

	function processQuartileData(quartile) {
		quartilePostData = []
		quartile.map(function(q) {
			numFeatures.map(function(date) {
				quartilePostData[date] = {}
				q[date].sort(function compareNumbers(a, b) {
					return a - b;
				})
				quartilePostData[date]["MAX"] = q[date][q[date].length-1]
				quartilePostData[date]["MIN"] = q[date][0]
				quartilePostData[date]["Median"] = q[date][Math.floor(q[date].length*0.5)-1]
				quartilePostData[date]["LQuartile"] = q[date][Math.floor(q[date].length*0.25)-1]
				quartilePostData[date]["HQuartile"] = q[date][Math.floor(q[date].length*0.75)-1]
				

			})
		})
	}

	function getRGBIndex(d) {
		for (var i = 0; i < Object.keys(labels).length; i++) {
			if(labels[Object.keys(labels)[i]].includes(d)) {
				return i
			}
		}
	}

	function findOptimalCluster(students, iterations) {
		// For Clusters ranging from 1 - 20, find the sum of square differences and store in a map
		var elbowMap = {}
		for (var i = 1; i <= 40; i++) {
			var clusters = kmeans(students,i,iterations)
			elbowMap[i] = calculateSumSquareDistance(clusters, students)
		}
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
			result = result + Math.sqrt(Math.abs(arr1[i].scores - arr2[i].scores))
		})
		return result
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

function getStackedBarData(currentLabel,filterCriteria) {
	var result = getQuartileData(currentLabel,filterCriteria)
	d3.selectAll(".serie").remove()
	d3.select(".stream-body").append("svg")
	// var svgStacked = d3.select(".stream-body").select("svg").attr("id","stacked"),
	//  margin = {top: 20, right: 80, bottom: 30, left: 50},
	//  width = +svg.attr("width") - margin.left - margin.right,
	//  height = +svg.attr("height") - margin.top - margin.bottom,
	
	g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	// d3.select(".serie").moveToBack();
	// d3.selectAll(".line").moveToFront();

	var x = d3.scaleTime().range([0, width])

	var y = d3.scaleLinear()
			.rangeRound([height, 0]);

	var z = d3.interpolateRdYlBu();
	var stack = d3.stack();
	data = result
	var columns = Object.keys(result[0])
	
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([0,110]);
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
		.attr("width", 10)
		

		// g.append("g")
		//  .attr("class", "axis axis--x")
		//  .attr("transform", "translate(0," + height + ")")
		//  .call(d3.axisBottom(x));

		// g.append("g")
		//  .attr("class", "axis axis--y")
		//  .call(d3.axisLeft(y).ticks(10, "s"))
		//  .append("text")
		//  .attr("x", 2)
		//  .attr("y", y(y.ticks(10).pop()))
		//  .attr("dy", "0.35em")
		//  .attr("text-anchor", "start")
		//  .attr("fill", "#000")
		//  .text("scores");

	// var legend = g.selectAll(".legend")
	//  .data(columns.slice(1).reverse())
	//  .enter().append("g")
	//  .attr("class", "legend")
	//  .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
	//  .style("font", "10px sans-serif");

	// legend.append("rect")
	//  .attr("x", width + 18)
	//  .attr("width", 18)
	//  .attr("height", 18)
	//  .attr("fill", z);

	// legend.append("text")
	//  .attr("x", width + 44)
	//  .attr("y", 9)
	//  .attr("dy", ".35em")
	//  .attr("text-anchor", "start")
	//  .text(function(d) { return d; });

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

function getDateIndex(completeDateList, date) {
	completeDateList.forEach(function(d,i) {
		if(x.getTime() == y.getTime()) {
			return i;
		}
	})
	return -1;
}

function getFilterData(labelsOnBasisOfPerformance) {

	var line = d3.line()
	.curve(d3.curveBasis)
	.x(function(d,i) {return x(d.date); })
	.y(function(d,i) {return y(d.hours); });

	d3.csv("data/tahours4.csv", type, function(error, TAdata) {
		if (error) throw error;

		var data = []
		columns.splice(1).forEach(function(studentID,id) {
			var object = {};
			object["id"] = studentID;
			object["values"] = [];
			object["values"] = date_i_list.map(function(date,i) {
				var x = date%100;
				var y = (date%10000-x)/100
				var z = 2017
				return {
					"date": new Date(z,y-1,x),
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
		

		var svg = d3.select(".filter-body").select("svg"),
			margin = {top: 20, right: 80, bottom: 30, left: 50},
			width = svg.attr("width") - margin.left - margin.right,
			height = svg.attr("height") - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var brush = d3.brush().on("end", brushended).extent([[0, 0], [width, height]]),
			idleTimeout,
			idleDelay = 10000;
		
		// data = clusterSimilarPerformingStudents(data, labelsOnBasisOfPerformance)
		var officeClusters = kmeans(data,clusters,maxiterations,"hours")
		var data = officeClusters.map(function(d,i) {
			return {
				id: "C"+i,
				values: d
			};
		})
		var officeHourData = data
		dataSecondary = data
		console.log(officeHourData)

  var data = [
  {date: new Date(2017, 1, 1), value: 93.24},
  {date: new Date(2017, 4, 15), value: 95.35}
];

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([
		d3.min(officeHourData, function(c) { return d3.min(c.values, function(d) { return d.hours; }); }),
		d3.max(officeHourData, function(c) { return d3.max(c.values, function(d) { return d.hours; }); })
  ]);
  z.domain(officeHourData.map(function(c,i) {return c.id; }));

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
		.text("hours");

  var officeHourDatum = g.selectAll(".officeHourDatum")
	.data(officeHourData)
	.enter().append("g")
	.attr("class", "officeHourDatum");

  officeHourDatum.append("path")
  .attr("class", "officeHourline")
  .attr("d", function(d) { return line(d.values); })
  .style("stroke", function(d) { return z(d.id); });

  officeHourDatum.append("text")
  .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
  .attr("transform", function(d) { console.log(d); return "translate(" + x(d.value.date) + "," + y(d.value.hours) + ")"; })
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
					if(d1.date > x0 && d1.date < x1 && d1.hours < y0 && d1.hours > y1) {
						set.add(i)
					}
				})
			})

			var result = Array.from(set);
			return result
		}

		function clusterSimilarPerformingStudents(data, labelsOnBasisOfPerformance) {
			var clusteredData = []
			var keys = Object.keys(labelsOnBasisOfPerformance)
			var result = []
			keys.map(function(labelIndex,i) {
				var object = {};
				var studentGroup = labelsOnBasisOfPerformance[labelIndex]
				var clusteredOfficeHourData = clusterOfficeHourData(studentGroup,data)
				object["id"] = "C"+i
				object["values"] = clusteredOfficeHourData
				result.push(object)
			})
			return result;
		}

		function clusterOfficeHourData(studentGroup, data) {
			result = data[0]["values"].map(function(d,i) {
				return {
					"date" : d["date"],
					"hours" : 0
				}
			})

			studentGroup.forEach(function(student) {
				data.forEach(function(tadata) {
					if(tadata["id"] == student) {
						tadata["values"].forEach(function(d,i) {
							result[i]["hours"] = result[i]["hours"] + (d["hours"]/studentGroup.length);
						})
					}
				})
			})
			return result;
		}
	});


}
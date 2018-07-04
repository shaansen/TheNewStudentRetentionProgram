var lineWidthOriginal = "1.5px";
var lineWidthOnHover = "3px";

var choices = new Set();

var svg = d3.select(".viz-body").select("svg"),
	margin = { top: 30, right: 80, bottom: 30, left: 50 },
	width = svg.attr("width") - margin.left - margin.right,
	height = svg.attr("height") - margin.top - margin.bottom,
	g = svg
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y%m%d%H%M");

var x = d3.scaleTime().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	z = d3.scaleOrdinal(d3.schemeCategory10);

var yellow = d3.interpolateYlGn(), // "rgb(255, 255, 229)"
	yellowGreen = d3.interpolateYlGn(0.5), // "rgb(120, 197, 120)"
	green = d3.interpolateYlGn(1); // "rgb(0, 69, 41)"

var cityline = d3
	.line()
	.x(function(d) {
		return x(d.date);
	})
	.y(function(d) {
		return y(d.temperature);
	});
// .curve(d3.curveBasis)

var filterLimits = {
	x0: new Date("December 17, 1995 03:24:00"),
	x1: new Date("December 17, 2995 03:24:00"),
	y0: 0,
	y1: 300
};

var circles = [];
var maxRadius;
var minRadius;
var tipBox;
var tooltip;
var completeDateList;
var dateSet;
var date_list;
var labelsOnBasisOfPerformance;
var tickOn = false;
var corrOn = false;
var distOn = false;
// -----------------------------------------------------------------------------------------
//
// Code to read Calendar and Map dates to events
//
// -----------------------------------------------------------------------------------------

// Calendar data contains the values of all the
// dates mapped to their events and the aggregate total score of the events till then
var calendarData = {};

// dateList contains the sequence of dates of events in an array
var dateList = [];
var longDateToShortDate = {};

// cTotal contains the accumulative total for all the events that have occured till that date
var cTotal = 0;

// this is the list of columns that need to be displayed in the visualization
var columns = ["date"];
var irregDatesToRegDates = [];
var quartilePreData;
var quartilePostData;
var numFeatures;
var boxplotdata;
var originalcityData;
var helpSeekingCSVdata = [];
var catWisecityData = [];
var cityWiseTAdata = [];
var choices = new Set();
var filterCriteria = [];
var currentLabel;
var listOfEvents = [
	"HW1",
	"LAB2",
	"OTHERS",
	"HW2",
	"HW3",
	"LAB3",
	"LAB4",
	"HW4",
	"LAB5",
	"PROJ1",
	"LAB6",
	"LAB7",
	"Midterm",
	"HW5",
	"LAB8",
	"PROJ2",
	"LAB9",
	"HW6",
	"LAB10",
	"PROJ3",
	"LAB13"
];
var hourSpent = {
	1: "< 5 minutes",
	2: "6 - 15 minutes",
	3: "16 - 30 minutes",
	4: "31 - 60 minutes",
	5: "> 60 minutes",
	6: "Not Attended"
};

var filteredSet = [];

mainFunction();

function mainFunction() {
	// Below code basically parses the cityGrade data to create normalized temperature of the cities till that date
	d3.csv("data/temperature/temperature5.csv", type, function(
		error,
		cityGradeData
	) {
		if (error) throw error;

		data = cityGradeData;
		date_list = data.map(function(d, i) {
			return d.date;
		});

		cities = cityGradeData.columns.slice(1).map(function(id) {
			return {
				id: id,
				values: data.map(function(d) {
					return { date: d.date, temperature: d[id] };
				})
			};
		});

		clusters = 4;
		maxiterations = 1000;
		numFeatures = cities[0]["values"].map(function(d) {
			return d.date;
		});

		// K-MEANS CLUSTERING
		cityClusters = kmeans(cities, clusters, maxiterations);

		// HIERARCHICAL CLUSTERING
		// labelsOnBasisOfPerformance = hierarch(cities,DTWDistance, clusters)
		// cityClusters = getCentroids(cities, labelsOnBasisOfPerformance, clusters)

		// findOptimalClusterUsingElbow(cities, maxiterations)
		// findOptimalClusterUsingSil(cities, maxiterations)
		// calculateSumSquareDistance(cityClusters,cities)

		var clusteredData = cityClusters.map(function(d, i) {
			return {
				id: "C" + i,
				values: d
			};
		});

		originalcityData = cities;
		cities = clusteredData;

		if (
			getFilterData &&
			typeof getFilterData == "function" &&
			initializePanel &&
			typeof initializePanel == "function"
		) {
			getFilterData(
				labelsOnBasisOfPerformance,
				data,
				cities,
				getLineData
			);
			initializePanel();
		}
	});
}

function initializePanel() {
	d3.selectAll(".tick").text("Ticks ON");
	d3.selectAll(".corr").text("Correlation ON");
	d3.selectAll(".dist").text("Distribution ON");
	enableNavFilters();
}

function toggleTick() {
	if (!tickOn) {
		d3.selectAll(".tickText").text("Ticks ON");
		enableTicks();
	} else {
		d3.selectAll(".tickText").text("Ticks OFF");
		disableTicks();
	}
	tickOn = !tickOn;
}

function disableTicks() {
	d3.selectAll(".pillars").remove();
	d3.selectAll(".pillar-text").remove();
}

function enableTicks() {
	var svg = d3.select(".viz-body").select("svg"),
		g = svg
			.append("g")
			.attr(
				"transform",
				"translate(" + margin.left + "," + margin.top + ")"
			);

	var pillars = g
		.selectAll(".pillars")
		.data(dateList)
		.enter();

	pillars
		.append("rect")
		.attr("class", "pillars")
		.attr("x", function(d, i) {
			var temp = parseTime(d);
			return x(temp);
		})
		.attr("y", "10")
		.attr("width", 1)
		.attr("height", height);

	var text = g
		.selectAll(".pillar-text")
		.data(dateList)
		.enter();

	text.append("text")
		.attr("class", "pillar-text")
		.attr("x", "10px")
		.attr("y", "10px")
		.text(function(d) {
			return calendarData[d]["description"];
		})
		.attr("transform", function(d, i) {
			return "translate(" + x(parseTime(d)) + ") rotate(45 10 0)";
		})
		.attr("text-anchor", "end")
		.attr("font-size", "10px");

	pillars.exit().remove();
	text.exit().remove();
}

function toggleDist() {
	if (!distOn) {
		d3.selectAll(".distText").text("Distribution ON");
		// enableDistribution();
	} else {
		d3.selectAll(".distText").text("Distribution OFF");
		disableDistribution();
	}
	distOn = !distOn;
	getFilterData;
}

function disableDistribution() {
	d3.selectAll(".serie").remove();
	d3.selectAll(".enter").remove();
}

function toggleCorr() {
	if (!corrOn) {
		d3.selectAll(".corrText").text("Correlation ON");
		// enableCorrelation();
	} else {
		d3.selectAll(".corrText").text("Correlation OFF");
		disableCorrelation();
	}
	corrOn = !corrOn;
	getFilterData;
}

function enableNavFilters() {
	var data = Object.keys(labelsOnBasisOfPerformance);
	/*  d3.select(".navfilter-body").select(".navfilter-body-svg").selectAll(".navbarElements").remove();
  var navbarElements = d3.select(".navfilter-body").select(".navfilter-body-svg").selectAll(".navbarElements")
  .data(data)
  .enter().append("g")
  .attr("class", "navbarElements")
  navbarElements.append("rect")
  .attr("class", "navbarRects")
  .attr("width","11px")
  .attr("height","11px")
  .style("fill",function(d,i) {
    return z(i);
  })
  .attr("x","20px")
  .attr("y",function(d,i) {
    return (i*20);
  })
  
  navbarElements.append("text")
  .attr("class","navbarTexts")
  .text(function(d,i) {
    return "Cluster-"+i+" #"+labelsOnBasisOfPerformance[d].length
  })
  .attr("x","40px")
  .attr("y",function(d,i) {
    return (i*20)+10;
  })
  
  navbarElements.exit().remove();*/

	var svg = d3
		.select(".navfilter-body")
		.append("svg")
		.attr("width", "160px")
		.attr("height", "220px")
		.append("g")
		.attr("transform", "translate(" + 10 + "," + 10 + ")");

	var width = 10;

	var legend = svg
		.selectAll(".navbarElements")
		.data(data)
		.enter()
		.append("g")
		.attr("class", "navbarElements")
		.attr("transform", function(d, i) {
			return "translate(0," + i * 20 + ")";
		});

	legend
		.append("rect")
		.attr("class", "navbarRects")
		.attr("x", width - 10)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", function(d, i) {
			return z(i);
		});

	legend
		.append("text")
		.attr("class", "navbarTexts")
		.attr("x", width + 20)
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "start")
		.text(function(d, i) {
			return "Cluster-" + i + " #" + labelsOnBasisOfPerformance[d].length;
		});

	legend.exit().remove();
}

function enableCorrelation() {
	/*var svg = d3.select(".viz-body").select("svg"),
    g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  d3.selectAll(".officeHourDots").remove();
  d3.selectAll(".officecircles").remove();
  var officeHourDots = g
    .selectAll(".officeHourDots")
    .data(circles)
    .enter()
    .append("g")
    .attr("class", "officeHourDots");
  // officeHourDots.append("circle")
  // .attr("class", "officecircles")
  // .attr("cx", function(d) { return d[1]; })
  // .attr("cy", function(d) { return d[2]; })
  // .attr("r", function(d) { return d[5]/7; })
  // .style("fill",  function(d) {return z(d[0]); })
  // .style("fill-opacity", "0.75")
  officeHourDots
    .append("circle")
    .attr("class", "officecircles")
    .attr("cx", function(d) {
      return d[1];
    })
    .attr("cy", function(d) {
      return d[2];
    })
    .attr("r", function(d) {
      return (20 * d[3]) / maxRadius;
    })
    .style("fill", function(d, i) {
      return z(d[0]);
    })
    .style("fill-opacity", "0.50")
  officeHourDots.exit().remove();
  // officeHourDots.append("circle")
  // .attr("class", "officecircles")
  // .attr("cx", function(d) { return d[1]; })
  // .attr("cy", function(d) { return d[2]; })
  // .attr("r", function(d) { return d[4]/7; })
  // .style("fill",  function(d) {return z(d[0]); })
  // .style("fill-opacity", "1")
  // officeHourDots.append("circle")
  // .attr("class", "officecircles")
  // .attr("cx", function(d) { return d[1]; })
  // .attr("cy", function(d) { return d[2]; })
  // .attr("r", function(d) { return 15*d[3]/maxRadius; })
  // .style("fill",  function(d) {return z(d[0]); })
  // officeHourDots.append("circle")
  // .attr("class", "officecircles")
  // .attr("cx", function(d) { return d[1]; })
  // .attr("cy", function(d) { return d[2]; })
  // .attr("r", function(d) { return 15*d[3]/maxRadius; })
  // .style("fill",  function(d) {return z(d[0]); })*/
}

function disableCorrelation() {
	d3.selectAll(".officeHourDots").remove();
	d3.selectAll(".officecircles").remove();
}

function mouseOutLine() {
	d3.select(".viz-body")
		.selectAll(".line")
		.style("stroke-opacity", function(d1, i1) {
			return "1";
		});

	d3.select(".filter-body")
		.selectAll(".officeHourline")
		.style("stroke-width", function(d1, i1) {
			return lineWidthOriginal;
		})
		.style("stroke-opacity", "1");

	d3.select(".filter-body")
		.selectAll(".officeHourlineMin")
		.style("stroke-width", function(d1, i1) {
			return "0.5px";
		})
		.style("stroke-opacity", "0.5");

	d3.select(".filter-body")
		.selectAll(".officeHourlineMax")
		.style("stroke-width", function(d1, i1) {
			return "0.5px";
		})
		.style("stroke-opacity", "0.5");

	d3.select(this).style("stroke-width", lineWidthOriginal);
	// tooltip.style("visibility", "hidden")

	d3.selectAll(".navbarRects").attr("width", "18px");

	d3.selectAll(".navbarTexts").attr("font-weight", "normal");

	d3.selectAll(".navbarTexts").attr("fill", "black");
}

d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
		this.parentNode.appendChild(this);
	});
};
d3.selection.prototype.moveToBack = function() {
	return this.each(function() {
		var firstChild = this.parentNode.firstChild;
		if (firstChild) {
			this.parentNode.insertBefore(this, firstChild);
		}
	});
};

function mouseOverLine(d, i) {
	if (corrOn) {
		d3.selectAll(".officecircles")
			.filter(function(d1, i1) {
				return d1[0] == i;
			})
			.style("fill-opacity", "1")
			.style("stroke", function(d, i) {
				return "black";
			});
	}

	d3.select(".viz-body")
		.selectAll(".line")
		.style("stroke-opacity", function(d1, i1) {
			if (d.id != d1.id) {
				return "0.05";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourline")
		.style("stroke-width", function(d1, i1) {
			if (d.id != d1.id) {
				return lineWidthOriginal;
			} else {
				return lineWidthOnHover;
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (d.id != d1.id) {
				return "0.05";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourlineMin")
		.style("stroke-width", function(d1, i1) {
			if (d.id != d1.id) {
				return "0.5px";
			} else {
				return "4px";
			}
			mouseOver;
		})
		.style("stroke-opacity", function(d1, i1) {
			if (d.id != d1.id) {
				return "0.05";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourlineMax")
		.style("stroke-width", function(d1, i1) {
			if (d.id != d1.id) {
				return "0.5px";
			} else {
				return "4px";
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (d.id != d1.id) {
				return "0.05";
			}
		});

	d3.selectAll(".navbarRects")
		.transition()
		.attr("width", function(d1, i1) {
			if (d1 != i) {
				return "18px";
			} else {
				return "160px";
			}
		});

	d3.selectAll(".navbarTexts")
		.transition()
		.attr("font-weight", function(d1, i1) {
			if (d1 != i) {
				return "normal";
			} else {
				return "bold";
			}
		})
		.attr("fill", function(d1, i1) {
			if (d1 != i) {
				return "black";
			} else {
				return "white";
			}
		});

	// .style("stroke", "black")

	d3.select(this)
		.style("stroke-width", lineWidthOnHover)
		.moveToFront();
	currentLabel = labelsOnBasisOfPerformance[i];
}

function mouseMoveOnLine() {
	/*  var year = x.invert(d3.mouse(this)[0]);
  var y = getEventName(year);
  tooltip
    .style("top", event.pageY - 30 + "px")
    .style("visibility", "visible")
    .style("left", event.pageX - 50 + "px")
    .text(y)
    .style("background-color", "grey")
    .style("padding", "5px 5px 5px 5px")
    .style("color", "white")
    .style("font-family", "Cabin")
    .style("font-size", "11px");*/
}

function clickOnLine(d, i) {
	d3.select(".reason-body")
		.selectAll("h4")
		.remove();
	d3.select(".reason-body")
		.selectAll("ul")
		.remove();

	currentLabel = labelsOnBasisOfPerformance[i];
	getTextValues(currentLabel, i);
	if (distOn) getStackedBarData(currentLabel, filterCriteria);
	if (corrOn) selectALineToViewOHData(i);
}

function selectALineToViewOHData(currentLabel) {
	getIntegratedCircles(currentLabel);
	// fillUpTheOHArea(currentLabel);
}

function getIntegratedCircles(currentLabel) {
	console.log(circles);

	var svg = d3.select(".viz-body").select("svg"),
		g = svg
			.append("g")
			.attr(
				"transform",
				"translate(" + margin.left + "," + margin.top + ")"
			);

	d3.selectAll(".officeHourDots").remove();
	d3.selectAll(".officecircles").remove();

	var officeHourDots = g
		.selectAll(".officeHourDots")
		.data(circles)
		.enter()
		.append("g")
		.attr("class", "officeHourDots");

	// officeHourDots.append("circle")
	// .attr("class", "officecircles")
	// .attr("cx", function(d) { return d[1]; })
	// .attr("cy", function(d) { return d[2]; })
	// .attr("r", function(d) { return d[5]/7; })
	// .style("fill",  function(d) {return z(d[0]); })
	// .style("fill-opacity", "0.75")

	officeHourDots
		.append("circle")
		.filter(function(d, i) {
			console.log(d[0], currentLabel);
			return d[0] == currentLabel;
		})
		.attr("class", "officecircles")
		.attr("cx", function(d, i) {
			return d[1];
		})
		.attr("cy", function(d) {
			return d[2];
		})
		.attr("r", function(d) {
			return (10 * (d[3] - minRadius)) / maxRadius;
		})
		.style("fill", function(d, i) {
			return z(d[0]);
		})
		.style("fill-opacity", "1")
		.style("stroke", function(d, i) {
			return "black";
		});
	// // .style("fill-opacity", "0.50");

	// officeHourDots
	// 	.append("circle")
	// 	.filter(function(d, i) {
	// 		return d[0] == currentLabel;
	// 	})
	// 	.attr("class", "officecircles")
	// 	.attr("cx", function(d, i) {
	// 		return d[1];
	// 	})
	// 	.attr("cy", function(d) {
	// 		return d[2];
	// 	})
	// 	.attr("r", function(d) {
	// 		if (d[3] != 0) return (20 * d[3]) / maxRadius + 4;
	// 		else return 0;
	// 	})
	// 	.style("fill", "none")
	// 	.style("stroke", "black");

	officeHourDots.exit().remove();

	// officeHourDots.append("circle")
	// .attr("class", "officecircles")
	// .attr("cx", function(d) { return d[1]; })
	// .attr("cy", function(d) { return d[2]; })
	// .attr("r", function(d) { return d[4]/7; })
	// .style("fill",  function(d) {return z(d[0]); })
	// .style("fill-opacity", "1")

	// officeHourDots.append("circle")
	// .attr("class", "officecircles")
	// .attr("cx", function(d) { return d[1]; })
	// .attr("cy", function(d) { return d[2]; })
	// .attr("r", function(d) { return 15*d[3]/maxRadius; })
	// .style("fill",  function(d) {return z(d[0]); })

	// officeHourDots.append("circle")
	// .attr("class", "officecircles")
	// .attr("cx", function(d) { return d[1]; })
	// .attr("cy", function(d) { return d[2]; })
	// .attr("r", function(d) { return 15*d[3]/maxRadius; })
	// .style("fill",  function(d) {return z(d[0]); })
}

function getTextValues(label, index) {
	d3.select(".text-body").style("border", "1px solid black");

	var text = d3.select(".text-body-cluster-description");

	text.text("Cluster Size : " + label.length);

	var text = d3
		.select(".text-body-cluster-content")
		.selectAll("text")
		.data(label);

	text.attr("class", "update");
	text.text("User IDs within this cluster : ").merge(text);
	text.enter()
		.append("text")
		.attr("class", "enter")
		.attr("x", function(d, i) {
			return i * 32;
		})
		.attr("dy", ".35em")
		.merge(text)
		.text(function(d) {
			return originalcityData[d]["id"] + ", ";
		});
	text.exit().remove();
}

function getSimpleDate(d) {
	var mm = d.getMonth() + 1; // getMonth() is zero-based
	var dd = d.getDate();
	return [
		d.getFullYear(),
		(mm > 9 ? "" : "0") + mm,
		(dd > 9 ? "" : "0") + dd
	].join("");
}

function getEventName(year) {
	var y = new Date(year);
	y.setHours(0, 0, 0, 0);
	var event =
		" - " + (y.getMonth() + 1) + "/" + y.getDay() + "/" + y.getFullYear();
	return (
		calendarData[getSimpleDate(irregDatesToRegDates[y])]["description"] +
		event
	);
}

function type(d, _, columns) {
	d.date = parseTime(d.date);
	for (var i = 1, n = columns.length, c; i < n; ++i)
		d[(c = columns[i])] = +d[c];
	return d;
}

// ----------------------------------------------------------------------------------------------
// Reads in all the Events at the Irregular Dates and converts them to Regular Spaced Dates
// The purpose of this conversion is to use it for DTW Clustering
function convertIrregToReg(completeDateList, cityGradeData, calendarData) {
	var dataForVisualization = [];
	var date_j = 0;
	completeDateList.forEach(function(date_i, i) {
		var element = {};
		irregDatesToRegDates[date_i] = parseTime(dateList[date_j]);
		element["date"] = date_i;
		if (date_i >= parseTime(dateList[date_j + 1] - 1)) {
			date_j = date_j + 1;
		}

		if (dateList[date_j] !== undefined) {
			var x = calendarData[dateList[date_j]].description;
			for (var i = 0; i < cityGradeData.length; i++) {
				var username = cityGradeData[i]["Username"];
				if (
					filteredSet.length === 0 ||
					filteredSet.includes(parseInt(username))
				) {
					element[username] = cityGradeData[i][x];
				}
			}

			dataForVisualization.push(element);
		}
	});
	return dataForVisualization;
}

// ----------------------------------------------------------------------------------------------
//
//
// ----------------------------------------------------------------------------------------------
function kmeans(dataset, clusters, maxIterations) {
	var centroids = getRandomCentroids(numFeatures, clusters);

	// Initialize book keeping vars.
	iterations = 0;
	oldCentroids = null;

	while (
		iterations <= maxIterations &&
		!compareCentroidsTo(centroids, oldCentroids)
	) {
		// Save old centroids for convergence test. Book keeping.
		oldCentroids = centroids;
		iterations = iterations + 1;
		// Assign labels to each datapoint based on centroids

		labels = getLabels(dataset, centroids);
		// Assign centroids based on datapoint labels
		centroids = getCentroids(dataset, labels, clusters);
		// We can get the labels too by calling getLabels(dataset, centroids)
	}

	labelsOnBasisOfPerformance = labels;

	return centroids;
}

function getRandomCentroids(numFeatures, k) {
	var result = [];
	for (var i = 0; i < k; i++) {
		result[i] = [];
		numFeatures.map(function(d) {
			var x = {};

			x["date"] = d;
			x["temperature"] = 40;
			result[i].push(x);
		});
	}
	return result;
}

function compareCentroidsTo(centroids, oldCentroids) {
	return _.isEqual(centroids, oldCentroids);
}

function getLabels(dataset, centroids) {
	var result = [];
	var labelSet = {};
	for (var id = 0; id < dataset.length; id++) {
		var min = Infinity;
		for (var j = 0; j < centroids.length; j++) {
			// var dist = EuclideanDistance(dataset[id]["values"],centroids[j])
			var dist = DTWDistance(dataset[id]["values"], centroids[j]);
			// var dist = ManhattanDistance(dataset[id]["values"],centroids[j])
			// var dist = MinkowskiDistance(dataset[id]["values"],centroids[j],10)
			// var dist = ChebyshevDistance(dataset[id]["values"],centroids[j])

			if (dist < min) {
				min = dist;
				result[id] = j;
			}
		}
		if (labelSet[result[id]] == undefined) {
			labelSet[result[id]] = [];
		}
		labelSet[result[id]].push(id);
	}

	for (var j = 0; j < centroids.length; j++) {
		if (labelSet[j] == undefined) {
			labelSet[j] = [];
		}
	}

	return labelSet;
}

function DTWDistance(s1, s2) {
	var DTW = [];
	for (var i = 0; i < s1.length; i++) {
		DTW[i] = {};
		for (var j = 0; j < s2.length; j++) {
			DTW[i][j] = 0;
		}
	}
	for (var i = 1; i < s1.length; i++) {
		DTW[i][0] = Infinity;
	}
	for (var i = 1; i < s2.length; i++) {
		DTW[0][i] = Infinity;
	}

	for (var i = 1; i < s1.length; i++) {
		for (var j = 1; j < s2.length; j++) {
			var dist =
				(s1[i].temperature - s2[j].temperature) *
				(s1[i].temperature - s2[j].temperature);
			DTW[i][j] =
				dist +
				Math.sqrt(
					Math.min(DTW[i - 1][j], DTW[i][j - 1], DTW[i - 1][j - 1])
				);
		}
	}

	var result = Math.sqrt(DTW[s1.length - 1][s2.length - 1]);
	return result;
}

function EuclideanDistance(s1, s2) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x = s1[i].temperature - s2[i].temperature;
		result += x * x;
	}
	return Math.sqrt(result);
}

function ManhattanDistance(s1, s2) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x =
			s1[i].temperature - s2[i].temperature >= 0
				? s1[i].temperature - s2[i].temperature
				: -(s1[i].temperature - s2[i].temperature);
		result += x;
	}
	return result;
}

function MinkowskiDistance(s1, s2, p) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x =
			s1[i].temperature - s2[i].temperature >= 0
				? s1[i].temperature - s2[i].temperature
				: -(s1[i].temperature - s2[i].temperature);
		x = Math.log(x) / p;
		x = Math.exp(x);
		result += x;
	}
	return Math.exp(result, p);
}

function ChebyshevDistance(s1, s2) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x =
			s1[i].temperature - s2[i].temperature >= 0
				? s1[i].temperature - s2[i].temperature
				: -(s1[i].temperature - s2[i].temperature);

		result = Math.max(x, result);
	}
	return result;
}

function getCentroids(dataset, labels, k) {
	var keys = Object.keys(labels);
	var result = [];

	for (var i = 0; i < k; i++) {
		if (labels[i].length == 0) {
			result[i] = [];
			numFeatures.map(function(d) {
				var x = {};
				x["date"] = d;
				x["temperature"] = 40;
				result[i].push(x);
			});
		} else {
			result[i] = [];
			numFeatures.forEach(function(d, i1) {
				var x = {};
				x["date"] = d;
				// var y = 1 // Using Multiplication
				var y = 0; // Using log in place of multiplication
				labels[i].forEach(function(d1) {
					y = y + Math.log(dataset[d1]["values"][i1]["temperature"]);
				});
				x["temperature"] = Math.exp(y / labels[i].length);
				result[i].push(x);
			});
		}
	}
	return result;
}

function processQuartileData(quartile) {
	quartilePostData = [];
	quartile.map(function(q) {
		numFeatures.map(function(date) {
			quartilePostData[date] = {};
			q[date].sort(function compareNumbers(a, b) {
				return a - b;
			});
			quartilePostData[date]["MAX"] = q[date][q[date].length - 1];
			quartilePostData[date]["MIN"] = q[date][0];
			quartilePostData[date]["Median"] =
				q[date][Math.floor(q[date].length * 0.5) - 1];
			quartilePostData[date]["LQuartile"] =
				q[date][Math.floor(q[date].length * 0.25) - 1];
			quartilePostData[date]["HQuartile"] =
				q[date][Math.floor(q[date].length * 0.75) - 1];
		});
	});
}

function getRGBIndex(d) {
	for (var i = 0; i < Object.keys(labels).length; i++) {
		if (labels[Object.keys(labels)[i]].includes(d)) {
			return i;
		}
	}
}

function findOptimalClusterUsingElbow(cities, iterations) {
	var elbowMap = {};
	for (var i = 1; i <= 15; i++) {
		var clusters = kmeans(cities, i, iterations);
		elbowMap[i] = calculateSumSquareDistance(clusters, cities);
	}
}

function findOptimalClusterUsingSil(cities, iterations) {
	var silMap = {};
	for (var i = 1; i <= 10; i++) {
		var clusters = kmeans(cities, i, iterations);
		silMap[i] = calculateSilhouette(
			clusters,
			cities,
			labelsOnBasisOfPerformance
		);
	}
}

function calculateSilhouette(clusters, cities, labels) {
	var result = 0;
	var plot = [];
	Object.keys(labels).forEach(function(d, i) {
		var a = calculateSilhouetteForOneClusterA(clusters, cities, labels[d]);
		var b = calculateSilhouetteForOneClusterB(clusters, cities, labels, d);
		var s = a.map(function(d, i) {
			if (d < b[i]) {
				return 1 - d / b[i];
			} else if (d > b[i]) {
				return b[i] / d - 1;
			} else {
				return 0;
			}
		});
		plot[i] = _.sum(s) / s.length;
		result = result + plot[i];
	});

	return result / Object.keys(labels).length;
}

function calculateSilhouetteForOneClusterA(clusters, cities, label) {
	var a = [];
	label.forEach(function(d1, i1) {
		a[i1] = 0;
		label.forEach(function(d2, i2) {
			if (i1 != i2) {
				a[i1] =
					a[i1] +
					getScoreDifferenceForSilhouette(
						cities[d1]["values"],
						cities[d2]["values"]
					) /
						label.length;
			}
		});
	});
	return a;
}

function calculateSilhouetteForOneClusterB(clusters, cities, labels, key) {
	var a = [];
	labels[key].forEach(function(d1, i1) {
		a[i1] = Infinity;
		Object.keys(labels).forEach(function(d2, i2) {
			var x = 0;
			if (d2 != key) {
				var label = labels[d2];
				label.forEach(function(d3, i3) {
					x =
						x +
						getScoreDifferenceForSilhouette(
							cities[d1]["values"],
							cities[d3]["values"]
						) /
							label.length;
				});
				if (a[i1] > x) {
					a[i1] = x;
				}
			}
		});
	});

	return a;
}

function getScoreDifferenceForSilhouette(score1, score2) {
	var difference = 0;
	score1.forEach(function(d, i) {
		var stuffToAdd = score1[i]["temperature"] - score2[i]["temperature"];
		stuffToAdd = stuffToAdd >= 0 ? stuffToAdd : -stuffToAdd;
		difference = difference + stuffToAdd;
	});
	return difference;
}

function calculateSumSquareDistance(clusters, cityData) {
	var label_iterator = Object.keys(labels);
	var x = 0;
	label_iterator.forEach(function(d, i1) {
		labels[d].forEach(function(e, i2) {
			x =
				x +
				getSquareDifference(d, e, cityData[e]["values"], clusters[i1]);
		});
	});
	return x;
}

function getSquareDifference(i1, i2, arr1, arr2) {
	var result = 0;
	arr1.forEach(function(d, i) {
		result =
			result +
			Math.sqrt(Math.abs(arr1[i].temperature - arr2[i].temperature));
	});
	return result;
}

function getQuartileData(indexes, filterCriteria) {
	result = [];
	var inter = {};
	numFeatures.forEach(function(d, i) {
		inter[d] = [];
	});

	var x0 = filterLimits["x0"];
	var x1 = filterLimits["x1"];
	var y0 = filterLimits["y0"];
	var y1 = filterLimits["y1"];

	originalcityData.forEach(function(d, i) {
		if (
			filterCriteria != undefined &&
			indexes.includes(i) &&
			(filterCriteria.length == 0 || filterCriteria.includes(i))
		) {
			d.values.forEach(function(d1, i1) {
				inter[d1.date].push(d1.temperature);
			});
		}
	});

	numFeatures.forEach(function(d, i) {
		inter[d].sort(function(a, b) {
			return a - b;
		});
		var resultElement = {};
		resultElement["date"] = d;
		resultElement["min"] = inter[d][0];
		resultElement["fquartile"] =
			inter[d][Math.floor(indexes.length * 0.25)] - inter[d][0];
		resultElement["median"] =
			inter[d][Math.floor(indexes.length * 0.5)] -
			inter[d][Math.floor(indexes.length * 0.25)];
		resultElement["tquartile"] =
			inter[d][Math.floor(indexes.length * 0.75)] -
			inter[d][Math.floor(indexes.length * 0.5)];
		resultElement["max"] =
			inter[d][indexes.length - 1] -
			inter[d][Math.floor(indexes.length * 0.75)];
		result.push(resultElement);
	});

	return result;
}

function getStackedBarData(currentLabel, filterCriteria) {
	var result = getQuartileData(currentLabel, filterCriteria);
	d3.selectAll(".serie").remove();
	d3.select(".stream-body").append("svg");
	// var svgStacked = d3.select(".stream-body").select("svg").attr("id","stacked"),
	//  margin = {top: 20, right: 80, bottom: 30, left: 50},
	//  width = +svg.attr("width") - margin.left - margin.right,
	//  height = +svg.attr("height") - margin.top - margin.bottom,

	g = svg
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	// d3.select(".serie").moveToBack();
	// d3.selectAll(".line").moveToFront();

	var x = d3.scaleTime().range([0, width]);

	var y = d3.scaleLinear().rangeRound([height, 0]);

	var z = d3.interpolateRdYlBu();
	var stack = d3.stack();
	data = result;
	var columns = Object.keys(result[0]);

	x.domain(
		d3.extent(data, function(d) {
			return d.date;
		})
	);
	// y.domain([
	// 	d3.min(cities, function(c) {
	// 		return d3.min(c.values, function(d) {
	// 			return d.temperature;
	// 		});
	// 	}),
	// 	d3.max(cities, function(c) {
	// 		return d3.max(c.values, function(d) {
	// 			return d.temperature;
	// 		});
	// 	})
	// ]);
	y.domain([0, 80]);
	g.selectAll(".serie")
		.data(stack.keys(columns.slice(1))(data))
		.enter()
		.append("g")
		.attr("class", "serie")
		.attr("fill", function(d, i) {
			return getRectangleColors(i);
		})
		.attr("fill-opacity", "0.5")
		.selectAll("rect")
		.data(function(d) {
			return d;
		})
		.enter()
		.append("rect")
		.attr("x", function(d) {
			return x(d.data.date);
		})
		.attr("y", function(d) {
			return y(d[1]);
		})
		.attr("height", function(d) {
			return y(d[0]) - y(d[1]);
		})
		.attr("width", 2);

	function type(d, i, columns) {
		for (i = 1, t = 0; i < columns.length; ++i)
			t += d[columns[i]] = +d[columns[i]];
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
	completeDateList.forEach(function(d, i) {
		if (x.getTime() == y.getTime()) {
			return i;
		}
	});
	return -1;
}

function getFilterData(
	labelsOnBasisOfPerformance,
	originalData,
	cities,
	getLineData
) {
	var x = d3.scaleTime().range([0, width]),
		y = d3.scaleLinear().range([height, 0]),
		z = d3.scaleOrdinal(d3.schemeCategory10);

	var line1 = d3
		.line()
		.x(function(d, i) {
			return x(d.date);
		})
		.y(function(d, i) {
			return y(d.hours);
		});

	var line2 = d3
		.line()
		.x(function(d, i) {
			return x(d.date);
		})
		.y(function(d, i) {
			return y(d.min);
		});

	var line3 = d3
		.line()
		.x(function(d, i) {
			return x(d.date);
		})
		.y(function(d, i) {
			return y(d.max);
		});

	d3.csv("data/temperature/humidity.csv", type, function(error, TAdata) {
		if (error) throw error;

		var data = [];
		var columns = TAdata.columns.splice(1);

		columns.forEach(function(cityName, cityIndex) {
			var object = {
				id: cityName,
				values: []
			};
			TAdata.forEach(function(d, i) {
				object["values"].push({
					date: d.date,
					hours: d[cityName]
				});
			});
			data.push(object);
		});

		var svg = d3.select(".filter-body").select("svg"),
			margin = { top: 30, right: 80, bottom: 30, left: 50 },
			width = svg.attr("width") - margin.left - margin.right,
			height = svg.attr("height") - margin.top - margin.bottom,
			g = svg
				.append("g")
				.attr(
					"transform",
					"translate(" + margin.left + "," + margin.top + ")"
				);

		// var brush = d3.brush().on("end", brushended).extent([[0, 0], [width, height]]),
		// 	idleTimeout,
		// 	idleDelay = 10000;

		data = clusterSimilarPerformingcities(data, labelsOnBasisOfPerformance);
		var officeHourData = data;
		var dataSecondary = data;
		console.log(data);

		var data = [
			{ date: new Date(date_list[0]), value: 93.24 },
			{ date: new Date(date_list[date_list.length - 1]), value: 95.35 }
		];

		x.domain(
			d3.extent(data, function(d) {
				return d.date;
			})
		);
		y.domain([
			d3.min(officeHourData, function(c) {
				return d3.min(c.values, function(d) {
					return d.min;
				});
			}),
			d3.max(officeHourData, function(c) {
				return d3.max(c.values, function(d) {
					return d.max;
				});
			})
		]);
		// z.domain(officeHourData.map(function(c,i) {return c.id; }));

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
			.text("humidity (%)");

		var officeHourDatum = g
			.selectAll(".officeHourDatum")
			.data(officeHourData)
			.enter()
			.append("g")
			.attr("class", "officeHourDatum");

		d3.selectAll(".officeHourline").remove();
		officeHourDatum
			.append("path")
			.attr("class", "officeHourline")
			.attr("d", function(d) {
				return line1(d.values);
			})
			.style("stroke", function(d, i) {
				return z(i);
			})
			.style("stroke-width", "1.5px")
			.on("mouseover", mouseOverLine)
			.on("mouseout", mouseOutLine)
			.on("mousemove", mouseMoveOnLine)
			.on("click", clickOnLine);

		officeHourDatum.exit().remove();

		officeHourDatum
			.append("path")
			.attr("class", "officeHourlineMin")
			.attr("d", function(d) {
				return line2(d.values);
			})
			.style("stroke", function(d, i) {
				return z(i);
			})
			.style("stroke-width", "0.5px")
			.style("stroke-dasharray", "5")
			.on("mouseover", mouseOverLine)
			.on("mouseout", mouseOutLine)
			.on("mousemove", mouseMoveOnLine)
			.on("click", clickOnLine);

		officeHourDatum
			.append("path")
			.attr("class", "officeHourlineMax")
			.attr("d", function(d) {
				return line3(d.values);
			})
			.style("stroke", function(d, i) {
				return z(i);
			})
			.style("stroke-width", "0.5px")
			.style("stroke-dasharray", "5")
			.on("mouseover", mouseOverLine)
			.on("mouseout", mouseOutLine)
			.on("mousemove", mouseMoveOnLine)
			.on("click", clickOnLine);

		officeHourDatum
			.append("text")
			.datum(function(d) {
				return { id: d.id, value: d.values[d.values.length - 1] };
			})
			.attr("transform", function(d) {
				return (
					"translate(" +
					x(d.value.date) +
					"," +
					y(d.value.hours) +
					")"
				);
			})
			.attr("x", 3)
			.attr("dy", "0.35em")
			.style("font", "10px sans-serif")
			.text(function(d) {
				return d.id;
			});

		if (getLineData && typeof getLineData == "function") {
			getLineData(originalData, cities, dataSecondary);
		}
	});
}

function brushended() {
	var s = d3.event.selection;
	if (!s) {
		if (!idleTimeout) return (idleTimeout = setTimeout(idled, idleDelay));
		// x.domain(x0);
		// y.domain(y0);
	} else {
		var x0 = x.invert(s[0][0]);
		var x1 = x.invert(s[1][0]);
		x0.setHours(x0.getHours() - 12);
		x1.setHours(x1.getHours() - 12);
		var y0 = y.invert(s[0][1]) + 7;
		var y1 = y.invert(s[1][1]) + 7;
		var filterLimits = {
			x0: x0,
			y0: y0,
			x1: x1,
			y1: y1
		};
	}
	update(filterLimits);
}

function idled() {
	idleTimeout = null;
}

function update(filterLimits) {
	filterCriteria = getFilteredLabels(dataSecondary, filterLimits);
	getStackedBarData(currentLabel, filterCriteria);
}

function getFilteredLabels(data, filters) {
	var x0 = filters["x0"];
	var x1 = filters["x1"];
	var y0 = filters["y0"];
	var y1 = filters["y1"];

	var set = new Set();
	data.forEach(function(d, i) {
		d.values.forEach(function(d1, i1) {
			if (
				d1.date > x0 &&
				d1.date < x1 &&
				d1.hours < y0 &&
				d1.hours > y1
			) {
				set.add(i);
			}
		});
	});

	var result = Array.from(set);
	return result;
}

function clusterSimilarPerformingcities(data, labelsOnBasisOfPerformance) {
	var clusteredData = [];
	var keys = Object.keys(labelsOnBasisOfPerformance);
	var result = [];
	keys.map(function(labelIndex, i) {
		var object = {};
		var cityGroup = labelsOnBasisOfPerformance[labelIndex];
		var clusteredOfficeHourData = clusterOfficeHourData(cityGroup, data);
		object["id"] = "C" + i;
		object["values"] = clusteredOfficeHourData;
		result.push(object);
	});
	return result;
}

function clusterOfficeHourData(cityGroup, data) {
	result = data[0]["values"].map(function(d, i) {
		return {
			date: d["date"],
			hours: 0,
			min: Infinity,
			max: -Infinity
		};
	});

	cityGroup.forEach(function(city) {
		data.forEach(function(tadata) {
			if (tadata["id"] == originalcityData[city]["id"]) {
				tadata["values"].forEach(function(d, i) {
					result[i]["hours"] =
						result[i]["hours"] + d["hours"] / cityGroup.length;
					result[i]["min"] = Math.min(result[i]["min"], d["hours"]);
					result[i]["max"] = Math.max(result[i]["max"], d["hours"]);
				});
			}
		});
	});
	return result;
}

function getLineData(data, cities, dataSecondary) {
	x.domain(
		d3.extent(data, function(d) {
			return d.date;
		})
	);
	y.domain([0, 80]);
	z.domain(
		cities.map(function(c, i) {
			return i;
		})
	);

	circles = [];

	cities.forEach(function(cityID, i) {
		cityID["values"].forEach(function(entry, i1) {
			circles.push([
				i,
				x(entry["date"]),
				y(entry["temperature"]),
				dataSecondary[i]["values"][i1]["hours"],
				dataSecondary[i]["values"][i1]["min"],
				dataSecondary[i]["values"][i1]["max"]
			]);
		});
	});

	maxRadius = d3.max(circles, function(c) {
		return c[3];
	});
	minRadius = d3.min(circles, function(c) {
		return c[3];
	});

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
		.text("temperature (F)");

	tooltip = d3
		.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden");

	var cityData = g
		.selectAll(".cityData")
		.data(cities)
		.enter()
		.append("g")
		.attr("class", "cityData");

	d3.select("viz-body")
		.selectAll(".line")
		.remove();

	// cityData.append("path")
	// 	.attr("class", "line")
	// 	.attr("d", function(d) {return cityline(d.values) })
	// 	.style("stroke", function(d) {return z(d.id); })
	// 	.style("stroke-width", "1.5px")
	// 	.on("mouseover", mouseOverLine)
	// 	.on("mouseout", mouseOutLine)
	// 	.on("mousemove", mouseMoveOnLine)
	// 	.on("click", clickOnLine)

	cityData
		.append("path")
		.attr("class", "line")
		.attr("d", function(d) {
			return cityline(d.values);
		})
		.style("stroke", function(d, i) {
			return z(i);
		})
		.style("stroke-width", lineWidthOriginal)
		.on("mouseover", mouseOverLine)
		.on("mouseout", mouseOutLine)
		.on("mousemove", mouseMoveOnLine)
		.on("click", clickOnLine);

	cityData.exit().remove();

	cityData
		.append("text")
		.attr("class", "cluster-text-name")
		.datum(function(d) {
			return { id: d.id, value: d.values[d.values.length - 1] };
		})
		.attr("transform", function(d) {
			return (
				"translate(" +
				x(d.value.date) +
				"," +
				y(d.value.temperature) +
				")"
			);
		})
		.attr("x", 3)
		.attr("dy", "0.35em")
		.style("font", "10px")
		.text(function(d) {
			return d.id;
		});
}

// function filterAttendingcities() {
// 	mainFunction(2)
// }

// function filterMissingcities() {
// 	mainFunction(3)
// }

function getLabelNumber(labelsOnBasisOfPerformance, id) {
	var result;
	Object.keys(labelsOnBasisOfPerformance).forEach(function(d1, i1) {
		if (labelsOnBasisOfPerformance[d1].includes(id)) {
			result = i1;
		}
	});
	return result;
}

function hierarch(cities, distance, clusterSize) {
	var dmin = [];
	var n = cities.length;
	var d = [];
	for (var i = 0; i < n; i++) {
		d[i] = {};
		d[i]["labels"] = [i];
		d[i]["values"] = [];
		for (var j = 0; j < n; j++) {
			if (i == j) {
				d[i]["values"][j] = Infinity;
			} else {
				d[i]["values"][j] = distance(
					cities[i]["values"],
					cities[j]["values"]
				);
			}
		}
	}

	// var m = []
	// m[0] = {}
	// m[1] = {}
	// m[2] = {}
	// m[3] = {}
	// m[4] = {}
	// m[5] = {}

	// m[0]["labels"] = [0]
	// m[0]["values"] = [Infinity,662,877,255,412,996]

	// m[1]["labels"] = [1]
	// m[1]["values"] = [662,Infinity,295,468,268,400]

	// m[2]["labels"] = [2]
	// m[2]["values"] = [877,295,Infinity,754,564,138]

	// m[3]["labels"] = [3]
	// m[3]["values"] = [255,468,754,Infinity,219,869]

	// m[4]["labels"] = [4]
	// m[4]["values"] = [412,268,564,219,Infinity,669]

	// m[5]["labels"] = [5]
	// m[5]["values"] = [996,400,138,869,669,Infinity]

	return handleDistanceMatrix(d, clusterSize);
}

function handleDistanceMatrix(matrix, clusterSize) {
	var Osize = matrix.length;
	for (var hx = Osize - 1; hx >= clusterSize; hx--) {
		var size = matrix.length;
		var min = Infinity;
		var minLabel1 = null;
		var minLabel2 = null;

		// To find the closest clusters
		// by finding the least value in the matrix
		for (var i = 0; i < size; i++) {
			for (var j = 0; j <= i; j++) {
				if (matrix[i]["values"][j] < min) {
					min = matrix[i]["values"][j];
					minLabel1 = i;
					minLabel2 = j;
				}
			}
		}

		// Saving the index of the closest clusters
		var min = minLabel1 < minLabel2 ? minLabel1 : minLabel2;
		var max = minLabel1 < minLabel2 ? minLabel2 : minLabel1;

		// Moving all the labels from the max index to the min index
		matrix[max]["labels"].forEach(function(d, i) {
			matrix[min]["labels"].push(d);
		});

		// Replacing all the values in the min index
		// with the minimum values of both the rows
		for (var i = 0; i < size; i++) {
			matrix[min]["values"][i] = linkageCriteriaAverage(
				matrix[min]["values"][i],
				matrix[max]["values"][i]
			);
		}

		// Replacing all the entries for the rows to make the same change
		for (var i = 0; i < size; i++) {
			matrix[i]["values"][min] = matrix[min]["values"][i];
		}

		// Remove the row for the max index
		_.remove(matrix, function(n, i) {
			return i == max;
		});

		// Remove the columns for the max index
		for (var i = 0; i < size - 1; i++) {
			_.remove(matrix[i]["values"], function(n, i2) {
				return i2 == max;
			});
		}
		matrix[min]["values"][min] = Infinity;
	}
	var result = {};
	matrix.forEach(function(d, i) {
		result[i] = d["labels"];
	});
	return result;
}

function linkageCriteriaSingle(a, b) {
	return Math.min(a, b);
}

function linkageCriteriaComplete(a, b) {
	return Math.max(a, b);
}

function linkageCriteriaAverage(a, b) {
	return (a + b) / 2;
}

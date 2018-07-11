var lineWidthOriginal = "1.5px";
var lineWidthOnHover = "5px";
var studentGradeData;
var csvFromCalendar;
var csvFromOH1;
var csvFromGrades;
var dataSecondary;
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
var svg = d3.select(".viz-body").select("svg"),
	margin = { top: 30, right: 80, bottom: 30, left: 50 },
	width = svg.attr("width") - margin.left - margin.right,
	height = svg.attr("height") - margin.top - margin.bottom,
	g = svg
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.attr("class", "overlayGradeSVG");

var parseTime = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
	y = d3.scaleLinear().range([height, 0]),
	z = d3.scaleOrdinal(d3.schemeCategory10);
var x_filter = d3.scaleTime().range([0, width]),
	y_filter = d3.scaleLinear().range([height, 0]),
	z_filter = d3.scaleOrdinal(d3.schemeCategory10);
var studentline = d3
	.line()
	.x(function(d) {
		return x(d.date);
	})
	.y(function(d) {
		return y(d.scores);
	});
var circles = [];
var maxRadius;
var tipBox;
var tooltip;
var completeDateList;
var dateSet;
var entireTimePeriod;
var labelsOnBasisOfPerformance;
var tickOn = false;
var corrOn = false;
var distOn = false;
var numbersOn = false;
var TAdata;
var overallOHdata = {};
var eventsByDate = {};
var bisectDate = d3.bisector(d => d).left;
var calendarData = {};
var dateList = [];
var longDateToShortDate = {};
var cTotal = 0;
var columns = ["date"];
var irregDatesToRegDates = [];
var quartilePreData;
var quartilePostData;
var numFeatures;
var boxplotdata;
var originalStudentData;
var helpSeekingCSVdata = [];
var studentWiseTAdata = [];
var filterCriteria = [];
var currentLabel;
var currentIndex = 0;
var filteredSet = [];

function mainFunction(studentList) {
	csvFromCalendar.forEach(function(d, i) {
		cTotal = cTotal + d.total;
		dateList.push(d.date);
		calendarData[d.date] = {};
		calendarData[d.date]["description"] = d.description;
		calendarData[d.date]["total"] = cTotal;
		longDateToShortDate[parseTime(d.date)] = d.date;
	});

	csvFromGrades.forEach(function(d, i) {
		if (studentList.includes(d.Username)) {
			var total = 0;
			for (var i = 0; i < dateList.length; i++) {
				var x = calendarData[dateList[i]].description;
				var y = calendarData[dateList[i]].total;
				total = total + d[x];
				d[x] = (total / y) * 100;
			}
			columns.push(d.Username);
		}
	});

	completeDateList = getCompleteDateList(dateList);
	var dataForVisualization = convertIrregToReg(
		completeDateList,
		csvFromGrades,
		calendarData
	);
	data = dataForVisualization;

	students = columns.slice(1).map(function(id) {
		return {
			id: id,
			values: data.map(function(d) {
				return { date: d.date, scores: d[id] };
			})
		};
	});

	clusters = 8;
	maxiterations = Infinity;
	numFeatures = students[0]["values"].map(function(d) {
		return d.date;
	});

	// K-MEANS CLUSTERING
	studentClusters = kmeans(students, clusters, maxiterations);
	
	// HIERARCHICAL CLUSTERING
	// labelsOnBasisOfPerformance = hierarch(students, DTWDistance, clusters);
	// studentClusters = getCentroids(
	// 	students,
	// 	labelsOnBasisOfPerformance,
	// 	clusters
	// );

	// findOptimalClusterUsingElbow(students, maxiterations)
	// findOptimalClusterUsingSil(students, maxiterations)
	// calculateSumSquareDistance(studentClusters,students)

	var clusteredData = studentClusters.map(function(d, i) {
		return {
			id: "C" + i,
			values: d
		};
	});

	originalStudentData = students;
	students = clusteredData;

	if (
		getFilterData &&
		typeof getFilterData == "function" &&
		initializePanel &&
		typeof initializePanel == "function"
	) {
		getFilterData(labelsOnBasisOfPerformance, data, students, getLineData);
		initializePanel();
	}
}

function initializePanel() {
	d3.selectAll(".tickers").text("Event Pillars ON");
	d3.selectAll(".corrers").text("Correlation ON");
	d3.selectAll(".disters").text("Distribution ON");
	enableNavFilters();
}

function toggleTick() {
	if (!tickOn) {
		d3.selectAll(".tickText").text("Event Pillars ON");
		enableTicks();
	} else {
		d3.selectAll(".tickText").text("Event Pillars OFF");
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

	dateList = _.filter(dateList, function(d) {
		return !(
			_.startsWith(calendarData[d]["description"], "LAB") ||
			_.startsWith(calendarData[d]["description"], "SUR")
		);
	});
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
		})
		.on("mouseover", mouseOverLine)
		.on("mouseout", mouseOutLine)
		.on("click", clickOnLine);

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

function mouseOutLine() {
	d3.select(".viz-body")
		.selectAll(".line")
		.style("stroke-width", function(d1, i1) {
			return lineWidthOriginal;
		})
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
		.style("stroke-opacity", "1");

	d3.select(".filter-body")
		.selectAll(".officeHourlineMax")
		.style("stroke-width", function(d1, i1) {
			return "0.5px";
		})
		.style("stroke-opacity", "1");
	// .style("stroke", "black")

	d3.select(this).style("stroke-width", lineWidthOriginal);
	// tooltip.style("visibility", "hidden")

	d3.selectAll(".navbarRects").attr("width", "18px");

	d3.selectAll(".navbarTexts").attr("font-weight", "normal");

	d3.selectAll(".navbarTexts").attr("fill", "black");
}

// https://github.com/wbkd/d3-extended
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
			.style("stroke", function(d, i) {
				return "black";
			});
	}

	d3.select(".viz-body")
		.selectAll(".line")
		.style("stroke-width", function(d1, i1) {
			if (i != i1) {
				return lineWidthOriginal;
			} else {
				return lineWidthOnHover;
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (i != i1) {
				return "0.30";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourline")
		.style("stroke-width", function(d1, i1) {
			if (i != i1) {
				return lineWidthOriginal;
			} else {
				return lineWidthOnHover;
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (i != i1) {
				return "0.30";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourlineMin")
		.style("stroke-width", function(d1, i1) {
			if (i != i1) {
				return "0.5px";
			} else {
				return "4px";
			}
			mouseOver;
		})
		.style("stroke-opacity", function(d1, i1) {
			if (i != i1) {
				return "0.30";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourlineMax")
		.style("stroke-width", function(d1, i1) {
			if (i != i1) {
				return "0.5px";
			} else {
				return "4px";
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (i != i1) {
				return "0.30";
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
	// currentLabel = labelsOnBasisOfPerformance[i];
	// currentIndex = i;
}

function clickOnLine(d, i) {
	currentLabel = labelsOnBasisOfPerformance[i];
	currentIndex = i;
	getTextValues(currentLabel, i);
	fillUpTheOHArea(i);
	if (distOn) getStackedBarData(currentLabel, filterCriteria);
	if (corrOn) selectALineToViewOHData(i);
}

function selectALineToViewOHData(currentLabel) {
	getIntegratedCircles(currentLabel);
	// fillUpTheOHArea(currentLabel);
}

function fillUpTheOHArea(currentLabel) {
	var eventMap = {};

	var users = labelsOnBasisOfPerformance[currentLabel].map(function(d) {
		return originalStudentData[d]["id"];
	});

	var OHToShow = [];

	TAdata.forEach(function(taElement, taID) {
		if (users.includes(taElement["Username"])) {
			eventMap[taElement["Help Category"]] =
				(eventMap[taElement["Help Category"]] || 0) +
				taElement["Duration"] /
					labelsOnBasisOfPerformance[currentLabel].length;
			OHToShow.push(taElement);
		}
	});

	var comparisonData = getComparisonWithClassAverage(overallOHdata, eventMap);
	var array = Object.keys(comparisonData);
	array.sort();
	var comparisonDisplay = getComparisonDisplayResults(comparisonData, array);
	displayComparisonDataResults(comparisonDisplay);
}

function displayComparisonDataResults(data) {
	d3.select(".oh-comparison-body")
		.selectAll("svg")
		.remove();
	var calendarList = Object.keys(calendarData).map(function(d, i) {
		return calendarData[d]["description"];
	});

	var svg = d3
		.select(".oh-comparison-body")
		.append("svg")
		.attr("width", "160px")
		.attr("height", "500px")
		.append("g")
		.attr("transform", "translate(" + 10 + "," + 10 + ")");

	var width = 10;

	var legend = svg
		.selectAll(".oh-compare-Elements")
		.data(data)
		.enter()
		.append("g")
		.attr("class", "oh-compare-Elements")
		.attr("transform", function(d, i) {
			return "translate(0," + i * 20 + ")";
		});

	legend
		.append("rect")
		.attr("class", "oh-compare-rect")
		.attr("x", width - 10)
		.attr("width", 160)
		.attr("height", 18)
		.style("fill", function(d, i) {
			if (d["type"] == "a") {
				return "#898989";
			} else if (d["type"] == "b") {
				return "#69aac6";
			} else if (d["type"] == "c") {
				return "#ffa0a0";
			} else {
				return "#80c669";
			}
		});

	legend
		.append("text")
		.attr("class", "oh-compare-text")
		.attr("x", width)
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "start")
		.text(function(d, i) {
			return d["Event"] + "  :: " + d["result"];
		})
		.style("fill", function(d, i) {
			if (d["type"] == "a") {
				return "black";
			} else {
				return "white";
			}
		});

	legend.exit().remove();
}

function getComparisonWithClassAverage(overallOHdata, eventMap) {
	var result = {};
	Object.keys(overallOHdata).forEach(function(event, i) {
		var a = eventMap[event] || 0;
		var b = overallOHdata[event] || 0;
		if (a == 0) {
			if (b == 0) {
				number = 1;
			} else {
				number = -1;
			}
		} else {
			number = a - b;
		}

		result[event] = Math.round(number * 10000) / 10000;
	});
	return result;
}

function getComparisonDisplayResults(comparisonData, array) {
	return array.map(function(event, i) {
		var result = null;
		var type = -1;
		if (comparisonData[event] == -1) {
			result = "N/A";
			// result = "";
			type = "a";
		} else if (comparisonData[event] == 1) {
			// result = "Nobody attended";
			result = "";
			type = "b";
		} else if (comparisonData[event] < 0) {
			result = comparisonData[event];
			type = "c";
		} else {
			result = comparisonData[event];
			type = "d";
		}

		return {
			Event: event,
			result: result,
			type: type
		};
	});
}

function convertLongToShortDate(fullDate) {
	return (
		fullDate.getFullYear() * 10000 +
		(fullDate.getMonth() + 1) * 100 +
		fullDate.getDate()
	);
}

function clickOnCircle(d, i) {
	var permittedUsers = labelsOnBasisOfPerformance[d[0]].map(function(d, i) {
		return originalStudentData[d]["id"];
	});
	var fullDate = d[6];
	var shortDate = convertLongToShortDate(fullDate);
	var eventList = eventsByDate[shortDate].filter(function(d, i) {
		return permittedUsers.includes(d.Username);
	});

	getEventsList(d, shortDate, eventList);
}

function mouseOverCircle(d, i) {
	d3.select(this)
		.attr("stroke-width", "3px")
		.attr("fill", "black")
		.attr("fill-opacity", "0.01")
		.attr("stroke", "black");
	mouseOverLine(null, currentIndex);
}

function mouseOutCircle(d, i) {
	d3.select(this)
		.attr("stroke-width", "1px")
		.attr("fill", "black")
		.attr("fill-opacity", "0.01")
		.attr("stroke", "black");
	mouseOutLine(null, currentIndex);
}

function getEventsList(object, date, eventsList) {
	var d = object[6];

	var displayDate =
		days[d.getDay()] +
		", " +
		d.getMonth() +
		"-" +
		d.getDate() +
		"-" +
		d.getFullYear();

	d3.select(".reason-body-list")
		.selectAll("table")
		.remove();
	d3.select(".reason-body-header")
		.selectAll("h5")
		.remove();
	d3.select(".reason-body-header")
		.selectAll("h3")
		.remove();

	d3.select(".reason-body-header")
		.append("h3")
		.attr("class", "reason-panel-header-date")
		.text(displayDate);

	d3.select(".reason-body-header")
		.append("h5")
		.text(
			"Students attended an average of " +
				Math.round(object[3] * 1000) / 1000 +
				" minutes"
		);

	d3.select(".reason-body-header")
		.append("h5")
		.text(
			"To discuss the following items (Total entries - " +
				eventsList.length +
				")"
		);

	eventsList.sort(function(a, b) {
		return a.Username - b.Username;
	});

	var titles = [
		"Username",
		"Help Category",
		"Start Time",
		"End Time",
		"Duration",
		"TA Name",
		"Question",
		"Notes",
		"Time Category",
		"Wait Time"
	];

	var sortAscending = true;
	var table = d3.select(".reason-body-list").append("table");
	// var titles = d3.keys(data[0]);
	var headers = table
		.append("thead")
		.append("tr")
		.selectAll("th")
		.data(titles)
		.enter()
		.append("th")
		.text(function(d) {
			return d;
		})
		.on("click", function(d) {
			headers.attr("class", "header");

			if (sortAscending) {
				rows.sort(function(a, b) {
					return b[d] < a[d];
				});
				sortAscending = false;
				this.className = "aes";
			} else {
				rows.sort(function(a, b) {
					return b[d] > a[d];
				});
				sortAscending = true;
				this.className = "des";
			}
		});

	var rows = table
		.append("tbody")
		.selectAll("tr")
		.data(eventsList)
		.enter()
		.append("tr");
	rows.selectAll("td")
		.data(function(d) {
			return titles.map(function(k) {
				return { value: d[k], name: k };
			});
		})
		.enter()
		.append("td")
		.attr("data-th", function(d) {
			return d.name;
		})
		.text(function(d) {
			return d.value;
		});
}

function getIntegratedCircles(currentLabel) {
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
	// 		return (20 * d[3]) / maxRadius;
	// 	})
	// 	.style("fill", function(d, i) {
	// 		return z(d[0]);
	// 	})
	// 	.style("fill-opacity", "1")
	// 	.style("stroke", function(d, i) {
	// 		return "black";
	// 	});
	// .style("fill-opacity", "0.50");

	officeHourDots
		.append("circle")
		.filter(function(d, i) {
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
			if (d[3] != 0) return (20 * d[3]) / maxRadius + 5;
			else return 0;
		})
		.attr("fill", "black")
		.attr("fill-opacity", "0.01")
		.attr("stroke", "black")
		.on("mouseover", mouseOverCircle)
		.on("mouseout", mouseOutCircle)
		.on("click", clickOnCircle);

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
	var array = label.map(function(d) {
		return originalStudentData[d]["id"];
	});

	array = array.sort();

	d3.select(".text-body").style("border", "1px solid black");

	/*var heading = [label.length];

	var text = d3
		.select(".text-body-cluster-description")
		.selectAll("text")
		.data(heading);

	text.attr("class", "update");
	text.enter()
		.append("text")
		.attr("class", "enter")
		.attr("x", function(d, i) {
			return i * 32;
		})
		.attr("dy", ".35em")
		.merge(text)
		.text(function(d) {
			return "Cluster Size : " + d;
		});*/

	var text = d3
		.select(".text-body-cluster-content")
		.selectAll("text")
		.data(array);

	text.attr("class", "update");
	text.enter()
		.append("text")
		.attr("class", "enter")
		.attr("x", function(d, i) {
			return i * 32;
		})
		.attr("dy", ".35em")
		.merge(text)
		.text(function(d) {
			return d + ", ";
		});
	text.exit().remove();
}

function type(d, _, columns) {
	d.date = parseTime(d.date);
	for (var i = 1, n = columns.length, c; i < n; ++i)
		d[(c = columns[i])] = +d[c];
	return d;
}

// ----------------------------------------------------------------------------------------------
// Reads in all the Events at the Irregular Dates and converts them to Regular Spaced Dates
// The purpose of this conversion is to use it for Clustering
function convertIrregToReg(completeDateList, studentGradeData, calendarData) {
	var dataForVisualization = [];
	var date_j = 0;
	completeDateList.forEach(function(date_i, i) {
		var element = {};
		irregDatesToRegDates[date_i] = parseTime(dateList[date_j]);

		element["date"] = date_i;
		if (date_i >= parseTime(dateList[date_j + 1])) {
			date_j = date_j + 1;
		}

		if (dateList[date_j] !== undefined) {
			var x = calendarData[dateList[date_j]].description;
			for (var i = 0; i < studentGradeData.length; i++) {
				var username = studentGradeData[i]["Username"];
				if (
					filteredSet.length === 0 ||
					filteredSet.includes(parseInt(username))
				) {
					element[username] = studentGradeData[i][x];
				}
			}

			dataForVisualization.push(element);
		}
	});
	return dataForVisualization;
}

// ----------------------------------------------------------------------------------------------
// This function reads in the list of Dates from the events and creates a list of all the dates
// between the first date and the last date
// ----------------------------------------------------------------------------------------------
function getCompleteDateList(dateList) {
	var date_i = dateList[0];
	dateSet = new Set();
	var completeDateList = [];

	entireTimePeriod.map(function(date_i, i) {
		if (parseTime(date_i) <= parseTime(dateList[dateList.length - 1])) {
			if (!dateSet.has(parseTime(date_i).toString())) {
				dateSet.add(parseTime(date_i).toString());
				completeDateList.push(parseTime(date_i));
			}
		}
	});

	return completeDateList;
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

	var resultant = centroids.map(function(d,i) {
		return {
			values: d,
			labels: labels[i]
		}
	})

	resultant.sort(function(a,b) {
		return b["values"][b["values"].length-1]["scores"]-a["values"][a["values"].length-1]["scores"];
	})

	centroids = resultant.map(function(d) {
		return d["values"]
	})

	labelsOnBasisOfPerformance = resultant.map(function(d) {
		return d["labels"]
	})

	return centroids;
}

function getRandomCentroids(numFeatures, k) {
	var result = [];
	for (var i = 0; i < k; i++) {
		result[i] = [];
		numFeatures.map(function(d) {
			var x = {};

			x["date"] = d;
			x["scores"] = Math.random() * 100;
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
				(s1[i].scores - s2[j].scores) * (s1[i].scores - s2[j].scores);
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
		var x = s1[i].scores - s2[i].scores;
		result += x * x;
	}
	return Math.sqrt(result);
}

function ManhattanDistance(s1, s2) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x =
			s1[i].scores - s2[i].scores >= 0
				? s1[i].scores - s2[i].scores
				: -(s1[i].scores - s2[i].scores);
		result += x;
	}
	return result;
}

function MinkowskiDistance(s1, s2, p) {
	var result = 0;

	for (var i = 0; i < s1.length; i++) {
		var x =
			s1[i].scores - s2[i].scores >= 0
				? s1[i].scores - s2[i].scores
				: -(s1[i].scores - s2[i].scores);
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
			s1[i].scores - s2[i].scores >= 0
				? s1[i].scores - s2[i].scores
				: -(s1[i].scores - s2[i].scores);

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
				x["scores"] = Math.random() * 100;
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
					y = y + Math.log(dataset[d1]["values"][i1]["scores"]);
				});
				x["scores"] = Math.exp(y / labels[i].length);
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

function findOptimalClusterUsingElbow(students, iterations) {
	var elbowMap = {};
	for (var i = 1; i <= 15; i++) {
		var clusters = kmeans(students, i, iterations);
		elbowMap[i] = calculateSumSquareDistance(clusters, students);
	}
}

function findOptimalClusterUsingSil(students, iterations) {
	var silMap = {};
	for (var i = 10; i <= 10; i++) {
		var clusters = kmeans(students, i, iterations);
		silMap[i] = calculateSilhouette(
			clusters,
			students,
			labelsOnBasisOfPerformance
		);
	}
}

function calculateSilhouette(clusters, students, labels) {
	var result = 0;
	var plot = [];
	Object.keys(labels).forEach(function(d, i) {
		var a = calculateSilhouetteForOneClusterA(
			clusters,
			students,
			labels[d]
		);
		var b = calculateSilhouetteForOneClusterB(
			clusters,
			students,
			labels,
			d
		);
		var s = a.map(function(d, i) {
			if (d < b[i]) {
				return 1 - d / b[i];
			} else if (d > b[i]) {
				return b[i] / d - 1;
			} else {
				return 0;
			}
		});
		s.sort(function(a, b) {
			return a - b;
		});
		plot[i] = _.sum(s) / s.length;
		result = result + plot[i];
	});

	return result / Object.keys(labels).length;
}

function calculateSilhouetteForOneClusterA(clusters, students, label) {
	var a = [];
	label.forEach(function(d1, i1) {
		a[i1] = 0;
		label.forEach(function(d2, i2) {
			if (i1 != i2) {
				a[i1] =
					a[i1] +
					getScoreDifferenceForSilhouette(
						students[d1]["values"],
						students[d2]["values"]
					) /
						label.length;
			}
		});
	});
	return a;
}

function calculateSilhouetteForOneClusterB(clusters, students, labels, key) {
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
							students[d1]["values"],
							students[d3]["values"]
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
		var stuffToAdd = score1[i]["scores"] - score2[i]["scores"];
		stuffToAdd = stuffToAdd >= 0 ? stuffToAdd : -stuffToAdd;
		difference = difference + stuffToAdd;
	});
	return difference;
}

function calculateSumSquareDistance(clusters, studentData) {
	var label_iterator = Object.keys(labels);
	var x = 0;
	label_iterator.forEach(function(d, i1) {
		labels[d].forEach(function(e, i2) {
			x =
				x +
				getSquareDifference(
					d,
					e,
					studentData[e]["values"],
					clusters[i1]
				);
		});
	});
	return x;
}

function getSquareDifference(i1, i2, arr1, arr2) {
	var result = 0;
	arr1.forEach(function(d, i) {
		result = result + Math.sqrt(Math.abs(arr1[i].scores - arr2[i].scores));
	});
	return result;
}

function getQuartileData(indexes, filterCriteria) {
	result = [];
	var inter = {};
	numFeatures.forEach(function(d, i) {
		inter[d] = [];
	});

	// var x0 = filterLimits["x0"];
	// var x1 = filterLimits["x1"];
	// var y0 = filterLimits["y0"];
	// var y1 = filterLimits["y1"];

	originalStudentData.forEach(function(d, i) {
		if (
			filterCriteria != undefined &&
			indexes.includes(i) &&
			(filterCriteria.length == 0 || filterCriteria.includes(i))
		) {
			d.values.forEach(function(d1, i1) {
				inter[d1.date].push(d1.scores);
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

	// var z = d3.interpolateRdYlBu();

	var stack = d3.stack();
	data = result;
	var columns = Object.keys(result[0]);

	x.domain(
		d3.extent(data, function(d) {
			return d.date;
		})
	);
	y.domain([0, 100]);
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
		.attr("width", 10);

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
			return "#001b47";
		case 2:
			return "#0000ff";
		case 3:
			return "#ff0000";
		case 4:
			// return "#fff";
			return "#4f0000";
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

function getTAdataFromCSV(oh) {
	var columns = oh[0];
	var TAdata = processOHData(oh.slice(1, oh.length), columns);

	TAdata.forEach(function(event) {
		var oldArray = eventsByDate[event["Timestamp"]] || [];
		oldArray.push(event);
		eventsByDate[event["Timestamp"]] = oldArray;
	});
	return TAdata;
}

function processOHData(oh, columns) {
	var TAdata = [];

	oh.slice(1, oh.length).forEach(function(tad) {
		var object = {};
		columns.forEach(function(col, i) {
			if (isNaN(tad[i]) || col == "Username") {
				object[col] = tad[i];
			} else {
				object[col] = +tad[i];
			}
		});
		TAdata.push(object);
	});

	var result = TAdata.map(function(d) {
		var dateValues = getDateValues(d);
		return {
			Username: d.Username,
			Duration: dateValues.duration,
			"Start Time": dateValues.startTime,
			Timestamp: dateValues.timestamp,
			"End Time": dateValues.endTime,
			"Wait Time": d["Time Waited"],
			"TA Name": d.TA,
			Question: d.Question,
			Notes: d.Notes,
			"Help Category": d["Help Category"],
			"Time Category": d["Personal Time"]
		};
	});

	return result;
}

function getDateValues(d) {
	var result = {};
	var startTime = moment(d["Entered"], "MM/DD/YY HH:mm");
	var endTime = moment(d["Time Helped"], "MM/DD/YY HH:mm");
	var duration = moment.duration(endTime.diff(startTime)).asMinutes();

	return {
		duration: duration,
		timestamp: +startTime.format("YYYYMMDD"),
		startTime: startTime.format("HH:mm:ss"),
		endTime: endTime.format("HH:mm:ss")
	};
}

function getUnclusteredOHDataFromTAData(TAdata) {
	var data = [];
	columns.slice(1, columns.length).forEach(function(studentID, id) {
		var object = {};
		object["id"] = studentID;
		object["values"] = [];
		object["values"] = entireTimePeriod.map(function(date, i) {
			var x = date % 100;
			var y = ((date % 10000) - x) / 100 - 1;
			var z = 2017;
			return {
				date: new Date(z, y, x),
				hours: 0
			};
		});

		TAdata.map(function(d, i) {
			if (d["Username"] == object["id"]) {
				var index = entireTimePeriod.indexOf(d["Timestamp"]);
				object["values"][index]["hours"] = d["Duration"];
			}
		});
		data.push(object);
	});
	return data;
}

function getFilterData(
	labelsOnBasisOfPerformance,
	originalData,
	students,
	getLineData
) {
	TAdata = getTAdataFromCSV(csvFromOH1);
	TAdata.forEach(function(d, i) {
		// overallOHdata[d["Events"]] = (overallOHdata[d["Events"]] || 0) + d["Time Spent"] / TAdata.length;
		overallOHdata[d["Help Category"]] =
			(overallOHdata[d["Help Category"]] || 0) +
			d["Duration"] / originalStudentData.length;
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
			)
			.attr("class", "overlayOHSVG");

	var unclusteredOHData = getUnclusteredOHDataFromTAData(TAdata);
	var officeHourData = clusterSimilarPerformingStudents(
		unclusteredOHData,
		labelsOnBasisOfPerformance
	);

	dataSecondary = officeHourData;

	x_filter.domain(
		d3.extent(officeHourData[0].values, function(d) {
			return d.date;
		})
	);

	y_filter.domain([
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

	var line1 = d3
		.line()
		.x(function(d, i) {
			return x_filter(d.date);
		})
		.y(function(d, i) {
			return y_filter(d.hours);
		});

	var line2 = d3
		.line()
		.x(function(d, i) {
			return x_filter(d.date);
		})
		.y(function(d, i) {
			return y_filter(d.min);
		});

	var line3 = d3
		.line()
		.x(function(d, i) {
			return x_filter(d.date);
		})
		.y(function(d, i) {
			return y_filter(d.max);
		});

	// z.domain(officeHourData.map(function(c,i) {return c.id; }));

	g.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x_filter));

	g.append("g")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(y_filter))
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("fill", "#000")
		.text("minutes");

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
		.on("click", clickOnLine);

	officeHourDatum
		.append("path")
		.attr("class", "officeHourlineMin")
		.attr("d", function(d) {
			return line2(d.values);
		})
		.style("stroke", function(d, i) {
			return z(i);
			// return "black";
		})
		.style("stroke-width", "0.5px")
		.style("stroke-dasharray", "5")
		.on("mouseover", mouseOverLine)
		.on("mouseout", mouseOutLine)
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
		.on("click", clickOnLine);

	officeHourDatum
		.append("text")
		.datum(function(d) {
			return { id: d.id, value: d.values[d.values.length - 1] };
		})
		.attr("transform", function(d) {
			return (
				"translate(" +
				x_filter(d.value.date) +
				"," +
				y_filter(d.value.hours) +
				")"
			);
		})
		.attr("x", 3)
		.attr("dy", "0.35em")
		.style("font", "10px sans-serif")
		.text(function(d) {
			return d.id;
		});

	officeHourDatum.exit().remove();

	if (getLineData && typeof getLineData == "function") {
		getLineData(originalData, students, dataSecondary);
	}
}

function makeUsefulTooltip() {
	if (!(corrOn || distOn)) {
		var x0 = x_filter.invert(d3.mouse(this)[0]);
		var i = bisectDate(completeDateList, x0, 1);
		var d0 = completeDateList[i - 1];
		var d1 = completeDateList[i];
		var d = x0 - d0 > d1 - x0 ? d1 : d0;

		mousemoveOverlayOH(d);
		mousemoveOverlayGrade(d);
	}
}

function mousemoveOverlayOH(d) {
	var avg =
		dataSecondary[currentIndex]["values"][completeDateList.indexOf(d)][
			"hours"
		];
	var min =
		dataSecondary[currentIndex]["values"][completeDateList.indexOf(d)][
			"min"
		];
	var max =
		dataSecondary[currentIndex]["values"][completeDateList.indexOf(d)][
			"max"
		];

	var y0 = y_filter(min);
	var y1 = y_filter(avg);
	var y2 = y_filter(max);

	var des1 = "Min";
	var des2 = "Avg";
	var des3 = "Max";

	if (y0 == y1 && y0 == y2) {
		des1 = "Avg/Min/Max";
		des2 = "Avg/Min/Max";
		des3 = "Avg/Min/Max";
	} else if (y0 == y1) {
		des1 = "Avg/Min";
		des2 = "Avg/Min";
	} else if (y1 == y2) {
		des2 = "Avg/Max";
		des3 = "Avg/Max";
	}

	var focusAvg = d3.select(".filter-body").selectAll(".focusAvg");
	focusAvg.attr("transform", "translate(" + x(d) + "," + y0 + ")");
	focusAvg.select("text").text(des1 + " : " + Math.round(min * 100) / 100);

	var focusMin = d3.select(".filter-body").selectAll(".focusMin");
	focusMin.attr("transform", "translate(" + x(d) + "," + y1 + ")");
	focusMin.select("text").text(des2 + " : " + Math.round(avg * 100) / 100);

	var focusMax = d3.select(".filter-body").selectAll(".focusMax");
	focusMax.attr("transform", "translate(" + x(d) + "," + y2 + ")");
	focusMax.select("text").text(des3 + " : " + Math.round(max * 100) / 100);
}

function mousemoveOverlayGrade(d) {
	var grade =
		students[currentIndex]["values"][completeDateList.indexOf(d)]["scores"];
	var y0 = y(grade);

	var focusGrades = d3.select(".viz-body").selectAll(".focusGrades");

	var textToDisplay =
		days[d.getDay()] +
		" , " +
		months[d.getMonth()] +
		" " +
		d.getDate() +
		" :: " +
		Math.round(grade * 100) / 100;

	focusGrades.attr("transform", "translate(" + x(d) + "," + y0 + ")");
	focusGrades.select("text").text(textToDisplay);
	focusGrades.select("rect").attr("dy", 0);
}

// function update(filterLimits) {
// 	filterCriteria = getFilteredLabels(dataSecondary, filterLimits);
// 	getStackedBarData(currentLabel, filterCriteria);
// }

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

function clusterSimilarPerformingStudents(data, labelsOnBasisOfPerformance) {
	var clusteredData = [];
	var keys = Object.keys(labelsOnBasisOfPerformance);
	var result = [];
	keys.map(function(labelIndex, i) {
		var object = {};
		var studentGroup = labelsOnBasisOfPerformance[labelIndex];
		var clusteredOfficeHourData = clusterOfficeHourData(studentGroup, data);
		object["id"] = "C" + i;
		object["values"] = clusteredOfficeHourData;
		result.push(object);
	});
	return result;
}

function clusterOfficeHourData(studentGroup, data) {
	result = data[0]["values"].map(function(d, i) {
		return {
			date: d["date"],
			hours: 0,
			min: Infinity,
			max: -Infinity
		};
	});

	studentGroup.forEach(function(student) {
		data.forEach(function(tadata) {
			if (tadata["id"] == originalStudentData[student]["id"]) {
				tadata["values"].forEach(function(d, i) {
					result[i]["hours"] =
						result[i]["hours"] + d["hours"] / studentGroup.length;
					result[i]["min"] = Math.min(result[i]["min"], d["hours"]);
					result[i]["max"] = Math.max(result[i]["max"], d["hours"]);
				});
			}
		});
	});
	return result;
}

function getLineData(data, students, dataSecondary) {


	x.domain(
		d3.extent(data, function(d) {
			return d.date;
		})
	);
	y.domain([0, 100]);
	z.domain(
		students.map(function(c, i) {
			return i;
		})
	);

	circles = [];

	students.forEach(function(studentID, i) {
		studentID["values"].forEach(function(entry, i1) {
			circles.push([
				i,
				x(entry["date"]),
				y(entry["scores"]),
				dataSecondary[i]["values"][i1]["hours"],
				dataSecondary[i]["values"][i1]["min"],
				dataSecondary[i]["values"][i1]["max"],
				entry["date"]
			]);
		});
	});

	maxRadius = d3.max(circles, function(c) {
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
		.text("Scores");

	tooltip = d3
		.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden");

	var studentData = g
		.selectAll(".studentData")
		.data(students)
		.enter()
		.append("g")
		.attr("class", "studentData");

	d3.select("viz-body")
		.selectAll(".line")
		.remove();

	// studentData.append("path")
	//  .attr("class", "line")
	//  .attr("d", function(d) {return studentline(d.values) })
	//  .style("stroke", function(d) {return z(d.id); })
	//  .style("stroke-width", "1.5px")
	//  .on("mouseover", mouseOverLine)
	//  .on("mouseout", mouseOutLine)
	//  .on("click", clickOnLine)

	studentData
		.append("path")
		.attr("class", "line")
		.attr("d", function(d) {
			return studentline(d.values);
		})
		.style("stroke", function(d, i) {
			return z(i);
		})
		.style("stroke-width", lineWidthOriginal)
		.on("mouseover", mouseOverLine)
		.on("mouseout", mouseOutLine)
		.on("click", clickOnLine);

	studentData.exit().remove();

	studentData
		.append("text")
		.attr("class", "cluster-text-name")
		.datum(function(d) {
			return { id: d.id, value: d.values[d.values.length - 1] };
		})
		.attr("transform", function(d) {
			return (
				"translate(" + x(d.value.date) + "," + y(d.value.scores) + ")"
			);
		})
		.attr("x", 3)
		.attr("dy", "0.35em")
		.style("font", "10px")
		.text(function(d) {
			return d.id;
		});
}

// function filterAttendingStudents() {
//  mainFunction(2)
// }

// function filterMissingStudents() {
//  mainFunction(3)
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

function hierarch(students, distance, clusterSize) {
	var dmin = [];
	var n = students.length;
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
					students[i]["values"],
					students[j]["values"]
				);
			}
		}
	}

	// var m = []
	// m[0] = {}
	// m[1] = {}
	// m[2] = {}
	// m[3] = {}man
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

function searchEvents() {}

// make dataset globally available
var dz;

// load dataset and create table
function load_grade_dataset(csv) {
	var data = d3.csvParseRows(csv);
	csvFromGrades = data.slice(1, data.length).map(function(d, i) {
		var object = {};
		data[0].forEach(function(c, k) {
			if (k != 0) {
				object[c] = +d[k];
			} else {
				object[c] = d[k] + "";
			}
		});
		return object;
	});
}

function load_oh_dataset(csv) {
	csvFromOH1 = d3.csvParseRows(csv);
}

function load_calendar_dataset(csv) {
	var data = d3.csvParseRows(csv);
	csvFromCalendar = data.slice(1, data.length).map(function(d, i) {
		return {
			date: d[0],
			description: d[1],
			total: +d[2]
		};
	});
}

// handle upload button
function upload_button(el, callback) {
	var grade_uploader = document.getElementById(el);
	var reader = new FileReader();

	reader.onload = function(e) {
		var contents = e.target.result;
		callback(contents);
	};

	grade_uploader.addEventListener("change", handleFiles, false);

	// function handleFiles() {
	// 	d3.select("#table").text("loading...");
	// 	var file = this.files[0];
	// 	reader.readAsText(file);
	// }
	function handleFiles() {
		// d3.select("#table").text("loading...");
		var file = this.files[0];
		reader.readAsText(file);
	}
}

function renderVisualization() {
	if (
		csvFromGrades == undefined ||
		csvFromOH1 == undefined ||
		csvFromCalendar == undefined
	) {
		var missingText = "Upload Following Files before continuing";
		var listOfMissingFiles = [];
		if (csvFromGrades == undefined) listOfMissingFiles.push("Grades");
		if (csvFromOH1 == undefined) listOfMissingFiles.push("Office-hours");
		if (csvFromCalendar == undefined) listOfMissingFiles.push("Calendar");

		listOfMissingFiles.forEach(function(d, i) {
			missingText = missingText + "\n" + (i + 1) + ".\t" + d;
		});

		alert(missingText);
	} else {
		var form_val = filterStudentByAttendanceType();
		var studentList = getCommonUsers(form_val, csvFromGrades, csvFromOH1);
		entireTimePeriod = getTheCompleteDateList();
		mainFunction(studentList);
	}
}

function filterStudentByAttendanceType() {
	var form = document.getElementById("attendanceCriteria");
	var form_val;
	for (var i = 0; i < form.length; i++) {
		if (form[i].checked) {
			form_val = form[i].id;
		}
	}

	if (form_val == "all") return 1;
	else if (form_val == "attended") return 2;
	else if (form_val == "missed") return 3;
	else return -1;
}

function handleViewChange() {
	var form = document.getElementById("viewType");
	var form_val;
	for (var i = 0; i < form.length; i++) {
		if (form[i].checked) {
			form_val = form[i].id;
		}
	}

	console.log("You selected", form_val);
	if (form_val == "none") {
		// disable everything
		disableCorrelation()
		disableDistribution()
		disableNumbers()
		numbersOn = false;
		corrOn = false;
		distOn = false;

	} else if (form_val == "highlight") {
		disableCorrelation()
		disableDistribution()
		disableNumbers()
		corrOn = false;
		distOn = false;
		toggleNumbers()
	} else if (form_val == "distribution") {
		disableCorrelation()
		disableNumbers()
		numbersOn = false;
		corrOn = false;
		toggleDist()
		// disable highlight and correlation
	} else if (form_val == "correlation") {
		disableDistribution()
		disableNumbers()
		numbersOn = false;
		distOn = false;
		toggleCorr()
		// disable highlight and distribution
	} else {

		// give out error message
		console.error("You wrongly chose",form_val)
	}
}

function getCommonUsers(form_val, grades, oh) {
	var all = grades.map(function(d) {
		return d.Username + "";
	});

	if (form_val == 1) return all;

	var attended = oh.slice(1, oh.length).map(function(d) {
		return d[0] + "";
	});

	attended = attended.filter(unique);

	if (form_val == 2) return attended;

	var missed = _.difference(all, attended);

	if (form_val == 3) return missed;
}

function getTheCompleteDateList() {
	var startDate = d3.min(csvFromCalendar, function(c) {
		return c.date;
	});
	var endDate = d3.max(csvFromCalendar, function(c) {
		return c.date;
	});

	var month_limit = {
		1: 31,
		3: 31,
		4: 30,
		5: 31,
		6: 30,
		7: 31,
		8: 31,
		9: 30,
		10: 31,
		11: 30,
		12: 31
	};

	var year = +startDate.slice(0, 4);
	var month = +startDate.slice(4, 6);
	var day = +startDate.slice(6, 8);
	var currentDay = startDate;
	var listOfDays = [+currentDay];

	if (year % 4 == 0) {
		month_limit[2] = 29;
	} else {
		month_limit[2] = 28;
	}

	while (currentDay != endDate) {
		if (day == month_limit[month]) {
			month = month + 1;
			day = 1;
		} else {
			day = day + 1;
		}
		currentDay = year * 10000 + month * 100 + day;
		listOfDays.push(currentDay);
	}

	return listOfDays;
}

var unique = (value, index, self) => {
	return self.indexOf(value) === index;
};

function toggleNumbers() {
	if (!numbersOn) {
		d3.selectAll(".numbersText").text("Highlight Numbers ON");
		enableNumbers();
	} else {
		d3.selectAll(".numbersText").text("Highlight Numbers OFF");
		disableNumbers();
	}
	numbersOn = !numbersOn;
}

function disableNumbers() {
	d3.select(".viz-body")
		.selectAll(".line")
		.style("stroke-width", function(d1, i1) {
			return lineWidthOriginal;
		})
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
		.style("stroke-opacity", "1");

	d3.select(".filter-body")
		.selectAll(".officeHourlineMax")
		.style("stroke-width", function(d1, i1) {
			return "0.5px";
		})
		.style("stroke-opacity", "1");

	d3.select(".filter-body")
		.select(".overlayOHSVG")
		.selectAll("rect")
		.remove();

	d3.select(".viz-body")
		.select(".overlayGradeSVG")
		.selectAll("rect")
		.remove();
}

function enableNumbers() {
	d3.select(".viz-body")
		.selectAll(".line")
		.style("stroke-width", function(d1, i1) {
			if (currentIndex != i1) {
				return lineWidthOriginal;
			} else {
				return lineWidthOnHover;
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (currentIndex != i1) {
				return "0.30";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourline")
		.style("stroke-width", function(d1, i1) {
			if (currentIndex != i1) {
				return lineWidthOriginal;
			} else {
				return lineWidthOnHover;
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (currentIndex != i1) {
				return "0.30";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourlineMin")
		.style("stroke-width", function(d1, i1) {
			if (currentIndex != i1) {
				return "0.5px";
			} else {
				return "4px";
			}
			mouseOver;
		})
		.style("stroke-opacity", function(d1, i1) {
			if (currentIndex != i1) {
				return "0.30";
			}
		});

	d3.select(".filter-body")
		.selectAll(".officeHourlineMax")
		.style("stroke-width", function(d1, i1) {
			if (currentIndex != i1) {
				return "0.5px";
			} else {
				return "4px";
			}
		})
		.style("stroke-opacity", function(d1, i1) {
			if (currentIndex != i1) {
				return "0.30";
			}
		});

	var g = d3.select(".filter-body").select(".overlayOHSVG");

	var focusAvg = g
		.append("g")
		.attr("class", "focusAvg")
		.style("display", "none");
	focusAvg.append("circle").attr("r", 4.5);
	focusAvg
		.append("rect")
		.attr("y", -height)
		.attr("width", 1)
		.attr("height", height);
	focusAvg
		.append("rect")
		.attr("width", 120)
		.attr("height", 20)
		.attr("x", "-25px")
		.attr("y", "-35px")
		.attr("fill-opacity", "0.7");

	var focusMin = g
		.append("g")
		.attr("class", "focusMin")
		.style("display", "none");

	focusMin.append("circle").attr("r", 4.5);
	focusMin
		.append("rect")
		.attr("width", 120)
		.attr("height", 20)
		.attr("x", "-25px")
		.attr("y", "-35px")
		.attr("fill-opacity", "0.7");

	var focusMax = g
		.append("g")
		.attr("class", "focusMax")
		.style("display", "none");

	focusMax.append("circle").attr("r", 4.5);
	focusMax
		.append("rect")
		.attr("width", 120)
		.attr("height", 20)
		.attr("x", "-25px")
		.attr("y", "-35px")
		.attr("fill-opacity", "0.7");

	focusAvg
		.append("text")
		.attr("x", 5)
		.attr("dy", "-20px")
		.attr("fill", "white");
	focusMin
		.append("text")
		.attr("x", 5)
		.attr("dy", "-20px")
		.attr("fill", "white");
	focusMax
		.append("text")
		.attr("x", 5)
		.attr("dy", "-20px")
		.attr("fill", "white");

	g.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height", height)
		.style("fill-opacity", "0")
		.on("mouseover", function() {
			focusAvg.style("display", null);
			focusMin.style("display", null);
			focusMax.style("display", null);
			focusGrades.style("display", null);
		})
		.on("mouseout", function() {
			focusAvg.style("display", "none");
			focusMin.style("display", "none");
			focusMax.style("display", "none");
			focusGrades.style("display", "none");
		})
		.on("mousemove", makeUsefulTooltip);

	var g = d3.select(".viz-body").select(".overlayGradeSVG");

	var focusGrades = g
		.append("g")
		.attr("class", "focusGrades")
		.style("display", "none");
	focusGrades.append("circle").attr("r", 4.5);

	focusGrades
		.append("rect")
		.attr("width", 1)
		.attr("height", height);
	focusGrades
		.append("rect")
		.attr("width", 120)
		.attr("height", 20)
		.attr("x", "-25px")
		.attr("y", "7px")
		.attr("fill-opacity", "0.7");

	focusGrades
		.append("text")
		.attr("x", "-20px")
		.attr("dy", "20px")
		.attr("fill", "white");

	g.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height", height)
		.style("fill-opacity", "0")
		.on("mouseover", function() {
			focusAvg.style("display", null);
			focusMin.style("display", null);
			focusMax.style("display", null);
			focusGrades.style("display", null);
		})
		.on("mouseout", function() {
			focusAvg.style("display", "none");
			focusMin.style("display", "none");
			focusMax.style("display", "none");
			focusGrades.style("display", "none");
		})
		.on("mousemove", makeUsefulTooltip);
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

function disableCorrelation() {
	d3.selectAll(".officeHourDots").remove();
	d3.selectAll(".officecircles").remove();
}

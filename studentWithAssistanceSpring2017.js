var lineWidthOriginal = "1.5px";
var lineWidthOnHover = "5px";
var choices = new Set();

var svg = d3.select(".viz-body").select("svg"),
  margin = { top: 30, right: 80, bottom: 30, left: 50 },
  width = svg.attr("width") - margin.left - margin.right,
  height = svg.attr("height") - margin.top - margin.bottom,
  g = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
  y = d3.scaleLinear().range([height, 0]),
  z = d3.scaleOrdinal(d3.schemeCategory10);

var studentline = d3
  .line()
  .x(function(d) {
    return x(d.date);
  })
  .y(function(d) {
    return y(d.scores);
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
var tipBox;
var tooltip;
var completeDateList;
var dateSet;
var spring2017_date_list;
var labelsOnBasisOfPerformance;
var tickOn = false;
var corrOn = false;
var distOn = false;
var TAdata;
var overallOHdata = {};
var eventsByDate = {};
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
var originalStudentData;
var helpSeekingCSVdata = [];
var catWiseStudentData = [];
var studentWiseTAdata = [];
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
var spring2017_date_list = [
  20170201,
  20170202,
  20170203,
  20170204,
  20170205,
  20170206,
  20170207,
  20170208,
  20170209,
  20170210,
  20170211,
  20170212,
  20170213,
  20170214,
  20170215,
  20170216,
  20170217,
  20170218,
  20170219,
  20170220,
  20170221,
  20170222,
  20170223,
  20170224,
  20170225,
  20170226,
  20170227,
  20170228,
  20170301,
  20170302,
  20170303,
  20170304,
  20170305,
  20170306,
  20170307,
  20170308,
  20170309,
  20170310,
  20170311,
  20170312,
  20170313,
  20170314,
  20170315,
  20170316,
  20170317,
  20170318,
  20170319,
  20170320,
  20170321,
  20170322,
  20170323,
  20170324,
  20170325,
  20170326,
  20170327,
  20170328,
  20170329,
  20170330,
  20170331,
  20170401,
  20170402,
  20170403,
  20170404,
  20170405,
  20170406,
  20170407,
  20170408,
  20170409,
  20170410,
  20170411,
  20170412,
  20170413,
  20170414,
  20170415,
  20170416,
  20170417,
  20170418,
  20170419,
  20170420,
  20170421,
  20170422,
  20170423,
  20170424,
  20170425,
  20170426,
  20170427,
  20170428,
  20170429,
  20170430,
  20170501,
  20170502,
  20170503,
  20170504,
  20170505,
  20170506,
  20170507,
  20170508,
  20170509,
  20170510,
  20170511,
  20170512,
  20170513,
  20170514,
  20170515
];

// var spring2017_date_list = [
//   20170831,
//   20170901,
//   20170902,
//   20170903,
//   20170904,
//   20170905,
//   20170906,
//   20170907,
//   20170908,
//   20170909,
//   20170910,
//   20170911,
//   20170912,
//   20170913,
//   20170914,
//   20170915,
//   20170916,
//   20170917,
//   20170918,
//   20170919,
//   20170920,
//   20170921,
//   20170922,
//   20170923,
//   20170924,
//   20170925,
//   20170926,
//   20170927,
//   20170928,
//   20170929,
//   20170930,
//   20171001,
//   20171002,
//   20171003,
//   20171004,
//   20171005,
//   20171006,
//   20171007,
//   20171008,
//   20171009,
//   20171010,
//   20171011,
//   20171012,
//   20171013,
//   20171014,
//   20171015,
//   20171016,
//   20171017,
//   20171018,
//   20171019,
//   20171020,
//   20171021,
//   20171022,
//   20171023,
//   20171024,
//   20171025,
//   20171026,
//   20171027,
//   20171028,
//   20171029,
//   20171030,
//   20171031,
//   20171101,
//   20171102,
//   20171103,
//   20171104,
//   20171105,
//   20171106,
//   20171107,
//   20171108,
//   20171109,
//   20171110,
//   20171111,
//   20171112,
//   20171113,
//   20171114,
//   20171115,
//   20171116,
//   20171117,
//   20171118,
//   20171119,
//   20171120,
//   20171121,
//   20171122,
//   20171123,
//   20171124,
//   20171125,
//   20171126,
//   20171127,
//   20171128,
//   20171129,
//   20171130,
//   20171201,
//   20171202,
//   20171203,
//   20171204,
//   20171205,
//   20171206,
//   20171207,
//   20171208,
//   20171209,
//   20171210,
//   20171211,
//   20171212,
//   20171213,
//   20171214,
//   20171215
// ];

var studentsWithAssistance_spring2017 = [
  "316",
  "227",
  "184",
  "334",
  "337",
  "137",
  "151",
  "215",
  "111",
  "320",
  "160",
  "130",
  "253",
  "158",
  "171",
  "116",
  "183",
  "313",
  "369",
  "310",
  "335",
  "173",
  "155",
  "169",
  "174",
  "297",
  "120",
  "257",
  "302",
  "138",
  "274",
  "121",
  "305",
  "358",
  "278",
  "102",
  "118",
  "124",
  "217",
  "162",
  "112",
  "364",
  "292",
  "179",
  "356",
  "190",
  "306",
  "101",
  "285",
  "110",
  "268",
  "331",
  "269",
  "108",
  "135",
  "258",
  "232",
  "262",
  "329",
  "296",
  "346",
  "167",
  "237",
  "143",
  "242",
  "139",
  "154",
  "105",
  "122",
  "243",
  "350",
  "157",
  "176",
  "244",
  "189",
  "187",
  "149",
  "136",
  "128",
  "245",
  "250",
  "359",
  "264",
  "261",
  "276",
  "152",
  "354",
  "133",
  "107",
  "221",
  "142",
  "357",
  "340",
  "106",
  "332",
  "339",
  "131",
  "208",
  "260",
  "280",
  "226",
  "170",
  "266",
  "303",
  "228",
  "304",
  "233",
  "159",
  "150",
  "251",
  "229",
  "211",
  "100",
  "220",
  "199",
  "180",
  "255",
  "299",
  "145",
  "165",
  "291",
  "322",
  "344",
  "254",
  "338",
  "283",
  "362",
  "284",
  "252",
  "279",
  "219"
];

mainFunction(1);

function mainFunction(studentFilter) {
  // Below code parses the calendar csv to mark events on the basis of the date
  // and give descriptions of the events that have occured
  // with the cummulative total score till that event
  d3.csv("data/spring2017/calendar.csv")
    .row(function(d) {
      return {
        date: parseInt(d["Date"]),
        description: d["Description"],
        total: +d["Total"]
      };
    })
    .get(function(error, csv) {
      if (!error) {
        csv.forEach(function(d, i) {
          cTotal = cTotal + d.total;
          dateList.push(d.date);
          calendarData[d.date] = {};
          calendarData[d.date]["description"] = d.description;
          calendarData[d.date]["total"] = cTotal;
          longDateToShortDate[parseTime(d.date)] = d.date;
        });
      } else {
        // handle error
      }
    });

  Object.keys(hourSpent).map(function(d, i) {
    catWiseStudentData[hourSpent[d]] = new Set();
  });

  // Below code basically parses the studentGrade data to create normalized scores of the students till that date
  d3.csv("data/spring2017/grades.csv", type, function(error, studentGradeData) {
    if (error) throw error;

    if (studentFilter == 1) {
      studentGradeData.forEach(function(d, i) {
        var total = 0;
        for (var i = 0; i < dateList.length; i++) {
          var x = calendarData[dateList[i]].description;
          var y = calendarData[dateList[i]].total;
          total = total + d[x];
          d[x] = (total / y) * 100;
        }
        columns.push(d.Username);
      });
    } else if (studentFilter == 2) {
      studentGradeData.forEach(function(d, i) {
        if (studentsWithAssistance_spring2017.includes(d.Username)) {
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
    } else if (studentFilter == 3) {
      studentGradeData.forEach(function(d, i) {
        if (!studentsWithAssistance_spring2017.includes(d.Username)) {
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
    }

    completeDateList = getCompleteDateList(dateList);
    var dataForVisualization = convertIrregToReg(
      completeDateList,
      studentGradeData,
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
    //   students,
    //   labelsOnBasisOfPerformance,
    //   clusters
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
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

  text
    .append("text")
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
    getIntegratedCircles();
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
    })
    .on("mouseover", mouseOverLine)
    .on("mouseout", mouseOutLine)
    .on("mousemove", mouseMoveOnLine)
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

function disableCorrelation() {
  d3.selectAll(".officeHourDots").remove();
  d3.selectAll(".officecircles").remove();
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
      return "4px";
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
      .style("fill-opacity", "1")
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
        return "4px";
      } else {
        return "6px";
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
  currentLabel = labelsOnBasisOfPerformance[i];
  getTextValues(currentLabel, i);
  fillUpTheOHArea(i);
  if (distOn) getStackedBarData(currentLabel, filterCriteria);
  // if (corrOn) selectALineToViewOHData(i);
}

function selectALineToViewOHData(currentLabel) {
  
}

function fillUpTheOHArea(currentLabel) {
  var eventMap = {};

  var users = labelsOnBasisOfPerformance[currentLabel].map(function(d) {
    return originalStudentData[d]["id"];
  });

  var OHToShow = [];
  TAdata.forEach(function(taElement, taID) {
    if (users.includes(taElement["Username"])) {
      eventMap[taElement["Events"]] =
        (eventMap[taElement["Events"]] || 0) +
        taElement["Time Spent"] /
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
  d3.select(this).attr("stroke-width", "3px");
}

function mouseOutCircle(d, i) {
  d3.select(this).attr("stroke-width", "1px");
}

function getEventsList(object, date, eventsList) {
  var d = object[6];
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  var displayDate =
    days[d.getDay()] +
    ", " +
    d.getMonth() +
    "-" +
    d.getDate() +
    "-" +
    d.getFullYear();

  d3.select(".reason-body-list")
    .selectAll("ul")
    .remove();
  d3.select(".reason-body-list")
    .selectAll("h4")
    .remove();
  d3.select(".reason-body-list")
    .selectAll("h2")
    .remove();

  d3.select(".reason-body-list")
    .append("h2")
    .attr("class", "reason-panel-header-date")
    .text(displayDate);

  d3.select(".reason-body-list")
    .append("h4")
    .text(
      "Students attended an average of " +
        Math.round(object[3] * 1000) / 1000 +
        " minutes"
    );

  d3.select(".reason-body-list")
    .append("h4")
    .text(
      "To discuss the following items (Total entries - " +
        eventsList.length +
        ")"
    );

  eventsList.sort(function(a, b) {
    return a.Username - b.Username;
  });
  eventsReasonsList = eventsList.map(function(d, i) {
    return d.Username + " :: " + d.Event;
  });

  var ul = d3.select(".reason-body-list").append("ul");
  ul.selectAll("li")
    .data(eventsReasonsList)
    .enter()
    .append("li")
    .html(String);
}

function getIntegratedCircles() {
  var svg = d3.select(".viz-body").select("svg"),
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
    .attr("class", "officeHourDots")
    .on("mouseover", mouseOverCircle)
    .on("mouseout", mouseOutCircle)
    .on("click", clickOnCircle);

  // officeHourDots.append("circle")
  // .attr("class", "officecircles")
  // .attr("cx", function(d) { return d[1]; })
  // .attr("cy", function(d) { return d[2]; })
  // .attr("r", function(d) { return d[5]/7; })
  // .style("fill",  function(d) {return z(d[0]); })
  // .style("fill-opacity", "0.75")

  // officeHourDots
  //   .append("circle")
  //   .filter(function(d, i) {
  //     return d[0] == currentLabel;
  //   })
  //   .attr("class", "officecircles")
  //   .attr("cx", function(d, i) {
  //     return d[1];
  //   })
  //   .attr("cy", function(d) {
  //     return d[2];
  //   })
  //   .attr("r", function(d) {
  //     return (20 * d[3]) / maxRadius;
  //   })
  //   .style("fill", function(d, i) {
  //     return z(d[0]);
  //   })
  //   .style("fill-opacity", "1")
  //   .style("stroke", function(d, i) {
  //     return "black";
  //   });
  // // .style("fill-opacity", "0.50");

  officeHourDots
    .append("circle")
    .attr("class", "officecircles")
    .attr("cx", function(d, i) {
      return d[1];
    })
    .attr("cy", function(d) {
      return d[2];
    })
    .attr("r", function(d) {
      if (d[3] != 0) return (10 * d[3]) / maxRadius + 3;
      else return 0;
    })
    .style("fill", function(d,i) {
      console.log(i,d)
      return z(d[0]);
    })
    .style("stroke", "black");

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

  // var text = d3.select(".text-body-cluster-description");
  // text.text("Cluster Size : " + label.length);

  var heading = [label.length];

  var text = d3
    .select(".text-body-cluster-description")
    .selectAll("text")
    .data(heading);

  text.attr("class", "update");
  text
    .enter()
    .append("text")
    .attr("class", "enter")
    .attr("x", function(d, i) {
      return i * 32;
    })
    .attr("dy", ".35em")
    .merge(text)
    .text(function(d) {
      return "Cluster Size : " + d;
    });

  var text = d3
    .select(".text-body-cluster-content")
    .selectAll("text")
    .data(label);

  text.attr("class", "update");
  text
    .enter()
    .append("text")
    .attr("class", "enter")
    .attr("x", function(d, i) {
      return i * 32;
    })
    .attr("dy", ".35em")
    .merge(text)
    .text(function(d) {
      return originalStudentData[d]["id"] + ", ";
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

  spring2017_date_list.map(function(date_i, i) {
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
      var dist = (s1[i].scores - s2[j].scores) * (s1[i].scores - s2[j].scores);
      DTW[i][j] =
        dist +
        Math.sqrt(Math.min(DTW[i - 1][j], DTW[i][j - 1], DTW[i - 1][j - 1]));
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
    var a = calculateSilhouetteForOneClusterA(clusters, students, labels[d]);
    var b = calculateSilhouetteForOneClusterB(clusters, students, labels, d);
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
      x = x + getSquareDifference(d, e, studentData[e]["values"], clusters[i1]);
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

  var x0 = filterLimits["x0"];
  var x1 = filterLimits["x1"];
  var y0 = filterLimits["y0"];
  var y1 = filterLimits["y1"];

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

  var z = d3.interpolateRdYlBu();
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
  students,
  getLineData
) {
  var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

  var dataSecondary;
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
      return y(d.median);
    });

  var line3 = d3
    .line()
    .x(function(d, i) {
      return x(d.date);
    })
    .y(function(d, i) {
      return y(d.max);
    });

  d3.request("data/spring2017/oh.csv")
    .mimeType("text/csv")
    .response(xhr => d3.csvParseRows(xhr.responseText, d => d))
    .get(function(data) {
      TAdata = data.splice(1).map(function(tad) {
        return {
          Username: tad[0],
          Timestamp: +tad[1],
          Events: tad[2],
          "Time Spent": +tad[3],
          Helped: tad[4]
        };
      });

      TAdata.forEach(function(event) {
        var oldArray = eventsByDate[event["Timestamp"]] || [];
        oldArray.push({
          Username: event["Username"],
          Event: event["Helped"]
        });
        eventsByDate[event["Timestamp"]] = oldArray;
      });

      var data = [];

      columns.splice(1).forEach(function(studentID, id) {
        var object = {};
        object["id"] = studentID;
        object["values"] = [];
        object["values"] = spring2017_date_list.map(function(date, i) {
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
            var index = spring2017_date_list.indexOf(d["Timestamp"]);
            object["values"][index]["hours"] = d["Time Spent"];
          }
        });
        data.push(object);
      });

      TAdata.forEach(function(d, i) {
        overallOHdata[d["Events"]] =
          (overallOHdata[d["Events"]] || 0) + d["Time Spent"] / TAdata.length;
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
      //  idleTimeout,
      //  idleDelay = 10000;

      data = clusterSimilarPerformingStudents(data, labelsOnBasisOfPerformance);

      var officeHourData = data;
      dataSecondary = data;

      var data = [
        { date: parseTime(spring2017_date_list[0]), value: 93.24 },
        {
          date: parseTime(
            spring2017_date_list[spring2017_date_list.length - 1]
          ),
          value: 95.35
        }
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
          console.log(i, d);
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
          // return "black";
        })
        .style("stroke-width", "1.5px")
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
          return "translate(" + x(d.value.date) + "," + y(d.value.hours) + ")";
        })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function(d) {
          return d.id;
        });

      if (getLineData && typeof getLineData == "function") {
        getLineData(originalData, students, dataSecondary);
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
      if (d1.date > x0 && d1.date < x1 && d1.hours < y0 && d1.hours > y1) {
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
        // var medianArray = tadata["values"].map(function(d,i) {
        //  return d.hours;
        // })
        // // console.log(medianArray);
        // medianArray.sort(function(a,b) {
        //  return a-b;
        // })
        // // console.log(medianArray);
        // var mid = Math.round((medianArray.length+1)/2);

        tadata["values"].forEach(function(d, i) {
          result[i]["hours"] =
            result[i]["hours"] + d["hours"] / studentGroup.length;
          // result[i]["median"] = medianArray[mid];
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
    .on("mousemove", mouseMoveOnLine)
    .on("click", clickOnLine);

  studentData.exit().remove();

  studentData
    .append("text")
    .attr("class", "cluster-text-name")
    .datum(function(d) {
      return { id: d.id, value: d.values[d.values.length - 1] };
    })
    .attr("transform", function(d) {
      return "translate(" + x(d.value.date) + "," + y(d.value.scores) + ")";
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

function searchEvents() {
  var input;
  input = document.getElementById("searchEvent");

  d3.select(".reason-body-list")
    .selectAll("ul")
    .remove();

  var ul = d3.select(".reason-body-list").append("ul");
  ul.selectAll("li")
    .data(eventsReasonsList)
    .enter()
    .filter(function(d, i) {
      return d.includes(input.value);
    })
    .append("li")
    .html(String);
}

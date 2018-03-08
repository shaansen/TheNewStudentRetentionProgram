var svg = d3.select("svg"),
    margin = {top: 10, right: 50, bottom: 20, left: 25},
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
    
var tipBox
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
var columns = ["date"]
var irregDatesToRegDates = []
var quartilePreData
var quartilePostData
var numFeatures
var boxplotdata
var originalStudentData
var helpSeekingCSVdata = []
var catWiseStudentData = []
var choices = new Set()
var currentLabel

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


Object.keys(hourSpent).map(function(d,i) {
  catWiseStudentData[hourSpent[d]] = new Set()
})

var filteredSet = []

d3.csv('data/tahours3.csv', function(error, tadata) {

  tadata.forEach(function(d,i) {
    catWiseStudentData[d["Time Spent"]].add(d["Username"])
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

    var completeDateList = getCompleteDateList(dateList)
    var dataForVisualization = convertIrregToReg(dataForVisualization,completeDateList,studentGradeData,calendarData)
    data = dataForVisualization

    students = columns.slice(1).map(function(id) {
      return {
        id: id,
        values: data.map(function(d) {
          return {date: d.date, scores: d[id]};
        })
      };
    });

    clusters = 10
    maxiterations = 25

    studentClusters = kmeans(students,clusters,maxiterations)
    console.log(studentClusters)
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
    // processQuartileData(quartilePreData)
    x.domain(d3.extent(data, function(d) {return d.date; }));

    y.domain([
      d3.min(students, function(c) { return d3.min(c.values, function(d) { return d.scores; }); }),
      d3.max(students, function(c) { return d3.max(c.values, function(d) { return d.scores; }); })
    ]);

    z.domain(students.map(function(c) {return c.total; }));

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

    var tooltip = d3.select("body")
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

    studentData.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.scores) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px")
      .text(function(d) { return d.id; });

  //  listOfEvents.forEach(function(values) {
  //    // create the necessary elements
  //    var br = document.createElement("br");
  //    var label= document.createElement("label");
  //    var description = document.createTextNode(values);
  //    var checkbox = document.createElement("input");

  //    checkbox.type = "checkbox";    // make the element a checkbox
  //    checkbox.name = values;      // give it a name we can check on the server side
  //    checkbox.value = values;         // make its value "pair"
  //    checkbox.id = "event"

  //    label.appendChild(checkbox);   // add the box to the element
  //    label.appendChild(description);// add the description to the element
      
  //    // add the label element to your div
  //    document.getElementById('eventsCheckboxes').appendChild(label);
  //    document.getElementById('eventsCheckboxes').appendChild(br);
  //  })

    Object.keys(hourSpent).forEach(function(values) {
     // create the necessary elements
     var br = document.createElement("br");
     var label= document.createElement("label");
     var description = document.createTextNode(hourSpent[values]);
     var checkbox = document.createElement("input");
     checkbox.id = "hourSpent"

     checkbox.type = "checkbox";    // make the element a checkbox
     checkbox.name = hourSpent[values];      // give it a name we can check on the server side
     checkbox.value = hourSpent[values];         // make its value "pair"

     label.appendChild(checkbox);   // add the box to the element
     label.appendChild(description);// add the description to the element

     // add the label element to your div
     document.getElementById('timeSpentCheckboxes').appendChild(label);
     document.getElementById('timeSpentCheckboxes').appendChild(br);
    })

  /*d3.selectAll("#event").on("change",eventUpdate);
        //eventUpdate();

    function eventUpdate(){
      var choices = [];
        d3.selectAll("#event").each(function(d){
          cb = d3.select(this);
          if(cb.property("checked")){
            choices.push(cb.property("value"));
          } 
        });


      var newfilteredSet
      var newHelpSeekingData
      if(choices.length > 0){
        newHelpSeekingData = helpSeekingCSVdata.filter(function(d,i){return choices.includes(d.event);});
        newfilteredSet = newHelpSeekingData.map(function(d) {return parseInt(d.username)})
      } else {
        newfilteredSet = filteredSet;     
      }

    filteredSet = newfilteredSet

    studentGradeData.forEach(function(d,i) {
      if(filteredSet.length === 0 || filteredSet.includes(parseInt(d.Username))) {
        var total = 0
        for (var i = 0; i < dateList.length; i++) {
          var x = (calendarData[dateList[i]].description)
          var y = (calendarData[dateList[i]].total)
          total = total + d[x]
          d[x] = total/y*100
        }
        if(!columns.includes(d.Username))
          {
            columns.push(d.Username)
          }
      }
    })

    // ----------------------------------------------------------------------------------------------
    // Below code contains the logic to transform the student data into time based data that will be used to create the visualization
    var dataForVisualization = []

    var students = columns.slice(1).map(function(id) {
      return {
        id: id,
        values: data.map(function(d) {
          return {date: d.date, scores: d[id]};
        })
      };
    });

    x.domain(d3.extent(data, function(d) {return d.date; }));

    y.domain([
      d3.min(students, function(c) { return d3.min(c.values, function(d) { return d.scores; }); }),
      d3.max(students, function(c) { return d3.max(c.values, function(d) { return d.scores; }); })
    ]);

    z.domain(students.map(function(c) { return c.id; }));

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

    var tooltip = d3.select(".viz-body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")

    var studentData = g.selectAll(".studentData")
      .data(students)
      .enter().append("g")
      .attr("class", "studentData");

    studentData.exit()
      .remove(); 

    studentData.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return z(d.id); })
      .style("stroke-width", "2px")
      .on("mouseover", mouseOverFunction)
      .on("mouseout", mouseOutFunction)
      .on("mousemove", mouseMoveFunction)

    studentData.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.scores) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px")
      .text(function(d) { return d.id; });

    }*/

    d3.selectAll("#hourSpent").on("change",hourSpentUpdate);
    hourSpentUpdate();

    function hourSpentUpdate(){
         d3.selectAll("#hourSpent").each(function(d){
          cb = d3.select(this);
          if(cb.property("checked")){
            choices.add(cb.property("value"));
          } else {
            choices.delete(cb.property("value"));
          }
        });
         getBoxPlotData()
    }


    function mouseOutFunction() {
      d3.select(this)
        .style("stroke-width","2px")   

      tooltip.style("visibility", "hidden") 
    }

    function mouseOverFunction(d,i) {
      d3.select(this)
        .style("stroke-width","10px") 
      currentLabel = labels[i]
      boxplotdata = getBoxPlotData()

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

    
    function getEventName(year) {
      var y = new Date(year)
      y.setHours( 0,0,0,0 )
      return calendarData[irregDatesToRegDates[y].yyyymmdd()]["description"] + " - "+y.getMonth()+"/"+y.getDay()+"/"+y.getFullYear()
    }

    Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
           ].join('');
    };
  });
})



  function type(d, _, columns) {
    d.date = parseTime(d.date);
    for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
    return d;
  }

  // ----------------------------------------------------------------------------------------------
  // Reads in all the Events at the Irregular Dates and converts them to Regular Spaced Dates
  // The purpose of this conversion is to use it for DTW Clustering
  function convertIrregToReg(dataForVisualization,completeDateList,studentGradeData,calendarData) {

    var dataForVisualization = []
    var date_j = 0;
    completeDateList.forEach(function(date_i,i) {
        var element = {}
        irregDatesToRegDates[parseTime(date_i)] = parseTime(dateList[date_j])
        element["date"] = parseTime(date_i)
        if(parseTime(date_i) >= parseTime(dateList[date_j+1]-1)) {
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
    var dateSet = new Set()
    var completeDateList = []
    while(parseTime(date_i) <= parseTime(dateList[dateList.length-1])) {
      if(!dateSet.has(parseTime(date_i).toString())) {
        dateSet.add(parseTime(date_i).toString())
        completeDateList.push(date_i);
      }
      date_i = date_i + 1
    }
    return completeDateList
  }


  // ----------------------------------------------------------------------------------------------
  // 
  //   
  // ----------------------------------------------------------------------------------------------
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
    console.log("Labels")
    console.log(labels)
    return centroids
  }
  
  function getRandomCentroids(numFeatures, k) {
    var result = []
    for (var i = 0; i < k; i++) {
      result[i] = []
      numFeatures.map(function(d) {
        var x = {}

        x["date"] = d;
        x["scores"] = Math.random()*100;
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

  function getCentroids(dataset, labels, k) {

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
          x["scores"] = Math.random()*100;
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
            y = y * dataset[d1]["values"][i1]["scores"]
            quartilePreData[i][d].push(dataset[d1]["values"][i1]["scores"])
          });
          x["scores"] = Math.pow(y,1/labels[i].length)
          result[i].push(x)

          // var y = 0
          // labels[i].forEach(function(d1) {
          //   y = y + dataset[d1]["values"][i1]["scores"]
          //   quartilePreData[i][d].push(dataset[d1]["values"][i1]["scores"])
          // });
          // x["scores"] = y/labels[i].length
          // result[i].push(x)
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
      result = result + Math.sqrt(Math.abs(arr1[i].scores - arr2[i].scores))
    })
    return result
  }

function getBoxPlotData() {

  arr = getFilteredUsers(currentLabel,choices)
  
  var t = d3.transition()
      .duration(750);

  var result = arr.map(function(d) {
    var x = {}
    originalStudentData[d]["values"].forEach(function(e) {
        x[e.date]= e.scores
    })
    return x
  })

  d3.selectAll(".box").remove()

  var box_labels = true
  var box_margin = {top: 10, right: 50, bottom: 20, left: 50}
  var box_width = 1500 - box_margin.left - box_margin.right
  var box_height = 300 - box_margin.top - box_margin.bottom
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
    for (var i = 0; i < originalStudentData.length; i++) {
      if(originalStudentData[i]["id"] == student && currentLabel.includes(i)) {
        return i
      }
    }
    return -1
  }
}
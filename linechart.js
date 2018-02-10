var svg = d3.select("svg"),
    margin = {top: 10, right: 50, bottom: 20, left: 25},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemePastel1);

var yellow = d3.interpolateYlGn(), // "rgb(255, 255, 229)"
    yellowGreen = d3.interpolateYlGn(0.5), // "rgb(120, 197, 120)"
    green = d3.interpolateYlGn(1); // "rgb(0, 69, 41)"

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.scores); });
    
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

var helpSeekingCSVdata = []
var listOfEvents = ["HW1","LAB2","OTHERS","HW2","HW3","LAB3","LAB4","HW4","LAB5","PROJ1","LAB6","LAB7",
                    "Midterm","HW5","LAB8","PROJ2","LAB9","HW6","LAB10","PROJ3","LAB13"]
var hourSpent = {
  1: "< 5 minutes",
  2: "6 - 15 minutes",
  3: "16 - 30 minutes",
  4: "31 - 60 minutes",
  5: "> 60 minutes",
}
var filteredSet = []


d3.csv('data/tahours2.csv')
  .row(function(d) {
    return {
      username: d["Username"],
      timeStamp: new Date(d["Timestamp"]),
      event: d["Events"],
      TimeSpentCat: d["Time Spent"],
      description: d["Time Helped"]
    };
  })
  .get(function(error, csv) {
    if (!error) {
      csv.forEach(function(d,i) {
        helpSeekingCSVdata.push(d)
      });
    } else {
      // handle error
    }
  });


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

// Below code contains the logic to transform the student data into time based data that will be used to create the visualization
  
  var completeDateList = getCompleteDateList(dateList)
  var dataForVisualization = convertIrregToReg(dataForVisualization,completeDateList,studentGradeData,calendarData)
  data = dataForVisualization



  var students = columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {date: d.date, scores: d[id]};
      }),
      /*total: studentGradeData.find(function(d,i) {
        return id==d["Username"]
      })["TOTAL%"]*/
    };
  });


  clusters = 10
  maxiterations = 10

  studentClusters = kmeans(students,clusters,maxiterations)

  var clusteredData = studentClusters.map(function(d,i) {
    return {
      id: "C"+i,
      values: d
    };
  })


  students = clusteredData
  processQuartileData(quartilePreData)
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
  //     var g = Math.floor((x/Object.keys(labels).length*456)%255);
  //     var b = Math.floor((x/Object.keys(labels).length*789)%255);
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

// Object.keys(hourSpent).forEach(function(values) {
//  // create the necessary elements
//  var br = document.createElement("br");
//  var label= document.createElement("label");
//  var description = document.createTextNode(hourSpent[values]);
//  var checkbox = document.createElement("input");
//  checkbox.id = "hourSpent"

//  checkbox.type = "checkbox";    // make the element a checkbox
//  checkbox.name = hourSpent[values];      // give it a name we can check on the server side
//  checkbox.value = hourSpent[values];         // make its value "pair"

//  label.appendChild(checkbox);   // add the box to the element
//  label.appendChild(description);// add the description to the element

//  // add the label element to your div
//  document.getElementById('timeSpentCheckboxes').appendChild(label);
//  document.getElementById('timeSpentCheckboxes').appendChild(br);
// })

d3.selectAll("#event").on("change",eventUpdate);
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

  var tooltip = d3.select("body")
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

  }

d3.selectAll("#hourSpent").on("change",hourSpentUpdate);
      hourSpentUpdate();

  function hourSpentUpdate(){
    var choices = [];
      d3.selectAll("#hourSpent").each(function(d){
        cb = d3.select(this);
        if(cb.property("checked")){
          choices.push(cb.property("value"));
        }
      });
  }


  function mouseOutFunction() {
    d3.select(this)
      .style("stroke-width","2px")   

    tooltip.style("visibility", "hidden") 
  }

  function mouseOverFunction() {
    d3.select(this)
      .style("stroke-width","10px")   
  }

  function mouseMoveFunction() {
    var year = x.invert(d3.mouse(this)[0])
    var y = getEventName(year)
    tooltip.style("top", (event.pageY-30)+"px")
    .style("left",(event.pageX-10)+"px")
    .text(y)
    .style("background-color","grey")
    .style("padding","5px 5px 5px 5px")
    .style("color","white")

  }

  
  function getEventName(year) {

    var y = new Date(year)
    y.setHours( 0,0,0,0 )
    return calendarData[irregDatesToRegDates[y].yyyymmdd()]["description"]
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
      var min = Infinity

      for (var j = 0; j < centroids.length; j++) {
        var dist = DTWDistance(dataset[id]["values"],centroids[j])
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
     DTW[i][0] = 100
    }
    for(var i=1;i<s2.length;i++) {
     DTW[0][i] = 100
    }
    
    for (var i = 1; i < s1.length; i++) {
      for (var j = 1; j < s2.length; j++) {
        var dist = (s1[i].scores - s2[j].scores)*(s1[i].scores - s2[j].scores)
        DTW[i][j] = dist + Math.min(DTW[i-1][j],DTW[i][j-1],DTW[i-1][j-1]);
      }
    }

    return Math.sqrt(DTW[s1.length-1][s2.length-1])

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


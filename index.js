var svg = d3.select(".studentDataSVG"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var columnsInData
var clusteredData

var parseTime = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory20);

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.grades); });

let studentData;
//d3.csv("data/actualdata.csv", type, function(error, data) {
d3.csv("data/grades.csv", type, function(error, csvData) {
  if (error) throw error;

  var data = csvData

  var students = Object.keys(data[0]).slice(3).map(function(id) {    return {
      id: id,
      values: data.map(function(d) {
        return {date: d.date, grades: d[id]};
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(students, function(c) { return d3.min(c.values, function(d) { return d.grades; }); }),
    d3.max(students, function(c) { return d3.max(c.values, function(d) { return d.grades; }); })
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
      .text("Grades");

  var city = g.selectAll(".city")
    .data(students)
    .enter().append("g")
      .attr("class", "city");

  city.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke-width",function(d,i) { return "2px"})
      .style("stroke",function(d,i) { return z(d.id)} )
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)

  city.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.grades) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .text(function(d,i) { return d.id; });



function handleMouseOver(d, i) {  // Add interactivity
  // Use D3 to select element, change color and size
  d3.select(this)
   .style("stroke-width","20px")  
}

function handleMouseOut(d, i) {
// Use D3 to select element, change color back to normal
  d3.select(this)
  .style("stroke-width","2px")    
};

});


function type(d, _, columns) {
  d.date = parseTime(d.date);
  for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
  return d;
}

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

function transformCSVToUsefulStuff(d) {
  let keys = []
  // To split the keys in the CSV to Date and Events
  for (k in columnsInData) {
    var x = columnsInData[k].split("-")
    var y = {}
    y["date"] = new Date(x[0].slice(0,4),x[0].slice(4,6)-1,x[0].slice(6,8))
    y["dateInt"] = x[0]
    y["event"] = x[1]
    keys.push(y);  
  }
 
  // To get cummulative scores and calculate the maximum of every test
  var total = []
  var max = Array.apply(null, Array(keys.length)).map(Number.prototype.valueOf,0);
  for(var i=0;i<d.length;i++) {
    var x = (d[i]["Username"]+"-"+d[i]["Sec No"])
    total[i] = 0;
    for(var j=0;j<keys.length;j++) {
      var y = (keys[j]["dateInt"]+"-"+keys[j]["event"])
      total[i] = total[i] + d[i][y]
      keys[j][x] = total[i]
      d[i][y] = total[i]
      max[j] = Math.max(max[j],total[i])
    }  
  }


  // To calculate the normalized scores of all the candidates
  for(var i=0;i<d.length;i++) {
    var x = (d[i]["Username"]+"-"+d[i]["Sec No"])
    for(var j=0;j<keys.length;j++) {
      var y = (keys[j]["dateInt"]+"-"+keys[j]["event"])
        keys[j][x] = (d[i][y]/max[j])*100
    }    
  }

  // Sorting the keys objects on the basis of dates
  keys.sort(function(a,b) {return a.date-b.date} )
  return keys
}


// Function that calls the k-means algorithm
function getDataAfterClustering(data,noOfKs,maxIterations) {
  var centroids = kmeans(data,noOfKs,maxIterations)
  return centroids
}

// K-Means driver function
function kmeans(dataset,k,maxIterations) {
  var numFeatures = dataset.columns.slice(3)
  var centroids = getRandomCentroids(numFeatures,k)
  var iterations = 0
  var oldCentroids
  
  while(!shouldStop(oldCentroids,centroids,iterations,maxIterations)) {
    oldCentroids = centroids
    iterations = iterations + 1
    var labels = getLabels(dataset,centroids)
    centroids = getCentroids(dataset,labels,k,numFeatures)
  }
  return centroids
}

// Should-Stop terminates the iterations
function shouldStop(oldCentroids,centroids,iterations,maxIterations) {
  if(iterations == maxIterations) {
    return true
  }
  return oldCentroids == centroids
}

// Returns k random centroids
function getCentroids(dataset,labels,k,numFeatures) {

  var newCentroids = []

  for (var i = 0; i < k; i++) {
    if(labels[i].length==0) {
      newCentroids[i] = randomReInitialize(numFeatures,i,k)

    } else {
      newCentroids[i] = computeGeometricCentroids(dataset,labels[i],numFeatures)
    }
    newCentroids[i]["Username"] = i
    newCentroids[i]["Sec No"] = 1
    newCentroids[i]["dataset"] = labels[i]
  }
  return newCentroids;
}

function computeGeometricCentroids(d,l,numFeatures) {
  var result = {}

  for(var i = 0;i < numFeatures.length;i++) {
    var total = 1
    for (var j = 0; j < l.length; j++) {
      total = total + d[l[j]][numFeatures[i]]
    }  
    result[numFeatures[i]] = Math.floor(total/l.length) 
  }
  
  return result
}

// Returns a label for each piece of data in the dataset.
function getLabels(dataset, centroids) {
  var labelData = []

  for(var j = 0; j < centroids.length; j++) {
    labelData[j] = []
  }

  for (var i = 0; i < dataset.length; i++) {
    var min_element = 1000;
    var min_index   = 1000;
    for(var j = 0; j < centroids.length; j++) {
      var distance = getDistance(dataset[i],centroids[j])
      if(distance < min_element) {
        min_element = distance
        min_index   = j
      }
    }
     
    labelData[min_index].push(i);
  }
  return labelData
}

function getDistance(d,c) {
  var total = 0
  for (var i = 0; i < columnsInData.length; i++) {
    total = total + (c[columnsInData[i]]-d[columnsInData[i]])*(c[columnsInData[i]]-d[columnsInData[i]])
  }
  return Math.sqrt(total/columnsInData.length)
}

function getRandomCentroids(numFeatures,k) {
  var x = [];
  for(var i=0;i<k;i++) {
    x[i] = randomReInitialize(numFeatures,i,k)    
  }
  return x
}

function randomReInitialize(numFeatures,i,k) {
  var x = {}

  for(var j=0;j<numFeatures.length;j++) {
    // var y = Math.floor((Math.random()*2) + 10)
    var y = (i+1)/k*100
    x[numFeatures[j]] = y
  }
  return x 
}

function uniformReInitialize(numFeatures,i,k) {
  var x = {}

  for(var j=0;j<numFeatures.length;j++) {
    var y = Math.floor((Math.random() * 20) + 10)
    x[numFeatures[j]] = y
  }
  return x 
}

function getNormalizedData(csvData) {
  console.log(columnsInData)
  return csvData;
}
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

d3.csv("data/temperature4.csv", type, function(error, data) {
  if (error) throw error;

  var dataToRepresent = data.columns.slice(1).map(function(id) {
    return {
      id: id,
      values: data.map(function(d) {
        return {date: new Date(d.date), temperature: d[id]};
      })
    };
  });


  clusters = 2
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
  // dataToRepresent = clusteredData
 
  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(dataToRepresent, function(c) { return d3.min(c.values, function(d) { return d.temperature; }); }),
    d3.max(dataToRepresent, function(c) { return d3.max(c.values, function(d) { return d.temperature; }); })
  ]);

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

  // city.append("path")
  //     .attr("class", "line")
  //     .attr("d", function(d) { return line(d.values); })
  //     .style("stroke", function(d) { return z(d.id); })
  //     .on("mouseover", mouseOverFunction)
  //     .on("mouseout", mouseOutFunction)
  //     .on("mousemove", mouseMoveFunction)

  city.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d,i) {
      var x = getRGBIndex(i)
      var r = Math.floor((x/Object.keys(labels).length*123)%255);
      var g = Math.floor((x/Object.keys(labels).length*345)%255);
      var b = Math.floor((x/Object.keys(labels).length*567)%255);
      return "rgb("+r+","+g+","+b+")"
    })
    .style("stroke-width", "2px")
    .on("mouseover", mouseOverFunction)
    .on("mouseout", mouseOutFunction)
    .on("mousemove", mouseMoveFunction)

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
    .style("stroke-width","5px") 
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
  // console.log(numFeatures)
  
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
      x["temperature"] = Math.random()*30;
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
        x["temperature"] = Math.random()*100;
        //quartilePreData[i][d] = []
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
        //   quartilePreData[i][d].push(dataset[d1]["values"][i1]["temperature"])
        // });
        // x["temperature"] = Math.pow(y,1/labels[i].length)
        // result[i].push(x)

        var y = 0
        labels[i].forEach(function(d1) {
          y = y + dataset[d1]["values"][i1]["temperature"]
          quartilePreData[i][d].push(dataset[d1]["values"][i1]["temperature"])
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
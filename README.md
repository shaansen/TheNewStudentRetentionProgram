Getting Started with Student Retention Tool
---------------------------------------------
Author	- Shantanu Sengupta
Date	- 15 July 2017
For additional queries and bugs: Please email at ssen1@umbc.edu


Application
-------------
To help instructors explore class performance through a semester and understand if the effects of office hour attendance on student grades.


Input Files
-------------
1. Grades File
2. Office Hours (OH) File
3. Calendar File

To see the sample files for each of the types - Please view the folder : samples/ 


How to Use
------------
1. Run the index.html file using a browser, preferably Firefox
2. On the left panel, click on the "Upload" sub-panel to maximize it.
3. Upload the three input file in the same format as the sample files
4. Choose the category of students you would like to visualize using the radio buttons
5. When done uploading the files and choosing the category type, click on the "Render" button. It may take a few minutes to render the visualization.


Features
----------
The left panel consists of following sub-panels
1. Upload files : This allows the user to upload the necessary files and choose the student category.
2. View Type 	: This allows the user to choose the type of view, depending on the purpose of the exploration.
3. Legends		: This panel gives information on the student clusters along with the number of data points in each cluster. 
4. View Members	: This panel gives information on the members of the cluster that is being selected by the user.
5. Comparison	: This allows the user to compare the characteristics of the selected cluster with the class average.


VIEW TYPE
-----------
There are four view types available to the user
1. None : This removes the previously selected exploratory options from the visualization and allows the user to explore from scratch.
2. Highlight Numbers : This allows the user to view both the office hours and grades visualization and see the actual values in the graph.
3. Distribution : This allows the user to see the distribution of data within a cluster.
4. Correlation : This allows the user to see the correlation between the office hour attendance and the class performance.
There is an option called "Event Pillars" that allows the user to install pillars in the visualization marking events in the semester.



Use Case #1 : Observing the Overall Performance of the Clusters
-----------------------------------------------------------------
1. After uploading the input files and clicking the "Render" button, the visualization created can be used to view the overall performance of the class.
2. For seeing the events in the semester, you can enable the "Event Pillars" button.
3. For viewing the actual numbers of the values in the graph, enable the "Highlight Numbers" radio button.



Use Case #2 : Observing the Distribution of the Clusters
-----------------------------------------------------------------
1. After uploading the input files and clicking the "Render" button, the visualization created can be used to view the overall performance of the class.
2. To start viewing the distribution, enable the "Distribution" radio button.
3. Click on the required cluster to see its distribution. 
4. To disable the distribution view, enable the "None" radio button



Use Case #3 : Observing the Correlation between Student Performance and Office Hour attendance
------------------------------------------------------------------------------------------------
1. After uploading the input files and clicking the "Render" button, the visualization created can be used to view the overall performance of the class.
2. For seeing the correlation of the office hour attendance in the student performance visualization panel, you can enable the "Correlation" radio button.
3. This button enables all the events from the Office hour panel into the Student performance panel. Each circle is marked by the same color as its cluster. The size of the circle is proportional to the average of the office hours attended by people in that cluster at that time.
4. Click on any circle to view additional details.
5. On Clicking a circle, an additional panel is rendered below the student performance panel.
6. This panel gives additional information of the details occuring on that day pertaining to that cluster. It can give additional details such as Time of Entry, Time Student was Helped, Time Student was done, Time spent personally by that student for that task.
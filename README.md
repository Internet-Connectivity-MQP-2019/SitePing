# Mapping Internet Connectivity

Team:
* [Evan Goldstein](https://github.com/evanbg-wpi)
* [David Vollum](https://github.com/davidvollum)
* [Sam Goldman](https://github.com/samgoldman)
* [Chris Myers](https://github.com/c7c8)


## About this project
URL: https://connention-to-the.net

This project - original started by David, Evan, and Sam for our final CS4241-Webware project - is a major component of our MQP designed to measure internet connectivity.
What this site does in particular is, with the user's permission, repeatedly load small resources (originally favicons, which is why there are references to them everywhere) from 45 of the top 50 websites
in the country (as determined by Alexa rankings). We specifically add a randomized parameter to the favicon to ensure that it isn't cached and record the time it took to load, which is a form of RTT. This essentially gets us a "ping" from the user to the website.
The idea is that we distribute this across the country, get people to load and run the page, collecting data.
Server side, we collect the clients IP address and use a third party database from MaxMind to geolocate the user. We also use the browser location API and if available, the NetworkInformation API to augment our data.
In an effort to entice people to do so, the site displays live data to the user in two forms:

1. On the left is a bar graph that displays a rolling average of the last 10 "pings". After each batch of pings is run, this graph updates with the new data, automatically sorting based on the average.
2. On the right is a map that displays the country wide data aggregated by city. Users can select between two maps: one that shows data from devices connected to mobile networks and one with data from all other devices. These maps updates as soon as new data is published to the server.

Note: to collect data and see the bar chart in action, you must click "Start" and agree to collect data.

## Technologies Used
* D3.js: we used D3.js for both of the data displays on the page. Both include live updating data and the bar graph includes animations for a smoother experience.
* Socket.io: we used socket.io to transfer the data to and from the server, allowing the server to notify _any_ client connected when _one_ client posts new data. This is essential for the live updating aspect.
* Webpack: we used webpack for bundling javascript. We had to create two bundles because there is a second page built specifically for the demo that allows us to delete all data in the database, but we didn't want this capability published in the main bundle.
* Geocoding API: we used a geocoding API from Texas A&M to look up cities to aggregate by in case of MaxMind unreliability
* MongoDB: we used MongoDB to store all data
* Bootstrap: used for styling and for responsiveness on mobile
* AWS: the site is hosted on AWS

## Template email

Hello PERSON,

I am currently in the middle of my culminating senior project called my (MQP).
My team and I are working to map internet connectivity across the US. One method data collection method involves distributing a website to volunteers (like yourself), across the US and asking them if we can collect data about your internet speeds. 
With these techniques we will map internet connectivity across the United States, providing valuable information to network architects, everyday users of the internet, and many others.
No personally identifying information except for your approximate location (accurate only to +/- 5 miles) and IP address will be collected.

To help us out, open this link, <a href=https://connection-to-the.net>connection-to-the.net</a>, and click the green start button.
In order to collect data most effectively, please leave the site open for at least 5 minutes. If you have any questions feel free to reach out to me at EMAIL. 

Thank you so much for your help,
 

SENDERS NAME

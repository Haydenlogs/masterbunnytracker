const express = require("express");
const http = require('http');
const WebSocket = require('ws');
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const session = require("express-session");
const fetch = require("node-fetch");
const app = express();
app.locals.clients = []; // Initialize clients array
async function sendMessageToWebhook(message) {
  const webhookUrl =
    "https://discord.com/api/webhooks/1213932233971204238/f6wIr0PPCAOhWg_4-AZBw2b6oknGabpuk41BfcZjCAOXCWUkB5WdyO4WsiJoF3oL8s_S";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "<@&1213936947156881448> "+message,message,
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to send message to webhook: ${response.statusText}`
      );
      return;
    }

    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message to webhook:", error);
  }
}
async function sendMessageToWebhook2(message) {
  const webhookUrl =
    "https://discord.com/api/webhooks/1213934842396549140/KrTMuFx1kPHHI7ghkZazbzPPAlN2ItKWmVq6vSTMlQNz8h0Q36KgnfRG1-ZKFncfL0NF";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "<@&1213936810015588372> "+message,
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to send message to webhook: ${response.statusText}`
      );
      return;
    }

    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message to webhook:", error);
  }
}
let lastcountries = "Bunny went to the places of: ";
let cities = [];
let currentIndex;
let isTrackerStarted = false;
let maxpresents = 8092411974;
let lastCity;
let startTime;
let started = false;
const intervalInSeconds = 8.02;
let trackerInterval;
const countdownDate = new Date("2024-03-31T08:00:00Z");
// Define the time intervals for each task in milliseconds (in CST)
const taskIntervals = {
  "/restarttracker": 13 * 60 * 60 * 1000 + 31 * 60 * 1000, // 1:27:00 PM
  "/resetbaskets": 13 * 60 * 60 * 1000 + 31 * 60 * 1000, // 1:27:00 PM
  "/unlock": 13 * 60 * 60 * 1000 + 31 * 60 * 1000, // 1:27:00 PM
  "/message1set": 13 * 60 * 60 * 1000 + 31 * 60 * 1000, // 1:27:00 PM
  "/message2set": 13 * 60 * 60 * 1000 + 31 * 60 * 1000, // 1:27:00 PM
  "/message3set": 13 * 60 * 60 * 1000 + 27 * 60 * 1000, // 1:27:00 PM
  "/message4set": 13 * 60 * 60 * 1000 + 27 * 60 * 1000, // 1:27:00 PM
  "/starttracker": 13 * 60 * 60 * 1000 + 27 * 60 * 1000, // 1:27:00 PM
};
// Endpoint to set the countdown date
app.post("/setcountdowndate", (req, res) => {
  // Assuming the client sends the countdown date in the request body
  const { date } = req.body;

  // Validate the date format (you may need to adjust this based on your requirements)
  if (isValidDate(date)) {
    countdownDate = new Date(date);
    res.send("Countdown date set successfully.");
  } else {
    res.status(400).send("Invalid date format. Please provide a valid date.");
  }
});
// Endpoint to send a message to live chat via SSE
app.get('/chatsend', (req, res) => {
  const { message } = req.query;
  
  if (!message) {
    return res.status(400).send('Message parameter is required');
  }

  // Send the message to all connected clients
  sendSSEUpdate({ message });

  res.status(200).send('Message sent to live chat');
});

// Endpoint to establish SSE connection for live chat updates
app.get('/livechat', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Date.now(), res };
  app.locals.clients.push(client);

  // Remove the client when the connection is closed
  req.on('close', () => {
    console.log('SSE connection closed');
    app.locals.clients = app.locals.clients.filter(c => c.id !== client.id);
  });
});

// Function to send SSE updates to all connected clients
function sendSSEUpdate(data) {
  app.locals.clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Function to validate date format
function isValidDate(dateString) {
  // Regular expression to match date format (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return dateString.match(datePattern);
}
function isSameMonthAsCountdown(date) {
  return date.getMonth() === countdownDate.getMonth();
}
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let activeUsers = 0;

// WebSocket connection handler
wss.on('connection', (ws) => {
    activeUsers++;
    console.log('New user connected. Active users:', activeUsers);

    // Handle WebSocket connection close event
    ws.on('close', () => {
        activeUsers--;
        console.log('User disconnected. Active users:', activeUsers);
    });
});

// Route to return the number of active users
app.get('/getactiveusers', (req, res) => {
    res.json({ activeUsers });
});
// Endpoint to get the countdown date
app.get("/getcountdowndate", (req, res) => {
  if (countdownDate) {
    res.send(countdownDate.toISOString()); // Sending the date in ISO string format
  } else {
    res.status(404).send("Countdown date not set.");
  }
});

let isscheduled = true;
// Function to execute a task
function executeTask(taskUrl) {
  console.log(`Executing task: ${taskUrl}`);

  // Perform specific actions based on the task URL
  if (taskUrl === "/restarttracker") {
    currentIndex = 0;
    saveIndexToFile(); // Save the index to file
  } else if (taskUrl === "/resetbaskets" || taskUrl === "/resetbaskets_next") {
    currentIndex = 0;
    fs.writeFileSync("giftsdelivered.json", "[]");
  } else if (taskUrl === "/unlock") {
    isLocked = false;
    sendTrackerEvent({ unlocked: true });
    saveTrackerStatusToFile(true);
  } else if (taskUrl === "/message1set") {
    // Perform actions for setting message 1
    fs.writeFile(
      "message.txt",
      "Weather on Easter Island is indicating perfect weather for traveling.",
      (err) => {
        if (err) {
          console.error("Error setting message 1:", err);
        } else {
          sendTrackerEvent({
            messageupdate:
              "Weather on Easter Island is indicating perfect weather for traveling.",
          });
        }
      }
    );
  } else if (taskUrl === "/message2set") {
    // Perform actions for setting message 2
    fs.writeFile(
      "message.txt",
      "Are you ready? Easter Bunny is expected to launch within the hour.",
      (err) => {
        if (err) {
          console.error("Error setting message 2:", err);
        } else {
          sendTrackerEvent({
            messageupdate:
              "Are you ready? Easter Bunny is expected to launch within the hour.",
          });
        }
      }
    );
  } else if (taskUrl === "/message3set") {
    // Perform actions for setting message 3
    fs.writeFile("message.txt", "Easter Bunny is about to launch.", (err) => {
      if (err) {
        console.error("Error setting message 3:", err);
      } else {
        sendTrackerEvent({
          messageupdate: "Easter Bunny is about to launch.",
        });
      }
    });
  } else if (taskUrl === "/message4set") {
    // Perform actions for setting message 4
    fs.writeFile("message.txt", "Easter Bunny is Launching!", (err) => {
      if (err) {
        console.error("Error setting message 4:", err);
      } else {
        sendTrackerEvent({
          messageupdate: "Easter Bunny is Launching!",
        });
      }
    });
  } else if (taskUrl === "/starttracker") {
    currentIndex = 0;
    saveIndexToFile(); // Save the index to file
  } else if (taskUrl === "/endtracker") {
    // Perform actions for ending the tracker
    isTrackerStarted = false;
    clearInterval(trackerInterval);
    sendTrackerEvent({ ended: true });
    saveTrackerStatusToFile(false);
  } else if (taskUrl === "/restarttracker_next") {
    currentIndex = 0;
    saveIndexToFile(); // Save the index to file
  } else if (taskUrl === "/lock") {
    // Perform actions for locking
    isLocked = true;
    sendTrackerEvent({ locked: true });
    saveTrackerStatusToFile(true);
  }
}

function scheduleTasks() {
  setInterval(() => {
    // Get the current time in UTC
    const currentTime = new Date();
    const currentHour = currentTime.getUTCHours();
    const currentMinute = currentTime.getUTCMinutes();
    const currentSecond = currentTime.getUTCSeconds();

    // Iterate over each task and check if it's time to execute
    Object.entries(taskIntervals).forEach(([taskUrl, interval]) => {
      // Extract scheduled hour, minute, and second from the interval
      const scheduledHour = Math.floor(interval / (60 * 60 * 1000));
      const scheduledMinute = Math.floor(
        (interval % (60 * 60 * 1000)) / (60 * 1000)
      );
      const scheduledSecond = Math.floor((interval % (60 * 1000)) / 1000);

      // Check if the current time matches the scheduled time for the task
      if (
        currentHour === scheduledHour &&
        currentMinute === scheduledMinute &&
        currentSecond === scheduledSecond &&
        !isscheduled
      ) {
        executeTask(taskUrl);
        isscheduled = true;
      }
    });

    // Reset isscheduled flag after each iteration
    isscheduled = false;
  }, 1000); // Check every second
}

// Function to save the current index to a file
function saveIndexToFile() {
  fs.writeFileSync("currentIndex.txt", currentIndex.toString());
  console.log("Current index saved to file:", currentIndex);
}

async function dosomethingtorefresh() {
  sendTrackerEvent({ refresh: true });
}
async function readCitiesFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const lines = data.trim().split("\n");
      cities = lines.map((line) => {
        const [city, country, latitude, longitude] = line.split(",");
        return {
          city,
          country,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      });

      console.log("Cities loaded:", cities.length);
      resolve();
    });
  });
}

// Function to read the current index from a file
async function readIndexFromFile() {
  try {
    const indexData = await fs.promises.readFile("currentIndex.txt", "utf8");
    const currentIndex = parseInt(indexData);
    console.log("Current index read from file:", currentIndex);
    return currentIndex;
  } catch (err) {
    console.error("Error reading index from file:", err);
    return 0; // Return 0 if there's an error reading the file
  }
}
async function startTracker(filePath) {
  if (!isTrackerStarted) {
    try {
      await readCitiesFromFile(filePath); // Wait for cities to be loaded
      currentIndex = await readIndexFromFile(); // Read index from file
      isTrackerStarted = true;
      if (currentIndex > 1) {
        // If currentIndex is greater than 1, start from that index
        for (let i = 0; i < currentIndex - 1; i++) {
          addToGiftsDelivered(cities[i]); // Add a basket for each city before the current index
        }
      }
      sendNextCity();
      trackerInterval = setInterval(() => {
        sendTrackerUpdate();
        const now = new Date();
        if (now.getMinutes() === 0 && now.getSeconds() === 0) {
          console.log("New hour");
          sendMessageToWebhook2(lastcountries);
          lastcountries = "Bunny went to the places of: "
          // You can send a message to the webhook here if needed
        }
      }, 1000); // Update tracker every second

      sendTrackerStartEvent(); // Send SSE event when the tracker starts
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  }
}
let presentsDelivered;
function updatePresentsDelivered(currentIndex) {
  presentsDelivered = Math.floor((currentIndex / cities.length) * maxpresents); // Calculate presents delivered
  // Update presents delivered every 10 milliseconds
  presentsDelivered = Math.floor((currentIndex / cities.length) * maxpresents); // Recalculate presents delivered
  sendTrackerEvent({ presentsDelivered: presentsDelivered }); // Send server update
}

function sendNextCity() {
  if (isTrackerStarted && currentIndex < cities.length) {
    const city = cities[currentIndex];
    if (city.city && city.country) {
      const cityInfo = {
        city: city.city,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
      };
      lastcountries = lastcountries + city.country + ", " + city.city + " | ";
      app.set("currentCity", cityInfo);
      lastCity = cityInfo; // Update lastCity when sending a new city
      startTime = Date.now(); // Set the start time when sending a new city
      console.log("Sent next city:", cityInfo);
      currentIndex++; // Increment currentIndex after sending the city
      saveIndexToFile(); // Save current index to file
      sendMessageToWebhook(
        "Satellites are saying that Easter Bunny will be going to **" +
          city.city +
          ", " +
          city.country +
          "**"
      );
      sendTrackerEvent({ newbasket: cityInfo }); // Include presentsDelivered in the event

      if (currentIndex <= 36) {
        let zoomOut = currentIndex >= 37;
        sendTrackerEvent({ santaMoving: true, zoomOut: zoomOut });
    } else {
        sendTrackerEvent({ santaMoving: true });
    }
    

      // Add delivered location to JSON file
      addToGiftsDelivered(cityInfo);
      console.log(cityInfo);

      setTimeout(sendNextCity, intervalInSeconds * 1000); // Wait for intervalInSeconds before sending the next city
    } else {
      currentIndex++; // Increment currentIndex even if city information is missing
      sendNextCity(); // Continue to the next city
    }
  } else {
    // If currentIndex is equal to or greater than cities.length, end the tracker
    isTrackerStarted = false;
    console.log("Tracker ended.");
    sendTrackerEvent({ trackerEnded: true }); // Send trackerEnded event
    app.set("currentCity", null);
    lastCity = null; // Reset lastCity when the tracker ends
    clearInterval(trackerInterval); // Stop the tracker interval
  }
}

// Endpoint to get the last city coordinates
app.get("/getlastcords", (req, res) => {
  if (lastCity) {
    res.json({
      latitude: lastCity.latitude,
      longitude: lastCity.longitude
    });
  } else {
    res.status(404).json({ error: "Last city coordinates not found" });
  }
});


// Endpoint to set message 1
app.get("/message1set", async (req, res) => {
  dosomethingtorefresh();
  try {
    await fs.writeFile(
      "message.txt",
      "Weather on Easter Island is indicating perfect weather for traveling.",
      (err) => {
        if (err) {
          res.status(500).send("Internal Server Error");
        } else {
          res.send("Message 1 set.");
          sendTrackerEvent({
            messageupdate:
              "Weather on Easter Island is indicating perfect weather for traveling.",
          });
          sendMessageToWebhook2("Weather on Easter Island is indicating perfect weather for traveling.");
        }
      }
    );
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
// Endpoint to get maxpresents
app.get("/getmaxpresents", (req, res) => {
  // Send a JSON response with the value of maxpresents
  res.json({ maxpresents: maxpresents });
});

// Endpoint to set message 2
app.get("/message2set", async (req, res) => {
  dosomethingtorefresh();
  try {
    await fs.writeFile(
      "message.txt",
      "Are you ready? Easter Bunny is expected to launch within the hour.",
      (err) => {
        if (err) {
          res.status(500).send("Internal Server Error");
        } else {
          res.send("Message 2 set.");
          sendTrackerEvent({
            messageupdate:
              "Are you ready? Easter Bunny is expected to launch within the hour.",
          });
          sendMessageToWebhook2("Are you ready? Easter Bunny is expected to launch within the hour.");
        }
      }
    );
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint to set message 3
app.get("/message3set", async (req, res) => {
  dosomethingtorefresh();
  try {
    await fs.writeFile(
      "message.txt",
      "Easter Bunny is about to launch.",
      (err) => {
        if (err) {
          res.status(500).send("Internal Server Error");
        } else {
          res.send("Message 3 set.");
          sendTrackerEvent({
            messageupdate: "Easter Bunny is about to launch.",
          });
          sendMessageToWebhook2("Easter Bunny is about to launch.");
        }
      }
    );
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint to set message 4
app.get("/message4set", async (req, res) => {
  dosomethingtorefresh();
  try {
    await fs.writeFile("message.txt", "Easter Bunny is Launching!", (err) => {
      if (err) {
        res.status(500).send("Internal Server Error");
      } else {
        res.send("Message 4 set.");
        sendTrackerEvent({ messageupdate: "Easter Bunny is Launching!" });
      }
    });
          sendMessageToWebhook2("Easter Bunny is Launching!");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
app.get("/refreshall", async (req, res) => {
  setTimeout(() => {
    sendTrackerEvent({ refresh: true });
    res.send("Refresh initiated successfully.");
  }, 5000); // 1000 milliseconds = 1 second
});

// Function to add delivered location to giftsdelivered.json
function addToGiftsDelivered(cityInfo) {
  try {
    const fileName = "giftsdelivered.json";
    let data = [];
    if (fs.existsSync(fileName)) {
      data = JSON.parse(fs.readFileSync(fileName));
    }
    data.push(cityInfo);
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    console.log("Added to giftsdelivered.json:", cityInfo);
  } catch (error) {
    console.error("Error adding to giftsdelivered.json:", error);
  }
}

function sendTrackerUpdate() {
  const trackerUpdate = generateTrackerUpdate();
  app.locals.clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(trackerUpdate)}\n\n`);
  });
}

function generateTrackerUpdate() {
  const currentCity = app.get("currentCity");
  const nextCityIndex = currentIndex;
  const nextCity = cities[nextCityIndex];
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
if (currentCity && nextCityIndex && nextCity && currentTime && elapsedTime) {
  // Calculate presents delivered based on the current index and elapsed time
  let presentsDelivered = Math.floor(
    (currentIndex / cities.length) * maxpresents
  );
  sendTrackerEvent({ presentsDelivered: presentsDelivered }); // Send server update

  // Calculate the time left for the current city
  const timeLeft = Math.ceil(
    intervalInSeconds - ((elapsedTime / 1000) % intervalInSeconds)
  );

  // Create a new basket object with the next city's information
  const newBasket = {
    city: currentCity.city,
    country: currentCity.country,
    latitude: currentCity.latitude,
    longitude: currentCity.longitude,
  };

  return {
    currentCity,
    timeLeft,
    nextCity,
    lastCity, // Include lastCity in the tracker update
    presentsDelivered,
    newBasket,
  };
}}


function sendTrackerStartEvent() {
  app.locals.clients.forEach((client) => {
    client.res.write("event: trackerStart\n");
    client.res.write('data: {"trackerStarted": true}\n\n');
  });
}

app.get("/starttracker", (req, res) => {
  dosomethingtorefresh();
  startTracker("cities2.csv");
  res.send("Tracker started.");
  started = true;
  sendTrackerEvent({ trackerStarted: true });
});

// Endpoint to reset the index to 0
app.get("/restarttracker", (req, res) => {
  dosomethingtorefresh();
  currentIndex = 0;
  saveIndexToFile(); // Save the index to file
  res.send("Tracker index reset.");
});

// Define a variable to track whether the site is locked
let isLocked = true;

// Endpoint to unlock the site
app.get("/unlock", (req, res) => {
  dosomethingtorefresh();
  isLocked = false;
  res.send("Site unlocked");
  sendTrackerEvent({ unlocked: true });
  saveTrackerStatusToFile(true);
});

// Endpoint to lock the site
app.get("/lock", (req, res) => {
  dosomethingtorefresh();
  isLocked = true;
  res.send("Site locked");
  sendTrackerEvent({ unlocked: false });
  saveTrackerStatusToFile(true);
});

// Endpoint to get yearly visits with visit data
app.get("/getyearlyvisits", (req, res) => {
  getVisitsWithData("year", (err, visits) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ visits: visits.length, visitData: visits });
    }
  });
});

// Endpoint to get monthly visits with visit data
app.get("/getmonthlyvisits", (req, res) => {
  getVisitsWithData("month", (err, visits) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ visits: visits.length, visitData: visits });
    }
  });
});

const currentDate = new Date(); // Assuming this is the current date
console.log(isSameMonthAsCountdown(currentDate)); // Output: true or false

// Default route handler
app.get("/", (req, res) => {
  const ip = req.ip;
  const time = new Date().toISOString();
  const country =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const visitData = { ip, time, country };
  const currentDate = new Date(); // Assuming this is the current date

  // Log the visit data to SiteVisits.json
  fs.appendFile("SiteVisits.json", JSON.stringify(visitData) + "\n", (err) => {
    if (err) console.error("Error logging visit:", err);
  });

  const trackerStarted = started;

  // Check if the site is locked
  if (isLocked) {
    // If locked, redirect to comeback.html
    if (isSameMonthAsCountdown(currentDate)) {
      if (started === true) {
        // If tracker started, serve map.html
        res.sendFile(path.join(__dirname, "src", "pages", "map.html"));
      } else {
        // If not started, serve games.html
        res.sendFile(path.join(__dirname, "src", "pages", "games.html"));
      }
    } else {
      res.sendFile(path.join(__dirname, "src", "pages", "comeback.html"));
    }
  } else if (isSameMonthAsCountdown(currentDate)) {
    // If unlocked and same month
    if (trackerStarted) {
      // If tracker started, serve map.html
      res.sendFile(path.join(__dirname, "src", "pages", "map.html"));
    } else {
      // If not started, serve index.html
      res.sendFile(path.join(__dirname, "src", "pages", "index.html"));
    }
  } else {
    // If unlocked and not in the same month, serve ended.html
    res.sendFile(path.join(__dirname, "src", "pages", "ended.html"));
  }
});

// Endpoint to reset the baskets
app.get("/resetbaskets", (req, res) => {
  try {
    fs.writeFileSync("giftsdelivered.json", "[]");
    res.send("Baskets reset.");
  } catch (error) {
    console.error("Error resetting baskets:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/getbaskets", (req, res) => {
  try {
    // Read the contents of the giftsdelivered.json file
    const baskets = JSON.parse(fs.readFileSync("giftsdelivered.json"));

    // Filter out every 5th basket
    const filteredBaskets = baskets.filter(
      (basket, index) => (index + 1) % 5 === 0
    );

    res.json(filteredBaskets);
  } catch (error) {
    console.error("Error getting baskets:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/getallbaskets", (req, res) => {
  try {
    // Read the contents of the giftsdelivered.json file
    const baskets = JSON.parse(fs.readFileSync("giftsdelivered.json"));

    // Filter out every 5th basket
    const filteredBaskets = baskets.filter(
      (basket, index) => (index + 1) % 1 === 0
    );

    res.json(filteredBaskets);
  } catch (error) {
    console.error("Error getting baskets:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add a function to send SSE events
function sendTrackerEvent(data) {
  app.locals.clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}
// Function to save the tracker status to a file
function saveTrackerStatusToFile(status) {
  const data = JSON.stringify({ trackerStarted: status });
  fs.writeFileSync("ended.json", data);
}

// Function to check if the tracker is started from the file
function isTrackerStartedFromFile() {
  try {
    const data = fs.readFileSync("ended.json");
    const { trackerStarted } = JSON.parse(data);
    return trackerStarted;
  } catch (err) {
    // If file doesn't exist or any error occurs, return false
    return false;
  }
}

app.get("/endtracker", (req, res) => {
  isTrackerStarted = false;
  console.log("Tracker ended.");
  app.set("currentCity", null);
  lastCity = null; // Reset lastCity when the tracker ends
  res.send("Tracker ended.");
  currentIndex = 0;
  started = false;
  saveIndexToFile(); // Save the index to file
  sendTrackerEvent({ trackerEnded: true });
  
  // Save the tracker status to file
  saveTrackerStatusToFile(false);
});
app.get("/checktrackerstatus", (req, res) => {
  const trackerStarted = isTrackerStartedFromFile();
  res.send(`Tracker is ${trackerStarted ? "started" : "not started"}`);
});

app.get("/updates", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const client = { id: Date.now(), res };
  if (!app.locals.clients) {
    app.locals.clients = [];
  }
  app.locals.clients.push(client);
});
app.get("/fetchbaskets", (req, res) => {
  try {
    // Read the contents of the giftsdelivered.json file
    const baskets = JSON.parse(fs.readFileSync("giftsdelivered.json"));

    // Filter the baskets array to show every 7th basket
    const filteredBaskets = baskets.filter((basket, index) => (index + 1) % 21 === 0);

    res.json(filteredBaskets); // Send the filtered baskets as JSON response
  } catch (error) {
    console.error("Error fetching baskets:", error);
    res.status(500).send("Internal Server Error");
  }
});

const allowedIPv4Equivalent = "::ffff:127.0.0.1";

app.get("/admin", (req, res) => {
 
    res.sendFile(path.join(__dirname, "src", "pages", "controlpanel.html"));
});
app.get("/refresherpage", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "refreshtokeepup.html"));
});
app.get("/en-us/embed/ended.html", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "ended.html"));
}); // Endpoint to get the current message
app.get("/en-us/embed/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "index.html"));
});
app.get("/en-us/embed/localtime", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "localtime.html"));
});
app.get("/en-us/embed/map", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "tracker.html"));
});
app.get("/en-us/embed/losttrack", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "losttrack.html"));
});
app.get("/en-us/embed/tracker", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "pages", "map.html"));
});
// Endpoint to get the current message
app.get("/getmessage", (req, res) => {
  // Read the contents of the message.txt file
  fs.readFile("message.txt", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading message:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Send the message as the response
      res.send(data);
    }
  });
});
// Handle 404 Not Found for all paths except "/", "/admin", and an empty path

app.use((req, res, next) => {
  const excludedPaths = ["/", "/admin", "", "/localtime", "/getip"];

  if (!excludedPaths.includes(req.path)) {
    res.status(404).sendFile(path.join(__dirname, "src", "pages", "404.html"));
  } else {
    next(); // Pass the request to the next middleware
  }
});


app.get('/getip', (req, res) => {
  const clientIp = req.socket.remoteAddress;
  res.send(`Your public IP address is: ${clientIp}`);
});
const hostname = '192.168.1.195'; // Listen on all available network interfaces
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  scheduleTasks();
});

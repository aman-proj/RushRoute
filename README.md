<img width="1908" height="901" alt="image" src="https://github.com/user-attachments/assets/813720ec-aa52-4fe7-9364-b8000fb93e45" />



<h1>Delivery Dispatch Command Center & Optimization Engine</h1>

<h2>What You Were Seeing (The Command Center)</h2>

<p>The frontend was designed as a modern Dispatch Dashboard:</p>

<h3>Interactive Map Component</h3>

<p>The dark-themed map (centered on New Delhi) dynamically placed:</p>

<ul>
  <li>Blue Orbs (representing your Delivery Riders)</li>
  <li>Green Dots (Restaurant Pickups)</li>
  <li>Red Squares (Customer Dropoffs)</li>
</ul>

<h3>Dynamic Polylines</h3>

<p>When the system assigned orders, it drew glowing lines between:</p>

<ul>
  <li>the rider</li>
  <li>the restaurants</li>
  <li>the customers</li>
</ul>

<p>to visualize their precise optimal path.</p>

<h3>Metrics Panel</h3>

<p>On the left sidebar, the system displayed real-time tracking metrics:</p>

<ul>
  <li>Tallied the active riders against pending orders</li>
  <li>Numerically displayed the calculated "Distance Saved" in kilometers</li>
</ul>

<p>This was calculated because of the algorithmic grouping (Batching) vs. sending a lone driver per order point-to-point.</p>

<hr/>

<h2>How The Application Works (The Backend Brain)</h2>

<p>Under the hood, the backend application operated on an asynchronous loop, completing several advanced AI engineering tasks every single second:</p>

<h3>Order Simulation (<code>simulator.py</code>)</h3>

<p>
A background thread constantly generated random orders (mock pickups and deliveries) spread organically across the city limits to simulate the massive volume platforms like 
<a href="https://www.swiggy.com" target="_blank">Swiggy</a> / 
<a href="https://www.zomato.com" target="_blank">Zomato</a> face.
</p>

<h3>Intelligent Batching (<code>batching.py</code>)</h3>

<p>We utilized scikit-learn and an Agglomerative Clustering algorithm.</p>

<p>Instead of statically grouping by zip codes, the system vectorized the Latitude and Longitude coordinates of pending orders.</p>

<p>It mathematically grouped nearby pickups and dropoffs together into pods of maximum 3 orders perfectly sized for a single driver's cargo capacity while saving massive travel distance.</p>

<h3>Optimal Routing (VRP - <code>routing.py</code>)</h3>

<p>This was the hardest part: figuring out which path a rider should take to satisfy a batched group.</p>

<p>
The system fed the coordinates into 
<a href="https://developers.google.com/optimization" target="_blank">Google OR-Tools</a>, 
passing strict logical constraints:
</p>

<ul>
  <li>a rider must visit a restaurant pickup node strictly before visiting the customer dropoff node</li>
</ul>

<p>The artificial intelligence solver then solved the permutation puzzle to return the shortest possible geographic path.</p>

<h3>Real-time Dispatch (<code>main.py</code>)</h3>

<ul>
  <li>found the nearest "Idle" rider using Euclidean distance mathematics</li>
  <li>assigned them the OR-Tools optimized route</li>
  <li>instantly pushed the new positional data to your Next.js frontend via WebSockets</li>
</ul>

<hr/>

<h2>The Outcome</h2>

<p>Without this system:</p>

<ul>
  <li>resolving 15 active orders requires 15 distinct riders</li>
  <li>each taking un-optimized paths</li>
  <li>costing maximum operational money</li>
</ul>

<p>By running these clustering and routing techniques in tandem:</p>

<ul>
  <li>the system aggregated those 15 orders onto just 5 or 6 riders</li>
  <li>minimized excess capacity</li>
  <li>reduced the total distance vehicles traveled</li>
  <li>cut operations costs</li>
</ul>

<p>The hallmark of any modern enterprise delivery network.</p>

import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def euclidean_distance(p1, p2):
    # Approximation of distance in degrees * 111 (km per degree)
    return max(1, int(111000 * math.sqrt((p1['lat'] - p2['lat'])**2 + (p1['lng'] - p2['lng'])**2)))

def optimize_route(rider, batch):
    """
    Given a rider's current location and a batch of orders (with pickups and drops),
    finds the optimal sequence of visiting these coordinates using OR-Tools (Pickup & Delivery Problem).
    Returns the ordered sequence of coordinates/stops.
    """
    if not batch:
        return []
        
    locations = [rider['location']] # index 0 is rider's start
    pickups_deliveries = [] # pairs of (pickup_idx, dropoff_idx)
    
    # Add order locations
    for order in batch:
        pickup_idx = len(locations)
        locations.append(order['pickup'])
        
        dropoff_idx = len(locations)
        locations.append(order['dropoff'])
        
        pickups_deliveries.append([pickup_idx, dropoff_idx])
        
    num_locations = len(locations)
    
    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return euclidean_distance(locations[from_node], locations[to_node])

    # Instantiate routing model
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Add distance dimension to keep track of accumulated distance
    dimension_name = 'Distance'
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        300000,  # maximum distance
        True,  # start cumul to zero
        dimension_name)
    distance_dimension = routing.GetDimensionOrDie(dimension_name)

    # Define Pickup and Delivery constraints
    for request in pickups_deliveries:
        pickup_index = manager.NodeToIndex(request[0])
        delivery_index = manager.NodeToIndex(request[1])
        # Pickup and delivery must be on the same vehicle
        routing.current_penalty = 100000
        routing.AddPickupAndDelivery(pickup_index, delivery_index)
        # Pickup and Delivery order constraint
        routing.solver().Add(
            routing.VehicleVar(pickup_index) == routing.VehicleVar(delivery_index))
        # Pickup must happen before delivery
        routing.solver().Add(
            distance_dimension.CumulVar(pickup_index) <=
            distance_dimension.CumulVar(delivery_index))

    # Setting first solution heuristic
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION)
        
    # Solve the problem
    solution = routing.SolveWithParameters(search_parameters)
    
    if not solution:
        return []

    # Extract the route
    route_sequence = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        node_index = manager.IndexToNode(index)
        if node_index != 0: # skip the rider start point in action sequence
            action_type = "pickup" if any(p[0] == node_index for p in pickups_deliveries) else "dropoff"
            # match with order
            order_index = (node_index - 1) // 2
            route_sequence.append({
                "order_id": batch[order_index]["id"],
                "action": action_type,
                "location": locations[node_index]
            })
        index = solution.Value(routing.NextVar(index))
        
    return route_sequence

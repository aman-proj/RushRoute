import numpy as np
from sklearn.cluster import AgglomerativeClustering

def create_batches(orders, max_batch_size=3, max_distance=0.03):
    """
    Groups pending orders into batches based on spatio-temporal proximity.
    """
    pending_orders = [o for o in orders if o["status"] == "pending"]
    if not pending_orders:
        return []

    # Features: pickup and dropoff coords
    # We multiply coords by 100 to make the distance_threshold more readable (0.03 deg -> 3)
    features = []
    for o in pending_orders:
        features.append([
            o['pickup']['lat'] * 100,
            o['pickup']['lng'] * 100,
            o['dropoff']['lat'] * 100,
            o['dropoff']['lng'] * 100,
        ])
    
    X = np.array(features)
    
    if len(pending_orders) == 1:
        # single order batch
        return [[pending_orders[0]]]

    # Agglomerative Clustering prevents dictating K upfront
    clustering = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=max_distance * 100, 
        linkage='average'
    )
    labels = clustering.fit_predict(X)
    
    # Group by labels
    temp_batches = {}
    for i, label in enumerate(labels):
        if label not in temp_batches:
            temp_batches[label] = []
        temp_batches[label].append(pending_orders[i])
        
    final_batches = []
    # Enforce capacity
    for label, batch in temp_batches.items():
        # Split into chunks of max_batch_size
        for i in range(0, len(batch), max_batch_size):
            chunk = batch[i:i + max_batch_size]
            final_batches.append(chunk)
            
    return final_batches

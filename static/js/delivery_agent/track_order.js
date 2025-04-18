document.addEventListener('DOMContentLoaded', function() {
  // Initialize the tracking UI when the page loads
  updateTrackingUI();
  
  // Attach event listener to the update button (if it exists)
  const updateButton = document.getElementById('updateStatusBtn');
  if (updateButton) {
    updateButton.addEventListener('click', trackOrder);
  }
});

function updateTrackingUI() {
  const statusElement = document.getElementById('orderStatus');
  const currentStatus = statusElement.textContent.trim();
  const trackingSteps = document.querySelectorAll('.tracking-step');
  const progressBar = document.getElementById('progressBar');
  const updateButton = document.getElementById('updateStatusBtn');
  
  // Define the order of statuses
  const statusOrder = ["Accepted", "Picked Up", "Out for Delivery", "Delivered"];
  const currentStepIndex = statusOrder.indexOf(currentStatus);
  
  // Update progress bar width
  const progressPercentage = ((currentStepIndex + 1) / statusOrder.length) * 100;
  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
  }
  
  // Update button text and disable if order is delivered
  if (updateButton) {
    if (currentStatus === "Delivered") {
      updateButton.textContent = "Order Completed";
      updateButton.disabled = true;
    } else {
      updateButton.textContent = "Update Status";
      updateButton.disabled = false;
    }
  }
  
  // Update each step's appearance based on the current status
  trackingSteps.forEach((step) => {
    const stepStatus = step.getAttribute('data-step');
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    // Reset any classes that indicate status
    step.classList.remove('active', 'completed');
    
    if (stepIndex < currentStepIndex) {
      // Mark steps before the current one as completed
      step.classList.add('completed');
      const iconElement = step.querySelector('.step-icon i');
      if (iconElement) {
        iconElement.className = 'fas fa-check';
      }
    } else if (stepIndex === currentStepIndex) {
      // Mark the current step as active
      step.classList.add('active');
    }
  });
}

function trackOrder() {
  const container = document.querySelector('.order-detail-container');
  if (!container) return; // safeguard if container is missing
  
  const orderId = container.getAttribute('data-order-id');
  const statusElement = document.getElementById('orderStatus');
  let currentStatus = statusElement.textContent.trim();
  
  // Normalize backend terminology: if "Completed" then consider it as "Delivered"
  if (currentStatus === "Completed") {
    currentStatus = "Delivered";
  }
  
  // Define the order of statuses
  const statusOrder = ["Accepted", "Picked Up", "Out for Delivery", "Delivered"];
  const currentStepIndex = statusOrder.indexOf(currentStatus);
  
  // If already delivered or an unknown status, do nothing
  if (currentStatus === "Delivered" || currentStepIndex === -1) {
    return;
  }
  
  // Determine the next status in the sequence
  const nextStepIndex = currentStepIndex + 1;
  if (nextStepIndex < statusOrder.length) {
    const nextStatus = statusOrder[nextStepIndex];
    
    // Send POST request to update the order's status
    fetch(`/api/orders/${orderId}/update_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: nextStatus })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(data => {
      // Use the backend status if provided, mapping "Completed" to "Delivered" if needed
      let updatedStatus = data.delivery_status || nextStatus;
      if (updatedStatus === "Completed") {
        updatedStatus = "Delivered";
      }
      
      // Update the status display in the UI
      statusElement.textContent = updatedStatus;
      statusElement.setAttribute('data-status', updatedStatus);
      
      // Refresh the tracking UI based on the new status
      updateTrackingUI();
      
    })
    .catch(err => {
      console.error('Error updating order status:', err);
      // flash("Error updating");
    });
  }
}

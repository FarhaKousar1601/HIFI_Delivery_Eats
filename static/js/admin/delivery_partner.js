function handleAccept(userId) {
    fetch(`/admin/accept/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const row = document.getElementById(`user-${userId}`);
        const acceptedTable = document.getElementById("acceptedAgentsList");
        acceptedTable.appendChild(row);
        row.removeChild(row.lastElementChild); // Remove actions column after acceptance
        // alert(data.message);
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        // alert('There was an error processing the acceptance.');
        window.location.reload();
    });
}

function handleReject(userId) {
    fetch(`/admin/reject/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // alert(data.message);
        document.getElementById(`user-${userId}`).remove();
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        // alert('There was an error processing the rejection.');
        window.location.reload();
    });
}

function handleDeactivate(userId) {
    fetch(`/admin/deactivate/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Optionally, display a success message:
        // alert(data.message);
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        // Optionally, display an error message:
        // alert('There was an error processing the deactivation.');
        window.location.reload();
    });
}

function handleActivate(userId) {
    fetch(`/admin/activate/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Optionally, display a success message:
        // alert(data.message);
        window.location.reload();
    })
    .catch(error => {
        console.error('Error:', error);
        // Optionally, display an error message:
        // alert('There was an error processing the activation.');
        window.location.reload();
    });
}

// Helper function to show the custom confirmation modal
// Generic confirmation popup
function showConfirmationPopup(message, onConfirm, onCancel) {
  const modal = document.getElementById('confirmationModal');
  const modalMessage = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  // Optional: if you have a close "x" element
  const closeModal = document.getElementById('closeModal');

  modalMessage.textContent = message;
  modal.style.display = 'block';

  // Set up confirmation and cancel callbacks (attached freshly)
  confirmBtn.onclick = function () {
    modal.style.display = 'none';
    onConfirm();
  };

  cancelBtn.onclick = function () {
    modal.style.display = 'none';
    if (onCancel) onCancel();
  };

  if (closeModal) {
    closeModal.onclick = function () {
      modal.style.display = 'none';
      if (onCancel) onCancel();
    };
  }

  // Optionally, close if clicking outside modal
  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
      if (onCancel) onCancel();
    }
  };
}

// Updated handleActivate/handleDeactivate without inner confirmation
function handleActivate(userId) {
  fetch(`/admin/activate/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => window.location.reload())
  .catch(error => {
    console.error('Error:', error);
    window.location.reload();
  });
}

function handleDeactivate(userId) {
  fetch(`/admin/deactivate/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => window.location.reload())
  .catch(error => {
    console.error('Error:', error);
    window.location.reload();
  });
}

// Toggle switch confirmation using the generic popup.
function confirmToggleAgent(agentId, checkbox) {
  // Determine the intended new state.
  const intendedState = checkbox.checked;
  // Revert the checkbox immediately.
  checkbox.checked = !intendedState;
  
  // Set appropriate message.
  const message = intendedState
    ? "Are you sure you want to activate this delivery agent?"
    : "Are you sure you want to deactivate this delivery agent?";
  
  // Show confirmation popup.
  showConfirmationPopup(message, function() {
    // On confirm, update the toggle and call the request.
    checkbox.checked = intendedState;
    if (intendedState) {
      handleActivate(agentId);
    } else {
      handleDeactivate(agentId);
    }
  }, function() {
    // On cancel, revert the toggle (already reverted above).
    checkbox.checked = !intendedState;
  });
}
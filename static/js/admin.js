// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function() {
    // Flash message fade-out after 3 seconds
    const flashMessages = document.getElementById("flash-messages");
    if (flashMessages) {
      setTimeout(() => {
        flashMessages.style.opacity = '0';
        // Remove from DOM after fade-out animation (0.5s)
        setTimeout(() => flashMessages.remove(), 500);
      }, 3000);
    }
  
    // Additional JS functionality can be added here
  });
  
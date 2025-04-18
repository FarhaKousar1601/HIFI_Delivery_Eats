document.addEventListener('DOMContentLoaded', function() {
    

    // Populate order details
    document.getElementById('orderStatus').textContent = orderData.status;
    document.getElementById('orderTime').textContent = orderData.orderTime;
    document.getElementById('estimatedDelivery').textContent = orderData.estimatedDelivery;
    document.getElementById('customerName').textContent = orderData.customer.name;
    document.getElementById('customerPhone').textContent = orderData.customer.phone;
    document.getElementById('customerAddress').textContent = orderData.customer.address;

    // Populate order items
    const itemList = document.getElementById('itemList');
    let subtotal = 0;
    orderData.items.forEach(item => {
        const li = document.createElement('li');
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;
        li.innerHTML = `
            <span>${item.name} x${item.quantity}</span>
            <span>₹${itemTotal.toFixed(2)}</span>
        `;
        itemList.appendChild(li);
    });

    // Calculate and update order summary
    const tax = subtotal * orderData.taxRate;
    const total = subtotal + orderData.deliveryFee + tax;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `₹${orderData.deliveryFee.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `₹${total.toFixed(2)}`;

    // Button functionality
    const acceptBtn = document.getElementById('acceptBtn');
    const completeBtn = document.getElementById('completeBtn');
    const orderStatus = document.getElementById('orderStatus');

    acceptBtn.addEventListener('click', function() {
        orderStatus.textContent = 'On the Way';
        orderStatus.style.backgroundColor = 'var(--primary-color)';
        this.disabled = true;
        completeBtn.disabled = false;
        startDeliveryTimer();
    });

    completeBtn.addEventListener('click', function() {
        orderStatus.textContent = 'Delivered';
        orderStatus.style.backgroundColor = 'var(--success-color)';
        this.disabled = true;
        stopDeliveryTimer();
    });

    // Delivery timer functionality
    let timerInterval;
    function startDeliveryTimer() {
        let time = 30 * 60; // 30 minutes in seconds
        const estimatedDelivery = document.getElementById('estimatedDelivery');
        
        timerInterval = setInterval(() => {
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            estimatedDelivery.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (time <= 0) {
                clearInterval(timerInterval);
                estimatedDelivery.textContent = "Delivery Overdue";
                estimatedDelivery.style.color = 'var(--danger-color)';
            }
            time--;
        }, 1000);
    }

    function stopDeliveryTimer() {
        clearInterval(timerInterval);
        document.getElementById('estimatedDelivery').textContent = "Delivered";
    }
    
});

// document.addEventListener("DOMContentLoaded", function () {
//     // Existing DOMContentLoaded code for order details
//     // ... (your existing order details JS code)

//     // Setup click events for stars (if review editing is needed)
//     const stars = document.querySelectorAll(".star");
//     const reviewText = document.getElementById("reviewText");

//     stars.forEach((star) => {
//       star.addEventListener("click", function () {
//         const value = this.getAttribute("data-value");

//         // Remove 'active' class from all stars
//         stars.forEach((s) => s.classList.remove("active"));

//         // Add 'active' class to all stars up to selected value
//         stars.forEach((s, index) => {
//           if (index < value) {
//             s.classList.add("active");
//           }
//         });

//         // Update review text based on selected rating (for demonstration)
//         const reviews = ["Very Bad", "Bad", "Average", "Good", "Excellent"];
//         reviewText.textContent = `Customer Rating: ${reviews[value - 1]}`;
//       });
//     });
//   });
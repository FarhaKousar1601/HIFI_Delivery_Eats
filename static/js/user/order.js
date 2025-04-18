document.addEventListener("DOMContentLoaded", async function () {
    const cartItemsContainer = document.getElementById("cart-items");
    const orderSummary = document.getElementById("order-summary");
    const clearControlsContainer = document.getElementById("cart-clear-controls");
    const orderHistoryContainer = document.getElementById("order-history-details");
    const orderHistorySection = document.getElementById("order-history");
    const clearOrdersButton = document.getElementById("clear-orders-button");

    // Initialize cart from Flask data
    let cart = window.initialCart || [];
    let menuItems = [];
    let isSelectionMode = false;

    console.log("Initial cart state from Flask:", cart);

    async function fetchMenuItems() {
        try {
            const response = await fetch('/api/menu_items', {
                method: 'GET',
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch menu items: ' + response.statusText);
            const result = await response.json();
            menuItems = result.data || [];
            console.log("Fetched menuItems from /api/menu_items:", menuItems);
        } catch (error) {
            console.error("Error fetching menu items:", error);
            menuItems = [];
        }
    }

    async function fetchCart() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch cart: ' + response.statusText);
            const result = await response.json();
            cart = result.data || [];
            console.log("Fetched cart from /api/cart:", cart);
            return cart;
        } catch (error) {
            console.error("Error fetching cart:", error);
            cart = [];
            return cart;
        }
    }

    async function saveCart() {
        console.log("Saving cart to server:", cart);
        try {
            const cartData = cart.map(item => ({
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                name: item.name,
                price: item.price
            }));
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ items: cartData })
            });
            if (!response.ok) throw new Error('Failed to save cart: ' + response.statusText);
            const result = await response.json();
            cart = result.data || cart;
            console.log("Cart saved to server:", cart);
        } catch (error) {
            console.error("Error saving cart:", error);
        }
    }

    function resolveImage(image, menuItemId) {
        const baseUrl = "https://HiFiDeliveryEats.com/";
        const staticImagePath = "/images/";
        const menuItem = menuItems.find(item => item.menu_item_id === menuItemId);
        if (menuItem && menuItem.image_url) {
            return `${staticImagePath}${menuItem.image_url.replace(baseUrl, '')}`;
        }
        return "https://via.placeholder.com/150?text=Image+Not+Found";
    }

    // Function to populate order history
    function populateOrderHistory(orders) {
        const orderHistoryTable = document.getElementById('order-history-details');
        orderHistoryTable.innerHTML = ''; // Clear existing content
        
        console.log("we are here with previous data",orders);
        const baseUrl = "https://HiFiDeliveryEats.com/";
        const staticImagePath = "/images/";

        orders.forEach(order => {
            const row = document.createElement('tr');
            image_src = `${staticImagePath}${order.image.replace(baseUrl, '')}`
            row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.name || 'Customer'}</td>
            <td><img src="${image_src}" alt="Item Image" style="width: 50px;" onerror="this.src='default-image.jpg';"></td>
            <td>${order.item || 'N/A'}</td>
            <td>₹ ${order.price.toFixed(2)}</td>
            <td>${order.delivery_details || 'N/A'}</td>
            <td>${order.payment_method || 'Cash on Delivery'}</td>
            <td>${order.date || 'N/A'}</td>
            <td>
                <a href="/order_confirmation?order_id=${order.order_id}" class="button">View Confirmation</a>
            </td>
        `;
            orderHistoryTable.appendChild(row);
        });
        // Show/hide the order history section based on data
        document.getElementById('order-history').style.display = orders.length > 0 ? 'block' : 'none';
    }

    fetch('/api/orders/history', {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            populateOrderHistory(data.orders);
        } else {
            console.error('Error fetching order history:', data.error);
        }
    })
    .catch(error => console.error('Fetch error:', error));

    
    // Initial fetches
    await fetchMenuItems();
    // await fetchCart();
    console.log("Cart after initial fetch:", cart);
    updateCartCount();

    function getCartTotalItems() {
        return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    function updateCartCount() {
        const totalItems = getCartTotalItems();
        const cartLink = document.querySelector('.nav__link[href="/order"]');
        if (cartLink) {
            const span = cartLink.querySelector(".nav__cart-count");
            if (span) span.textContent = totalItems;
        }
    }

    function toggleSelectionMode() {
        isSelectionMode = !isSelectionMode;
        displayCartItems();
    }

    function displayCartItems() {
        cartItemsContainer.innerHTML = "";
        clearControlsContainer.innerHTML = "";

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<div class="empty-cart-container">
                <img src="./images/cart.png" alt="Empty Cart" class="empty-cart-image" onerror="this.src='https://via.placeholder.com/150?text=Cart+Image+Not+Found';" />
                <p>Your cart is empty.</p>
              </div>`;
            orderSummary.style.display = "none";
            return;
        }

        cartItemsContainer.style.display = "block";
        orderSummary.style.display = "block";

        if (!isSelectionMode) {
            clearControlsContainer.innerHTML = `
                <div style="flex: 1;"></div>
                <button class="cart__clear-button" id="clear-cart-button">Clear Cart</button>
            `;
        } else {
            clearControlsContainer.innerHTML = `
                <div class="cart__select-all">
                    <input type="checkbox" id="select-all" />
                    <label for="select-all">Select All</label>
                </div>
                <div class="cart__selection-buttons">
                    <button class="clear-selected" id="clear-selected">Clear</button>
                    <button class="cancel" id="cancel-clear">Cancel</button>
                </div>
            `;
        }

        const clearCartButton = document.getElementById("clear-cart-button");
        const clearSelectedButton = document.getElementById("clear-selected");
        const cancelClearButton = document.getElementById("cancel-clear");
        const selectAllCheckbox = document.getElementById("select-all");

        if (clearCartButton) clearCartButton.addEventListener("click", toggleSelectionMode);
        if (cancelClearButton) cancelClearButton.addEventListener("click", toggleSelectionMode);
        if (clearSelectedButton) {
            clearSelectedButton.addEventListener("click", async function () {
                const selectedItems = Array.from(document.querySelectorAll(".cart__item-checkbox input:checked")).map(input => parseInt(input.value));
                cart = cart.filter((_, index) => !selectedItems.includes(index));
                await saveCart();
                displayCartItems();
                updateCartCount();
            });
        }
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener("change", function () {
                const checkboxes = document.querySelectorAll(".cart__item-checkbox input");
                checkboxes.forEach(checkbox => { checkbox.checked = this.checked; });
            });
        }

        cart.forEach((item, index) => {
            const cartItem = document.createElement("div");
            cartItem.classList.add("cart__item");
            const adjustedImagePath = resolveImage(null, item.menu_item_id);
            cartItem.innerHTML = `
                ${isSelectionMode ? `
                    <div class="cart__item-checkbox">
                        <input type="checkbox" id="cart-item-${index}" value="${index}" />
                        <label for="cart-item-${index}"></label>
                    </div>
                ` : ""}
                <img src="${adjustedImagePath}" alt="${item.name}" class="cart__item-img" onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found';" />
                <div class="cart__item-details">
                    <h3 class="cart__item-name">${item.name}</h3>
                    <p class="cart__item-price">₹${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button class="decrease" data-index="${index}">-</button>
                    <span class="quantity quantity-${index}">${item.quantity || 1}</span>
                    <button class="increase" data-index="${index}">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        if (isSelectionMode) {
            const checkboxes = document.querySelectorAll(".cart__item-checkbox input");
            checkboxes.forEach(checkbox => checkbox.addEventListener("change", () => {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            }));
        }

        updateOrderSummary();
    }

    cartItemsContainer.addEventListener("click", async (event) => {
        const index = parseInt(event.target.getAttribute("data-index"));
        if (event.target.classList.contains("decrease")) await decreaseQuantity(index);
        if (event.target.classList.contains("increase")) await increaseQuantity(index);
    });

    async function increaseQuantity(index) {
        const item = cart[index];
        const menuItem = menuItems.find(i => i.menu_item_id === item.menu_item_id);
        const stockAvailable = menuItem ? (parseInt(menuItem.stock_available) || 0) : 100;
        const currentQuantity = item.quantity || 1;

        if (currentQuantity + 1 > stockAvailable) {
            alert(`Item "${item.name}" not available - Only ${stockAvailable} left!`);
            return;
        }

        item.quantity = currentQuantity + 1;
        await saveCart();
        displayCartItems();
        updateCartCount();
    }

    async function decreaseQuantity(index) {
        const item = cart[index];
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        await saveCart();
        displayCartItems();
        updateCartCount();
    }

    function updateOrderSummary() {
        let subtotal = 0;
        let totalDiscount = 0;

        orderSummary.innerHTML = `
            <h2 class="summary-title">Order Summary</h2>
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Quantity</th>
                        <th>Discount</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody id="order-items"></tbody>
            </table>
            <div class="summary-details" id="summary-details"></div>
            <div class="place-order-section" id="place-order-section"></div>
        `;

        const tbody = document.getElementById("order-items");
        const summaryDetails = document.getElementById("summary-details");
        const placeOrderSection = document.getElementById("place-order-section");

        cart.forEach((item) => {
            const quantity = item.quantity || 1;
            const itemPrice = parseFloat(item.price) || 0;
            const itemTotal = itemPrice * quantity;
            const discountPercentage = parseFloat(item.discount_percentage) || 0;
            console.log(discountPercentage);
            const itemDiscount = (itemTotal * discountPercentage) / 100;
            const actualPrice = itemTotal - itemDiscount;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.name} (₹${itemTotal.toFixed(2)})</td>
                <td>${quantity}</td>
                <td>${discountPercentage > 0 ? `₹${itemDiscount.toFixed(2)} (${discountPercentage}%)` : "₹0.00"}</td>
                <td>₹${actualPrice.toFixed(2)}</td>
            `;
            tbody.appendChild(row);

            subtotal += itemTotal;
            totalDiscount += itemDiscount;
        });

        const taxRate = 0.18;
        const tax = (subtotal - totalDiscount) * taxRate;
        const deliveryCharge = 50.0;
        const total = (subtotal - totalDiscount) + tax + deliveryCharge;

        summaryDetails.innerHTML = `
            <div class="summary-item">
                <span>Subtotal:</span> <span class="summary-value">₹${(subtotal - totalDiscount).toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span>Tax (18%):</span> <span class="summary-value">₹${tax.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span>Delivery Charge:</span> <span class="summary-value">₹${deliveryCharge.toFixed(2)}</span>
            </div>
            <div class="summary-item total">
                <span>Total:</span> <span class="summary-value">₹${total.toFixed(2)}</span>
            </div>
        `;

        placeOrderSection.innerHTML = `
            <form method="POST" action="/order" id="place-order-form">
                <button type="submit" id="place-order-button" class="place-order-btn">Place Order</button>
            </form>
        `;
    }

    displayCartItems();

    // Add CSS styles (unchanged from your version)
    const popupStyles = `
        .popup-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #069c54; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); z-index: 1000; text-align: center; }
        .popup-container p { margin: 0 0 15px; font-size: 16px; color: #fff; }
        .button-group { display: flex; justify-content: center; gap: 10px; }
        .button-group button { padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
        .button-group #close-stock-alert { background: #fff; color: #333; }
        .button-group button:hover { opacity: 0.9; }
        .order-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden; }
        .order-table th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; font-weight: bold; }
        .order-table td { padding: 12px; border-bottom: 1px solid #ddd; }
        .order-table tr:last-child td { border-bottom: none; }
        .order-table tr:hover { background-color: #f5f5f5; }
        .summary-details { background: #f9f9f9; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
        .summary-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; color: #333; }
        .summary-item.total { font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; }
        .summary-value { color: #4CAF50; }
        .place-order-btn { background: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; }
        .place-order-btn:hover { background: #45a049; }
        #place-order-form {display: flex; justify-content: center; align-items: center; height: 100%; margin: 2%;}
    `;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = popupStyles;
    document.head.appendChild(styleSheet);
});
document.addEventListener("DOMContentLoaded", () => {
    let orders = [];
    let menuItems = [];
    let deliveryAgents = [];

    // Fetch orders from backend
    async function fetchOrders() {
        try {
            const response = await fetch('/api/admin/pending_orders', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'  // Include cookies for session authentication
            });
            const result = await response.json();
            console.log('API Response:', result);  // Debug: Log the full response
            if (result.ok) {
                orders = result.data;
                populateOrders();
            } else {
                console.error('Error fetching orders:', result.error);
                document.getElementById("order-items").innerHTML = "<p>Error loading orders: " + result.error + "</p>";
            }
        } catch (error) {
            console.error('Fetch error:', error);
            document.getElementById("order-items").innerHTML = "<p>Failed to connect to server.</p>";
        }
    }

    // Fetch menu items from backend
    async function fetchMenuItems() {
        try {
            const response = await fetch('/api/menu_items', {
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            console.log('API Response (Menu Items):', result);
            if (result.ok) {
                menuItems = result.data;
            } else {
                console.error('Error fetching menu items:', result.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    async function fetchDeliveryAgents() {
        try {
            const response = await fetch('/api/admin/delivery_agents', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const result = await response.json();
            console.log('API Response (Delivery Agents):', result);
            if (result.ok) {
                deliveryAgents = result.data;
                populateDeliveryAgents();
            } else {
                console.error('Error fetching delivery agents:', result.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    /* const deliveryAgents = [
        { name: "Rohith", status: "active" },
        { name: "Aaditya", status: "available" },
        { name: "Vaishnavi", status: "available" },
        { name: "Farha", status: "offline" },
        { name: "Saibabu", status: "available" },
        { name: "Sreehari", status: "active" },
        { name: "Ganesh", status: "offline" },
        { name: "Manoj", status: "available" },
    ]; */

    const scroller = document.getElementById("placeholder-scroller");
    if (scroller) {
        const subcategories = [
            "Starter",
            "Biryani",
            "Soups",
            "Salads",
            "Breads",
            "Main Course",
            "Beverages",
            "Icecreams",
            "Breakfast",
        ];
        const items = [...subcategories, ...subcategories];
        items.forEach((subcategory) => {
            const span = document.createElement("span");
            span.textContent = subcategory;
            scroller.appendChild(span);
        });
    }

    /*
    / This function is a simple logic for resolve imagse
    function resolveImage(image, menuItemId) {
        const baseUrl = "https://HiFiDeliveryEats.com/";
        const staticImagePath = "/static/images/";
        const menuItem = menuItems.find(item => item.menu_item_id === menuItemId);
        if (menuItem && menuItem.image_url) {
            return `${staticImagePath}${menuItem.image_url.replace(baseUrl, '')}`;
        }
        return "https://via.placeholder.com/150?text=Image+Not+Found";
    }*/

    // Resolve image URL using menuItems data
    function resolveImage(image, itemId) {
        console.log(`Resolving image for itemId: ${itemId}, image: ${image}`);
        if (!image && !itemId) {
            return "https://via.placeholder.com/150?text=Image+Not+Found";
        }
        if (image && image.startsWith("data:image/")) {
            return image;
        }

        const menuItem = menuItems.find(item => item.menu_item_id === itemId);
        if (menuItem && menuItem.image_url) {
            // Adjust image URL based on your storage setup
            if (menuItem.image_url.startsWith("https://HiFiDeliveryEats.com/")) {
                const filename = menuItem.image_url.split('/').pop();
                return `/images/${filename}`;  // Assumes images are in static/images/
            }
            return menuItem.image_url;  // Use as-is if already a valid path
        }

        console.warn(`Image resolution failed for itemId: ${itemId}`);
        return "https://via.placeholder.com/150?text=Image+Not+Found";
    }

    function populateOrders() {
        const orderTabs = document.getElementById("order-tabs");
        const orderItems = document.getElementById("order-items");
        orderTabs.innerHTML = "";
        orderItems.innerHTML = "";

        console.log('Orders to populate:', orders);  // Debug: Log orders array

        if (orders.length === 0) {
            orderItems.innerHTML = "<p>No pending orders available.</p>";
            return;
        }

        orders.forEach((order, index) => {
            const tab = document.createElement("button");
            tab.className = `tab ${index === 0 ? "active" : ""}`;
            tab.textContent = `📦 #${order.orderId}`;
            tab.dataset.orderId = order.orderId;
            orderTabs.appendChild(tab);

            const orderCard = document.createElement("div");
            orderCard.className = "order-card";
            orderCard.dataset.orderId = order.orderId;
            orderCard.style.display = index === 0 ? "block" : "none";

            orderCard.innerHTML = `
        <div class="order-header">
          <span class="order-id">Order #${order.orderId}</span>
          <span class="order-date">${order.date}</span>
        </div>
        ${order.items
                    .map(
                        (item) => `
          <div class="order-content">
            <img src="${resolveImage(item.image, item.itemId)}" alt="${item.itemName
                            }" class="order-item-img" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=Image+Not+Found'; console.log('Image failed to load for ${item.itemName
                            }: ${resolveImage(item.image, item.itemId)}');" />
            <div class="order-details">
              <h3>${item.itemName}</h3>
              <p>Qty: ${item.quantity}</p>
              <p class="price">₹${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        `
                    )
                    .join("")}
        <div class="order-footer">
          <span>${order.items.length}x items</span>
          <span class="order-total">Total: ₹${order.total}</span>
          <div class="order-actions">
            <button class="reject-btn">❌</button>
            <button class="accept-btn">✔️</button>
          </div>
        </div>
        <div class="customer-info">
          <p><strong>Customer:</strong> ${order.name}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <p><strong>Address:</strong> ${order.street}, ${order.city}, ${order.state
                }, ${order.pincode}</p>
          <p><strong>Estimated Delivery Time: </strong>15 Min</p>
        </div>
      `;

            orderItems.appendChild(orderCard);

            const acceptBtn = orderCard.querySelector(".accept-btn");
            const rejectBtn = orderCard.querySelector(".reject-btn");

            acceptBtn.addEventListener("click", () => showAgentPopup(order));
            rejectBtn.addEventListener("click", () => showRejectPopup(order.orderId));

            tab.addEventListener("click", () => {
                document
                    .querySelectorAll(".tab")
                    .forEach((t) => t.classList.remove("active"));
                document
                    .querySelectorAll(".order-card")
                    .forEach((c) => (c.style.display = "none"));
                tab.classList.add("active");
                orderCard.style.display = "block";
            });
        });
    }


    function populateDeliveryAgents() {
        const agentList = document.getElementById("agent-list-ui");
        if (!agentList) {
            console.warn("Element with ID 'agent-list-ui' not found. Skipping agent population.");
            return;
        }

        agentList.innerHTML = "";
        console.log('Delivery agents to populate:', deliveryAgents);

        if (deliveryAgents.length === 0) {
            agentList.innerHTML = "<p>No delivery agents available.</p>";
            return;
        }

        deliveryAgents.forEach(agent => {
            const agentItem = document.createElement("div");
            agentItem.className = "agent-item";
            const statusText = agent.status === "available" ? "Available for new orders"
                : agent.status === "busy" ? "Currently delivering" : "On break";
            agentItem.innerHTML = `
            <div class="agent-details">
              <h3>${agent.name}</h3>
              <p>${statusText}</p>
            </div>
            <span class="agent-status ${agent.status}">${agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}</span>
          `;
            agentList.appendChild(agentItem);
        });
    }

    let allOrders = [];
    let currentPage = 1;
    let perPage = 10;
    let totalPages = 1;
    let sortBy = 'order_id';
    let sortDir = 'asc';

    // New Function: Fetch All Orders
    async function fetchAllOrders() {
        try {
            const response = await fetch(`/api/admin/all_orders?page=${currentPage}&per_page=${perPage}&sort_by=${sortBy}&sort_dir=${sortDir}`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const result = await response.json();
            if (result.ok) {
                allOrders = result.data;
                totalPages = result.total_pages;
                populateAllOrders();
                updatePagination();
            } else {
                console.error('Error fetching all orders:', result.error);
                document.getElementById("all-orders-table").innerHTML = "<p>Error loading orders: " + result.error + "</p>";
            }
        } catch (error) {
            console.error('Fetch error:', error);
            document.getElementById("all-orders-table").innerHTML = "<p>Failed to connect to server.</p>";
        }
    }
    // New Function: Populate All Orders Table
    function populateAllOrders() {
        const tableBody = document.getElementById("all-orders-table").querySelector("tbody");
        tableBody.innerHTML = "";

        if (allOrders.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='6'>No orders found.</td></tr>";
            return;
        }

        allOrders.forEach(order => {
            const row = document.createElement("tr");
            row.innerHTML = `
        <td>${order.order_id}</td>
        <td>${order.customer_name}</td>
        <td>${order.status}</td>
        <td>₹${order.total_price.toFixed(2)}</td>
        <td>${new Date(order.created_at).toLocaleString()}</td>
        <td>${order.delivery_agent_id}</td>
      `;
            tableBody.appendChild(row);
        });
    }

    // New Function: Update Pagination Controls
    function updatePagination() {
        const pagination = document.getElementById("pagination");
        pagination.innerHTML = `
      <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${currentPage} of ${totalPages}</span>
      <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;

        document.getElementById("prev-page").addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAllOrders();
            }
        });

        document.getElementById("next-page").addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchAllOrders();
            }
        });
    }

    // New Function: Handle Sorting
    function sortTable(column) {
        if (sortBy === column) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = column;
            sortDir = 'asc';
        }
        fetchAllOrders();
    }



    // Function to show custom popup
    function showPopup(message) {
        const popup = document.getElementById("custom-popup");
        const popupMessage = document.getElementById("popup-message");
        const popupClose = document.getElementById("popup-close");

        popupMessage.textContent = message;
        popup.classList.add("show");
        document.body.classList.add("popup-active");

        popupClose.onclick = () => {
            popup.classList.remove("show");
            document.body.classList.remove("popup-active");
        };

        // Optional: Auto-close after 3 seconds
        setTimeout(() => {
            popup.classList.remove("show");
            document.body.classList.remove("popup-active");
        }, 3000);
    }

    function showAgentPopup(order) {
        const popup = document.getElementById("agent-assignment-popup");
        const agentList = document.getElementById("agent-list");
        const closeBtn = document.getElementById("agent-popup-close");

        if (!popup || !agentList || !closeBtn) {
            console.error("Popup elements not found in HTML.");
            return;
        }

        agentList.innerHTML = "";
        document.getElementById("agent-popup-title").textContent = `Assign Delivery Agent for Order #${order.orderId}`;

        const availableAgents = deliveryAgents.filter(agent => agent.status === "available");
        if (availableAgents.length === 0) {
            agentList.innerHTML = "<p>No available agents at the moment.</p>";
        } else {
            availableAgents.forEach(agent => {
                const agentItem = document.createElement("div");
                agentItem.className = "agent-item";
                agentItem.innerHTML = `
              <div class="agent-info">
                <span class="agent-name">${agent.name}</span>
                <span class="agent-status agent-status-${agent.status}">Available</span>
              </div>
              <button class="assign-btn" data-agent-id="${agent.delivery_agent_id}">Assign</button>
            `;
                agentList.appendChild(agentItem);

                const assignBtn = agentItem.querySelector(".assign-btn");
                assignBtn.addEventListener("click", () => assignOrder(order, agent.delivery_agent_id));
                // assignBtn.addEventListener("click", () => {
                //     console.log(`Assigning Order #${order.orderId} to ${agent.name} (ID: ${agent.delivery_agent_id})`);
                //     popup.style.display = "none";
                // });
            });
        }

        popup.style.display = "flex";
        closeBtn.onclick = () => (popup.style.display = "none");
    }

    async function assignOrder(order, deliveryAgentId) {
        try {
            const response = await fetch('/api/admin/assign_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ order_id: order.orderId, delivery_agent_id: deliveryAgentId })
            });
            const result = await response.json();
            if (result.ok) {
                orders = orders.filter(o => o.orderId !== order.orderId);
                // deliveryAgents = deliveryAgents.map(a =>
                //     a.delivery_agent_id === deliveryAgentId ? { ...a, status: "busy" } : a
                // );
                populateOrders();
                populateDeliveryAgents();
                fetchAllOrders();  // Refresh all orders table
                document.getElementById("agent-assignment-popup").style.display = "none";
                showPopup(result.message);
            } else {
                console.error('Error assigning order:', result.error);
                showPopup(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Assign error:', error);
            showPopup('Failed to assign order.');
        }
    }

    async function rejectOrder(orderId) {
        try {
            const response = await fetch('/api/admin/reject_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ order_id: orderId })
            });
            const result = await response.json();
            if (result.ok) {
                orders = orders.filter(o => o.orderId !== orderId);
                populateOrders();
                fetchAllOrders();  // Refresh all orders table
                showPopup(result.message);
            } else {
                console.error('Error rejecting order:', result.error);
                showPopup(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Reject error:', error);
            showPopup('Failed to reject order.');
        }
    }

    function showRejectPopup(orderId) {
        const popup = document.getElementById("agent-assignment-popup");
        const agentList = document.getElementById("agent-list");
        const closeBtn = document.getElementById("agent-popup-close");

        agentList.innerHTML = `
      <p>Are you sure you want to reject Order #${orderId}?</p>
      <button class="confirm-reject-btn" data-order-id="${orderId}">Confirm Reject</button>
    `;
        document.getElementById("agent-popup-title").textContent =
            "Confirm Rejection";

        popup.style.display = "flex";
        closeBtn.onclick = () => (popup.style.display = "none");

        const confirmRejectBtn = agentList.querySelector(".confirm-reject-btn");
        confirmRejectBtn.addEventListener("click", () => {
            rejectOrder(orderId);
            popup.style.display = "none";
        });
    }



    const chartData = {
        week: {
            totalOrders: [10, 15, 12, 18, 20, 22, 25],
            customerGrowth: [5, 7, 6, 8, 10, 12, 15],
            totalRevenue: [1000, 1500, 1200, 1800, 2000, 2200, 2500],
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        month: {
            totalOrders: [50, 60, 70, 65, 80, 90],
            customerGrowth: [20, 25, 30, 28, 35, 40],
            totalRevenue: [5000, 6000, 7000, 6500, 8000, 9000],
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        },
        year: {
            totalOrders: [300, 320, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430],
            customerGrowth: [
                100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210,
            ],
            totalRevenue: [
                30000, 32000, 34000, 35000, 36000, 37000, 38000, 39000, 40000, 41000,
                42000, 43000,
            ],
            labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ],
        },
    };

    let revenueChart, orderChart, pieChart;

    // New Function: Fetch Summary Data
    async function fetchSummary() {
        try {
            const response = await fetch('/api/admin/summary', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const result = await response.json();
            if (result.ok) {
                updateSummary(result.data);
            } else {
                console.error('Error fetching summary:', result.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    // New Function: Fetch Chart Data
    async function fetchChartData() {
        try {
            const response = await fetch('/api/admin/order_status_chart', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const result = await response.json();
            if (result.ok) {
                renderChart(result.data);
            } else {
                console.error('Error fetching chart data:', result.error);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }


    // New Function: Render Pie Chart
    function renderChart(data) {
        const ctx = document.getElementById('order-status-chart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#FF6384', // Pending
                        '#36A2EB', // Preparing
                        '#FFCE56', // Out for Delivery
                        '#4BC0C0', // Delivered
                        '#9966FF'  // Cancelled
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Order Status Distribution' }
                }
            }
        });
    }
    function createCharts(period) {
        const revenueCtx = document
            .getElementById("revenue-chart")
            ?.getContext("2d");
        const orderCtx = document.getElementById("order-chart")?.getContext("2d");
        const pieCtx = document.getElementById("pie-chart")?.getContext("2d");

        if (!revenueCtx || !orderCtx || !pieCtx) {
            console.error(
                "One or more chart canvas elements are missing in the DOM."
            );
            return;
        }

        const data = chartData[period];

        if (revenueChart) revenueChart.destroy();
        if (orderChart) orderChart.destroy();
        if (pieChart) pieChart.destroy();

        revenueChart = new Chart(revenueCtx, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Total Revenue (₹)",
                        data: data.totalRevenue,
                        borderColor: "#069c54",
                        backgroundColor: "rgba(6, 156, 84, 0.1)",
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } },
        });

        orderChart = new Chart(orderCtx, {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Total Orders",
                        data: data.totalOrders,
                        backgroundColor: "#42a5f5",
                        borderColor: "#42a5f5",
                        borderWidth: 1,
                    },
                ],
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } },
        });

        const pieData = [
            orders.filter((o) => o.status !== "rejected").length,
            data.customerGrowth.reduce((a, b) => a + b, 0),
            orders.reduce(
                (sum, o) => sum + (o.status !== "rejected" ? parseFloat(o.total) : 0),
                0
            ) / 100,
        ];

        pieChart = new Chart(pieCtx, {
            type: "pie",
            data: {
                labels: ["Total Orders", "Customer Growth", "Total Revenue"],
                datasets: [
                    {
                        data: pieData,
                        backgroundColor: ["#42a5f5", "#ffca28", "#069c54"],
                        borderColor: "#ffffff",
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "top" } },
            },
        });

        const totalOrdersPercent = (
            (pieData[0] / (pieData[0] + pieData[1] + pieData[2])) *
            100
        ).toFixed(1);
        const customerGrowthPercent = (
            (pieData[1] / (pieData[0] + pieData[1] + pieData[2])) *
            100
        ).toFixed(1);
        const totalRevenuePercent = (
            (pieData[2] / (pieData[0] + pieData[1] + pieData[2])) *
            100
        ).toFixed(1);

        document.getElementById(
            "pie-total-order"
        ).textContent = `${totalOrdersPercent}%`;
        document.getElementById(
            "pie-customer-growth"
        ).textContent = `${customerGrowthPercent}%`;
        document.getElementById(
            "pie-total-revenue"
        ).textContent = `${totalRevenuePercent}%`;

        const toggleChart = document.getElementById("toggle-chart");
        const toggleValues = document.getElementById("toggle-values");
        const pieCharts = document.querySelectorAll(".pie-chart");

        if (toggleChart && toggleValues) {
            toggleChart.addEventListener("change", () => {
                pieCharts.forEach((chart) =>
                    chart.classList.toggle("hidden", !toggleChart.checked)
                );
            });
            toggleValues.addEventListener("change", () => {
                pieCharts.forEach((chart) => {
                    const span = chart.querySelector("span");
                    if (span) span.classList.toggle("hidden", !toggleValues.checked);
                });
            });
        }

        const timePeriodSelect = document.getElementById("time-period-select");
        if (timePeriodSelect) {
            timePeriodSelect.addEventListener("change", (e) =>
                createCharts(e.target.value)
            );
        }
    }

    // Add sorting event listeners after DOM is loaded
    document.addEventListener("DOMContentLoaded", () => {
        const headers = document.querySelectorAll("#all-orders-table th[data-sort]");
        headers.forEach(header => {
            header.addEventListener("click", () => sortTable(header.dataset.sort));
        });
    });

    // Load all data on page load
    Promise.all([fetchOrders(), fetchMenuItems(), fetchDeliveryAgents(), fetchSummary(), fetchChartData(), fetchAllOrders()]).then(() => {
        populateOrders();
        populateDeliveryAgents();
        populateAllOrders();
    });

    // New Function: Update Summary UI
    function updateSummary(data) {
        document.getElementById("total-orders").textContent = data.total_orders;
        document.getElementById("total-revenue").textContent = `₹${data.total_revenue.toFixed(2)}`;
        document.getElementById("cancelled-orders").textContent = data.cancelled_orders;
        document.getElementById("delivered-orders").textContent = data.delivered_orders;
    }
    const cards = document.querySelectorAll(".summary-card");
    const sections = document.querySelectorAll(".section-content");

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            cards.forEach((c) => c.classList.remove("active"));
            card.classList.add("active");
            sections.forEach((section) => (section.style.display = "none"));
            const sectionId = card.getAttribute("data-section");
            const targetSection = document.querySelector(
                `.section-content.${sectionId}`
            );
            if (targetSection) {
                targetSection.style.display = "block";
                if (sectionId === "business-insights") {
                    createCharts("week");
                    updateSummary();
                    const toggleChart = document.getElementById("toggle-chart");
                    const toggleValues = document.getElementById("toggle-values");
                    if (toggleChart) toggleChart.checked = true;
                    if (toggleValues) toggleValues.checked = true;
                } else if (sectionId === "order-assignment") {
                    populateOrders();
                } else if (sectionId === "delivery-agents") {
                    populateDeliveryAgents();
                }
            }
        });
    });

    cards[0].click();

    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
    .order-item-img {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 5px;
      margin-right: 10px;
    }
    .order-content {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .order-details {
      flex: 1;
    }
  `;
    document.head.appendChild(styleSheet);
});

// Simulated data updates
function updateMetrics() {
    const metrics = {
        totalOrders: Math.floor(Math.random() * 1000),
        totalUsers: Math.floor(Math.random() * 500),
        totalSales: Math.floor(Math.random() * 10000),
        newUsers: Math.floor(Math.random() * 50)
    };

    document.getElementById('totalOrders').textContent = metrics.totalOrders;
    document.getElementById('totalUsers').textContent = metrics.totalUsers;
    document.getElementById('totalSales').textContent = `$${metrics.totalSales}`;
    document.getElementById('newUsers').textContent = metrics.newUsers;
}

// Update metrics every 5 seconds
updateMetrics();
setInterval(updateMetrics, 5000);

// Add active state to navigation
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelector('.nav-menu a.active')?.classList.remove('active');
        e.target.classList.add('active');
    });
});

// Sales Chart
const ctx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Monthly Sales',
            data: [12000, 19000, 15000, 25000, 22000, 30000],
            borderColor: 'rgb(139, 195, 74)',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value, index, values) {
                        return '$' + value;
                    }
                }
            }
        }
    }
});

// Recent Orders Table
function generateRandomOrder() {
    const orderId = Math.floor(Math.random() * 1000000);
    const customers = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Emma Wilson'];
    const items = ['Pizza', 'Burger', 'Salad', 'Pasta', 'Sushi'];
    const statuses = ['Delivered', 'In Transit', 'Preparing', 'Cancelled'];

    return {
        id: orderId,
        customer: customers[Math.floor(Math.random() * customers.length)],
        items: `${items[Math.floor(Math.random() * items.length)]}, ${items[Math.floor(Math.random() * items.length)]}`,
        total: `$${(Math.random() * 100).toFixed(2)}`,
        status: statuses[Math.floor(Math.random() * statuses.length)]
    };
}

function updateRecentOrders() {
    const tableBody = document.querySelector('#recentOrders tbody');
    tableBody.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        // ! NEED TO FETCH DATA FROM DATABASE.
        const order = generateRandomOrder();
        const row = `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.items}</td>
                <td>${order.total}</td>
                <td>${order.delivery_status}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    }
}

// Initial update and set interval for recent orders
updateRecentOrders();
setInterval(updateRecentOrders, 10000);
document.addEventListener("DOMContentLoaded", function () {
    const orderPreview = document.getElementById("total-preview");
    const confirmOrderButton = document.getElementById("confirm-order-btn");
    const cartCountElement = document.getElementById("cart-count");
    const popupOverlay = document.getElementById("popup-overlay");
    const popupTitle = document.getElementById("popup-title");
    const popupMessage = document.getElementById("popup-message");
    const popupClose = document.getElementById("popup-close");
    const popupConfirm = document.getElementById("popup-confirm");

    const cart = window.initialCart || [];
    const total = window.total || 0;

    console.log(total);

    const subtotal = window.subtotal || 0;
    const tax = window.tax || 0;
    const deliveryCharge = window.deliveryCharge || 0;

    function getCartTotalItems() {
        return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    // function updateCartCount() {
    //     const totalItems = getCartTotalItems();
    //     const cartLink = document.querySelector('.nav__link[href="/order"]');
    //     if (cartLink) {
    //         const span = cartLink.querySelector(".nav__cart-count");
    //         if (span) span.textContent = totalItems;
    //     }
    // }

    function updateOrderPreview() {
        orderPreview.innerHTML = `
            <p>Total: <span id="total-preview">₹${total.toFixed(2)}</span></p>
        `;
    }

    // Initialize Leaflet Map
    // Map Initialization and Functions
    let map;
    let marker;

    function initMap() {
        const mapElement = document.getElementById("map");
        if (!mapElement) {
            console.error("Map container not found");
            return;
        }

        // Set default dimensions if not set
        mapElement.style.height = mapElement.style.height || "400px";
        mapElement.style.width = mapElement.style.width || "100%";

        try {
            // Initialize map with default Bangalore coordinates
            map = L.map("map").setView([28.5355, 77.3910], 12);

            // Add tile layers
            L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
                }
            ).addTo(map);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                opacity: 0.5,
            }).addTo(map);

            // Click handler for map
            map.on("click", function (event) {
                const lat = event.latlng.lat;
                const lng = event.latlng.lng;
                geocodeLatLng(lat, lng);
                updateMarker(lat, lng);
            });

            // Ensure proper sizing
            setTimeout(() => {
                map.invalidateSize();
            }, 300);
        } catch (error) {
            console.error("Map initialization error:", error);
        }
    }

    function updateMarker(lat, lng) {
        const redIcon = L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });

        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
    }

    function geocodeLatLng(lat, lng) {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

        fetch(nominatimUrl, {
            headers: {
                "User-Agent": "HIFI-Delivery-Eats/1.0 (your-email@example.com)",
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data && data.address) {
                    const address = data.address;
                    document.getElementById("street").value = address.road || address.street || "";
                    document.getElementById("city").value =
                        address.city || address.town || address.village || "";
                    document.getElementById("state").value = address.state || "";
                    document.getElementById("pincode").value = address.postcode || "";
                    document.getElementById("coordinates").value = `(${lat}, ${lng})`;
                }
            })
            .catch((error) => {
                console.error("Geocoding error:", error);
            });
    }

    
    // Popup functions
    function showPopup(title, message, isConfirm = false) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupOverlay.style.display = "flex";
        popupConfirm.style.display = isConfirm ? "inline-block" : "none";
        popupClose.style.display = "inline-block";
    }

    function hidePopup() {
        popupOverlay.style.display = "none";
    }

    popupOverlay.addEventListener("click", function (e) {
        if (e.target === popupOverlay) hidePopup();
    });
    popupClose.addEventListener("click", hidePopup);

    // Validate and show confirmation popup
    function validateAndProceed() {
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const street = document.getElementById("street").value.trim();
        const city = document.getElementById("city").value.trim();
        const state = document.getElementById("state").value.trim();
        const pincode = document.getElementById("pincode").value.trim();

        if (!name || !phone || !street || !city || !state || !pincode) {
            showPopup("Error", "Please fill out all delivery details.");
            return;
        }

        showPopup("Confirmation", "Are you sure you want to confirm this order?", true);
    }

    // Handle order confirmation
    function proceedWithOrder() {
        const deliveryDetails = {
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            street: document.getElementById("street").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            pincode: document.getElementById("pincode").value.trim(),
            coordinates: document.getElementById("coordinates").value.trim(),
            payment_method: document.querySelector('input[name="payment"]:checked').value
        };

        const orderData = {
            total: total,
            subtotal: subtotal,
            tax: tax,
            delivery_charge: deliveryCharge,
            delivery_details: deliveryDetails
        };

        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(orderData)
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to place order');
                return response.json();
            })
            .then(data => {
                window.location.href = `/order_confirmation?order_id=${data.order_id}`;
            })
            .catch(error => {
                console.error("Error placing order:", error);
                showPopup("Error", "Failed to place order: " + error.message);
            });
    }

    // Event listeners
    confirmOrderButton.addEventListener("click", validateAndProceed);
    popupConfirm.addEventListener("click", function () {
        hidePopup();
        proceedWithOrder();
    });

    updateOrderPreview();
    // updateCartCount();
    initMap();
    
});
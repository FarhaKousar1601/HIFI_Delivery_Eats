// Utility function to format timestamp as YYYY-MM-DD HH:mm:ss
function formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Function to show success popup
function showSuccessPopup(message) {
    const popup = document.createElement("div");
    popup.className = "popup-container";

    const style = document.createElement("style");
    style.textContent = `
    .popup-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #069c54, #34c759);
        color: #FFFFFF;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        max-width: 400px;
        width: 90%;
        font-family: 'Arial', sans-serif;
        animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -60%); }
        to { opacity: 1; translate(-50%, -50%); }
    }
    .popup-container p {
        margin: 0 0 20px;
        font-size: 18px;
        text-align: center;
        color: #FFFFFF;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    }
    .popup-container button {
        padding: 12px 25px;
        border: none;
        border-radius: 8px;
        background-color: #FFFFFF;
        color: #069c54;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        display: block;
        margin: 0 auto;
    }
    .popup-container button:hover {
        background-color: #F0F0F0;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }
    .popup-container button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    `;
    document.head.appendChild(style);

    popup.innerHTML = `
        <p>${message}</p>
        <button id="close-success">OK</button>
    `;

    document.body.appendChild(popup);

    document
        .getElementById("close-success")
        .addEventListener("click", function () {
            document.body.removeChild(popup);
            document.head.removeChild(style);
        });

    // Auto-close after 3 seconds
    setTimeout(() => {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
            document.head.removeChild(style);
        }
    }, 3000);
}

// Function to render menu items in the table
function renderMenuItems() {
    const tableBody = document.getElementById("menu-table-body");
    if (!tableBody) {
        console.error("Table body element with id 'menu-table-body' not found.");
        return;
    }
    fetch("/get_items").then(response => response.json())
        .then(data => {
            tableBody.innerHTML = "";
            const baseUrl = "https://HiFiDeliveryEats.com/";
            const staticImagePath = "/images/";
            data.forEach((item) => {
                const newRow = document.createElement("tr");
                newRow.innerHTML = `
                    <td>${item.menu_item_id || "N/A"}</td>
                    <td>${item.name}</td>
                    <td>${item.description}</td>
                    <td>${item.price}</td>
                    <td>${item.category_name}</td>
                    <td>${item.subcategory_name}</td>
                    <td>${item.discount_percentage}%</td>
                    <td><img src="${staticImagePath}${item.image_url.replace(baseUrl, '')}" alt="${item.name}" width="50"></td>
                    <td>${item.is_best_seller}</td>
                    <td>${item.stock_available}</td>
                    <td>${item.scheduled_update_time || formatTimestamp(new Date())}</td> <!-- Display scheduled time -->

                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn" data-index="${item.menu_item_id}">Edit</button>
                            <button class="delete-btn" data-index="${item.menu_item_id}">Delete</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(newRow);
            });
            document.querySelectorAll(".edit-btn").forEach((button) => {
                button.addEventListener("click", function () {
                    const index = this.getAttribute("data-index");
                    const deleteButton = this.parentElement.querySelector(".delete-btn");
                    deleteButton.disabled = true;
                    this.disabled = true;
                    showEditPopup(index, deleteButton, this);
                });
            });

            document.querySelectorAll(".delete-btn").forEach((button) => {
                button.addEventListener("click", function () {
                    const index = this.getAttribute("data-index");
                    const editButton = this.parentElement.querySelector(".edit-btn");
                    editButton.disabled = true;
                    this.disabled = true;
                    showDeleteConfirmation(index, editButton, this);
                });
            });
            //   menuItems = data;
            console.log(data);
        }).catch(error => console.error("Error fetching items:", error));

}

// Function to show edit popup with green and white theme
function showEditPopup(index, deleteButton, editButton) {
    let item = {};

    fetch(`/get_item_by_id/${index}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Data:", data);  // Debugging
            item = data;
            const popup = document.createElement("div");
            popup.className = "popup-container";

            const style = document.createElement("style");
            style.textContent = `
            .popup-container {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #069c54, #34c759);
              color: #FFFFFF;
              padding: 25px;
              border-radius: 15px;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
              z-index: 1000;
              max-width: 500px;
              width: 90%;
              max-height: 80vh;
              overflow-y: auto;
              font-family: 'Arial', sans-serif;
              animation: fadeIn 0.3s ease-in-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translate(-50%, -60%); }
              to { opacity: 1; transform: translate(-50%, -50%); }
            }
            .popup-container h3 {
              margin: 0 0 20px;
              font-size: 24px;
              text-align: center;
              color: #FFFFFF;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
            }
            .popup-container label {
              display: block;
              margin: 10px 0 5px;
              font-weight: bold;
              color: #FFFFFF;
            }
            .popup-container input[type="text"],
            .popup-container input[type="number"],
            .popup-container textarea,
            .popup-container select {
              width: 100%;
              padding: 10px;
              margin-bottom: 15px;
              border: none;
              border-radius: 8px;
              background-color: #FFFFFF;
              color: #333;
              font-size: 14px;
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .popup-container input[type="text"]:disabled {
              background-color: #E0E0E0;
              color: #666;
            }
            .popup-container textarea {
              height: 80px;
              resize: none;
            }
            .popup-container input[type="radio"] {
              margin: 0 5px 0 15px;
            }
            .popup-container .button-group {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
            }
            .popup-container button {
              padding: 12px 25px;
              border: none;
              border-radius: 8px;
              background-color: #FFFFFF;
              color: #069c54;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .popup-container button:hover {
              background-color: #F0F0F0;
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
            }
            .popup-container button:active {
              transform: translateY(0);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            `;
            document.head.appendChild(style);

            popup.innerHTML = `
            <h3>Edit Menu Item</h3>
            <label>Item ID:</label>
            <input type="text" id="edit-item-id" value="${item.menu_item_id}" disabled><br>
            <label>Item Name:</label>
            <input type="text" id="edit-item-name" value="${item.name}" required><br>
            <label>Description:</label>
            <textarea id="edit-description" required>${item.description}</textarea><br>
            <label>Price (₹):</label>
            <input type="number" id="edit-price" step="0.01" value="${item.price}" required><br>
            <label>Category:</label>
            <select id="edit-category" required>
                <option value="Veg" ${item.category_name === "Veg" ? "selected" : ""}>VEG</option>
                <option value="Non-Veg" ${item.category_name === "Non-Veg" ? "selected" : ""}>NON-VEG</option>
            </select><br>
            <label>Subcategory:</label>
            <select id="edit-subcategory" required>
                <option value="Starter" ${item.subcategory_name === "Starter" ? "selected" : ""}>Starter</option>
                <option value="Soup" ${item.subcategory_name === "Soup" ? "selected" : ""}>Soup</option>
                <option value="Salad" ${item.subcategory_name === "Salad" ? "selected" : ""}>Salad</option>
                <option value="Bread" ${item.subcategory_name === "Bread" ? "selected" : ""}>Bread</option>
                <option value="Main Course" ${item.subcategory_name === "Main Course" ? "selected" : ""}>Main Course</option>
                <option value="Beverage" ${item.subcategory_name === "Beverage" ? "selected" : ""}>Beverage</option>
                <option value="Breakfast" ${item.subcategory_name === "Breakfast" ? "selected" : ""}>Breakfast</option>
                <option value="Biryani" ${item.subcategory_name === "Biryani" ? "selected" : ""}>Biryani</option>
                <option value="Icecream" ${item.subcategory_name === "Icecream" ? "selected" : ""}>Icecream</option>
            </select><br>
            <label>Discount (%):</label>
            <input type="number" id="edit-discount" min="0" max="100" value="${item.discount_percentage}"><br>
            <label>Best Seller:</label>
            <input type="radio" id="edit-best-seller-yes" name="edit-best-seller" value="yes" ${item.is_best_seller ? "checked" : ""}> Yes
            <input type="radio" id="edit-best-seller-no" name="edit-best-seller" value="no" ${!item.is_best_seller ? "checked" : ""}> No<br>
            <label>Stock Available:</label>
            <input type="number" id="edit-stock-available" min="0" value="${item.stock_available}" required><br>
            <label>Schedule Update (optional):</label>
            <input type="datetime-local" id="edit-schedule-time" value="${item.scheduled_update_time}"><br>
            <div class="button-group">
                <button id="save-edit">Save</button>
                <button id="cancel-edit">Cancel</button>
            </div>
            `;

            document.body.appendChild(popup);

            document.getElementById("save-edit").addEventListener("click", function () {
                let stockValue = document.getElementById("edit-stock-available").value.trim();
                // Default stockAvailable to "0" if blank or invalid
                stockValue = (stockValue === "" || isNaN(parseInt(stockValue)) || parseInt(stockValue) < 0) ? "0" : stockValue;

                // Validate discount input
                let discountValue = document.getElementById("edit-discount").value.trim();
                discountValue = (discountValue === "" || isNaN(parseInt(discountValue)) || parseInt(discountValue) < 0 || parseInt(discountValue) > 100) ? "0" : discountValue;
                const scheduleTime = document.getElementById("edit-schedule-time").value;

                const updatedItem = {
                    menu_item_id: index,
                    name: document.getElementById("edit-item-name").value,
                    description: document.getElementById("edit-description").value,
                    price: document.getElementById("edit-price").value,
                    category_name: document.getElementById("edit-category").value,
                    subcategory_name: document.getElementById("edit-subcategory").value,
                    discount_percentage: discountValue,
                    is_best_seller: document.querySelector('input[name="edit-best-seller"]:checked').value === "yes",
                    stock_available: stockValue,
                    scheduled_update_time: scheduleTime ? new Date(scheduleTime).toISOString() : null
                };

                fetch('/update_item', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedItem),
                }).then(response => response.json())
                    .then((data) => {
                        showSuccessPopup("Updated successfully!");
                        setTimeout(() => {
                            location.reload();
                        }, 2000); // Reload after 2 seconds (adjust timing as needed)
                        renderMenuItems();
                        document.body.removeChild(popup);
                        document.head.removeChild(style);
                        deleteButton.disabled = false;
                        editButton.disabled = false;
                    });
            });

            document.getElementById("cancel-edit").addEventListener("click", function () {
                document.body.removeChild(popup);
                document.head.removeChild(style);
                deleteButton.disabled = false;
                editButton.disabled = false;
            });
        }).catch(error => {
            console.error("Error fetching item:", error);
            showSuccessPopup("Failed to fetch item details. Please try again.");
        });
}

// Function to show delete confirmation popup with green and white theme
function showDeleteConfirmation(index, editButton, deleteButton) {
    // const menu_item_id = index;
    fetch(`/get_item_by_id/${index}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Data:", data);  // Debugging

            const popup = document.createElement("div");
            popup.className = "popup-container";

            const style = document.createElement("style");
            style.textContent = `
            .popup-container {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #069c54, #34c759);
              color: #FFFFFF;
              padding: 25px;
              border-radius: 15px;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
              z-index: 1000;
              max-width: 400px;
              width: 90%;
              font-family: 'Arial', sans-serif;
              animation: fadeIn 0.3s ease-in-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translate(-50%, -60%); }
              to { opacity: 1; transform: translate(-50%, -50%); }
            }
            .popup-container p {
              margin: 0 0 20px;
              font-size: 18px;
              text-align: center;
              color: #FFFFFF;
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
            }
            .popup-container .button-group {
              display: flex;
              justify-content: space-around;
            }
            .popup-container button {
              padding: 12px 25px;
              border: none;
              border-radius: 8px;
              background-color: #FFFFFF;
              color: #069c54;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .popup-container button:hover {
              background-color: #F0F0F0;
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
            }
            .popup-container button:active {
              transform: translateY(0);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .popup-container #confirm-delete {
              background-color: #FF4444;
              color: #FFFFFF;
            }
            .popup-container #confirm-delete:hover {
              background-color: #FF6666;
            }
            `;
            document.head.appendChild(style);

            popup.innerHTML = `
            <p>Are you sure you want to delete "${data.name}"?</p>
            <div class="button-group">
                <button id="confirm-delete">Yes</button>
                <button id="cancel-delete">No</button>
            </div>
            `;

            document.body.appendChild(popup);

            document.getElementById("confirm-delete").addEventListener("click", function () {
                fetch("/delete_item", {
                    method: "DELETE", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: data.name })
                }).then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            // alert(data.message); // Alert after successful deletion
                            renderMenuItems();
                            document.body.removeChild(popup);
                            document.head.removeChild(style);
                            showSuccessPopup("Item Deleted successfully!");
                            editButton.disabled = false;
                            deleteButton.disabled = false;
                        }
                    }).catch(error => console.error("Error:", error));
            });

            document.getElementById("cancel-delete").addEventListener("click", function () {
                document.body.removeChild(popup);
                document.head.removeChild(style);
                editButton.disabled = false;
                deleteButton.disabled = false;
            });
        });
}

// Function to generate a random timestamp in February 2025 with random time
function generateFeb2025Timestamp() {
    const day = Math.floor(Math.random() * 28) + 1; // Random day between 1 and 28
    const hours = Math.floor(Math.random() * 24); // Random hours between 0 and 23
    const minutes = Math.floor(Math.random() * 60); // Random minutes between 0 and 59
    const seconds = Math.floor(Math.random() * 60); // Random seconds between 0 and 59
    const date = new Date(2025, 1, day, hours, minutes, seconds); // Month is 1 (February, 0-based index)
    return formatTimestamp(date); // Use existing formatTimestamp function
}

// Main event listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("menu-form");
    const tableBody = document.getElementById("menu-table-body");

    if (!form) {
        console.error("Form element with id 'menu-form' not found.");
        return;
    }
    if (!tableBody) {
        console.error("Table body element with id 'menu-table-body' not found.");
        return;
    }

    // Apply table styling
    const tableStyle = document.createElement("style");
    tableStyle.textContent = `
      table {
        width: 100%;
        border-collapse: collapse;
        background: #FFFFFF;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        font-family: 'Arial', sans-serif;
      }
      th, td {
        padding: 15px;
        text-align: center;
        border-bottom: 1px solid #E0E0E0;
        color: #333;
      }
      th {
        background: linear-gradient(135deg, #069c54, #34c759);
        color: #FFFFFF;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      tr:nth-child(even) {
        background-color: #F8F8F8;
      }
      tr:hover {
        background-color: #F0F0F0;
        transition: background-color 0.3s ease;
      }
      td img {
        border-radius: 5px;
        object-fit: cover;
      }
      .action-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      .edit-btn, .delete-btn {
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .edit-btn {
        background-color: #069c54;
        color: #FFFFFF;
      }
      .edit-btn:hover {
        background-color: #34c759;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .edit-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .delete-btn {
        background-color: #FF4444;
        color: #FFFFFF;
      }
      .delete-btn:hover {
        background-color: #FF6666;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .delete-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .edit-btn:disabled, .delete-btn:disabled {
        background-color: #A0A0A0;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    `;
    document.head.appendChild(tableStyle);

    // Render initial menu items
    renderMenuItems();

    // Add event listener for form submission
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const itemName = document.getElementById("item-name").value.trim();
        const description = document.getElementById("description").value.trim();
        const price = document.getElementById("price").value.trim();
        const category = document.getElementById("category").value;
        const subcategory = document.getElementById("subcategory").value;
        let discount = document.getElementById("discount").value.trim();
        const imageFile = document.getElementById("image").files[0];
        const bestSeller =
            document.querySelector('input[name="best_seller"]:checked')?.value ||
            "no";
        let stockAvailable = document.getElementById("stock-available").value.trim();

        // Default stockAvailable to "0" if blank or invalid
        stockAvailable = (stockAvailable === "" || isNaN(parseInt(stockAvailable)) || parseInt(stockAvailable) < 0) ? "0" : stockAvailable;

        // Validate discount input (0-100, default to "0" if invalid)
        discount = (discount === "" || isNaN(parseInt(discount)) || parseInt(discount) < 0 || parseInt(discount) > 100) ? "0" : discount;

        let validationErrors = [];
        if (!itemName) validationErrors.push("Item Name is required.");
        if (!description) validationErrors.push("Description is required.");
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            validationErrors.push("Price must be a valid number greater than 0.");
        }
        if (!category || category === "")
            validationErrors.push("Please select a valid Category (VEG or NON-VEG).");
        if (!subcategory || subcategory === "")
            validationErrors.push("Please select a valid Subcategory.");
        if (isNaN(parseInt(stockAvailable)) || parseInt(stockAvailable) < 0) {
            validationErrors.push(
                "Stock Available must be a valid number (0 or greater)."
            );
        }
        if (!imageFile) {
            validationErrors.push("An image is required.");
        } else {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
            if (!allowedTypes.includes(imageFile.type)) {
                validationErrors.push("Image must be a JPEG, PNG, or GIF file.");
            }
        }

        if (validationErrors.length > 0) {
            showSuccessPopup(validationErrors.join("<br>")); // Use custom popup for errors
            return;
        }

        // Prepare form data for the backend
        const formData = new FormData();
        formData.append("item_name", itemName);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("category", category);
        formData.append("subcategory", subcategory);
        formData.append("discount", discount);
        formData.append("image", imageFile);
        formData.append("best_seller", bestSeller);
        formData.append("stock_available", stockAvailable);
        formData.append("scheduled_update_time", document.getElementById("schedule-time").value || "");

        // Send data to the backend
        fetch("/add_item", { method: "POST", body: formData, })
            .then((response) => response.json())
            .then((data) => {
                // alert(data);
                if (data.success) {
                    renderMenuItems();
                    form.reset();
                    showSuccessPopup("Item added successfully!");
                }
            }).catch((error) => {
                console.error("Error:", error);
                showSuccessPopup("⚠️ An unexpected error occurred.");
            });
    });
    renderMenuItems();
});
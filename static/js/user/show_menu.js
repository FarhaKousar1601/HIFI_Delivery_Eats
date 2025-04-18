// Initialize cart from the database
cart = [];
window.globalCart = cart;

async function fetchCart() {
    try {
      const response = await fetch('/api/cart', {
        method: 'GET',
        credentials: 'include', // Include cookies for session
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart: ' + response.statusText);
      }
      const result = await response.json();
      cart = result.data || [];
      window.globalCart = cart;
      console.log("Fetched cart:", cart);
      updateCartCount();
    } catch (error) {
      console.error("Error fetching cart:", error);
      cart = [];
    }
}

// Function to save cart to the backend
async function saveCart() {
    console.log("Saving cart:", cart);
    try {
      // Normalize cart data to ensure consistency
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
      if (!response.ok) {
        throw new Error('Failed to save cart: ' + response.statusText);
      }
      const result = await response.json();
      cart = result.data || cart; // Update local cart with server response
      window.globalCart = cart;
      console.log("Cart saved:", cart);
      updateCartCount();
    } catch (error) {
      console.error("Error saving cart:", error);
    }
}

// Function to calculate total items in the cart
function getCartTotalItems() {
  return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

// Function to update cart count in the navigation bar
function updateCartCount() {
    const totalItems = getCartTotalItems();
    const cartLink = document.querySelector('.nav__cart-count');
    if (cartLink) {
      cartLink.textContent = totalItems;
      console.log("Updated cart count to:", totalItems);
    } else {
      console.error("Cart link element not found.");
    }
  }

// Function to fetch menu items from the backend
async function fetchMenuItems() {
  try {
    const response = await fetch('/api/menu_items');
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    const result = await response.json(); // Parse the JSON response
    const menuItems = result.data; // Extract the 'data' array from your API response
    console.log(menuItems); // Log to verify the data
    appendDynamicItems(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
  }
}

// New Function: Fetch Recommendations
async function fetchRecommendations() {
    try {
        const response = await fetch('/api/recommendations', {
            method: 'GET',
            credentials: 'include', // Include cookies for session
        });
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const result = await response.json();
        console.log("Recommendations:", result);
        populateRecommendations(result.data, result.is_new_user);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        document.getElementById("recommendation-container").innerHTML = "<p>Error loading recommendations.</p>";
    }
}

// New Function: Populate Recommendations
function populateRecommendations(recommendations, isNewUser) {
    const recommendationSection = document.getElementById("recommendation-section");
    const recommendationContainer = document.getElementById("recommendation-container");

    if (isNewUser || recommendations.length === 0) {
        recommendationSection.style.display = "none"; // Hide for new users or no recommendations
        return;
    }

    recommendationSection.style.display = "block"; // Show for returning users with recommendations
    recommendationContainer.innerHTML = ""; // Clear existing content

    recommendations.forEach(item => {
        const menuItem = document.createElement("div");
        const baseUrl = "https://HiFiDeliveryEats.com/";
        const staticImagePath = "/images/";
        
        menuItem.classList.add("menu__content", "dynamic");
        menuItem.setAttribute("data-name", item.name);
        menuItem.setAttribute("data-price", item.price);
        menuItem.setAttribute("data-type", item.category_name?.toLowerCase() || "");
        menuItem.setAttribute("data-item-id", item.menu_item_id || "");

        const cartItem = cart.find(ci => ci.menu_item_id === item.menu_item_id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const stockAvailable = item.stock_available;

        const cartControlHtml = stockAvailable === 0
            ? `<div class="cart-control"><span class="out-of-stock">Out of Stock</span></div>`
            : quantity > 0
                ? `
          <div class="cart-control">
            <span class="cart-icon-wrapper"><i class="bx bx-cart-alt cart-icon"></i></span>
            <div class="quantity-control">
              <button class="decrement">-</button>
              <span class="item-count">${quantity}</span>
              <button class="increment">+</button>
            </div>
          </div>
        `
                : `
          <div class="cart-control">
            <span class="cart-icon-wrapper menu__button"><i class="bx bx-cart-alt cart-icon"></i></span>
          </div>
        `;
        console.log(`${item.image_url.replace(baseUrl, '')}  this is at location 151`);
        
        menuItem.innerHTML = `
        <img src="${staticImagePath}${item.image_url.replace(baseUrl, '')}" alt="${item.name}" class="menu__img" />
        <h3 class="menu__name">${item.name}</h3>
        <span class="menu__detail">${item.description || "No description available"}</span>
        <div class="menu__price-row">
          <span class="menu__preci">₹ ${parseFloat(item.price).toFixed(2)}</span>
          ${cartControlHtml}
        </div>
      `;

        recommendationContainer.appendChild(menuItem);
        setupCartControls(menuItem, item); // Reuse existing function
    });
}

// Function to append dynamic items to the menu
function appendDynamicItems(menuItems) {
    if (!menuItems || menuItems.length === 0) {
      console.log("No dynamic menu items to display.");
      return;
    }
  
    document.querySelectorAll(".menu__container .menu__content.dynamic").forEach(item => item.remove());
  
    menuItems.forEach((item) => {
      const subcategory = item['subcategory_name'].toLowerCase();
      if (!subcategory) {
        console.warn(`Item ${item['name']} has no subcategory, skipping.`);
        return;
      }
  
      const categorySection = Array.from(document.querySelectorAll(".menu-category")).find(
        (category) => category.getAttribute("data-category").toLowerCase() === subcategory.toLowerCase()
      );
  
      if (categorySection) {
        const menuContainer = categorySection.querySelector(".menu__container");
        const baseUrl = "https://HiFiDeliveryEats.com/";
        const staticImagePath = "/images/";
        if (menuContainer) {
          const cartItem = cart.find((ci) => ci.itemId === item.menu_item_id);
          const quantity = cartItem ? cartItem.quantity : 0;
          const stockAvailable = item.is_out_of_stock ? 0 : 5; // Adjust if stock data is available
  
          const menuItem = document.createElement("div");
          menuItem.classList.add("menu__content", "dynamic");
          menuItem.setAttribute("data-name", item['name']);
          menuItem.setAttribute("data-price", item['price']);
          menuItem.setAttribute("data-type", item['category_name']?.toLowerCase() || "");
          menuItem.setAttribute("data-item-id", item['menu_item_id'] || "");
  
          const cartControlHtml = stockAvailable === 0
            ? `<div class="cart-control"><span class="out-of-stock">Out of Stock</span></div>`
            : quantity > 0
            ? `
              <div class="cart-control">
                <span class="cart-icon-wrapper"><i class="bx bx-cart-alt cart-icon"></i></span>
                <div class="quantity-control">
                  <button class="decrement">-</button>
                  <span class="item-count">${quantity}</span>
                  <button class="increment">+</button>
                </div>
              </div>
            `
            : `
              <div class="cart-control">
                <span class="cart-icon-wrapper menu__button"><i class="bx bx-cart-alt cart-icon"></i></span>
              </div>
            `;
            // static\images\Paneer_Biryani.jpg
            // console.log(`${staticImagePath}, ${item.image_url.replace(baseUrl, '')} this is at 222`);
          menuItem.innerHTML = `
            <img src="${staticImagePath}${item.image_url.replace(baseUrl, '')}" alt="${item.name}" class="menu__img" />
            <h3 class="menu__name">${item.name}</h3>
            <span class="menu__detail">${item.description || "No description available"}</span>
            <div class="menu__price-row">
              <span class="menu__preci">₹ ${parseFloat(item.price).toFixed(2)}</span>
              ${cartControlHtml}
            </div>
          `;
  
          menuContainer.appendChild(menuItem);
  
          // Attach all cart-related event listeners
          setupCartControls(menuItem, item);
        } else {
          console.error(`Menu container not found for subcategory: ${subcategory}`);
        }
      } else {
        console.error(`Category section not found for subcategory: ${subcategory}`);
      }
    });
  }


// Function to show add-to-cart popup
function showAddToCartPopup(item, menuItem) {
    const popup = document.createElement("div");
    popup.className = "popup-container";
    popup.innerHTML = `
      <p>Add "${item.name}" to cart?</p>
      <div class="button-group">
        <button id="confirm-add">OK</button>
        <button id="cancel-add">Cancel</button>
      </div>
    `;
    document.body.appendChild(popup);
  
    document.getElementById("confirm-add").addEventListener("click", () => {
      updateQuantity(item, 1, menuItem);
      document.body.removeChild(popup);
    });
  
    document.getElementById("cancel-add").addEventListener("click", () => {
      document.body.removeChild(popup);
    });
  }
  
  // Function to set up cart control event listeners
  function setupCartControls(menuItem, item) {
    const incrementBtn = menuItem.querySelector(".increment");
    const decrementBtn = menuItem.querySelector(".decrement");
    const countSpan = menuItem.querySelector(".item-count");
    const addToCartBtn = menuItem.querySelector(".cart-icon-wrapper.menu__button");
  
    // Add to Cart button listener
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showAddToCartPopup(item, menuItem);
      });
    }
  
    // Increment button listener
    if (incrementBtn) {
      incrementBtn.addEventListener("click", (e) => {
        e.preventDefault();
        updateQuantity(item, 1, menuItem);
      });
    }
  
    // Decrement button listener
    if (decrementBtn) {
      decrementBtn.addEventListener("click", (e) => {
        e.preventDefault();
        updateQuantity(item, -1, menuItem);
      });
    }
  
    // Disable decrement button if quantity is 0
    if (decrementBtn && countSpan) {
      decrementBtn.disabled = parseInt(countSpan.textContent) <= 0;
    }
  }
  
// Updated updateQuantity to ensure consistent cart structure
async function updateQuantity(item, change, menuItem) {
    const cartControl = menuItem.querySelector(".cart-control");
    const previousQuantity = parseInt(menuItem.querySelector(".item-count")?.textContent || "0");
    const stockAvailable = item.is_out_of_stock ? 0 : 5; // Update to item.stock_available later
    let newQuantity = previousQuantity + change;
  
    if (change > 0 && newQuantity > stockAvailable) {
      showStockAlert(item.name, stockAvailable);
      return;
    }
  
    if (newQuantity < 0) newQuantity = 0;
  
    const cartItem = cart.find(ci => ci.menu_item_id === item.menu_item_id);
    if (newQuantity === 0 && cartItem) {
      cart = cart.filter(ci => ci.menu_item_id !== item.menu_item_id);
    } else if (cartItem) {
      cartItem.quantity = newQuantity;
      // Ensure all required fields are present
      cartItem.menu_item_id = item.menu_item_id;
      cartItem.name = item.name;
      cartItem.price = item.price;
    } else if (newQuantity > 0) {
      cart.push({
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: newQuantity
      });
    }
  
    const cartControlHtml = stockAvailable === 0
      ? `<div class="cart-control"><span class="out-of-stock">Out of Stock</span></div>`
      : newQuantity > 0
      ? `
        <div class="cart-control">
          <span class="cart-icon-wrapper"><i class="bx bx-cart-alt cart-icon"></i></span>
          <div class="quantity-control">
            <button class="decrement">-</button>
            <span class="item-count">${newQuantity}</span>
            <button class="increment">+</button>
          </div>
        </div>
      `
      : `
        <div class="cart-control">
          <span class="cart-icon-wrapper menu__button"><i class="bx bx-cart-alt cart-icon"></i></span>
        </div>
      `;
  
    cartControl.innerHTML = cartControlHtml;
    setupCartControls(menuItem, item);
  
    await saveCart();
    updateCartCount();
  }
  
  // Function to show stock alert popup
function showStockAlert(itemName, stockAvailable) {
    const popup = document.createElement("div");
    popup.className = "popup-container";
    popup.innerHTML = `
      <p>"${itemName}" is limited to ${stockAvailable} units in stock.</p>
      <div class="button-group">
        <button id="close-alert">OK</button>
      </div>
    `;
    document.body.appendChild(popup);
  
    document.getElementById("close-alert").addEventListener("click", () => {
      document.body.removeChild(popup);
    });
  
    // Auto-close after 3 seconds
    setTimeout(() => {
      if (document.body.contains(popup)) {
        document.body.removeChild(popup);
      }
    }, 3000);
}
  
  // Scroll-to-top functionality
  function scrollTop() {
    const scrollTop = document.getElementById("scroll-top");
    if (window.scrollY >= 560) {
      scrollTop.classList.add("show-scroll");
    } else {
      scrollTop.classList.remove("show-scroll");
    }
  }

document.addEventListener("DOMContentLoaded",async function () {
    // DOM Elements
    await fetchCart();
    await fetchMenuItems();
    await fetchRecommendations();
    updateCartCount();
    
    const searchInput = document.querySelector(".search-input");
    const vegNonVegFilter = document.getElementById("veg-nonveg-filter");
    const subCategoryFilter = document.getElementById("sub-category");
    const menuCategories = document.querySelectorAll(".menu-category");
    const menuHeading = document.getElementById("menu-heading");
    const menuSection = document.querySelector("section.menu");
  
    // Debug DOM availability
    console.log("DOM elements:", {
      searchInput: !!searchInput,
      vegNonVegFilter: !!vegNonVegFilter,
      subCategoryFilter: !!subCategoryFilter,
      menuCategories: menuCategories.length,
      menuHeading: !!menuHeading,
      menuSection: !!menuSection
    });

    // Function to apply filters
    function applyFilters() {
      const searchQuery = searchInput?.value.trim().toLowerCase() || "";
      const vegNonVegValue = vegNonVegFilter?.value.toLowerCase() || "";
      const subCategoryValue = subCategoryFilter?.value.toLowerCase() || "";
  
      console.log("Applying filters:", { searchQuery, vegNonVegValue, subCategoryValue });
  
      let headingText = "All Menu Items";
      if (searchQuery) headingText = `Search Results for "${searchQuery}"`;
      else if (vegNonVegValue && subCategoryValue) {
        headingText = `${vegNonVegValue.charAt(0).toUpperCase() + vegNonVegValue.slice(1)} ${subCategoryValue.charAt(0).toUpperCase() + subCategoryValue.slice(1)}`;
      } else if (vegNonVegValue) {
        headingText = `${vegNonVegValue.charAt(0).toUpperCase() + vegNonVegValue.slice(1)} Items`;
      } else if (subCategoryValue) {
        headingText = subCategoryValue.charAt(0).toUpperCase() + subCategoryValue.slice(1);
      }
  
      if (menuHeading) menuHeading.textContent = headingText;
      else {
        console.error("menu-heading element not found");
        return;
      }
  
      let hasResults = false;
      menuCategories.forEach((category) => {
        const categorySubcategory = category.dataset.category.toLowerCase();
        const matchesSubCategory = !subCategoryValue || categorySubcategory === subCategoryValue;
        const items = category.querySelectorAll(".menu__content");
        let hasVisibleItems = false;
  
        items.forEach((item) => {
          const itemName = item.getAttribute("data-name")?.toLowerCase() || "";
          const itemType = item.getAttribute("data-type")?.toLowerCase() || "";
          const matchesSearch = !searchQuery || itemName.includes(searchQuery);
          const matchesVegNonVeg = !vegNonVegValue || itemType === vegNonVegValue;
  
          if (matchesSearch && matchesVegNonVeg && matchesSubCategory) {
            item.style.display = "flex";
            hasVisibleItems = true;
            hasResults = true;
          } else {
            item.style.display = "none";
          }
        });
  
        category.style.display = matchesSubCategory ? "block" : "none";
        const categoryTitle = category.querySelector(".category-title");
        if (categoryTitle) categoryTitle.style.display = matchesSubCategory ? "block" : "none";
  
        const noItemsMessage = category.querySelector(".no-items-message");
        if (noItemsMessage) noItemsMessage.remove();
  
        if (matchesSubCategory && !hasVisibleItems) {
          const message = document.createElement("p");
          message.className = "no-items-message";
          message.textContent = "No items match your filters in this category.";
          message.style.textAlign = "center";
          message.style.color = "#707070";
          const menuContainer = category.querySelector(".menu__container");
          if (menuContainer) menuContainer.appendChild(message);
        }
      });
  
      if (!hasResults && (searchQuery || vegNonVegValue || subCategoryValue)) {
        menuHeading.textContent = "No Results Found";
        menuHeading.classList.add("no-results");
      } else {
        menuHeading.classList.remove("no-results");
      }
    }
  
    // Event listeners for filters
    searchInput?.addEventListener("input", applyFilters);
    vegNonVegFilter?.addEventListener("change", applyFilters);
    subCategoryFilter?.addEventListener("change", applyFilters);

    const themeButton = document.getElementById("theme-button");
    if (themeButton) {
      themeButton.addEventListener("click", toggleTheme);
    } else {
      console.error("Theme button not found in DOMContentLoaded");
    }
    applySavedTheme();
  });
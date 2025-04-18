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
          const menuItem = document.createElement("div");
          menuItem.classList.add("menu__content", "dynamic");
          menuItem.setAttribute("data-name", item['name']);
          menuItem.setAttribute("data-price", item['price']);
          menuItem.setAttribute("data-type", item['category_name']?.toLowerCase() || "");
          menuItem.setAttribute("data-item-id", item['menu_item_id'] || "");
  
          const cartControlHtml =`
              <div class="cart-control">
                <span class="cart-icon-wrapper menu__button"><i class="bx bx-cart-alt cart-icon"></i></span>
              </div>
            `;
          menuItem.innerHTML = `
            <img src="${staticImagePath}${item.image_url.replace(baseUrl, '')}" alt="${item.name}" class="menu__img" />
            <h3 class="menu__name">${item.name}</h3>
            <span class="menu__detail">${item.description || "No description available"}</span>
            <div class="menu__price-row">
              <span class="menu__preci">₹ ${parseFloat(item.price).toFixed(2)}</span>
             
            </div>
          `;
  
          menuContainer.appendChild(menuItem);
  
        } else {
          console.error(`Menu container not found for subcategory: ${subcategory}`);
        }
      } else {
        console.error(`Category section not found for subcategory: ${subcategory}`);
      }
    });
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
    await fetchMenuItems();
    // await fetchRecommendations();
    
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
// import ScrollReveal from 'scrollreveal'
/*==================== SHOW MENU ====================*/
const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId);
    if (toggle && nav) {
      toggle.addEventListener("click", () => nav.classList.toggle("show-menu"));
    }
  };
  showMenu("nav-toggle", "nav-menu");
  
  /*==================== REMOVE MENU MOBILE ====================*/
  const navLink = document.querySelectorAll(".nav__link");
  function linkAction() {
    const navMenu = document.getElementById("nav-menu");
    navMenu.classList.remove("show-menu");
  }
  navLink.forEach((n) => n.addEventListener("click", linkAction));
  
  /*==================== TOGGLE DROPDOWN ON MOBILE ====================*/
  const dropdown = document.querySelector(".nav__dropdown");
  const dropdownLink = document.querySelector(".nav__menu-link");
  if (dropdown && dropdownLink) {
    dropdownLink.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdown.classList.toggle("active");
      }
    });
  }
  
  /*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
  const sections = document.querySelectorAll("section[id]");
  function scrollActive() {
    const scrollY = window.pageYOffset;
    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 50;
      const sectionId = current.getAttribute("id");
      const link = document.querySelector(`.nav__menu a[href*=${sectionId}]`);
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        link?.classList.add("active-link");
      } else {
        link?.classList.remove("active-link");
      }
    });
  }
  window.addEventListener("scroll", scrollActive);
  
  /*==================== CHANGE BACKGROUND HEADER ====================*/
  function scrollHeader() {
    const nav = document.getElementById("header");
    if (window.scrollY >= 200) nav.classList.add("scroll-header");
    else nav.classList.remove("scroll-header");
  }
  window.addEventListener("scroll", scrollHeader);
  
  /*==================== SHOW SCROLL TOP ====================*/
  function scrollTop() {
    const scrollTop = document.getElementById("scroll-top");
    if (window.scrollY >= 560) scrollTop.classList.add("show-scroll");
    else scrollTop.classList.remove("show-scroll");
  }
  window.addEventListener("scroll", scrollTop);
  
  /*==================== DARK LIGHT THEME ====================*/
  const themeButton = document.getElementById("theme-button");
  const darkTheme = "dark-theme";
  const iconTheme = "bx-sun";
  
  const selectedTheme = localStorage.getItem("selected-theme");
  const selectedIcon = localStorage.getItem("selected-icon");
  
  const getCurrentTheme = () =>
    document.body.classList.contains(darkTheme) ? "dark" : "light";
  const getCurrentIcon = () =>
    themeButton.classList.contains(iconTheme) ? "bx-moon" : "bx-sun";
  
  if (selectedTheme) {
    document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
      darkTheme
    );
    themeButton.classList[selectedIcon === "bx-moon" ? "add" : "remove"](
      iconTheme
    );
  }
  
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle(darkTheme);
    themeButton.classList.toggle(iconTheme);
    localStorage.setItem("selected-theme", getCurrentTheme());
    localStorage.setItem("selected-icon", getCurrentIcon());
  });

  
  /*==================== SCROLL REVEAL ANIMATION ====================*/
  const sr = ScrollReveal({
    origin: "top",
    distance: "30px",
    duration: 2000,
    reset: true,
  });
  sr.reveal(
    `.home__data, .home__img, .about__data, .about__img, .menu__content, .footer__content`,
    { interval: 200 }
  );
  
  /*==================== CART FUNCTIONALITY ====================*/
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  window.globalCart = cart;
  
  function saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
      window.globalCart = cart;
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
      cart = [];
    }
  }
  
  function updateCartCounter() {
    const totalQuantity = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    const cartLink = document.querySelector(
      '.nav__link[href="../order/order.html"]'
    );
    if (cartLink) cartLink.textContent = `Cart (${totalQuantity})`;
  }
  
  /*==================== INITIALIZATION ====================*/
  document.addEventListener("DOMContentLoaded", () => {
    updateCartCounter();
  });
  
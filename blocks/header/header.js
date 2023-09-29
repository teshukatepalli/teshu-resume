import { getMetadata, decorateIcons } from "../../scripts/lib-franklin.js";

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia("(min-width: 900px)");

function closeOnEscape(e) {
  if (e.code === "Escape") {
    const nav = document.getElementById("nav");
    const navSections = nav.querySelector(".nav-sections");
    const navSectionExpanded = navSections.querySelector(
      '[aria-expanded="true"]'
    );
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector("button").focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === "nav-drop";
  if (isNavDrop && (e.code === "Enter" || e.code === "Space")) {
    const dropExpanded = focused.getAttribute("aria-expanded") === "true";
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest(".nav-sections"));
    focused.setAttribute("aria-expanded", dropExpanded ? "false" : "true");
  }
}

function focusNavSection() {
  document.activeElement.addEventListener("keydown", openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll(".nav-sections > ul > li").forEach((section) => {
    section.setAttribute("aria-expanded", expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded =
    forceExpanded !== null
      ? !forceExpanded
      : nav.getAttribute("aria-expanded") === "true";
  const button = nav.querySelector(".nav-hamburger button");
  document.body.style.overflowY = expanded || isDesktop.matches ? "" : "hidden";
  nav.setAttribute("aria-expanded", expanded ? "false" : "true");
  toggleAllNavSections(
    navSections,
    expanded || isDesktop.matches ? "false" : "true"
  );
  button.setAttribute(
    "aria-label",
    expanded ? "Open navigation" : "Close navigation"
  );
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll(".nav-drop");
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute("tabindex")) {
        drop.setAttribute("role", "button");
        drop.setAttribute("tabindex", 0);
        drop.addEventListener("focus", focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute("role");
      drop.removeAttribute("tabindex");
      drop.removeEventListener("focus", focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener("keydown", closeOnEscape);
  } else {
    window.removeEventListener("keydown", closeOnEscape);
  }
}

function createSearchResultsBlock(results) {
  const searchResultsBlock = document.createElement("div");
  searchResultsBlock.classList.add("search-results"); // You can customize the class name

  // Loop through the search results and create elements for each result
  results.forEach((result) => {
    const resultElement = document.createElement("div");
    resultElement.classList.add("search-result"); // You can customize the class name

    // Customize the content based on your search result data
    resultElement.innerHTML = `
    <img src="${result.image}" alt="${result.title}">
      <a href="${result.path}">${result.description}</a>
    `;

    // Append the result element to the search results block
    searchResultsBlock.appendChild(resultElement);
  });

  return searchResultsBlock;
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  console.log(block);
  // fetch nav content
  const navMeta = getMetadata("nav");
  const navPath = navMeta ? new URL(navMeta).pathname : "/nav";
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement("nav");
    nav.id = "nav";
    nav.innerHTML = html;

    const classes = ["brand", "sections", "tools"];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navSections = nav.querySelector(".nav-sections");
    if (navSections) {
      navSections.querySelectorAll(":scope > ul > li").forEach((navSection) => {
        if (navSection.querySelector("ul"))
          navSection.classList.add("nav-drop");
        navSection.addEventListener("click", () => {
          if (isDesktop.matches) {
            const expanded =
              navSection.getAttribute("aria-expanded") === "true";
            toggleAllNavSections(navSections);
            navSection.setAttribute(
              "aria-expanded",
              expanded ? "false" : "true"
            );
          }
        });
      });
    }

    // // hamburger for mobile
    const hamburger = document.createElement("div");
    hamburger.classList.add("nav-hamburger");
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
    hamburger.addEventListener("click", () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute("aria-expanded", "false");
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener("change", () =>
      toggleMenu(nav, navSections, isDesktop.matches)
    );

    decorateIcons(nav);
    const navWrapper = document.createElement("div");
    navWrapper.className = "nav-wrapper";
    navWrapper.append(nav);
    block.append(navWrapper);
    const inputElement = document.createElement("input");
    inputElement.setAttribute("type", "text");
    inputElement.setAttribute("placeholder", "Search");

    inputElement.addEventListener("change", function () {
      const searchTerm = this.value.toLowerCase(); // Get the lowercase search term

      // Fetch the JSON data from the URL
      fetch("http://localhost:3000/query-index.json")
        .then((response) => response.json())
        .then((jsonData) => {
          // Perform a search based on the fetched JSON data
          const results = jsonData.data.filter((item) => {
            // Customize this condition to match your search criteria
            return item.description.toLowerCase().includes(searchTerm);
          });
          console.log(results);
          const resultBlock = document.querySelector(".search-results"); // Use .search-results for class selector
          resultBlock ? resultBlock.remove() : null;
          if (results.length > 0 && searchTerm != "") {
            // Create a block based on the search results
            const searchResultsBlock = createSearchResultsBlock(results);

            // Use a more specific selector for your header
            const header = document.querySelector(".header"); // Adjust this selector as needed
            header.appendChild(searchResultsBlock);
          }

          // Get the header element and append the search results block to it
        })
        .catch((error) => {
          console.error("Error fetching JSON data:", error);
        });
    });

    // Append the input element to the .nav-tools container
    const navToolsContainer = document.querySelector(".nav-tools");
    navToolsContainer.appendChild(inputElement);

  //   // header-wrapper
  //   // Get the original header element
  //   const originalHeader = document.querySelector(".header-wrapper");

  //   // Create a new header element
  //   const newHeader = document.createElement("header");
  //   newHeader.id = "header";

  //   // Create the outer div element
  //   const outerDiv = document.createElement("div");
  //   outerDiv.classList.add("outer");

  //   // Create the logo anchor element
  //   const logoAnchor = document.createElement("a");
  //   logoAnchor.id = "logo";
  //   logoAnchor.href = "/";
  //   const logoImg = document.createElement("img");
  //   logoImg.src = "//www.aldevron.com/hubfs/aldevron_template/logo.png";
  //   logoImg.alt = "Aldevron Logo";
  //   logoAnchor.appendChild(logoImg);
  //   outerDiv.appendChild(logoAnchor);

  //   // Create the cart div element
  //   const cartDiv = document.createElement("div");
  //   cartDiv.id = "cart";
  //   const cartLink = document.createElement("a");
  //   cartLink.href =
  //     "https://606687.secure.netsuite.com/app/site/query/cartredirect.nl?c=606687&amp;n=1&amp;ext=T";
  //   const cartIcon = document.createElement("span");
  //   cartIcon.classList.add("icon-cart");
  //   const cartNum = document.createElement("span");
  //   cartNum.classList.add("cart-num");
  //   cartNum.innerHTML =
  //     '<script src="https://606687.secure.netsuite.com/app/site/query/getcartitemcount.nl?c=606687&amp;n=1"></script>0';
  //   const cartSum = document.createElement("span");
  //   cartSum.classList.add("cart-sum");
  //   cartSum.innerHTML =
  //     '/ <script src="https://606687.secure.netsuite.com/app/site/query/getcarttotal.nl?c=606687&amp;n=1"></script>$0.00';
  //   cartLink.appendChild(cartIcon);
  //   cartLink.appendChild(cartNum);
  //   cartLink.appendChild(cartSum);
  //   cartDiv.appendChild(cartLink);
  //   outerDiv.appendChild(cartDiv);

  //   // Create the header-nav div element
  //   const headerNavDiv = document.createElement("div");
  //   headerNavDiv.id = "header-nav";

  //   // Create the mobile-nav div element
  //   const mobileNavDiv = document.createElement("div");
  //   mobileNavDiv.id = "mobile-nav";
  //   const mobileNavIcon = document.createElement("span");
  //   mobileNavIcon.classList.add("icon-menu");
  //   mobileNavDiv.appendChild(mobileNavIcon);
  //   headerNavDiv.appendChild(mobileNavDiv);

  //   // Create the header-nav-in div element
  //   const headerNavInDiv = document.createElement("div");
  //   headerNavInDiv.id = "header-nav-in";

  //   // Create the header-info div element
  //   const headerInfoDiv = document.createElement("div");
  //   headerInfoDiv.id = "header-info";

  //   // Create the custom search form
  //   const customSearchForm = document.createElement("form");
  //   customSearchForm.setAttribute("data-hs-cf-bound", "true");
  //   const customSearchInput = document.createElement("input");
  //   customSearchInput.name = "q";
  //   customSearchInput.id = "customsearch-q";
  //   customSearchInput.placeholder = "Enter text...";
  //   const searchIcon = document.createElement("span");
  //   searchIcon.classList.add("icon-search");
  //   customSearchForm.appendChild(customSearchInput);
  //   customSearchForm.appendChild(searchIcon);
  //   headerInfoDiv.appendChild(customSearchForm);

  //   // Create links for Contact Us, Status, News, Blog, and Careers
  //   const contactLink = document.createElement("a");
  //   contactLink.classList.add("contact");
  //   contactLink.href = "/about-us/contact-us";
  //   contactLink.textContent = "Contact Us";

  //   const statusLink = document.createElement("a");
  //   statusLink.classList.add("status");
  //   statusLink.href = "/status";
  //   statusLink.textContent = "Status";

  //   const newsLink = document.createElement("a");
  //   newsLink.classList.add("news");
  //   newsLink.href = "/about-us/news";
  //   newsLink.textContent = "News";

  //   const blogLink = document.createElement("a");
  //   blogLink.classList.add("blog");
  //   blogLink.href = "/blog";
  //   blogLink.textContent = "Blog";

  //   const eventsLink = document.createElement("a");
  //   eventsLink.classList.add("events");
  //   eventsLink.href = "/events-calendar";
  //   eventsLink.textContent = "Events";

  //   const careersLink = document.createElement("a");
  //   careersLink.classList.add("careers");
  //   careersLink.href = "https://jobs.danaher.com/global/en/aldevron";
  //   careersLink.target = "_blank";
  //   careersLink.textContent = "Careers";

  //   headerInfoDiv.appendChild(contactLink);
  //   headerInfoDiv.appendChild(statusLink);
  //   headerInfoDiv.appendChild(newsLink);
  //   headerInfoDiv.appendChild(blogLink);
  //   headerInfoDiv.appendChild(eventsLink);
  //   headerInfoDiv.appendChild(careersLink);

  //   // Create the menu navigation
  //   const menuNav = originalHeader
  //     .querySelector(".nav-tools ul")
  //     .cloneNode(true);

  //   headerNavInDiv.appendChild(headerInfoDiv);
  //   headerNavInDiv.appendChild(menuNav);
  //   headerNavDiv.appendChild(headerNavInDiv);

  //   outerDiv.appendChild(headerNavDiv);
  //   newHeader.appendChild(outerDiv);

  //   // Replace the original header with the new header
  //   originalHeader.parentNode.replaceChild(newHeader, originalHeader);
  // }
  }
}

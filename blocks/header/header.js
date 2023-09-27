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
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
    }

  // // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  decorateIcons(nav);
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  const inputElement = document.createElement('input');
  inputElement.setAttribute('type', 'text');
  inputElement.setAttribute('placeholder', 'Search');

  inputElement.addEventListener('change', function () {
    const searchTerm = this.value.toLowerCase(); // Get the lowercase search term

    // Fetch the JSON data from the URL
    fetch('http://localhost:3000/query-index.json')
      .then(response => response.json())
      .then(jsonData => {
        // Perform a search based on the fetched JSON data
        const results = jsonData.data.filter(item => {
          // Customize this condition to match your search criteria
          return item.description.toLowerCase().includes(searchTerm);
        });
        console.log(results);
        const resultBlock = document.querySelector('.search-results'); // Use .search-results for class selector
        resultBlock ? resultBlock.remove() : null;
        if (results.length > 0 && searchTerm != '') {
          // Create a block based on the search results
          const searchResultsBlock = createSearchResultsBlock(results);

          // Use a more specific selector for your header
          const header = document.querySelector('.header'); // Adjust this selector as needed
          header.appendChild(searchResultsBlock);
        }

        // Get the header element and append the search results block to it
      })
      .catch(error => {
        console.error("Error fetching JSON data:", error);
      });
  });

  // Append the input element to the .nav-tools container
  const navToolsContainer = document.querySelector('.nav-tools');
  navToolsContainer.appendChild(inputElement);

  }
}

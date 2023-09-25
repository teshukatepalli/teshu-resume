import {
  sampleRUM,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  toClassName,
  getMetadata,
  loadCSS,
  loadBlock,
  loadHeader,
  decorateBlock,
  buildBlock,
  readBlockConfig,
  toCamelCase,
} from './lib-franklin.js';
import {
  a, div, domEl, p,
} from './dom-helpers.js';

/**
 * to add/remove a template, just add/remove it in the list below
 */
const TEMPLATE_LIST = [
  'application-note',
  'news',
  'publication',
  'blog',
  'event',
  'about-us',
  'newsroom',
  'landing-page',
];

const LCP_BLOCKS = []; // add your LCP blocks to the list

let LAST_SCROLL_POSITION = 0;
let LAST_STACKED_HEIGHT = 0;
let STICKY_ELEMENTS;
let PREV_STICKY_ELEMENTS;
const mobileDevice = window.matchMedia('(max-width: 991px)');

export function loadScript(url, callback, type, async, forceReload) {
  let script = document.querySelector(`head > script[src="${url}"]`);
  if (forceReload && script) {
    script.remove();
    script = null;
  }

  if (!script) {
    const head = document.querySelector('head');
    script = document.createElement('script');
    script.src = url;
    if (async) {
      script.async = true;
    }
    if (type) {
      script.setAttribute('type', type);
    }
    script.onload = callback;
    head.append(script);
  } else if (typeof callback === 'function') {
    callback('noop');
  }

  return script;
}

/**
 * Summarises the description to maximum character count without cutting words.
 * @param {string} description Description to be summarised
 * @param {number} charCount Max character count
 * @returns summarised string
 */
export function summariseDescription(description, charCount) {
  let result = description;
  if (result.length > charCount) {
    result = result.substring(0, charCount);
    const lastSpaceIndex = result.lastIndexOf(' ');
    if (lastSpaceIndex !== -1) {
      result = result.substring(0, lastSpaceIndex);
    }
  }
  return `${result}…`;
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * Decorate blocks in an embed fragment.
 */
function decorateEmbeddedBlocks(container) {
  container
    .querySelectorAll('div.section > div')
    .forEach(decorateBlock);
}


/**
 * Parse video links and build the markup
 */
export function isVideo(url) {
  let isV = false;
  const hostnames = ['vids.moleculardevices.com', 'vidyard.com'];
  [...hostnames].forEach((hostname) => {
    if (url.hostname.includes(hostname)) {
      isV = true;
    }
  });
  return isV;
}

export function embedVideo(link, url, type) {
  const videoId = url.pathname.substring(url.pathname.lastIndexOf('/') + 1).replace('.html', '');
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadScript('https://play.vidyard.com/embed/v4.js', null, null, null, true);
      link.parentElement.innerHTML = `<img style="width: 100%; margin: auto; display: block;"
      class="vidyard-player-embed"
      src="https://play.vidyard.com/${videoId}.jpg"
      data-uuid="${videoId}"
      data-v="4"
      data-width="${type === 'lightbox' ? '700' : ''}"
      data-height="${type === 'lightbox' ? '394' : ''}"
      data-autoplay="${type === 'lightbox' ? '1' : '0'}"
      data-type="${type === 'lightbox' ? 'lightbox' : 'inline'}"/>`;
    }
  });
  observer.observe(link.parentElement);
}

export function videoButton(container, button, url) {
  const videoId = url.pathname.split('/').at(-1).trim();
  const overlay = div({ id: 'overlay' }, div({
    class: 'vidyard-player-embed', 'data-uuid': videoId, 'dava-v': '4', 'data-type': 'lightbox', 'data-autoplay': '2',
  }));

  container.prepend(overlay);
  button.addEventListener('click', (e) => {
    e.preventDefault();
    loadScript('https://play.vidyard.com/embed/v4.js', () => {
      // eslint-disable-next-line no-undef
      VidyardV4.api.getPlayersByUUID(videoId)[0].showLightbox();
    });
  });
}

export function decorateExternalLink(link) {
  if (!link.href) return;

  const url = new URL(link.href);

  const internalLinks = [
    'https://view.ceros.com',
    'https://share.vidyard.com',
    'https://main--moleculardevices--hlxsites.hlx.page',
    'https://main--moleculardevices--hlxsites.hlx.live',
    'http://molecular-devices.myshopify.com',
    'http://moldev.com',
    'http://go.pardot.com',
    'http://pi.pardot.com',
    'https://drift.me',
  ];

  if (url.origin === window.location.origin
    || url.host.endsWith('moleculardevices.com')
    || internalLinks.includes(url.origin)
    || !url.protocol.startsWith('http')
    || link.closest('.languages-dropdown')
    || link.querySelector('.icon')) {
    return;
  }

  const acceptedTags = ['STRONG', 'EM', 'SPAN', 'H2'];
  const invalidChildren = Array.from(link.children)
    .filter((child) => !acceptedTags.includes(child.tagName));

  if (invalidChildren.length > 0) {
    return;
  }

  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');

  const heading = link.querySelector('h2');
  const externalLinkIcon = domEl('i', { class: 'fa fa-external-link' });
  if (!heading) {
    link.appendChild(externalLinkIcon);
  } else {
    heading.appendChild(externalLinkIcon);
  }
}

export function decorateLinks(main) {
  main.querySelectorAll('a').forEach((link) => {
    const url = new URL(link.href);
    // decorate video links
    if (isVideo(url) && !link.closest('.block.hero-advanced') && !link.closest('.block.hero')) {
      const closestButtonContainer = link.closest('.button-container');
      if (link.closest('.block.cards') || (closestButtonContainer && closestButtonContainer.querySelector('strong,em'))) {
        videoButton(link.closest('div'), link, url);
      } else {
        const up = link.parentElement;
        const isInlineBlock = (link.closest('.block.vidyard') && !link.closest('.block.vidyard').classList.contains('lightbox'));
        const type = (up.tagName === 'EM' || isInlineBlock) ? 'inline' : 'lightbox';
        const wrapper = div({ class: 'video-wrapper' }, div({ class: 'video-container' }, a({ href: link.href }, link.textContent)));
        if (link.href !== link.textContent) wrapper.append(p({ class: 'video-title' }, link.textContent));
        up.innerHTML = wrapper.outerHTML;
        embedVideo(up.querySelector('a'), url, type);
      }
    }

    // decorate RFQ page links with pid parameter
    if (url.pathname.startsWith('/quote-request') && !url.searchParams.has('pid') && getMetadata('family-id')) {
      url.searchParams.append('pid', getMetadata('family-id'));
      link.href = url.toString();
    }

    if (url.pathname.endsWith('.pdf')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }

    // decorate external links
    decorateExternalLink(link);
  });
}

function decorateParagraphs(main) {
  [...main.querySelectorAll('p > picture')].forEach((picturePar) => {
    picturePar.parentElement.classList.add('picture');
  });
  [...main.querySelectorAll('ol > li > em:only-child')].forEach((captionList) => {
    captionList.parentElement.parentElement.classList.add('text-caption');
  });
}


/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateLinks(main);
  decorateParagraphs(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}



export async function fetchFragment(path, plain = true) {
  const response = await fetch(path + (plain ? '.plain.html' : ''));
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('error loading fragment details', response);
    return null;
  }
  const text = await response.text();
  if (!text) {
    // eslint-disable-next-line no-console
    console.error('fragment details empty', path);
    return null;
  }
  return text;
}



/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

export async function processEmbedFragment(element) {
  const block = div({ class: 'embed-fragment' });
  [...element.classList].forEach((className) => { block.classList.add(className); });
  let found = false;
  const link = element.querySelector('a');
  if (link) {
    const linkUrl = new URL(link.href);
    let linkTextUrl;
    try {
      linkTextUrl = new URL(link.textContent);
    } catch {
      // not a url, ignore
    }
    if (linkTextUrl && linkTextUrl.pathname === linkUrl.pathname) {
      const fragmentDomains = ['localhost', 'moleculardevices.com', 'moleculardevices--hlxsites.hlx.page', 'moleculardevices--hlxsites.hlx.live'];
      found = fragmentDomains.find((domain) => linkUrl.hostname.endsWith(domain));
      if (found) {
        block.classList.remove('button-container');
        const fragment = await fetchFragment(linkUrl);
        block.innerHTML = fragment;
        const sections = block.querySelectorAll('.embed-fragment > div');
        [...sections].forEach((section) => {
          section.classList.add('section');
        });
        decorateEmbeddedBlocks(block);
        decorateSections(block);
        loadBlocks(block);
      }
    }
  }

  if (!found) {
    const elementInner = element.innerHTML;
    block.append(div({ class: 'section' }));
    block.querySelector('.section').innerHTML = elementInner;
  }

  decorateButtons(block);
  decorateIcons(block);
  decorateLinks(block);
  decorateParagraphs(block);

  return block;
}

loadPage();

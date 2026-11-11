/* store.js: phần dùng chung cho mọi trang
   đọc dữ liệu JSON, định dạng tiền, giỏ hàng lưu ở localStorage, menu, hiệu ứng hiện dần */
const UEL = (() => {
  const CART_KEY = "uelshop.cart";
  const ORDERS_KEY = "uelshop.orders";
  const cache = {};

  async function load(name) {
    if (!cache[name]) {
      cache[name] = fetch(`data/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`Không đọc được data/${name}.json`);
        return r.json();
      });
    }
    return cache[name];
  }

  const vnd = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
  const param = (k) => new URLSearchParams(location.search).get(k);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ----- giỏ hàng -----
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }
  function writeCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
    renderCount();
    return items;
  }
  function addToCart(line) {
    const items = readCart();
    const found = items.find((i) => i.sku === line.sku);
    if (found) found.qty = Math.min(found.qty + line.qty, line.maxStock);
    else items.push(line);
    return writeCart(items);
  }
  function setQty(sku, qty) {
    const items = readCart()
      .map((i) => (i.sku === sku ? { ...i, qty: Math.max(0, Math.min(qty, i.maxStock)) } : i))
      .filter((i) => i.qty > 0);
    return writeCart(items);
  }
  const clearCart = () => writeCart([]);
  const cartCount = () => readCart().reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = () => readCart().reduce((s, i) => s + i.qty * i.price, 0);

  function saveOrder(order) {
    try {
      const all = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      all.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(all.slice(0, 20)));
      return true;
    } catch {
      return false;
    }
  }
  function findOrder(code, phone) {
    try {
      const all = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      return all.find((o) => o.code === code.trim().toUpperCase() && o.customer.phone === phone.replace(/\s/g, ""));
    } catch {
      return null;
    }
  }

  function renderCount() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cartCount()));
  }

  // ----- thông báo nhỏ -----
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.append(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  // ----- ô sản phẩm dùng chung -----
  const FIELDS = ["f1", "f2", "f4", "f3"];
  function tile(p, i = 0) {
    const soldOut = p.variants.every((v) => v.stock <= 0);
    const back = p.images[1];
    const f = FIELDS[i % 4];
    return `<a class="tile reveal${back ? " can-flip" : ""}" href="product.html?slug=${encodeURIComponent(p.slug)}">
      <div class="tile-media ${f}">
        ${soldOut ? '<span class="badge-soldout">Hết hàng</span>' : ""}
        <div class="tile-inner">
          <div class="tile-face ${f}"><img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy"></div>
          ${back ? `<div class="tile-face tile-back ${f}" aria-hidden="true"><img src="${esc(back)}" alt="" loading="lazy"></div>` : ""}
        </div>
      </div>
      <p class="tile-name">${esc(p.name)}</p>
      <p class="tile-price tabular">${vnd(p.price)}</p>
    </a>`;
  }

  // ----- hiện dần khi cuộn, theo dõi cả phần tử thêm sau -----
  function watchReveal() {
    const show = (el) => el.classList.add("is-in");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(show);
      return { scan() {} };
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (show(e.target), io.unobserve(e.target))),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    const scan = () => document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    return { scan };
  }

  function initChrome() {
    document.documentElement.classList.remove("no-js");
    // menu: tô trang đang mở
    const page = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === page) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });
    renderCount();
    watchReveal();
  }

  document.addEventListener("DOMContentLoaded", initChrome);

  return { load, vnd, param, esc, readCart, addToCart, setQty, clearCart, cartCount, cartSubtotal, saveOrder, findOrder, tile, toast };
})();

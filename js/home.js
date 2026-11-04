/* home.js: trang chủ. Bệ sản phẩm đổi chỗ, thời khoá biểu gợi ý đồ, dải ảnh, hai món mùa mưa */
(async () => {
  const { products } = await UEL.load("products");
  const { slots } = await UEL.load("timetable");
  const byCode = new Map(products.map((p) => [p.code, p]));

  // Bệ sản phẩm: crossfade chậm giữa 4 món, dừng khi giảm chuyển động
  const HERO = ["AT-THU-01", "HD-YEN-24", "BL-THU-27", "PL-YEN-22"].map((c) => byCode.get(c)).filter(Boolean);
  const stage = document.querySelector(".plinth-stage");
  const caption = document.querySelector(".plinth-caption");
  const dots = document.querySelector(".plinth-dots");
  let i = 0;
  stage.innerHTML = HERO.map((p, n) => `<img src="${p.images[0]}" alt="${UEL.esc(p.name)}" class="${n ? "" : "is-on"}">`).join("");
  dots.innerHTML = HERO.map((p, n) => `<button type="button" aria-label="${UEL.esc(p.name)}" aria-pressed="${!n}"><span></span></button>`).join("");
  const show = (n) => {
    i = n;
    stage.querySelectorAll("img").forEach((im, k) => im.classList.toggle("is-on", k === n));
    dots.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-pressed", k === n));
    const p = HERO[n];
    caption.innerHTML = `<a href="product.html?slug=${p.slug}">${UEL.esc(p.name)}</a> <span class="text-soft tabular">${UEL.vnd(p.price)}</span>`;
  };
  dots.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) show([...dots.children].indexOf(b));
  });
  show(0);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(() => !document.hidden && show((i + 1) % HERO.length), 5600);

  // Thời khoá biểu: chọn khung giờ, hiện các món phù hợp
  const tabs = document.querySelector(".tt-tabs");
  const panel = document.querySelector(".tt-panel");
  tabs.innerHTML = slots
    .map((s, n) => `<button type="button" role="tab" class="tt-tab" aria-selected="${!n}" data-id="${s.id}"><small>${s.time}</small>${UEL.esc(s.title)}</button>`)
    .join("");
  const renderSlot = (id) => {
    const s = slots.find((x) => x.id === id);
    tabs.querySelectorAll(".tt-tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.id === id));
    const items = s.codes.map((c) => byCode.get(c)).filter(Boolean);
    panel.innerHTML = `<h3 class="text-head">${s.time} ${UEL.esc(s.title)}</h3>
      <p class="text-lead" style="margin-top:12px">${UEL.esc(s.note)}</p>
      <ul class="tt-list">${items
        .map(
          (p) => `<li><a class="tt-item" href="product.html?slug=${p.slug}">
            <img src="${p.images[0]}" alt="" loading="lazy">
            <span><span style="font-weight:500">${UEL.esc(p.name)}</span><br><span class="text-soft text-small">${UEL.esc((p.description || "").split(".")[0])}.</span></span>
            <span class="tabular">${UEL.vnd(p.price)}</span></a></li>`
        )
        .join("")}</ul>`;
  };
  tabs.addEventListener("click", (e) => {
    const t = e.target.closest(".tt-tab");
    if (t) renderSlot(t.dataset.id);
  });
  renderSlot(slots[0].id);

  // Dải ảnh: nhân đôi để chạy vòng liền mạch
  const track = document.querySelector(".photo-track");
  track.innerHTML += track.innerHTML.replace(/<figure/g, '<figure aria-hidden="true"');

  // Hai món mùa mưa
  document.querySelectorAll("[data-pair]").forEach((el) => {
    const p = byCode.get(el.dataset.pair);
    if (!p) return;
    el.querySelector("img").src = p.images[0];
    el.querySelector("img").alt = p.name;
    el.querySelector(".pair-name").textContent = p.name;
    el.querySelector(".pair-price").textContent = UEL.vnd(p.price);
    el.querySelector(".pair-buy").href = `product.html?slug=${p.slug}`;
    el.querySelector(".pair-cat").href = `shop.html?category=${p.category}`;
  });

  // Mỗi loại một món
  const { categories } = await UEL.load("categories");
  const firstOf = categories.map((c) => products.find((p) => p.category === c.slug)).filter(Boolean).slice(0, 8);
  document.querySelector(".latest").innerHTML = firstOf.map(UEL.tile).join("");
})();

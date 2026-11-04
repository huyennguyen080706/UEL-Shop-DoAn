/* shop.js: cửa hàng. Lọc theo danh mục, bộ sưu tập, size, khoảng giá, tìm kiếm và sắp xếp.
   Bộ lọc ghi lên URL để chia sẻ được đường dẫn; đổi bộ lọc thì vẽ lại lưới ngay, không tải lại trang. */
(async () => {
  const [{ products }, { categories }, { collections }] = await Promise.all([UEL.load("products"), UEL.load("categories"), UEL.load("collections")]);
  const PRICES = [
    { id: "0-100", label: "Dưới 100.000 ₫", min: 0, max: 100000 },
    { id: "100-250", label: "100.000 đến 250.000 ₫", min: 100000, max: 250000 },
    { id: "250-400", label: "250.000 đến 400.000 ₫", min: 250000, max: 400000 },
    { id: "400-", label: "Trên 400.000 ₫", min: 400000, max: Infinity },
  ];
  const SORTS = [
    { id: "featured", label: "Gợi ý" },
    { id: "price-asc", label: "Giá thấp đến cao" },
    { id: "price-desc", label: "Giá cao đến thấp" },
    { id: "popular", label: "Được đặt nhiều" },
  ];
  const unaccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const url = new URL(location.href);
  const state = {
    category: url.searchParams.get("category") || "",
    collection: url.searchParams.get("collection") || "",
    size: url.searchParams.get("size") || "",
    price: url.searchParams.get("price") || "",
    sort: url.searchParams.get("sort") || "featured",
    q: url.searchParams.get("q") || "",
  };

  const $ = (s) => document.querySelector(s);
  const save = () => {
    const u = new URL(location.pathname, location.origin);
    Object.entries(state).forEach(([k, v]) => v && !(k === "sort" && v === "featured") && u.searchParams.set(k, v));
    history.replaceState(null, "", u.pathname.split("/").pop() + u.search);
  };

  function filtered() {
    const pr = PRICES.find((p) => p.id === state.price);
    const q = unaccent(state.q.trim());
    let list = products.filter(
      (p) =>
        (!state.category || p.category === state.category) &&
        (!state.collection || p.collection === state.collection) &&
        (!state.size || p.variants.some((v) => v.size === state.size)) &&
        (!pr || (p.price >= pr.min && p.price < pr.max)) &&
        (!q || unaccent(`${p.name} ${p.code} ${p.description || ""}`).includes(q))
    );
    if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === "popular") list = [...list].sort((a, b) => b.sold - a.sold);
    return list;
  }

  function render() {
    // tiêu đề theo bộ sưu tập hoặc danh mục
    const col = collections.find((c) => c.slug === state.collection);
    const cat = categories.find((c) => c.slug === state.category);
    $(".shop-title").textContent = col ? col.name : cat ? cat.name : state.q ? `Kết quả cho ${state.q}` : "Cửa hàng";
    $(".shop-desc").textContent = col ? col.description : cat ? cat.description || "" : "Áo, balo, phụ kiện và quà lưu niệm lấy cảm hứng từ đời sống sinh viên UEL.";

    const count = (slug) => products.filter((p) => p.category === slug && (!state.collection || p.collection === state.collection)).length;
    $(".cat-list").innerHTML =
      `<li><button type="button" data-cat="" class="${state.category ? "" : "is-on"}">Tất cả</button></li>` +
      categories
        .filter((c) => count(c.slug))
        .map((c) => `<li><button type="button" data-cat="${c.slug}" class="${state.category === c.slug ? "is-on" : ""}"><span>${UEL.esc(c.name)}</span><span class="tabular">${count(c.slug)}</span></button></li>`)
        .join("");

    // chỉ hiện size có trong phạm vi đang xem
    const scope = products.filter((p) => (!state.category || p.category === state.category) && (!state.collection || p.collection === state.collection));
    const sizes = [...new Set(scope.flatMap((p) => p.variants.map((v) => v.size)))];
    $(".size-chips").innerHTML = sizes.map((s) => `<button type="button" class="chip${state.size === s ? " is-on" : ""}" data-size="${UEL.esc(s)}">${UEL.esc(s)}</button>`).join("");
    $(".price-chips").innerHTML = PRICES.map((p) => `<button type="button" class="chip${state.price === p.id ? " is-on" : ""}" data-price="${p.id}">${p.label}</button>`).join("");
    $(".sort-chips").innerHTML = SORTS.map((s) => `<button type="button" class="chip${state.sort === s.id ? " is-on" : ""}" data-sort="${s.id}">${s.label}</button>`).join("");

    const list = filtered();
    $(".result-count").textContent = `${list.length} sản phẩm`;
    $(".product-grid").innerHTML = list.length
      ? list.map(UEL.tile).join("")
      : `<p class="empty text-lead">Không có sản phẩm phù hợp. <button type="button" class="link" data-reset style="border:0;background:none;cursor:pointer">Bỏ bộ lọc</button></p>`;
    $("#q").value = state.q;
    save();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if ("cat" in b.dataset) Object.assign(state, { category: b.dataset.cat, size: "" });
    else if (b.dataset.size) state.size = state.size === b.dataset.size ? "" : b.dataset.size;
    else if (b.dataset.price) state.price = state.price === b.dataset.price ? "" : b.dataset.price;
    else if (b.dataset.sort) state.sort = b.dataset.sort;
    else if ("reset" in b.dataset) Object.assign(state, { category: "", size: "", price: "", q: "" });
    else return;
    render();
  });
  $("#q").form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = $("#q").value;
    render();
  });
  render();
})();

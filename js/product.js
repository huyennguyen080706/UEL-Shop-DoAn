/* product.js: trang chi tiết sản phẩm. Chọn màu, size, số lượng theo tồn kho rồi thêm vào giỏ */
(async () => {
  const { products } = await UEL.load("products");
  const { categories } = await UEL.load("categories");
  const p = products.find((x) => x.slug === UEL.param("slug")) || products[0];
  const cat = categories.find((c) => c.slug === p.category);
  document.title = `${p.name} · UEL Shop`;

  const colors = [...new Map(p.variants.map((v) => [v.color, v.hex])).entries()];
  let color = colors[0][0];
  let size = null;
  let qty = 1;
  const $ = (s) => document.querySelector(s);

  $(".crumb").innerHTML = `<a class="link" href="shop.html">Cửa hàng</a> / <a class="link" href="shop.html?category=${p.category}">${UEL.esc(cat?.name || "")}</a>`;
  $(".gallery").innerHTML = p.images.map((src, n) => `<div class="${n ? "f2" : "f1"}"><img src="${src}" alt="${UEL.esc(p.name)}, ảnh ${n + 1}"></div>`).join("");
  $(".buybox h1").textContent = p.name;
  $(".price").textContent = UEL.vnd(p.price);
  $(".code").textContent = `Mã ${p.code}. Đổi size miễn phí trong 7 ngày tại quầy.`;
  $(".desc").textContent = p.description || "";
  $(".material").textContent = p.material || "Đang cập nhật.";
  $(".care").textContent = p.care || "Giặt nhẹ, phơi nơi thoáng mát.";

  const variant = () => p.variants.find((v) => v.color === color && v.size === size);
  function render() {
    $(".colors").innerHTML = colors
      .map(([name, hex]) => `<button type="button" class="swatch${name === color ? " is-on" : ""}" title="${UEL.esc(name)}" aria-label="${UEL.esc(name)}" data-color="${UEL.esc(name)}" style="background:${hex || "#999"}"></button>`)
      .join("");
    $(".color-name").textContent = color;
    const sizes = p.variants.filter((v) => v.color === color);
    $(".sizes").innerHTML = sizes
      .map((v) => `<button type="button" class="chip${v.size === size ? " is-on" : ""}" data-size="${UEL.esc(v.size)}" ${v.stock <= 0 ? "disabled" : ""}>${UEL.esc(v.size)}</button>`)
      .join("");
    const v = variant();
    $(".stock").textContent = v ? (v.stock > 0 ? `Còn ${v.stock} sản phẩm` : "Hết hàng") : "Chọn size để xem tồn kho";
    qty = Math.min(qty, v?.stock || 1);
    $(".qty output").textContent = qty;
    $(".add").disabled = !v || v.stock <= 0;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.color) {
      color = b.dataset.color;
      size = null;
    } else if (b.dataset.size) size = b.dataset.size;
    else if (b.dataset.step) qty = Math.max(1, Math.min(qty + Number(b.dataset.step), variant()?.stock || 1));
    else if (b.classList.contains("add") || b.classList.contains("buy-now")) {
      const v = variant();
      if (!v) return UEL.toast("Bạn chọn size trước nhé");
      UEL.addToCart({ sku: v.sku, slug: p.slug, name: p.name, color: v.color, size: v.size, price: p.price, image: p.images[0], qty, maxStock: v.stock });
      if (b.classList.contains("buy-now")) location.href = "checkout.html";
      else UEL.toast(`Đã thêm ${qty} ${p.name} vào giỏ`);
      return;
    } else return;
    render();
  });
  render();

  // gợi ý cùng loại
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  $(".related").innerHTML = related.map(UEL.tile).join("");
})();

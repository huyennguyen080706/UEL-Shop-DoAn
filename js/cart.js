/* cart.js: trang giỏ hàng. Đổi số lượng, xoá dòng, tính tạm tính */
(() => {
  const list = document.querySelector(".cart-lines");
  const sum = document.querySelector(".summary");
  function render() {
    const items = UEL.readCart();
    if (!items.length) {
      list.innerHTML = `<p class="text-lead">Giỏ hàng đang trống.</p><a class="btn btn-primary" style="margin-top:20px" href="shop.html">Vào cửa hàng</a>`;
      sum.hidden = true;
      return;
    }
    sum.hidden = false;
    list.innerHTML = items
      .map(
        (i) => `<div class="cart-line">
          <img src="${i.image}" alt="">
          <div>
            <a href="product.html?slug=${i.slug}" style="font-weight:500">${UEL.esc(i.name)}</a>
            <p class="text-soft text-small">${UEL.esc(i.color)}, size ${UEL.esc(i.size)}</p>
            <div class="qty" style="margin-top:12px">
              <button type="button" data-sku="${i.sku}" data-d="-1" aria-label="Bớt">−</button>
              <output class="tabular">${i.qty}</output>
              <button type="button" data-sku="${i.sku}" data-d="1" aria-label="Thêm">+</button>
            </div>
          </div>
          <div style="text-align:right">
            <p class="tabular">${UEL.vnd(i.price * i.qty)}</p>
            <button type="button" class="link text-small" data-sku="${i.sku}" data-remove style="border:0;background:none;cursor:pointer;margin-top:8px">Xoá</button>
          </div>
        </div>`
      )
      .join("");
    sum.querySelector(".subtotal").textContent = UEL.vnd(UEL.cartSubtotal());
    sum.querySelector(".count").textContent = `${UEL.cartCount()} món`;
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-sku]");
    if (!b) return;
    const item = UEL.readCart().find((i) => i.sku === b.dataset.sku);
    if ("remove" in b.dataset) UEL.setQty(b.dataset.sku, 0);
    else UEL.setQty(b.dataset.sku, item.qty + Number(b.dataset.d));
    render();
  });
  render();
})();

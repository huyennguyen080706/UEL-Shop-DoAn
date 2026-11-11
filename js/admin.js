/* admin.js: trang quản trị bản tĩnh.
   - Đơn hàng: đọc/ghi localStorage "uelshop.orders" (chung với trang checkout).
   - Sản phẩm: sửa trên giao diện, lưu nháp ở "uelshop.admin.products", xuất ra products.json để commit.
   Không có server, không logic xử lý phía sau. Mã truy cập chỉ chặn hờ, KHÔNG bảo mật thật. */
(() => {
  const ADMIN_PASS = "uel@2026"; // đổi tại đây; đây chỉ là rào hờ phía trình duyệt
  const AUTH_KEY = "uelshop.admin.auth";
  const ORDERS_KEY = "uelshop.orders";
  const PRODUCTS_OVERRIDE_KEY = "uelshop.admin.products";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => UEL.esc(s);
  const vnd = (n) => UEL.vnd(n || 0);

  const STATUS = [
    ["PENDING", "Chờ xử lý"],
    ["CONFIRMED", "Đã xác nhận"],
    ["READY", "Sẵn sàng"],
    ["COMPLETED", "Hoàn tất"],
    ["CANCELLED", "Đã huỷ"],
  ];
  const statusLabel = (s) => (STATUS.find((x) => x[0] === s) || ["PENDING", "Chờ xử lý"])[1];
  const FULFILL = { PICKUP: "Nhận tại trường", DELIVERY: "Giao tận nơi" };

  /* ================= Đăng nhập ================= */
  function isAuthed() {
    try { return sessionStorage.getItem(AUTH_KEY) === "1"; } catch { return false; }
  }
  function showApp() {
    $("[data-gate]").hidden = true;
    $("[data-shell]").hidden = false;
    initOrders();
    initProducts();
  }
  function initGate() {
    if (isAuthed()) return showApp();
    const gate = $("[data-gate]");
    gate.hidden = false;
    $("[data-login]").addEventListener("submit", (e) => {
      e.preventDefault();
      const err = $("[data-gate-error]");
      if ($("#pass").value === ADMIN_PASS) {
        try { sessionStorage.setItem(AUTH_KEY, "1"); } catch {}
        err.hidden = true;
        showApp();
      } else {
        err.hidden = false;
        $("#pass").value = "";
        $("#pass").focus();
      }
    });
  }
  $("[data-logout]")?.addEventListener("click", () => {
    try { sessionStorage.removeItem(AUTH_KEY); } catch {}
    location.reload();
  });

  /* ================= Chuyển tab ================= */
  $$(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".admin-tab").forEach((b) => b.classList.toggle("is-active", b === btn));
      const name = btn.dataset.tab;
      $$(".admin-panel").forEach((p) => {
        const on = p.dataset.panel === name;
        p.hidden = !on;
        p.classList.toggle("is-active", on);
      });
    });
  });

  /* ================= ĐƠN HÀNG ================= */
  function readOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; }
  }
  function writeOrders(list) {
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); return true; }
    catch { alert("Không ghi được dữ liệu đơn vào trình duyệt."); return false; }
  }

  function initOrders() {
    renderOrders();
    // cập nhật nếu đặt đơn ở tab khác cùng trình duyệt
    window.addEventListener("storage", (e) => {
      if (e.key === ORDERS_KEY) renderOrders();
    });
  }

  function orderStats(orders) {
    const revenue = orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter((o) => o.status === "PENDING").length;
    return [
      { k: "Tổng đơn", v: orders.length },
      { k: "Chờ xử lý", v: pending },
      { k: "Hoàn tất", v: orders.filter((o) => o.status === "COMPLETED").length },
      { k: "Doanh thu (trừ huỷ)", v: vnd(revenue) },
    ];
  }

  function renderOrders() {
    const orders = readOrders();
    $("[data-order-stats]").innerHTML = orderStats(orders)
      .map((s) => `<div class="stat-card"><div class="k">${s.k}</div><div class="v tabular">${s.v}</div></div>`)
      .join("");

    const body = $("[data-orders-body]");
    const empty = $("[data-orders-empty]");
    const table = $("[data-orders-table]");
    if (!orders.length) {
      body.innerHTML = "";
      table.hidden = true;
      empty.hidden = false;
      return;
    }
    table.hidden = false;
    empty.hidden = true;

    body.innerHTML = orders
      .map((o, i) => {
        const d = new Date(o.createdAt);
        const date = isNaN(d) ? "—" : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
        const opts = STATUS.map(([v, l]) => `<option value="${esc(v)}"${v === o.status ? " selected" : ""}>${esc(l)}</option>`).join("");
        return `<tr data-row="${i}">
          <td class="mono">${esc(o.code)}</td>
          <td>${date}</td>
          <td>${esc(o.customer?.name || "—")}<br><span class="text-small text-soft mono">${esc(o.customer?.phone || "")}</span></td>
          <td>${esc(FULFILL[o.fulfillment] || o.fulfillment || "")}</td>
          <td class="num tabular">${vnd(o.total)}</td>
          <td><select class="status-select s-${esc(o.status)}" data-status="${i}" aria-label="Trạng thái đơn ${esc(o.code)}">${opts}</select></td>
          <td class="num"><button type="button" class="link-btn" data-detail="${i}">Chi tiết</button></td>
        </tr>`;
      })
      .join("");

    // đổi trạng thái
    $$("[data-status]", body).forEach((sel) => {
      sel.addEventListener("change", () => {
        const idx = +sel.dataset.status;
        const list = readOrders();
        if (!list[idx]) return;
        list[idx].status = sel.value;
        writeOrders(list);
        sel.className = `status-select s-${sel.value}`;
        // cập nhật thẻ thống kê
        $("[data-order-stats]").innerHTML = orderStats(list)
          .map((s) => `<div class="stat-card"><div class="k">${s.k}</div><div class="v tabular">${s.v}</div></div>`)
          .join("");
        UEL.toast("Đã lưu trạng thái");
      });
    });

    // mở/đóng chi tiết
    $$("[data-detail]", body).forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = +btn.dataset.detail;
        const row = $(`tr[data-row="${idx}"]`, body);
        const next = row.nextElementSibling;
        if (next && next.classList.contains("row-detail")) {
          next.remove();
          btn.textContent = "Chi tiết";
          return;
        }
        $$(".row-detail", body).forEach((r) => r.remove());
        $$("[data-detail]", body).forEach((b) => (b.textContent = "Chi tiết"));
        const tr = document.createElement("tr");
        tr.className = "row-detail";
        tr.innerHTML = `<td colspan="7">${orderDetailHtml(readOrders()[idx])}</td>`;
        row.after(tr);
        btn.textContent = "Thu gọn";
      });
    });
  }

  function orderDetailHtml(o) {
    if (!o) return "";
    const items = (o.items || [])
      .map(
        (it) => `<tr>
          <td>${esc(it.name)}<br><span class="text-small text-soft">${esc(it.color || "")}${it.size ? " · " + esc(it.size) : ""} · <span class="mono">${esc(it.sku || "")}</span></span></td>
          <td class="num">${it.qty}×</td>
          <td class="num tabular">${vnd(it.price)}</td>
          <td class="num tabular">${vnd(it.price * it.qty)}</td>
        </tr>`
      )
      .join("");
    const cust = o.customer || {};
    return `<div class="order-detail">
      <div>
        <h4>Mặt hàng</h4>
        <table class="order-items">${items}</table>
        <div style="margin-top:12px">
          <div class="totals-line"><span>Tạm tính</span><span class="tabular">${vnd(o.subtotal)}</span></div>
          <div class="totals-line"><span>Phí giao</span><span class="tabular">${o.shippingFee ? vnd(o.shippingFee) : "Miễn phí"}</span></div>
          <div class="totals-line grand"><span>Tổng cộng</span><span class="tabular">${vnd(o.total)}</span></div>
        </div>
      </div>
      <div>
        <h4>Khách hàng</h4>
        <dl class="kv">
          <dt>Tên</dt><dd>${esc(cust.name || "—")}</dd>
          <dt>Điện thoại</dt><dd class="mono">${esc(cust.phone || "—")}</dd>
          <dt>Email</dt><dd>${esc(cust.email || "—")}</dd>
          <dt>Hình thức</dt><dd>${esc(FULFILL[o.fulfillment] || o.fulfillment || "")}</dd>
          ${o.address ? `<dt>Địa chỉ</dt><dd>${esc(o.address)}</dd>` : ""}
          <dt>Thanh toán</dt><dd>${esc(o.paymentLabel || o.payment || "—")}</dd>
          ${o.note ? `<dt>Ghi chú</dt><dd>${esc(o.note)}</dd>` : ""}
        </dl>
      </div>
    </div>`;
  }

  /* ================= SẢN PHẨM ================= */
  let products = [];
  let categories = [];
  let collections = [];
  let dirty = false;

  async function initProducts() {
    try {
      const [cat, col] = await Promise.all([UEL.load("categories"), UEL.load("collections")]);
      categories = cat.categories || [];
      collections = col.collections || [];
    } catch {}
    const override = loadOverride();
    if (override) {
      products = override;
      setDirty(true);
    } else {
      const data = await UEL.load("products");
      products = (data.products || []).map(clone);
    }
    renderProducts();
    bindProductToolbar();
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));
  function loadOverride() {
    try {
      const raw = localStorage.getItem(PRODUCTS_OVERRIDE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return Array.isArray(d.products) ? d.products : null;
    } catch { return null; }
  }
  function saveOverride() {
    try { localStorage.setItem(PRODUCTS_OVERRIDE_KEY, JSON.stringify({ products })); }
    catch { alert("Không lưu được bản nháp sản phẩm vào trình duyệt."); return; }
    setDirty(true);
  }
  function setDirty(v) {
    dirty = v;
    const flag = $("[data-dirty]");
    if (flag) flag.hidden = !v;
  }

  const stockOf = (p) => (p.variants || []).reduce((s, v) => s + (+v.stock || 0), 0);
  const catName = (slug) => (categories.find((c) => c.slug === slug) || {}).name || slug || "—";

  function renderProducts(filter = "") {
    const body = $("[data-products-body]");
    const q = filter.trim().toLowerCase();
    const list = q
      ? products.filter((p) => (p.name + " " + p.code).toLowerCase().includes(q))
      : products;
    body.innerHTML = list
      .map((p) => {
        const idx = products.indexOf(p);
        const img = (p.images && p.images[0]) || "";
        return `<tr>
          <td>${img ? `<img class="thumb" src="${esc(img)}" alt="" loading="lazy">` : `<span class="thumb"></span>`}</td>
          <td class="mono">${esc(p.code)}</td>
          <td>${esc(p.name)}</td>
          <td>${esc(catName(p.category))}</td>
          <td class="num tabular">${vnd(p.price)}</td>
          <td class="num tabular">${stockOf(p)}</td>
          <td><div class="row-actions">
            <button type="button" class="btn btn-paper btn-sm" data-edit="${idx}">Sửa</button>
          </div></td>
        </tr>`;
      })
      .join("");
    $("[data-products-count]").textContent = `${list.length} sản phẩm${q ? ` (lọc từ ${products.length})` : ""}.`;
    $$("[data-edit]", body).forEach((b) => b.addEventListener("click", () => openEditor(+b.dataset.edit)));
  }

  function bindProductToolbar() {
    $("[data-prod-search]").addEventListener("input", (e) => renderProducts(e.target.value));
    $("[data-prod-new]").addEventListener("click", () => openEditor(-1));
    $("[data-prod-export]").addEventListener("click", exportProducts);
    $("[data-prod-reset]").addEventListener("click", resetProducts);
  }

  function exportProducts() {
    const json = JSON.stringify({ products }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.json";
    a.click();
    URL.revokeObjectURL(url);
    UEL.toast("Đã tải products.json — thay vào data/ rồi commit");
  }

  async function resetProducts() {
    if (!confirm("Khôi phục danh sách sản phẩm về đúng file gốc data/products.json? Mọi sửa đổi chưa xuất sẽ mất.")) return;
    try { localStorage.removeItem(PRODUCTS_OVERRIDE_KEY); } catch {}
    const data = await UEL.load("products");
    products = (data.products || []).map(clone);
    setDirty(false);
    renderProducts($("[data-prod-search]").value);
    UEL.toast("Đã khôi phục từ file gốc");
  }

  /* ----- Modal sửa/thêm ----- */
  function openEditor(idx) {
    const isNew = idx < 0;
    const p = isNew
      ? { code: "", slug: "", name: "", price: 0, category: categories[0]?.slug || "", collection: "", sold: 0, material: "", care: "", description: "", images: [], variants: [] }
      : clone(products[idx]);

    const catOpts = categories.map((c) => `<option value="${esc(c.slug)}"${c.slug === p.category ? " selected" : ""}>${esc(c.name)}</option>`).join("");
    const colOpts = `<option value="">— Không —</option>` + collections.map((c) => `<option value="${esc(c.slug)}"${c.slug === p.collection ? " selected" : ""}>${esc(c.name)}</option>`).join("");

    $("[data-modal-body]").innerHTML = `
      <h3>${isNew ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h3>
      <form data-prod-form>
        <div class="form-grid">
          <div class="form-field"><label>Mã (code)</label><input class="field mono" name="code" value="${esc(p.code)}" required></div>
          <div class="form-field"><label>Slug (đường dẫn)</label><input class="field mono" name="slug" value="${esc(p.slug)}" placeholder="ao-thun-uel-..."></div>
          <div class="form-field full"><label>Tên sản phẩm</label><input class="field" name="name" value="${esc(p.name)}" required></div>
          <div class="form-field"><label>Giá (₫)</label><input class="field" name="price" type="number" min="0" step="1000" value="${+p.price || 0}" required></div>
          <div class="form-field"><label>Đã bán</label><input class="field" name="sold" type="number" min="0" value="${+p.sold || 0}"></div>
          <div class="form-field"><label>Danh mục</label><select class="field" name="category">${catOpts}</select></div>
          <div class="form-field"><label>Bộ sưu tập</label><select class="field" name="collection">${colOpts}</select></div>
          <div class="form-field full"><label>Ảnh (mỗi dòng một đường dẫn)</label><textarea class="field" name="images" placeholder="images/products/.../1.webp">${esc((p.images || []).join("\n"))}</textarea></div>
          <div class="form-field"><label>Chất liệu</label><input class="field" name="material" value="${esc(p.material || "")}"></div>
          <div class="form-field"><label>Bảo quản</label><input class="field" name="care" value="${esc(p.care || "")}"></div>
          <div class="form-field full"><label>Mô tả</label><textarea class="field" name="description">${esc(p.description || "")}</textarea></div>
        </div>

        <div class="form-field full" style="margin-top:16px">
          <label>Phân loại (màu / size / tồn kho)</label>
          <div class="variant-editor" data-variants>
            <div class="variant-row variant-head">
              <span>Màu</span><span>Mã màu</span><span>Size</span><span>SKU</span><span>Tồn</span><span></span>
            </div>
            <div data-variant-rows></div>
          </div>
          <button type="button" class="btn btn-paper btn-sm" data-add-variant style="margin-top:10px; align-self:flex-start">+ Thêm phân loại</button>
        </div>

        <div class="modal-actions">
          ${isNew ? "" : `<button type="button" class="btn btn-paper btn-sm danger" data-del-product>Xoá sản phẩm</button>`}
          <button type="button" class="btn btn-paper" data-modal-close>Huỷ</button>
          <button type="submit" class="btn btn-primary">${isNew ? "Thêm" : "Lưu"}</button>
        </div>
      </form>`;

    const rowsBox = $("[data-variant-rows]");
    const addVariant = (v = { color: "", hex: "", size: "", sku: "", stock: 0 }) => {
      const row = document.createElement("div");
      row.className = "variant-row";
      row.innerHTML = `
        <input class="field" data-v="color" value="${esc(v.color || "")}" placeholder="Xanh navy">
        <input class="field mono" data-v="hex" value="${esc(v.hex || "")}" placeholder="#192741">
        <input class="field" data-v="size" value="${esc(v.size || "")}" placeholder="M">
        <input class="field mono" data-v="sku" value="${esc(v.sku || "")}" placeholder="AT-...-M">
        <input class="field" data-v="stock" type="number" min="0" value="${+v.stock || 0}">
        <button type="button" class="icon-btn" data-rm-variant aria-label="Xoá phân loại">×</button>`;
      row.querySelector("[data-rm-variant]").addEventListener("click", () => row.remove());
      rowsBox.append(row);
    };
    (p.variants || []).forEach(addVariant);
    $("[data-add-variant]").addEventListener("click", () => addVariant());

    $("[data-prod-form]").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const next = {
        code: f.code.value.trim(),
        slug: f.slug.value.trim() || slugify(f.name.value),
        name: f.name.value.trim(),
        price: +f.price.value || 0,
        description: f.description.value.trim(),
        material: f.material.value.trim(),
        care: f.care.value.trim(),
        sold: +f.sold.value || 0,
        category: f.category.value,
        collection: f.collection.value || null,
        images: f.images.value.split("\n").map((s) => s.trim()).filter(Boolean),
        variants: $$(".variant-row:not(.variant-head)", rowsBox).map((r) => ({
          color: r.querySelector('[data-v="color"]').value.trim(),
          hex: r.querySelector('[data-v="hex"]').value.trim(),
          size: r.querySelector('[data-v="size"]').value.trim(),
          sku: r.querySelector('[data-v="sku"]').value.trim(),
          stock: +r.querySelector('[data-v="stock"]').value || 0,
        })),
      };
      if (!next.code || !next.name) return;
      // trùng mã?
      const clash = products.findIndex((x) => x.code === next.code);
      if (isNew) {
        if (clash >= 0) { alert("Mã sản phẩm đã tồn tại."); return; }
        products.unshift(next);
      } else {
        if (clash >= 0 && clash !== idx) { alert("Mã sản phẩm trùng với sản phẩm khác."); return; }
        products[idx] = next;
      }
      saveOverride();
      closeModal();
      renderProducts($("[data-prod-search]").value);
      UEL.toast(isNew ? "Đã thêm sản phẩm" : "Đã lưu sản phẩm");
    });

    $("[data-del-product]")?.addEventListener("click", () => {
      if (!confirm(`Xoá sản phẩm "${products[idx].name}"?`)) return;
      products.splice(idx, 1);
      saveOverride();
      closeModal();
      renderProducts($("[data-prod-search]").value);
      UEL.toast("Đã xoá sản phẩm");
    });

    $$("[data-modal-close]").forEach((b) => b.addEventListener("click", closeModal));
    openModal();
  }

  const slugify = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  function openModal() {
    const m = $("[data-modal]");
    m.hidden = false;
    document.body.style.overflow = "hidden";
    $("[data-modal] .modal-backdrop").addEventListener("click", closeModal, { once: true });
  }
  function closeModal() {
    $("[data-modal]").hidden = true;
    document.body.style.overflow = "";
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("[data-modal]").hidden) closeModal();
  });

  /* ================= khởi động ================= */
  initGate();
})();

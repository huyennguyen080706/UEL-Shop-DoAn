/* checkout.js: đặt hàng. Kiểm tra dữ liệu nhập, tính phí giao hàng,
   tạo đơn dạng JSON và XML, lưu đơn ở localStorage để tra cứu lại */
(async () => {
  const info = await UEL.load("shop-info");
  const form = document.querySelector("#checkout");
  const out = document.querySelector(".result");
  const $ = (s) => document.querySelector(s);

  const shippingFee = (method, subtotal, address) => {
    if (method === "PICKUP" || subtotal >= info.shipping.freeFrom) return 0;
    const a = address.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return /ho chi minh|hcm|sai gon|thu duc/.test(a) ? info.shipping.feeHcm : info.shipping.feeOther;
  };

  function totals() {
    const sub = UEL.cartSubtotal();
    const fee = shippingFee(form.fulfillment.value, sub, form.address.value);
    $(".subtotal").textContent = UEL.vnd(sub);
    $(".fee").textContent = fee ? UEL.vnd(fee) : "Miễn phí";
    $(".total").textContent = UEL.vnd(sub + fee);
    $(".address-row").hidden = form.fulfillment.value !== "DELIVERY";
    return { sub, fee };
  }

  const RULES = {
    name: (v) => (v.trim().length >= 2 ? "" : "Nhập họ và tên"),
    phone: (v) => (/^(0|\+84)\d{9,10}$/.test(v.replace(/[\s.-]/g, "")) ? "" : "Số điện thoại chưa đúng"),
    email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Email chưa đúng"),
    address: (v) => (form.fulfillment.value !== "DELIVERY" || v.trim().length >= 10 ? "" : "Nhập địa chỉ giao hàng đầy đủ"),
  };
  function validate() {
    let ok = true;
    for (const [k, rule] of Object.entries(RULES)) {
      const msg = rule(form[k].value);
      form[k].classList.toggle("is-invalid", !!msg);
      form[k].setAttribute("aria-invalid", !!msg);
      form.querySelector(`[data-err="${k}"]`).textContent = msg;
      if (msg && ok) form[k].focus();
      ok = ok && !msg;
    }
    return ok;
  }

  // XML của đơn hàng: dựng bằng DOM rồi chuyển thành chuỗi
  function toXml(order) {
    const doc = document.implementation.createDocument(null, "order", null);
    const root = doc.documentElement;
    root.setAttribute("code", order.code);
    root.setAttribute("createdAt", order.createdAt);
    const add = (parent, tag, text, attrs = {}) => {
      const el = doc.createElement(tag);
      if (text !== undefined) el.textContent = text;
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      parent.append(el);
      return el;
    };
    const c = add(root, "customer");
    add(c, "name", order.customer.name);
    add(c, "phone", order.customer.phone);
    if (order.customer.email) add(c, "email", order.customer.email);
    add(root, "fulfillment", order.fulfillment === "PICKUP" ? "Nhận tại trường" : "Giao tận nơi", { type: order.fulfillment });
    if (order.address) add(root, "address", order.address);
    add(root, "payment", order.paymentLabel, { method: order.payment });
    const items = add(root, "items");
    order.items.forEach((i) => add(items, "item", i.name, { sku: i.sku, color: i.color, size: i.size, quantity: i.qty, unitPrice: i.price }));
    const t = add(root, "totals");
    add(t, "subtotal", order.subtotal);
    add(t, "shippingFee", order.shippingFee);
    add(t, "total", order.total);
    const s = new XMLSerializer().serializeToString(doc);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + s.replace(/></g, ">\n<");
  }

  const download = (name, text, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ô đang báo lỗi thì kiểm tra lại ngay khi người dùng sửa
  form.addEventListener("input", (e) => {
    const k = e.target.name;
    if (RULES[k] && e.target.classList.contains("is-invalid")) {
      const msg = RULES[k](e.target.value);
      e.target.classList.toggle("is-invalid", !!msg);
      form.querySelector().textContent = msg;
    }
    totals();
  });
  form.addEventListener("change", totals);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!UEL.readCart().length) return UEL.toast("Giỏ hàng đang trống");
    if (!validate()) return;
    const { sub, fee } = totals();
    const now = new Date();
    const code = "UEL" + now.toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const pay = form.payment.value;
    const order = {
      code,
      createdAt: now.toISOString(),
      status: "PENDING",
      customer: { name: form.name.value.trim(), phone: form.phone.value.replace(/[\s.-]/g, ""), email: form.email.value.trim() || null },
      fulfillment: form.fulfillment.value,
      address: form.fulfillment.value === "DELIVERY" ? form.address.value.trim() : null,
      payment: pay,
      paymentLabel: info.payment[pay].label,
      note: form.note.value.trim() || null,
      items: UEL.readCart().map(({ sku, name, color, size, price, qty }) => ({ sku, name, color, size, price, qty })),
      subtotal: sub,
      shippingFee: fee,
      total: sub + fee,
    };
    UEL.saveOrder(order);
    UEL.clearCart();
    const json = JSON.stringify(order, null, 2);
    const xml = toXml(order);
    form.hidden = true;
    out.hidden = false;
    out.querySelector(".code").textContent = code;
    out.querySelector(".pay-note").textContent = info.payment[pay].note;
    out.querySelector(".xml-preview").textContent = xml;
    out.querySelector(".dl-json").onclick = () => download(`${code}.json`, json, "application/json");
    out.querySelector(".dl-xml").onclick = () => download(`${code}.xml`, xml, "application/xml");
    scrollTo({ top: 0 });
  });
  totals();
})();

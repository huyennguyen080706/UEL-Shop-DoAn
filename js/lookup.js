/* lookup.js: tra cứu đơn đã đặt trên trình duyệt này theo mã đơn và số điện thoại */
(() => {
  const form = document.querySelector("#lookup");
  const out = document.querySelector(".lookup-result");
  const STATUS = { PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", READY: "Sẵn sàng nhận hàng", COMPLETED: "Hoàn tất", CANCELLED: "Đã huỷ" };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const o = UEL.findOrder(form.code.value, form.phone.value);
    if (!o) {
      out.innerHTML = `<p class="note">Không tìm thấy đơn. Kiểm tra lại mã đơn và số điện thoại đã dùng khi đặt.</p>`;
      return;
    }
    out.innerHTML = `<div class="summary">
      <p class="text-soft">Mã đơn</p><p class="text-lead tabular">${o.code}</p>
      <p class="text-soft" style="margin-top:12px">Trạng thái</p><p class="text-lead">${STATUS[o.status]}</p>
      <ul style="margin-top:16px">${o.items.map((i) => `<li>${UEL.esc(i.name)}, ${UEL.esc(i.color)}, size ${UEL.esc(i.size)} × ${i.qty}</li>`).join("")}</ul>
      <p style="margin-top:16px" class="tabular">Tổng cộng ${UEL.vnd(o.total)}</p></div>`;
  });
})();

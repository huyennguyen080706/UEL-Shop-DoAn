/* policy.js: mục lục trang Chính sách, tô mục đang đọc */
(() => {
  const links = [...document.querySelectorAll(".toc a")];
  const secs = links.map((a) => document.querySelector(a.getAttribute("href")));
  const pick = () => {
    const line = innerHeight * 0.35;
    let cur = 0;
    secs.forEach((s, i) => s.getBoundingClientRect().top <= line && (cur = i));
    if (innerHeight + scrollY >= document.body.scrollHeight - 4) cur = secs.length - 1;
    links.forEach((a, i) => a.classList.toggle("is-active", i === cur));
  };
  addEventListener("scroll", pick, { passive: true });
  pick();
})();

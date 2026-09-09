export {};

const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-nbis-nav-link]")];
const sections = links
  .map((link) => document.getElementById(link.dataset.nbisNavLink ?? ""))
  .filter((section): section is HTMLElement => Boolean(section));

if (links.length && sections.length) {
  const setActive = (id: string) => {
    links.forEach((link) => {
      const active = link.dataset.nbisNavLink === id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const updateFromScroll = () => {
    const marker = Math.min(window.innerHeight * 0.32, 300);
    const current = sections.reduce<HTMLElement | null>((active, section) => {
      return section.getBoundingClientRect().top <= marker ? section : active;
    }, sections[0]);
    if (current) setActive(current.id);
  };

  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      updateFromScroll();
    });
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  links.forEach((link) => link.addEventListener("click", () => setActive(link.dataset.nbisNavLink ?? "")));
  updateFromScroll();
}

// Jump to anchor
const scrollAndRemoveQuery = () => {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
  const { protocol, host, pathname } = window.location;
  const url = `${protocol}//${host}${pathname}`;
  window.history.replaceState({}, '', url);
}
// automatically jump into anchor

if (location.hash) {
  setTimeout(() => {
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView();
    } else {
      scrollAndRemoveQuery()
    }
  }, 0);
} else {
  scrollAndRemoveQuery()
}
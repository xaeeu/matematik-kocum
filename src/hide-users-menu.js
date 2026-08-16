(() => {
  const hide = () => {
    document.querySelectorAll('[data-page="users"]').forEach(el => el.remove());
    if (document.querySelector('h1')?.textContent.trim() === 'Kullanıcılar') {
      document.querySelector('.content')?.replaceChildren();
    }
  };
  hide();
  setTimeout(hide, 300);
  setTimeout(hide, 1000);
  setInterval(hide, 1500);
})();

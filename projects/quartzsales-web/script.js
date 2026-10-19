const menuToggle = document.querySelector('.hamburger-icon');
const mobileMenu = document.querySelector('.mobile-menu');

menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('show-mobile-menu');
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        mobileMenu.classList.remove('show-mobile-menu');
    }
});

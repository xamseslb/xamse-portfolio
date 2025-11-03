// Mobile menu

const mobileMenuToggle= document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// close mobile menu when clicking on a link

const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link=>{
    link.addEventListener('click',()=>{
        navMenu.classList.remove('active');
    });
});

    // Navbar scroll effect

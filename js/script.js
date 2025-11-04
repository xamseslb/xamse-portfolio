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

const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });


        // intersection Observer for animations
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add(
            entry.target.classList.contains('about-content') ? 'reveal' : 'animate'
        );

        observer.unobserve(entry.target);
    });
}, {
    threshold: 0.1
});


        // smooth scroll for anchor links

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const offsetTop = target.offsetTop - 80;

        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    });
});

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

        // Typewriter effect funtion

function typewriterEffect(elements, startDelay = 0) {
    let index = 0;

    function typeNext() {
        if (index >= elements.length) return;

        const element = elements[index];
        const text = element.dataset.text || element.textContent;

        element.dataset.text = text;
        element.textContent = '';
        element.classList.add('typewriter-active');
        element.style.opacity = '1';

        let charIndex=0;
        const speed = Math.random() * 6 + 12; // 12–18 ms

        (function typeChar() {
            if (charIndex < text.length) {
                element.textContent += text[charIndex++];
                setTimeout(typeChar, speed);
            } else {
                index++;
                typeNext();
            }
        })();
    }

    setTimeout(typeNext, startDelay);
}


// apply typewriter to her section

const heroTypewriterElements = document.querySelectorAll('.hero-title, .hero-tagline, .hero-description');
if (heroTypewriterElements.length) {
    typewriterEffect([...heroTypewriterElements], 500);
}


// Apply typewriter to About Me section when scrolled into view
const aboutContent = document.querySelector('.about-content');

if (aboutContent) {
    const aboutObserver = new IntersectionObserver(entries => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;

        const aboutTextElements = aboutContent.querySelectorAll('.about-text h2, .about-text p');

        if (aboutTextElements.length) {
            typewriterEffect([...aboutTextElements], 200);
        }

        aboutObserver.unobserve(aboutContent);
    }, { threshold: 0.2 });

    aboutObserver.observe(aboutContent);
}


// --- Combined scroll behavior (parallax, etc.) ---
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    // Parallax effect for background blobs
    document.querySelectorAll('.gradient-blob').forEach((blob, index) => {
        const speed = 0.5 + index * 0.1;
        blob.style.transform = `translateY(${-(scrolled * speed)}px)`;
    });
}, { passive: true });


// Entrance reveal animation delays
['.skill-card', '.timeline-item', '.contact-card'].forEach(selector => {
    document.querySelectorAll(selector).forEach((el, index) => {
        const baseDelay = selector === '.timeline-item' ? 0.2 : 0.1;
        el.style.animationDelay = `${index * baseDelay}s`;
    });
});


// Console message for devs 👋
console.log('%c👋 Hi there!', 'font-size: 20px; color: #667eea; font-weight: bold;');
console.log('%cCurious how this site was built? Reach out anytime 😊', 'font-size: 14px; color: #6c757d;');

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Hero Canvas Animation
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// Resize canvas
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Mouse position
let mouse = {
    x: null,
    y: null,
    radius: 150
};

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

// Particle class
class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 3 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        
        // Color based on theme
        if (document.body.classList.contains('dark-mode')) {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
        } else {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        }
        
        ctx.fill();
    }

    update() {
        // Mouse interaction
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            }
        }
        
        // Movement
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        this.draw();
    }
}

function init() {
    particles = [];
    let numberOfParticles = (width * height) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

init();

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
    }
    
    connect();
}

function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
            
            if (distance < (width/7) * (height/7)) {
                opacityValue = 1 - (distance/20000);
                
                if (document.body.classList.contains('dark-mode')) {
                    ctx.strokeStyle = 'rgba(102, 126, 234,' + opacityValue + ')';
                } else {
                    ctx.strokeStyle = 'rgba(102, 126, 234,' + opacityValue * 0.5 + ')';
                }
                
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

animate();

window.addEventListener('resize', () => {
    resize();
    init();
});


// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('about-content')) {
                entry.target.classList.add('reveal');
            } else {
                entry.target.classList.add('animate');
            }
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animated elements
const animatedElements = document.querySelectorAll('.skill-card, .timeline-item, .contact-card, .about-content');
animatedElements.forEach(el => {
    observer.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if href is just "#"
        if (href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 80;

            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Typewriter effect function
function typewriterEffect(elements, startDelay = 0) {
    let currentElementIndex = 0;

    function typeElement() {
        if (currentElementIndex >= elements.length) return;

        const element = elements[currentElementIndex];
        const text = element.getAttribute('data-text') || element.textContent;

        element.setAttribute('data-text', text);
        element.textContent = '';
        element.classList.add('typewriter-active');
        element.style.opacity = '1';
        element.style.visibility = 'visible';

        let charIndex = 0;
        const typeSpeed = Math.floor(Math.random() * (18 - 12 + 1)) + 12;

        function typeChar() {
            if (charIndex < text.length) {
                element.textContent += text.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typeSpeed);
            } else {
                currentElementIndex++;
                typeElement();
            }
        }

        typeChar();
    }

    setTimeout(typeElement, startDelay);
}

// Apply typewriter to hero section
const heroTypewriterElements = document.querySelectorAll('.hero-title, .hero-tagline, .hero-description');
if (heroTypewriterElements.length > 0) {
    typewriterEffect(Array.from(heroTypewriterElements), 500);
}

// Apply typewriter to About Me section when it becomes visible
const aboutContent = document.querySelector('.about-content');
if (aboutContent) {
    const aboutObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const aboutTextElements = aboutContent.querySelectorAll('.about-text h2, .about-text p');
                if (aboutTextElements.length > 0) {
                    typewriterEffect(Array.from(aboutTextElements), 200);
                }
                aboutObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    aboutObserver.observe(aboutContent);
}

// Add entrance animation delay to cards
const skillCards = document.querySelectorAll('.skill-card');
skillCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.2}s`;
});

const contactCards = document.querySelectorAll('.contact-card');
contactCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// Console message
console.log('%c👋 Hi there!', 'font-size: 20px; color: #667eea; font-weight: bold;');
console.log('%cInterested in how this site was built? Feel free to reach out!', 'font-size: 14px; color: #6c757d;');

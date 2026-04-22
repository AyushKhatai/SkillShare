// ========================================
// AUTH-AWARE UI (Landing Page)
// ========================================
(function () {
    if (typeof API === 'undefined' || !API.auth) return;

    const isLoggedIn = API.auth.isAuthenticated();
    const user = API.getUser();

    if (isLoggedIn && user) {
        const displayName = (user.name || user.full_name || 'User').split(' ')[0];

        // Swap nav buttons
        const loginBtn = document.getElementById('navAuthLogin');
        const registerBtn = document.getElementById('navAuthRegister');
        const dashBtn = document.getElementById('navAuthDashboard');

        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (dashBtn) {
            dashBtn.style.display = '';
            dashBtn.textContent = `👋 ${displayName}'s Dashboard`;
        }

        // Swap CTA section
        const ctaTitle = document.getElementById('ctaTitle');
        const ctaDesc = document.getElementById('ctaDesc');
        const ctaBtn = document.getElementById('ctaBtn');

        if (ctaTitle) ctaTitle.textContent = `Welcome back, ${displayName}! 🎉`;
        if (ctaDesc) ctaDesc.textContent = 'Head to your dashboard to manage skills, check sessions, or explore new things to learn.';
        if (ctaBtn) {
            ctaBtn.href = 'dashboard.html';
            ctaBtn.innerHTML = 'Go to Dashboard <span class="btn-arrow">→</span>';
        }
    }
})();

// ========================================
// NAVBAR SCROLL EFFECT
// ========================================

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add shadow on scroll
        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
            navbar.style.background = 'rgba(15, 23, 42, 0.9)';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.background = 'rgba(15, 23, 42, 0.6)';
        }

        // Update active nav link based on scroll position
        updateActiveNavLink();

        lastScroll = currentScroll;
    });
}

// ========================================
// ACTIVE NAV LINK HIGHLIGHTING
// ========================================

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop - 200) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// ========================================
// PARTICLE CURSOR EFFECT
// ========================================

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.life = 100;
        // Styles based on new theme
        this.color = Math.random() > 0.5 ? '139, 92, 246' : '6, 182, 212'; // Violet or Cyan
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 2;
        if (this.size > 0.2) this.size -= 0.05;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(${this.color}, ${this.life / 100})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Only activate on larger screens
if (window.innerWidth > 768) {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Create particles on mouse move (throttled)
        if (Math.random() > 0.8) {
            particles.push(new Particle(mouseX, mouseY));
        }
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw(ctx);

            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }


    animate();
}

console.log('✨ Campus Skill Share animations initialized!');

// ========================================
// NOTIFICATIONS & UTILITIES
// ========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Theme-aware colors
    const bgColor = type === 'success' ? '#10b981' : '#3b82f6'; // Emerald or Blue

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${bgColor};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ========================================
// ANIMATED STAT COUNTERS
// ========================================
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            counter.textContent = current.toLocaleString() + '+';
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        }
        requestAnimationFrame(updateCount);
    });
}

// Trigger counters on scroll into view
const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    let countersTriggered = false;
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersTriggered) {
                countersTriggered = true;
                animateCounters();
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
}

// ========================================
// TESTIMONIALS CAROUSEL
// ========================================
(function () {
    const track = document.getElementById('testimonialTrack');
    const dotsContainer = document.getElementById('testimonialDots');
    if (!track || !dotsContainer) return;

    const cards = track.querySelectorAll('.testimonial-card');
    const total = cards.length;
    let currentIndex = 0;
    let autoSlideInterval;

    // Create dots
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    function goToSlide(index) {
        currentIndex = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        dotsContainer.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        goToSlide((currentIndex + 1) % total);
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 4000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    startAutoSlide();

    // Pause on hover
    const carousel = document.getElementById('testimonialsCarousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
    }

    // Touch swipe support
    let touchStartX = 0;
    if (carousel) {
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            stopAutoSlide();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToSlide((currentIndex + 1) % total);
                } else {
                    goToSlide((currentIndex - 1 + total) % total);
                }
            }
            startAutoSlide();
        }, { passive: true });
    }
})();

// ========================================
// FAQ ACCORDION
// ========================================
(function () {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            // Close all
            faqItems.forEach(i => i.classList.remove('open'));
            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
})();

// ========================================
// HAMBURGER MOBILE MENU
// ========================================
(function () {
    const hamburger = document.getElementById('hamburgerBtn');
    const drawer = document.getElementById('navDrawer');
    if (!hamburger || !drawer) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        drawer.classList.toggle('open');
    });

    // Close on link click
    drawer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            drawer.classList.remove('open');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!drawer.contains(e.target) && !hamburger.contains(e.target) && drawer.classList.contains('open')) {
            hamburger.classList.remove('active');
            drawer.classList.remove('open');
        }
    });
})();

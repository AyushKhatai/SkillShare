// Smooth Scroll & Reveal Animations

document.addEventListener('DOMContentLoaded', () => {
    // Reveal Observer for scroll animations
    const revealNav = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver(revealNav, revealOptions);

    // Add reveal class to cards and sections
    const revealElements = document.querySelectorAll('.feature-card, .skill-card, .step-card, .section-header, .hero-content > *, .auth-card');

    // Add CSS for reveal animation
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .skill-card, .step-card, .section-header, .auth-card {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .revealed {
            opacity: 1;
            transform: translateY(0);
        }

        /* Staggered transition delays for grids */
        .features-grid .feature-card:nth-child(2) { transition-delay: 0.1s; }
        .features-grid .feature-card:nth-child(3) { transition-delay: 0.2s; }
        .skills-grid .skill-card:nth-child(2) { transition-delay: 0.1s; }
        .skills-grid .skill-card:nth-child(3) { transition-delay: 0.2s; }
        .skills-grid .skill-card:nth-child(4) { transition-delay: 0.3s; }
    `;
    document.head.appendChild(style);

    revealElements.forEach(el => revealObserver.observe(el));

    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax effect for orbs
    document.addEventListener('mousemove', (e) => {
        const orbs = document.querySelectorAll('.gradient-orb');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (window.innerWidth / 2 - e.clientX) / speed;
            const yOffset = (window.innerHeight / 2 - e.clientY) / speed;

            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });
});

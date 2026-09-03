// ─── Shared brand mark ────────────────────────────────────────
// Replaces 🎓 emoji + old wordmark on every page with the
// consistent SVG logo. CSS handles dark-mode colors automatically.

function upgradeBrands() {
    const logoSVG = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="logo-svg" aria-hidden="true">
  <title>SkillShare Hub</title>
  <rect class="logo-frame" x="4" y="4" width="40" height="40" rx="9" transform="rotate(-4 24 24)"/>
  <g class="logo-arrow-paper">
    <path d="M14 19 H31"/>
    <path d="M27.5 15 L31.5 19 L27.5 23"/>
  </g>
  <g class="logo-arrow-lemon">
    <path d="M34 29 H17"/>
    <path d="M20.5 25 L16.5 29 L20.5 33"/>
  </g>
</svg>`;

    const newBrand = `
        <span class="logo-mark" aria-hidden="true">${logoSVG}</span>
        <span class="logo-word">skillshare<i>/</i>hub</span>
    `;

    document.querySelectorAll('.logo').forEach(el => {
        if (el.querySelector('.logo-mark')) return;
        el.classList.add('logo-brand');
        el.innerHTML = newBrand;
    });

    document.querySelectorAll('.dash-topbar .logo').forEach(el => {
        if (el.querySelector('.logo-mark')) return;
        el.classList.add('logo-brand');
        el.innerHTML = newBrand;
    });

    document.querySelectorAll('.footer__mark').forEach(el => {
        if (el.querySelector('svg')) return;
        el.innerHTML = logoSVG;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgradeBrands);
} else {
    upgradeBrands();
}
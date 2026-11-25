// Reformes Clau · interacción (sin librerías)
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ahorro = navigator.connection && navigator.connection.saveData;

  // cabecera sólida al bajar + progreso con la llave + barra del móvil
  const cab = $('[data-cab]'), barra = $('.barra-movil'), hero = $('.hero');
  let pendiente = false;
  const alScroll = () => {
    pendiente = false;
    const y = scrollY, alto = document.documentElement.scrollHeight - innerHeight;
    cab.classList.toggle('solida', y > (hero ? hero.offsetHeight - 80 : 40));
    cab.style.setProperty('--p', alto > 0 ? Math.min(1, y / alto).toFixed(4) : 0);
    if (barra) barra.classList.toggle('visible', y > innerHeight * .7);
  };
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alScroll); } }, { passive: true });
  alScroll();

  // menú del móvil
  const bm = $('[data-menu]');
  bm.addEventListener('click', () => { const ab = cab.classList.toggle('abierta'); bm.setAttribute('aria-expanded', ab); });
  $$('#menu a').forEach((a) => a.addEventListener('click', () => { cab.classList.remove('abierta'); bm.setAttribute('aria-expanded', false); }));

  // aparición
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.aparece, .pasos').forEach((el) => io.observe(el));

  // vídeos: se cargan y reproducen solo cuando se ven
  const arranca = (v) => {
    if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); }
    const p = v.play(); if (p) p.then(() => v.classList.add('vivo')).catch(() => {});
  };
  if (!reducido && !ahorro) {
    const iov = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) arranca(v); else if (!v.paused) v.pause();
    }), { threshold: .35 });
    $$('video[data-src]:not(.hero__video)').forEach((v) => iov.observe(v));
    const hv = $('.hero__video');
    if (hv) addEventListener('load', () => setTimeout(() => { arranca(hv); iov.observe(hv); }, 400), { once: true });
  }

  // ¿piedra o mortero?
  let jugadas = 0, aciertos = 0;
  const marcador = $('[data-marcador]');
  $$('[data-carta]').forEach((c) => $$('[data-resp]', c).forEach((b) => b.addEventListener('click', () => {
    if (c.classList.contains('resuelta')) return;
    const ok = b.dataset.resp === 'mortero';
    jugadas++; if (ok) aciertos++;
    $('.carta__veredicto', c).textContent = ok ? '¡Bien visto!' : '¡Te ha pillado!';
    c.classList.add('resuelta');
    if (marcador) marcador.textContent = jugadas < 4
      ? `Llevas ${aciertos} de ${jugadas}. Quedan ${4 - jugadas}.`
      : (aciertos === 4 ? '4 de 4. Tienes ojo de albañil… y aun así, todo era mortero.' : `${aciertos} de 4. Todo era mortero, tallado a mano por Claudio.`);
  })));

  // antes / después y día / noche
  $$('.obra').forEach((o) => {
    $$('[data-ver]', o).forEach((b) => b.addEventListener('click', () => {
      const antes = b.dataset.ver === 'antes';
      o.classList.toggle('ver-antes', antes);
      $$('[data-ver]', o).forEach((x) => x.setAttribute('aria-pressed', x === b));
    }));
    const dn = $('[data-dn]', o);
    if (dn) dn.addEventListener('click', () => { const n = o.classList.toggle('noche'); dn.setAttribute('aria-pressed', n); dn.setAttribute('aria-label', n ? 'Ver de día' : 'Ver de noche'); });
  });

  // más obras en el móvil
  const mas = $('[data-mas]');
  if (mas) mas.addEventListener('click', () => { $('[data-minis]').classList.add('todas'); mas.remove(); });

  // visor de fotos
  const dlg = $('[data-visor-dlg]'), img = $('[data-visor-img]'), tit = $('[data-visor-tit]'), num = $('[data-visor-n]');
  let lista = [], i = 0, origen = null;
  const pinta = () => {
    const [src, w, h] = lista[i];
    img.src = src; img.width = w; img.height = h; img.alt = `${tit.textContent}, foto ${i + 1}`;
    num.textContent = `${i + 1} / ${lista.length}`;
    const sig = lista[(i + 1) % lista.length]; if (sig) { const p = new Image(); p.src = sig[0]; }
  };
  const mueve = (d) => { i = (i + d + lista.length) % lista.length; pinta(); };
  $$('[data-visor]').forEach((b) => b.addEventListener('click', () => {
    lista = JSON.parse(b.dataset.visor); i = 0; origen = b;
    tit.textContent = b.dataset.titulo || '';
    pinta(); dlg.showModal(); document.body.style.overflow = 'hidden';
  }));
  const cierra = () => { dlg.close(); };
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; img.removeAttribute('src'); if (origen) origen.focus(); });
  $('[data-visor-x]').addEventListener('click', cierra);
  $('[data-visor-ant]').addEventListener('click', () => mueve(-1));
  $('[data-visor-sig]').addEventListener('click', () => mueve(1));
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') mueve(-1); if (e.key === 'ArrowRight') mueve(1); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.matches('[data-visor-esc]')) cierra(); });
  let x0 = null;
  const esc = $('[data-visor-esc]');
  esc.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  esc.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) mueve(dx < 0 ? 1 : -1); x0 = null; });

  // formulario → WhatsApp
  const f = $('[data-form]');
  if (f) f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const n = f.elements.nombre;
    if (!d.nombre.trim()) { n.classList.add('error'); n.focus(); return; }
    n.classList.remove('error');
    const t = `Hola Claudio, soy ${d.nombre.trim()}${d.pueblo.trim() ? ` (${d.pueblo.trim()})` : ''}.\nMe interesa: ${d.tipo}.\n${d.mensaje.trim()}`;
    window.open(`https://wa.me/${window.WA}?text=${encodeURIComponent(t.trim())}`, '_blank', 'noopener');
  });
})();

/* Uma puxada por vez: sem relógio rodando depois que o papel se acomoda. */
(() => {
  'use strict';
  const section = document.querySelector('#sobre.corda-section');
  if (!section) return;

  const rig = section.querySelector('.corda-rig');
  const handle = section.querySelector('.corda-handle');
  const rope = section.querySelector('.corda-line');
  const scribble = section.querySelector('.corda-scribble');
  const hint = section.querySelector('.corda-hint');
  const again = section.querySelector('.corda-again');
  const note = section.querySelector('.corda-afterthought');
  const live = section.querySelector('.corda-live');
  const controls = section.querySelector('.corda-controls');
  if (!rig || !handle || !rope || !scribble || !again || !controls) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const phrases = [...section.querySelectorAll('.corda-phrase')];
  const beads = [];
  phrases.forEach((phrase, group) => {
    const words = phrase.textContent.trim().split(/\s+/);
    phrase.textContent = '';
    let order = 0;
    words.forEach(word => {
      const holder = document.createElement('span');
      holder.className = 'corda-bead-word';
      [...word].forEach(char => {
        const bead = document.createElement('span');
        bead.className = 'corda-bead';
        bead.textContent = char;
        const index = order++;
        beads.push({ element: bead, group, index, tilt: ((index * 7 + group * 3) % 5) - 2 });
        holder.appendChild(bead);
      });
      phrase.appendChild(holder);
    });
  });

  let progress = 0;
  let settled = 0;
  let runs = 0;
  let busy = false;
  let drag = null;
  let animationFrame = 0;
  let suppressClick = false;
  let suppressTimer = 0;
  let size = rig.getBoundingClientRect().width || 500;
  let height = rig.getBoundingClientRect().height || 210;
  const drawing = section.querySelector('.corda-drawing');
  const state = value => { section.dataset.cordaState = value; };

  function paint(value, rest = 0, offsetX = 0, offsetY = 0) {
    progress = clamp(value);
    settled = rest;
    section.style.setProperty('--corda-pull', progress.toFixed(4));
    section.style.setProperty('--corda-settle', rest.toFixed(4));
    // The cord spans the page; the end follows the hand in CSS pixels.
    const x = clamp(size - 36 + offsetX, 125, size - 30);
    const y = clamp(78 + 30 * progress - 5 * rest + offsetY, 30, height - 30);
    const at = fraction => 96 + (x - 96) * fraction;
    const wave = 10 + 30 * progress;
    drawing.setAttribute('viewBox', `0 0 ${size} ${height}`);
    rope.setAttribute('d', `M96 68 C${at(.13)} ${68 - wave}, ${at(.23)} ${83 + wave}, ${at(.35)} 80 S${at(.57)} ${72 - wave}, ${at(.67)} 86 S${at(.86)} ${91 + wave}, ${x} ${y}`);
    const underlineX = height > 240 ? size * .14 : size * .73;
    const underlineY = height > 240 ? 257 : 87;
    scribble.setAttribute('d', `M${underlineX} ${underlineY}q${size * .055} 5 ${size * .11} -2`);
    handle.style.left = `${x}px`;
    handle.style.top = `${y}px`;
    const drawn = clamp((progress - .07) / .83);
    scribble.style.opacity = drawn > 0 ? '1' : '0';
    scribble.style.strokeDashoffset = String(1 - drawn);
    hint.style.opacity = String(1 - clamp(progress * 5));
    phrases.forEach((phrase, index) => {
      const reveal = clamp((progress - .12 - index * .15) / .3);
      phrase.style.opacity = String(reveal);
      phrase.style.transform = reduce.matches ? 'none' : `translate(${(1 - reveal) * -12}px, ${(1 - reveal) * 9}px) rotate(${(1 - rest) * (index % 2 ? .5 : -.5)}deg)`;
    });
    beads.forEach(({ element, group, index, tilt }) => {
      const appear = clamp((progress - .12 - group * .15 - index * .003) / .16);
      element.style.opacity = String(appear);
      element.style.transform = reduce.matches ? 'none' : `translateY(${(1 - appear) * (index % 2 ? -5 : 6)}px) rotate(${tilt}deg)`;
    });
  }

  function blockControls(blocked) {
    handle.setAttribute('aria-disabled', String(blocked));
    again.setAttribute('aria-disabled', String(blocked));
  }

  function finish() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    paint(1, 1);
    busy = false;
    runs += 1;
    state('settled');
    blockControls(false);
    again.hidden = false;
    handle.setAttribute('aria-label', 'Dar mais corda à ideia');
    if (runs >= 2) note.textContent = 'pronto. agora tivemos outra ideia.';
    live.textContent = runs === 1
      ? 'e se? será que dá pra fazer? não sei como colocar em prática. A ideia ganhou forma. Você pode dar mais corda.'
      : 'pronto. agora tivemos outra ideia.';
  }

  function play(from = 0) {
    if (busy) return;
    busy = true;
    blockControls(true);
    state('playing');
    live.textContent = '';
    if (reduce.matches) { finish(); return; }
    const start = performance.now();
    const duration = 660;
    function frame(now) {
      const elapsed = now - start;
      if (elapsed < duration) {
        const t = clamp(elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        paint(from + (1 - from) * eased, 0);
      } else {
        const t = clamp((elapsed - duration) / 300);
        const ease = 1 - Math.pow(1 - t, 3);
        const paperJolt = Math.sin(t * Math.PI * 2) * (1 - t);
        paint(1, ease, paperJolt * 2, paperJolt * -3);
        if (t >= 1) { finish(); return; }
      }
      animationFrame = requestAnimationFrame(frame);
    }
    animationFrame = requestAnimationFrame(frame);
  }

  function forgetSyntheticClick() {
    suppressClick = true;
    clearTimeout(suppressTimer);
    suppressTimer = window.setTimeout(() => { suppressClick = false; }, 600);
  }

  function releasePointer(event, cancelled = false) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const { id, moved } = drag;
    drag = null;
    if (handle.hasPointerCapture(id)) handle.releasePointerCapture(id);
    if (cancelled) {
      paint(runs ? 1 : 0, runs ? 1 : 0);
      state(runs ? 'settled' : 'idle');
      forgetSyntheticClick();
      return;
    }
    if (moved) {
      forgetSyntheticClick();
      play(progress);
    } else {
      // A real click, touch tap, Enter and Space all use the native button click.
      paint(runs ? 1 : 0, runs ? 1 : 0);
      state(runs ? 'settled' : 'idle');
    }
  }

  handle.addEventListener('pointerdown', event => {
    if (busy || drag || !event.isPrimary || event.button !== 0) return;
    clearTimeout(suppressTimer);
    suppressClick = false;
    size = rig.getBoundingClientRect().width || 500;
    height = rig.getBoundingClientRect().height || 210;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, originY: runs ? 103 : 78, moved: false };
    handle.setPointerCapture(event.pointerId);
    state('pulling');
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId || busy) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 5 && !drag.moved) return;
    drag.moved = true;
    const amount = clamp(distance / 110);
    if (reduce.matches) {
      // Only the short piece of string follows the hand; the collage stays still.
      const x = clamp(size - 36 + dx, 125, size - 30);
      const y = clamp(drag.originY + dy, 30, height - 30);
      handle.style.left = `${x}px`;
      handle.style.top = `${y}px`;
      rope.setAttribute('d', `M96 68 Q${size * .53} 88 ${x} ${y}`);
      progress = amount;
      return;
    }
    paint(amount, 0, clamp(dx, -80, 6), drag.originY - 78 + clamp(dy, -35, 110) - 30 * amount);
  });
  handle.addEventListener('pointerup', event => releasePointer(event));
  handle.addEventListener('pointercancel', event => releasePointer(event, true));
  handle.addEventListener('lostpointercapture', event => { if (drag) releasePointer(event, true); });
  handle.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) { event.preventDefault(); releasePointer(null, true); }
    if ((event.key === 'Enter' || event.key === ' ') && event.repeat) event.preventDefault();
  });
  handle.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    if (busy || drag) return;
    paint(0, 0);
    play();
  });
  again.addEventListener('click', () => {
    if (busy || drag) return;
    paint(0, 0);
    play();
  });
  reduce.addEventListener('change', () => { if (busy && reduce.matches) finish(); });
  window.addEventListener('blur', () => { if (drag) releasePointer(null, true); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (drag) releasePointer(null, true);
      if (busy) finish();
    }
  });

  function resize() {
    if (drag) releasePointer(null, true);
    size = rig.getBoundingClientRect().width || 500;
    height = rig.getBoundingClientRect().height || 210;
    paint(progress, settled);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(rig);
  else window.addEventListener('resize', resize, { passive: true });

  // Paths and controls only become active after all the setup has succeeded.
  scribble.style.strokeDasharray = '1';
  scribble.style.strokeDashoffset = '1';
  paint(0, 0);
  controls.hidden = false;
  section.classList.add('corda-ready');
  state('idle');
})();

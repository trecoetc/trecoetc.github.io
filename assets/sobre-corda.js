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
        beads.push({ element: bead, group, index, tilt: ((index * 7 + group * 3) % 11) - 5 });
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
  const state = value => { section.dataset.cordaState = value; };

  function paint(value, rest = 0, offsetX = 0, offsetY = 0) {
    progress = clamp(value);
    settled = rest;
    section.style.setProperty('--corda-pull', progress.toFixed(4));
    section.style.setProperty('--corda-settle', rest.toFixed(4));
    // Coordinates are in the drawing's 500 × 340 paper space.
    const x = 224 + 49 * progress + offsetX;
    const y = 202 + 43 * progress - 12 * rest + offsetY;
    const curl = 1 - progress;
    rope.setAttribute('d', `M156 106 C${178 + progress * 24} ${102 - progress * 18}, ${204 + progress * 26} ${126 + progress * 10}, ${190 + progress * 38} ${147 + progress * 21} C${174 + progress * 53} ${174 + progress * 6}, ${215 + progress * 32} ${183 + progress * 13}, ${219 + progress * 27} ${161 + progress * 30} C${226 + progress * 27} ${139 + progress * 38}, ${204 + progress * 43} ${134 + progress * 44}, ${208 + progress * 39} ${153 + progress * 38} Q${211 + progress * 41} ${185 + curl * 10}, ${x} ${y}`);
    handle.style.left = `${x / 5}%`;
    handle.style.top = `${y / 3.4}%`;
    const drawn = clamp((progress - .07) / .83);
    scribble.style.opacity = drawn > 0 ? '1' : '0';
    scribble.style.strokeDashoffset = String(1 - drawn);
    hint.style.opacity = String(1 - clamp(progress * 5));
    phrases.forEach((phrase, index) => {
      const reveal = clamp((progress - .12 - index * .15) / .3);
      phrase.style.opacity = String(reveal);
      phrase.style.transform = reduce.matches ? 'none' : `translate(${(1 - reveal) * (-22 + index * 8)}px, ${(1 - reveal) * (14 - index * 4)}px) rotate(${(1 - rest) * (index % 2 ? 2 : -2)}deg)`;
    });
    beads.forEach(({ element, group, index, tilt }) => {
      const appear = clamp((progress - .12 - group * .15 - index * .006) / .16);
      element.style.opacity = String(appear);
      element.style.transform = reduce.matches ? 'none' : `translateY(${(1 - appear) * (index % 2 ? -9 : 10)}px) rotate(${tilt + (1 - rest) * (index % 2 ? 4 : -4)}deg)`;
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
    const duration = 620;
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
        paint(1, ease, paperJolt * 3, paperJolt * -5);
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
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    handle.setPointerCapture(event.pointerId);
    state('pulling');
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId || busy) return;
    const dx = (event.clientX - drag.x) * 500 / size;
    const dy = (event.clientY - drag.y) * 500 / size;
    const distance = Math.hypot(dx, dy);
    if (distance <= 5 && !drag.moved) return;
    drag.moved = true;
    const amount = clamp(distance / 125);
    if (reduce.matches) {
      // Only the short piece of string follows the hand; the collage stays still.
      handle.style.left = `${(224 + clamp(dx, -28, 50)) / 5}%`;
      handle.style.top = `${(202 + clamp(dy, -28, 56)) / 3.4}%`;
      rope.setAttribute('d', `M156 106 Q195 160 ${224 + clamp(dx, -28, 50)} ${202 + clamp(dy, -28, 56)}`);
      progress = amount;
      return;
    }
    paint(amount, 0, clamp(dx * .18, -18, 24), clamp(dy * .15, -16, 18));
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

  // Paths and controls only become active after all the setup has succeeded.
  scribble.style.strokeDasharray = '1';
  scribble.style.strokeDashoffset = '1';
  paint(0, 0);
  controls.hidden = false;
  section.classList.add('corda-ready');
  state('idle');
})();

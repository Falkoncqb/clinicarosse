/**
 * Estética Rossé — Scrollytelling Engine 2.0 (Dual Chapter Architecture)
 * Secuencia de imágenes de video bidireccionales en Canvas y transición continua
 * al ritmo del scroll para Bloque 1 (Facial) y Bloque 2 (Cuerpo / Capilar)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Detección de movimiento reducido
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;
  motionQuery.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
  });

  // Curva de interpolación suave (Smoothstep)
  function smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  // Fábrica de Motores Scrollytelling independientes
  function createScrollyChapter(config) {
    const {
      wrapperId,
      canvasId,
      progressBarId,
      metaIndexId,
      metaDescId,
      framesDir,
      totalFrames,
      sectionsSelector
    } = config;

    const wrapper = document.getElementById(wrapperId);
    const canvas = document.getElementById(canvasId);
    if (!wrapper || !canvas) return null;

    const ctx = canvas.getContext('2d');
    const sections = wrapper.querySelectorAll(sectionsSelector);
    const progressBar = document.getElementById(progressBarId);
    const metaIndex = document.getElementById(metaIndexId);
    const metaDesc = document.getElementById(metaDescId);

    // Estado del motor
    const frames = new Array(totalFrames);
    let currentFrame = 0;
    let targetFrame = 0;
    let isTicking = false;
    let isVisible = true;

    // Generador de rutas
    function getFrameSrc(index) {
      const padIndex = String(index + 1).padStart(4, '0');
      return `${framesDir}/frame_${padIndex}.webp`;
    }

    // 1. Cargar primer frame de inmediato
    const firstImg = new Image();
    firstImg.src = getFrameSrc(0);
    firstImg.onload = () => {
      frames[0] = firstImg;
      drawFrame(0);
      loadRemaining();
    };

    function loadRemaining() {
      for (let i = 1; i < totalFrames; i++) {
        const img = new Image();
        img.src = getFrameSrc(i);
        img.onload = () => {
          frames[i] = img;
        };
        img.onerror = () => {
          frames[i] = frames[i - 1] || firstImg;
        };
      }
    }

    function drawFrame(frameIdx) {
      const idx = Math.max(0, Math.min(totalFrames - 1, Math.round(frameIdx)));
      const img = frames[idx] || frames[0] || firstImg;
      if (!img || !img.complete) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    function updateSections(progress) {
      sections.forEach((sec) => {
        const idx = parseInt(sec.dataset.index, 10);
        let opacity = 0;
        let translateY = 30;

        if (idx === 1) {
          if (progress <= 0.14) {
            opacity = 1;
            translateY = 0;
          } else if (progress < 0.26) {
            const t = smoothstep(0.14, 0.26, progress);
            opacity = 1 - t;
            translateY = -30 * t;
          } else {
            opacity = 0;
            translateY = -30;
          }
        } else if (idx === 2) {
          if (progress < 0.18) {
            opacity = 0;
            translateY = 30;
          } else if (progress < 0.28) {
            const t = smoothstep(0.18, 0.28, progress);
            opacity = t;
            translateY = 30 * (1 - t);
          } else if (progress <= 0.44) {
            opacity = 1;
            translateY = 0;
          } else if (progress < 0.54) {
            const t = smoothstep(0.44, 0.54, progress);
            opacity = 1 - t;
            translateY = -30 * t;
          } else {
            opacity = 0;
            translateY = -30;
          }
        } else if (idx === 3) {
          if (progress < 0.46) {
            opacity = 0;
            translateY = 30;
          } else if (progress < 0.56) {
            const t = smoothstep(0.46, 0.56, progress);
            opacity = t;
            translateY = 30 * (1 - t);
          } else if (progress <= 0.70) {
            opacity = 1;
            translateY = 0;
          } else if (progress < 0.80) {
            const t = smoothstep(0.70, 0.80, progress);
            opacity = 1 - t;
            translateY = -30 * t;
          } else {
            opacity = 0;
            translateY = -30;
          }
        } else if (idx === 4) {
          if (progress < 0.72) {
            opacity = 0;
            translateY = 30;
          } else if (progress < 0.82) {
            const t = smoothstep(0.72, 0.82, progress);
            opacity = t;
            translateY = 30 * (1 - t);
          } else {
            opacity = 1;
            translateY = 0;
          }
        }

        if (opacity > 0.005) {
          sec.style.visibility = 'visible';
          sec.style.opacity = opacity.toFixed(3);
          sec.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
          sec.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
        } else {
          sec.style.visibility = 'hidden';
          sec.style.opacity = '0';
          sec.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
          sec.style.pointerEvents = 'none';
        }
      });

      // Metadato dominante
      let dom = 1;
      if (progress < 0.24) dom = 1;
      else if (progress < 0.50) dom = 2;
      else if (progress < 0.76) dom = 3;
      else dom = 4;

      const currentSec = wrapper.querySelector(`.scrolly-section[data-index="${dom}"]`);
      if (currentSec) {
        if (metaIndex) metaIndex.textContent = `0${dom} / 04`;
        if (metaDesc) metaDesc.textContent = currentSec.dataset.meta || '';
      }
    }

    function renderLoop() {
      if (!isVisible) {
        isTicking = false;
        return;
      }

      if (prefersReducedMotion) {
        currentFrame = targetFrame;
        drawFrame(currentFrame);
        updateSections(currentFrame / (totalFrames - 1));
        isTicking = false;
        return;
      }

      currentFrame += (targetFrame - currentFrame) * 0.075;
      drawFrame(currentFrame);

      const norm = currentFrame / (totalFrames - 1);
      updateSections(norm);

      const delta = Math.abs(targetFrame - currentFrame);
      if (delta > 0.02) {
        requestAnimationFrame(renderLoop);
      } else {
        currentFrame = targetFrame;
        drawFrame(currentFrame);
        updateSections(currentFrame / (totalFrames - 1));
        isTicking = false;
      }
    }

    function onScroll(windowH) {
      const rect = wrapper.getBoundingClientRect();
      const maxScroll = rect.height - windowH;
      if (maxScroll <= 0) return;

      const dist = -rect.top;
      let progress = dist / maxScroll;
      progress = Math.max(0, Math.min(1, progress));

      targetFrame = progress * (totalFrames - 1);

      if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
      }

      // Optimización: solo animar si el contenedor está dentro o cerca de la ventana visible
      const isNearby = rect.bottom >= -100 && rect.top <= windowH + 100;

      if (prefersReducedMotion) {
        currentFrame = targetFrame;
        drawFrame(currentFrame);
        updateSections(progress);
        return;
      }

      if (isNearby) {
        if (!isTicking && isVisible) {
          isTicking = true;
          requestAnimationFrame(renderLoop);
        }
      } else {
        currentFrame = targetFrame;
        drawFrame(currentFrame);
        updateSections(progress);
      }
    }

    return {
      onScroll,
      setVisibility: (v) => { isVisible = v; }
    };
  }

  // Instanciar los dos bloques de Scrollytelling
  const chapter1 = createScrollyChapter({
    wrapperId: 'scrolly-wrapper-1',
    canvasId: 'video-canvas-1',
    progressBarId: 'progress-bar-1',
    metaIndexId: 'current-section-index-1',
    metaDescId: 'current-section-desc-1',
    framesDir: 'frames',
    totalFrames: 160,
    sectionsSelector: '.scrolly-section'
  });


  function handleScrollAll() {
    const h = window.innerHeight;
    if (chapter1) chapter1.onScroll(h);
  }

  window.addEventListener('scroll', handleScrollAll, { passive: true });
  window.addEventListener('resize', handleScrollAll, { passive: true });

  document.addEventListener('visibilitychange', () => {
    const isVis = !document.hidden;
    if (chapter1) chapter1.setVisibility(isVis);
    if (isVis) handleScrollAll();
  });

  // Navegación suave por anclas (#section-X)
  document.querySelectorAll('a[href^="#section-"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      const targetSec = document.querySelector(targetId);
      if (!targetSec) return;

      const wrapper = targetSec.closest('.scrolly-container');
      if (!wrapper) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const secIndex = parseInt(targetSec.dataset.index, 10);
      const rect = wrapper.getBoundingClientRect();
      const maxScroll = wrapper.offsetHeight - window.innerHeight;

      // Puntos de anclaje óptimos para cada sección dentro de su wrapper
      const targetPoints = [0.05, 0.36, 0.65, 0.92];
      const targetProgress = targetPoints[secIndex - 1] ?? 0;
      const targetScrollY = window.scrollY + rect.top + targetProgress * maxScroll;

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  });

  // Prevenir saltos de anclas '#' sin destino definido
  document.querySelectorAll('a[href="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
    });
  });

  // Carrusel: entrada por la izquierda y salida por la derecha cada 2 segundos.
  const slider = document.querySelector('.treatments-slider');
  if (slider) {
    const slides = [...slider.querySelectorAll('.treatment-slide')];
    const counter = slider.querySelector('.treatments-count');
    const pauseButton = slider.querySelector('[data-slide-pause]');
    let current = 0, paused = motionQuery.matches, hovered = false, focused = false, visible = false;
    let timer;
    const syncButton = () => {
      pauseButton.textContent = paused ? 'Reanudar' : 'Pausar';
      pauseButton.setAttribute('aria-pressed', String(paused));
    };
    const show = (index) => {
      const next = (index + slides.length) % slides.length;
      if (next === current) return;
      slides.forEach(slide => slide.classList.remove('is-leaving'));
      const outgoing = slides[current];
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
      outgoing.inert = true;
      outgoing.setAttribute('aria-hidden', 'true');
      current = next;
      slides[current].classList.add('is-active');
      slides[current].inert = false;
      slides[current].setAttribute('aria-hidden', 'false');
      counter.textContent = String(current + 1).padStart(2, '0') + ' / 04';
    };
    const schedule = () => {
      clearInterval(timer);
      if (!paused && !hovered && !focused && visible && !document.hidden)
        timer = setInterval(() => show(current + 1), 2000);
    };
    slider.querySelector('[data-slide-prev]').addEventListener('click', () => { show(current - 1); schedule(); });
    slider.querySelector('[data-slide-next]').addEventListener('click', () => { show(current + 1); schedule(); });
    pauseButton.addEventListener('click', () => { paused = !paused; syncButton(); schedule(); });
    slider.addEventListener('mouseenter', () => { hovered = true; schedule(); });
    slider.addEventListener('mouseleave', () => { hovered = false; schedule(); });
    slider.addEventListener('focusin', () => { focused = true; schedule(); });
    slider.addEventListener('focusout', event => { focused = slider.contains(event.relatedTarget); schedule(); });
    document.addEventListener('visibilitychange', schedule);
    motionQuery.addEventListener('change', event => { paused = event.matches; syncButton(); schedule(); });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: 0.2 }).observe(slider);
    syncButton();
  }

  // Inicializar estado inicial
  handleScrollAll();

  // Asegurar reproducción del video de fondo de radiofrecuencia (sin audio)
  const rfVideo = document.getElementById('rf-video') || document.querySelector('.rf-bg-video');
  if (rfVideo) {
    rfVideo.muted = true;
    rfVideo.defaultMuted = true;
    const playPromise = rfVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const tryPlay = () => {
          rfVideo.play().catch(() => {});
        };
        window.addEventListener('scroll', tryPlay, { once: true, passive: true });
        window.addEventListener('click', tryPlay, { once: true });
      });
    }
  }
});

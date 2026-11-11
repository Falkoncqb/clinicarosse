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

  // --------------------------------------------------------------------------
  // HERO: Scroll Normal, Imagen Fija y Sincronización de Menú / Metadatos
  // --------------------------------------------------------------------------
  const heroWrapper = document.getElementById('hero-wrapper-1');
  const heroSections = document.querySelectorAll('.hero-flow-section');
  const navLinks = document.querySelectorAll('.nav-menu .nav-link');
  const heroProgressBar = document.getElementById('progress-bar-1');
  const metaIndex1 = document.getElementById('current-section-index-1');
  const metaDesc1 = document.getElementById('current-section-desc-1');

  function updateHeroOnScroll() {
    if (!heroWrapper || !heroSections.length) return;
    const rect = heroWrapper.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Progreso del Hero durante el scroll normal
    const totalDist = heroWrapper.offsetHeight - windowH;
    if (totalDist > 0) {
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalDist));
      if (heroProgressBar) {
        heroProgressBar.style.width = `${(progress * 100).toFixed(1)}%`;
      }
    }

    // Identificar si estamos dentro del Hero o más abajo
    const servicesBlock = document.getElementById('scrolly-wrapper-2');
    const servicesRect = servicesBlock ? servicesBlock.getBoundingClientRect() : null;

    if (servicesRect && servicesRect.top <= windowH * 0.45) {
      // El usuario ya avanzó a la segunda sección: quitar activo del menú hero
      navLinks.forEach((link) => link.classList.remove('active'));
      return;
    }

    // Identificar la sección dominante en pantalla dentro del Hero
    const threshold = windowH * 0.45;
    let activeSec = heroSections[0];

    heroSections.forEach((sec) => {
      const sRect = sec.getBoundingClientRect();
      if (sRect.top <= threshold && sRect.bottom >= threshold) {
        activeSec = sec;
      }
    });

    if (activeSec) {
      const idx = activeSec.dataset.index;
      const meta = activeSec.dataset.meta;
      const id = activeSec.id;

      // Actualizar metadatos inferiores del Hero
      if (metaIndex1) metaIndex1.textContent = `0${idx} / 04`;
      if (metaDesc1) metaDesc1.textContent = meta || '';

      // Actualizar clase 'active' en el menú de navegación superior
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  function handleScrollAll() {
    updateHeroOnScroll();
  }

  window.addEventListener('scroll', handleScrollAll, { passive: true });
  window.addEventListener('resize', handleScrollAll, { passive: true });

  // Navegación suave por anclas (#section-X, #scrolly-wrapper-2, etc.)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') {
      anchor.addEventListener('click', (e) => e.preventDefault());
      return;
    }

    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSec = document.querySelector(href);
      if (!targetSec) return;

      const navHeight = 80;
      const targetTop = targetSec.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({
        top: Math.max(0, targetTop),
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

  // Inicializar estado inicial
  handleScrollAll();

  // Control de audio y reproducción inteligente para los videos clínicos (video1 y video2)
  const videoCards = document.querySelectorAll('.video-card');
  const allVideos = document.querySelectorAll('.showcase-video');

  videoCards.forEach((card) => {
    const video = card.querySelector('.showcase-video');
    const audioBtn = card.querySelector('.video-audio-btn');
    if (!video) return;

    // Estado inicial: silenciado para cumplir con la política de autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const updateAudioButton = () => {
      if (!audioBtn) return;
      if (video.muted) {
        audioBtn.classList.add('is-muted');
        audioBtn.setAttribute('aria-label', 'Activar sonido');
        audioBtn.setAttribute('title', 'Activar sonido');
        const textSpan = audioBtn.querySelector('.audio-btn-text');
        if (textSpan) textSpan.textContent = 'Activar sonido';
      } else {
        audioBtn.classList.remove('is-muted');
        audioBtn.setAttribute('aria-label', 'Silenciar video');
        audioBtn.setAttribute('title', 'Silenciar video');
        const textSpan = audioBtn.querySelector('.audio-btn-text');
        if (textSpan) textSpan.textContent = 'Silenciar';
      }
    };

    // Al pulsar el botón de audio
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        if (video.muted) {
          // Silenciar el otro video para que no se mezclen los audios
          allVideos.forEach((v) => {
            if (v !== video) {
              v.muted = true;
              const otherBtn = v.closest('.video-card')?.querySelector('.video-audio-btn');
              if (otherBtn) {
                otherBtn.classList.add('is-muted');
                const tSpan = otherBtn.querySelector('.audio-btn-text');
                if (tSpan) tSpan.textContent = 'Activar sonido';
              }
            }
          });

          video.muted = false;
          video.play().catch(() => {});
        } else {
          video.muted = true;
        }
        updateAudioButton();
      });
    }

    // Al hacer click directamente en el video (pausar o reanudar)
    video.addEventListener('click', () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });

    updateAudioButton();
  });

  // Pausar y silenciar automáticamente si el video sale de la pantalla
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
          if (!video.muted) {
            video.muted = true;
            const audioBtn = video.closest('.video-card')?.querySelector('.video-audio-btn');
            if (audioBtn) {
              audioBtn.classList.add('is-muted');
              const tSpan = audioBtn.querySelector('.audio-btn-text');
              if (tSpan) tSpan.textContent = 'Activar sonido';
            }
          }
        }
      });
    }, { threshold: 0.25 });

    allVideos.forEach((video) => videoObserver.observe(video));
  } else {
    allVideos.forEach((video) => video.play().catch(() => {}));
  }
});

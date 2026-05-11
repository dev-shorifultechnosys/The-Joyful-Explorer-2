(() => {
  const nav = document.getElementById('mainNav');
  const navCollapse = document.getElementById('navbarMenu');
  const year = document.getElementById('year');
  const heroSlides = Array.from(document.querySelectorAll('.hero-bg'));
  const pauseButton = document.getElementById('pauseHero');
  const counters = Array.from(document.querySelectorAll('[data-count]'));
  const revealItems = Array.from(document.querySelectorAll('.reveal-up'));
  const cityButtons = Array.from(document.querySelectorAll('.city-chip'));
  const atlasFeature = document.querySelector('.atlas-feature');
  const atlasImage = document.querySelector('.atlas-feature img');
  const atlasTitle = document.querySelector('.atlas-overlay h3');
  const subscribeForm = document.getElementById('subscribeForm');
  const videoForm = document.getElementById('videoLinkForm');
  const videoInput = document.getElementById('videoLinkInput');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoButtons = Array.from(document.querySelectorAll('.video-playlist button'));

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const updateNavState = () => {
    if (!nav) return;
    nav.classList.toggle('nav-scrolled', window.scrollY > 24);
  };

  window.addEventListener('scroll', updateNavState, { passive: true });
  updateNavState();

  if (navCollapse) {
    navCollapse.addEventListener('show.bs.collapse', () => nav.classList.add('menu-active'));
    navCollapse.addEventListener('hidden.bs.collapse', () => nav.classList.remove('menu-active'));

    navCollapse.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        const collapse = bootstrap.Collapse.getInstance(navCollapse);
        if (collapse) collapse.hide();
      });
    });
  }

  let slideIndex = 0;
  let slideshowPaused = false;
  let slideshowTimer;

  const showSlide = index => {
    heroSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  };

  const startSlideshow = () => {
    if (!heroSlides.length) return;
    clearInterval(slideshowTimer);
    slideshowTimer = setInterval(() => {
      if (slideshowPaused) return;
      slideIndex = (slideIndex + 1) % heroSlides.length;
      showSlide(slideIndex);
    }, 5200);
  };

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      slideshowPaused = !slideshowPaused;
      pauseButton.innerHTML = slideshowPaused ? '<i class="bi bi-play-fill"></i>' : '<i class="bi bi-pause-fill"></i>';
      pauseButton.setAttribute('aria-label', slideshowPaused ? 'Play slideshow' : 'Pause slideshow');
    });
  }

  startSlideshow();

  const runCounter = counter => {
    const target = Number(counter.getAttribute('data-count') || 0);
    const duration = 1100;
    const start = performance.now();

    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      counter.textContent = value;
      if (progress < 1) requestAnimationFrame(tick);
      else counter.textContent = target;
    };

    requestAnimationFrame(tick);
  };

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  revealItems.forEach(item => revealObserver.observe(item));

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  const cityDescriptions = {
    Paris: 'Walks, small cafés, bridges, evening light, and the notes that come after a long day.',
    Kyoto: 'Quiet lanes, morning tea, temple paths, soft rain, and the kind of calm that makes time feel slower.',
    Lima: 'Cliff walks, ocean air, bright food, old streets, and the feeling of arriving somewhere layered.',
    London: 'Grey skies, long walks, bookshops, parks, and the small city details that stay after the trip.',
    Santorini: 'White walls, blue water, late sunsets, slow breakfasts, and days that seem to glow at the edges.',
    Marrakesh: 'Courtyards, warm color, market sounds, mint tea, and streets that pull you deeper with every turn.'
  };

  cityButtons.forEach(button => {
    button.addEventListener('click', () => {
      cityButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');

      const city = button.dataset.city;
      const img = button.dataset.img;

      if (!atlasFeature || !atlasImage || !atlasTitle) return;

      atlasFeature.classList.add('updating');
      setTimeout(() => {
        atlasImage.src = img;
        atlasImage.alt = `${city} travel memory image`;
        atlasTitle.textContent = city;
        const paragraph = atlasFeature.querySelector('.atlas-overlay p');
        if (paragraph) paragraph.textContent = cityDescriptions[city] || cityDescriptions.Paris;
        atlasFeature.classList.remove('updating');
      }, 180);
    });
  });


  const getVideoEmbed = rawUrl => {
    if (!rawUrl) return null;
    let url;
    try {
      url = new URL(rawUrl.trim());
    } catch (error) {
      return null;
    }

    const host = url.hostname.replace('www.', '').toLowerCase();
    const path = url.pathname;

    if (host.includes('youtube.com')) {
      let id = url.searchParams.get('v');
      if (!id && path.startsWith('/shorts/')) id = path.split('/shorts/')[1]?.split('/')[0];
      if (!id && path.startsWith('/embed/')) id = path.split('/embed/')[1]?.split('/')[0];
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}` };
    }

    if (host.includes('youtu.be')) {
      const id = path.replace('/', '').split('?')[0];
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}` };
    }

    if (host.includes('vimeo.com')) {
      const parts = path.split('/').filter(Boolean);
      const id = parts.pop();
      if (id && /^\d+$/.test(id)) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}` };
      if (host.includes('player.vimeo.com')) return { type: 'iframe', src: rawUrl.trim() };
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url.href)) {
      return { type: 'video', src: url.href };
    }

    return { type: 'iframe', src: url.href };
  };

  const loadVideo = rawUrl => {
    if (!videoPlayer) return false;
    const embed = getVideoEmbed(rawUrl);
    if (!embed) {
      videoPlayer.innerHTML = `
        <div class="video-placeholder">
          <i class="bi bi-exclamation-circle"></i>
          <h3>Video link not found</h3>
          <p>Please paste a full YouTube, Vimeo, MP4, WebM, or OGG video URL.</p>
        </div>`;
      return false;
    }

    if (embed.type === 'video') {
      videoPlayer.innerHTML = `<video controls playsinline src="${embed.src}"></video>`;
    } else {
      videoPlayer.innerHTML = `<iframe src="${embed.src}" title="The Joyful Explorer travel video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
    return true;
  };

  if (videoForm && videoInput) {
    videoForm.addEventListener('submit', event => {
      event.preventDefault();
      const loaded = loadVideo(videoInput.value);
      if (loaded) {
        videoButtons.forEach(button => button.classList.remove('active'));
      }
    });
  }

  videoButtons.forEach(button => {
    button.addEventListener('click', () => {
      const videoUrl = button.dataset.video;
      if (!videoUrl) return;
      loadVideo(videoUrl);
      videoButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      if (videoInput) videoInput.value = videoUrl;
    });
  });


  const sectionIds = ['home', 'journal', 'cities', 'restaurants', 'photos', 'videos', 'thoughts'];
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  const activeNavObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sectionIds.forEach(id => {
    const section = document.getElementById(id);
    if (section) activeNavObserver.observe(section);
  });

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', event => {
      event.preventDefault();
      const button = subscribeForm.querySelector('button');
      const input = subscribeForm.querySelector('input');
      if (!button || !input) return;
      button.textContent = 'Saved';
      input.value = '';
      setTimeout(() => {
        button.textContent = 'Subscribe';
      }, 1800);
    });
  }
})();

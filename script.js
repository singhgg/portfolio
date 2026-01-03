// ================= REGISTER PLUGINS =================
gsap.registerPlugin(ScrollTrigger);

// ================= THREE.JS BACKGROUND (IMAGE SHADER) =================
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// -- TEXTURE LOADER --
const loader = new THREE.TextureLoader();
// Using 'bgimg.png' as requested for the background distortion
const texture = loader.load('bgimg.png');

// -- CUSTOM SHADER MATERIAL --
// This creates the "water ripple" / "heat haze" effect driven by mouse movement
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uTexture: { value: texture },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform sampler2D uTexture;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      // Calculate distance from mouse for interaction
      float dist = distance(uv, uMouse);
      
      // Ripple strength based on mouse distance (closer = stronger)
      float mouseRipple = 0.0;
      if(dist < 0.3) {
        mouseRipple = sin(dist * 20.0 - uTime * 5.0) * (0.3 - dist) * 0.1;
      }
      
      // Gentle automatic wave pattern
      float wave = sin(uv.y * 10.0 + uTime) * 0.005 + cos(uv.x * 10.0 + uTime * 0.5) * 0.005;
      
      // Apply distortions to UV coordinates
      uv.x += wave + mouseRipple;
      uv.y += wave + mouseRipple;
      
      vec4 color = texture2D(uTexture, uv);
      
      // Darken slightly for better text readability
      gl_FragColor = vec4(color.rgb * 0.7, 1.0); 
    }
  `
});

// Fullscreen Plane
// We scale it to cover the view comfortably
const geometry = new THREE.PlaneGeometry(35, 20);
const plane = new THREE.Mesh(geometry, shaderMaterial);
scene.add(plane);

camera.position.z = 5;

// -- MOUSE INTERACTION --
let mouseXRel = 0;
let mouseYRel = 0;

document.addEventListener('mousemove', (event) => {
  const x = event.clientX / window.innerWidth;
  const y = 1.0 - (event.clientY / window.innerHeight);

  // Parallax movement variables
  mouseXRel = (event.clientX - window.innerWidth / 2) * 0.001;
  mouseYRel = (event.clientY - window.innerHeight / 2) * 0.001;

  // Update Shader Uniform
  shaderMaterial.uniforms.uMouse.value.set(x, y);
});

const clock = new THREE.Clock();

function tick() {
  const elapsedTime = clock.getElapsedTime();

  shaderMaterial.uniforms.uTime.value = elapsedTime;

  // Gentle Parallax for the plane
  plane.rotation.x = mouseYRel * 0.1;
  plane.rotation.y = mouseXRel * 0.1;

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

// ================= INTRO LOADER =================
// Handles the "Press to Start" interaction and loading bar
const intro = document.getElementById('intro');
const introText = document.getElementById('introText');
const loadingFill = document.getElementById('loadingFill');

let isStarted = false;

intro.addEventListener('click', () => {
  if (isStarted) return; // Prevent double clicks
  isStarted = true;

  introText.innerText = "INITIALIZING...";
  introText.classList.remove('glitch'); // Stop glitching while loading

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 1;
    if (progress > 100) progress = 100;

    loadingFill.style.width = `${progress}%`;

    if (progress === 100) {
      clearInterval(interval);

      // GSAP Animation
      const tl = gsap.timeline();

      tl.to(introText, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        delay: 0.2
      })
        .to('.loading-bar', {
          width: 0,
          opacity: 0,
          duration: 0.5
        }, "-=0.3")
        .to(intro, {
          y: '-100%',
          duration: 1,
          ease: 'power4.inOut',
          onComplete: () => {
            document.body.classList.remove('loading');
            initScrollAnimations();
          }
        });
    }
  }, 30);
});


// ================= SMOOTH SCROLL (LENIS) =================
const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);


// ================= GSAP SCROLL ANIMATIONS =================
function initScrollAnimations() {

  // Hero Parallax
  gsap.to('.hero-title', {
    yPercent: 50,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  // Manifesto Text Reveal
  gsap.utils.toArray('.reveal-text').forEach((text) => {
    gsap.to(text, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: text,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  // Gallery Cards 3D Flip In
  gsap.from('.work-card', {
    y: 100,
    opacity: 0,
    rotateX: -15,
    stagger: 0.2, // Sequential entry
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.gallery-grid',
      start: 'top 75%'
    }
  });


  // ================= PROCESS SECTION LOGIC =================
  // Handles the horizontal scroll on desktop vs vertical on mobile
  const track = document.querySelector('.process-track');
  const progressBar = document.querySelector('.progress-bar');

  ScrollTrigger.matchMedia({
    // Desktop: Horizontal Scroll (Pin & Slide)
    "(min-width: 769px)": function () {
      if (!track) return;

      // Calculate distance to scroll: (Content Width - Viewport Width)
      const scrollAmount = track.scrollWidth - window.innerWidth + window.innerWidth * 0.1;

      gsap.to(track, {
        x: -scrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: ".process",
          start: "top top",
          end: "+=" + scrollAmount,
          pin: true, // PIN section during scroll
          scrub: 1,  // Link animation to scroll bar
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Update progress bar
            if (progressBar) {
              gsap.to(progressBar, { width: `${self.progress * 100}%`, ease: 'none', duration: 0.1 });
            }

            // Highlight cards as they pass center of screen
            document.querySelectorAll('.step-card').forEach((card) => {
              const rect = card.getBoundingClientRect();
              const center = window.innerWidth / 2;

              // If card is near center
              if (rect.left < center + 300 && rect.right > center - 300) {
                card.classList.add('active');
              } else {
                card.classList.remove('active');
              }
            });
          }
        }
      });
    },

    // Mobile: Simple updates (Vertical Stack)
    "(max-width: 768px)": function () {
      ScrollTrigger.create({
        trigger: '.process',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          // Simple progress bar fill based on vertical scroll
          if (progressBar) {
            gsap.to(progressBar, { width: `${self.progress * 100}%`, ease: 'none', duration: 0.1 });
          }
        }
      });
    }
  });

  // System Specs Entrance Animation
  const specsTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.system-specs',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  });

  specsTl.from('.hud-container', {
    scale: 0.9,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  })
    .from('.avatar-ph', {
      x: -50,
      opacity: 0,
      duration: 0.6
    }, "-=0.4")
    .from('.stat-row', {
      x: 50,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6
    }, "-=0.4")
    .from('.description-box', {
      y: 20,
      opacity: 0,
      duration: 0.6
    }, "-=0.2");

  // System Specs XP Bar Animation (Existing but tweaked start to match)
  gsap.from('.xp-bar', {
    width: '0%',
    duration: 1.5,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.system-specs',
      start: 'top 80%'
    }
  });

  // Arsenal "Zero Gravity" Parallax & Floating
  const chips = gsap.utils.toArray('.skill-chip');

  chips.forEach((chip, i) => {
    // 1. Random Float Animation (Yoyo sine wave)
    // Random duration between 2 and 4 seconds
    // Random delay so they don't sync
    gsap.to(chip, {
      y: "random(-10, 10)",
      duration: "random(2, 4)",
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: i * 0.2 // slight initial offset
    });

    // 2. Parallax Scroll Effect
    // Some move faster, some slower against the scroll
    const speed = Math.random() < 0.5 ? 50 : -50;

    gsap.fromTo(chip,
      { yPercent: 0 },
      {
        yPercent: () => Math.random() * speed, // Random parallax distance
        ease: "none",
        scrollTrigger: {
          trigger: '.skills-grid',
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      }
    );
  });
}



// ================= INTERACTIVE ELEMENTS =================

// 3D Tilt Effect for Cards
document.querySelectorAll('.tilt-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
  });
});

// Magnetic Buttons
document.querySelectorAll('.magnetic-btn').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    btn.children[0].style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
    btn.children[0].style.transform = 'translate(0, 0)';
  });
});

// Form Email Obfuscation
// Hides email from static source code
const contactForm = document.querySelector('.contact form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    const user = 'dhanwanthworks';
    const domain = 'gmail.com';
    this.action = `https://formsubmit.co/${user}@${domain}`;
  });
}

// Glitch Effect Randomizer
const glitchText = document.querySelector('.glitch');
if (glitchText) {
  setInterval(() => {
    glitchText.classList.add('active');
    setTimeout(() => glitchText.classList.remove('active'), 200);
  }, 3000);
}

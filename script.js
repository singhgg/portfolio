/* ================= INITIAL STATE ================= */
document.body.classList.add("loading-active");

/* ================= INTRO LOGIC ================= */
const intro = document.getElementById("intro");
const introText = document.getElementById("introText");
const loadingBar = document.getElementById("loadingBar");
const loadingFill = document.getElementById("loadingFill");

let started = false;

intro.addEventListener("click", () => {
  if(started) return;
  started = true;

  introText.textContent = "LOADING...";
  loadingBar.style.opacity = "1";

  let progress = 0;
  const loader = setInterval(() => {
    progress += Math.random() * 12;
    loadingFill.style.width = progress + "%";

    if(progress >= 100){
      clearInterval(loader);

      intro.style.opacity = "0";
      intro.style.pointerEvents = "none";

      document.body.classList.remove("loading-active");
      document.body.classList.add("loaded");
    }
  }, 120);
});

/* ================= RESUME BUTTON ANIMATION ================= */
const resumeBtn = document.getElementById("resumeBtn");

resumeBtn.addEventListener("click", () => {
  resumeBtn.classList.add("downloading");
  resumeBtn.textContent = "DOWNLOADING...";

  setTimeout(() => {
    resumeBtn.textContent = "DOWNLOAD RESUME";
    resumeBtn.classList.remove("downloading");
  }, 2000);
});

/* ================= CARD STACK SCROLL ================= */
const cardStack = document.getElementById("cardStack");

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        cardStack.classList.add("expanded");
      } else {
        cardStack.classList.remove("expanded");
      }
    });
  },
  { threshold: 0.5 }
);

observer.observe(cardStack);

/* ================= EMAILJS ================= */
(function(){
  emailjs.init("YOUR_PUBLIC_KEY"); // 🔴 replace
})();

const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

form.addEventListener("submit", function(e){
  e.preventDefault();

  status.textContent = "Sending mission request...";

  emailjs.sendForm(
    "YOUR_SERVICE_ID",   // 🔴 replace
    "YOUR_TEMPLATE_ID",  // 🔴 replace
    this
  ).then(() => {
    status.textContent = "Mission request sent successfully 🚀";
    form.reset();
  }, () => {
    status.textContent = "Something went wrong. Try again.";
  });
});

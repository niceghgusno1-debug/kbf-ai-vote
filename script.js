const VOTE_DEADLINE = new Date("2026-06-11T23:59:59+09:00");
const SUPABASE_URL = "https://zluujdtbwddlnttrkhiz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdXVqZHRid2RkbG50dHJraGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzQxMDgsImV4cCI6MjA5NjUxMDEwOH0.DIn32l1DS88Kxghz5t8btMOEDbqrkIXEKyIiZPy1kYk";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_VOTES = 3;

function goToPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);

  if (!targetPage) {
    console.error(`Page not found: ${pageId}`);
    return;
  }

  targetPage.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function openLuxuryInvitation() {
  goToPage("pageHero2");

  setTimeout(() => {
    goToPage("pageHero3");
  }, 650);

  setTimeout(() => {
    goToPage("pageInvitation");
  }, 1400);
}

async function loadCandidates() {
  try {
    const response = await fetch("candidates.json");

    if (!response.ok) {
      throw new Error("candidates.json 파일을 불러오지 못했습니다.");
    }

    const candidates = await response.json();

    const container = document.getElementById("candidate-list");
    container.innerHTML = "";

    candidates.forEach((candidate, index) => {
      const card = document.createElement("div");
      card.className = "candidate-card";

      card.innerHTML = `
        <label class="candidate-main">
          <input type="checkbox" name="vote" value="${candidate.name}">
          <div class="candidate-number">${String(index + 1).padStart(2, "0")}</div>
          <div class="candidate-text">
            <h3>${candidate.name}</h3>
            <span>${candidate.english}</span>
            <p>${candidate.tagline}</p>
          </div>
        </label>

        <button class="detail-toggle" type="button">작명 이야기</button>

        <div class="candidate-detail">
          <p>${candidate.reason}</p>
          
        </div>
      `;

      const input = card.querySelector("input");
      const toggle = card.querySelector(".detail-toggle");
      const detail = card.querySelector(".candidate-detail");

      input.addEventListener("change", () => {
        const checked = document.querySelectorAll("input[name='vote']:checked");

        if (checked.length > MAX_VOTES) {
          input.checked = false;
          alert("최대 3개까지만 선택할 수 있습니다.");
          return;
        }

        card.classList.toggle("selected", input.checked);
        updateVoteCount();
      });

      toggle.addEventListener("click", () => {
        detail.classList.toggle("open");

        toggle.textContent = detail.classList.contains("open")
          ? "작명 이야기 닫기"
          : "작명 이야기 보기";
      });

      container.appendChild(card);
    });

    updateVoteCount();
  } catch (error) {
    console.error(error);
    alert("후보 데이터를 불러오지 못했습니다. candidates.json 파일을 확인해 주세요.");
  }
}

function updateVoteCount() {
  const count = document.querySelectorAll("input[name='vote']:checked").length;
  const voteCount = document.getElementById("voteCount");

  if (voteCount) {
    voteCount.textContent = `${count} / ${MAX_VOTES} 선택`;
  }
}

async function submitVote() {
  if (new Date() > VOTE_DEADLINE) {
  alert("투표가 마감되었습니다.");
  return;
}
  const selected = [...document.querySelectorAll("input[name='vote']:checked")]
    .map(input => input.value);

  if (selected.length !== MAX_VOTES) {
    alert(`후보 이름을 ${MAX_VOTES}개 선택해 주세요.`);
    return;
  }

  if (localStorage.getItem("kbf_ai_vote_done") === "yes") {
    alert("이미 투표가 완료되었습니다.");
    return;
  }

  const { error } = await supabaseClient
    .from("votes")
    .insert({
      selected_candidates: selected
    });

  if (error) {
    console.error(error);
    alert("투표 저장 중 오류가 발생했습니다.");
    return;
  }

  localStorage.setItem("kbf_ai_vote_done", "yes");
  localStorage.setItem("kbf_ai_vote", JSON.stringify(selected));

  goToPage("pageThankyou");
}

  
loadCandidates();

const heroImages = [
  "assets/hero-invitation1.png",
  "assets/hero-invitation2.png",
  "assets/hero-invitation3.png",
  "assets/hero-invitation4.png"
];

let startY = 0;
let currentStep = 0;

const heroPage = document.getElementById("pageHeroDrag");
const heroImage = document.getElementById("heroDragImage");

heroPage.addEventListener("touchstart", event => {
  startY = event.touches[0].clientY;
});

heroPage.addEventListener("touchmove", event => {
  const currentY = event.touches[0].clientY;
  const diff = startY - currentY;

  let step = 0;

  if (diff > 40) step = 1;
  if (diff > 100) step = 2;
  if (diff > 160) step = 3;

  if (step !== currentStep) {
    currentStep = step;
    heroImage.src = heroImages[currentStep];
    heroImage.classList.add("soft-change");

    setTimeout(() => {
      heroImage.classList.remove("soft-change");
    }, 250);
  }
});

heroPage.addEventListener("touchend", () => {
  if (currentStep >= 3) {
    goToPage("pageInvitation");
  } else {
    currentStep = 0;
    heroImage.src = heroImages[0];
  }
});

async function loadResults() {
  const password = document.getElementById("adminPassword").value.trim();
  const resultList = document.getElementById("result-list");

  resultList.innerHTML = "";

  const { data, error } = await supabaseClient.rpc("get_vote_results", {
    p_password: password
  });

  if (error) {
    console.error(error);
    alert("비밀번호가 틀렸거나 결과를 불러오지 못했습니다.");
    return;
  }

  if (!data || data.length === 0) {
    resultList.innerHTML = "<p class='empty-result'>아직 투표 결과가 없습니다.</p>";
    return;
  }

  resultList.innerHTML = data.map((row, index) => `
    <div class="result-card">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${row.candidate}</strong>
      <em>${row.vote_count}표</em>
    </div>
  `).join("");
}

async function resetVotes() {
  const password = document.getElementById("adminPassword").value.trim();

  if (!password) {
    alert("비밀번호를 입력해 주세요.");
    return;
  }

  if (!confirm("정말 모든 투표 결과를 초기화할까요?")) return;

  const { data, error } = await supabaseClient.rpc("reset_votes", {
    p_password: password
  });

  console.log("reset result", data, error);

  if (error) {
    alert(error.message);
    return;
  }

  localStorage.removeItem("kbf_ai_vote_done");
  localStorage.removeItem("kbf_ai_vote");

  alert("투표 결과가 초기화되었습니다.");
  loadResults();
}

let adminTapCount = 0;
let adminTapTimer = null;

document.addEventListener("click", event => {
  const activePage = document.querySelector(".page.active");

  if (!activePage || activePage.id !== "pageThankyou") return;

  const x = event.clientX;
  const y = event.clientY;

  const isBottomRight =
    x > window.innerWidth - 90 &&
    y > window.innerHeight - 90;

  if (!isBottomRight) return;

  adminTapCount++;

  clearTimeout(adminTapTimer);

  adminTapTimer = setTimeout(() => {
    adminTapCount = 0;
  }, 1800);

  if (adminTapCount >= 5) {
    adminTapCount = 0;
    goToPage("pageAdmin");
  }
});

let introAdminTapCount = 0;
let introAdminTimer = null;

document.addEventListener("click", () => {
  const activePage = document.querySelector(".page.active");

  if (!activePage) return;

  const isIntroPage =
    activePage.id === "pageHero1" ||
    activePage.id === "pageEnvelope" ||
    activePage.id === "pageHeroDrag";

  if (!isIntroPage) return;

  introAdminTapCount++;

  clearTimeout(introAdminTimer);

  introAdminTimer = setTimeout(() => {
    introAdminTapCount = 0;
  }, 3000);

  if (introAdminTapCount >= 10) {
    introAdminTapCount = 0;
    goToPage("pageAdmin");
  }
});

function updateCountdown() {
  const timer = document.getElementById("countdownTimer");
  if (!timer) return;

  const now = new Date();
  const diff = VOTE_DEADLINE - now;

  if (diff <= 0) {
    timer.textContent = "투표 마감";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  timer.textContent =
    `${days}일 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

function updateCountdown() {
  const diff = VOTE_DEADLINE - new Date();

  const daysEl = document.getElementById("countDays");
  const hoursEl = document.getElementById("countHours");
  const minutesEl = document.getElementById("countMinutes");
  const secondsEl = document.getElementById("countSeconds");

  if (!daysEl) return;

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = String(days).padStart(2, "0");
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}

setInterval(updateCountdown, 1000);
updateCountdown();
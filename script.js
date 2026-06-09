const MAX_VOTES = 3;

function goToPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadCandidates() {
  const response = await fetch("candidates.json");
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

      <button class="detail-toggle" type="button">추천 사유 보기</button>

      <div class="candidate-detail">
        <p>${candidate.reason}</p>
        <strong>추천인 : ${candidate.recommender}</strong>
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
        ? "추천 사유 닫기"
        : "추천 사유 보기";
    });

    container.appendChild(card);
  });

  updateVoteCount();
}

function updateVoteCount() {
  const count = document.querySelectorAll("input[name='vote']:checked").length;
  const voteCount = document.getElementById("voteCount");

  if (voteCount) {
    voteCount.textContent = `${count} / 3 선택`;
  }
}

function submitVote() {
  const selected = [...document.querySelectorAll("input[name='vote']:checked")]
    .map(input => input.value);

  if (selected.length !== 3) {
    alert("후보 이름을 3개 선택해 주세요.");
    return;
  }

  goToPage("pageThankyou");
}

loadCandidates();
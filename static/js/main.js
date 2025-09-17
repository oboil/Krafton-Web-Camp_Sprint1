import { washers, dryers, initMachineData } from "./WasherState.js";
import {
  openStartModal,
  openStopModal,
  confirmStart,
  confirmStop,
} from "./WasherEvent.js";
import { refreshData } from "./request.js";

// 세탁기·건조기 세트 정보 (id 매칭 + 성별 구분)
const sets = [
  { setId: 1, washerId: 1, dryerId: 1, gender: "male" },
  { setId: 2, washerId: 2, dryerId: 2, gender: "male" },
  { setId: 3, washerId: 3, dryerId: 3, gender: "male" },
  { setId: 4, washerId: 4, dryerId: 4, gender: "male" },
  { setId: 5, washerId: 5, dryerId: 5, gender: "male" },
  { setId: 6, washerId: 6, dryerId: 6, gender: "female" },
  { setId: 7, washerId: 7, dryerId: 7, gender: "female" },
];

// 상태별 배지 클래스와 텍스트
function getBadge(status) {
  switch (status) {
    case "available":
      return { cls: "bg-info", text: "사용가능" };
    case "running":
      return { cls: "bg-success", text: "가동중" };
    case "maintenance":
      return { cls: "bg-warning text-dark", text: "점검중" };
    default:
      return { cls: "bg-secondary", text: "알수없음" };
  }
}

// 버튼 HTML 생성
function getButtonHTML(status, type, id) {
  if (status === "available") {
    return `<button class="btn btn-info btn-machine" onclick="openStartModal(${id}, '${type}')">
              <i class="fas fa-play me-1"></i>시작
            </button>`;
  } else if (status === "running") {
    return `<button class="btn btn-dark btn-machine" onclick="openStopModal(${id}, '${type}')">
            <i class="fas fa-stop me-1"></i>중단
          </button>`;
  } else {
    return `<button class="btn btn-warning btn-machine text-dark" disabled>
              <i class="fas fa-tools me-1"></i>점검
            </button>`;
  }
}

// 시간 포맷팅
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// 선택된 성별에 따라 세트 렌더링
function renderMachineSets(containerId, selectedGender = "male") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  // 선택된 성별에 따라 필터링
  const filteredSets = sets.filter((set) => set.gender === selectedGender);

  filteredSets.forEach((set) => {
    const washer = washers[set.washerId] || { status: "available" };
    const dryer = dryers[set.dryerId] || { status: "available" };

    const wb = getBadge(washer.status);
    const db = getBadge(dryer.status);
    const columnClass =
      selectedGender === "male"
        ? "col-6 col-xl-2-4 male-set"
        : "col-6 female-set";

    container.innerHTML += createSetHTML(
      set.setId,
      set.washerId,
      set.dryerId,
      washer,
      dryer,
      wb,
      db,
      columnClass
    );
  });

  // UI 업데이트는 HTML이 추가된 후에 수행
  setTimeout(() => {
    filteredSets.forEach((set) => {
      if (typeof createDrumHoles === "function") {
        createDrumHoles(washers, "washer", set.washerId);
        createDrumHoles(dryers, "dryer", set.dryerId);
      }
    });
  }, 0);
}

// 세트 HTML 생성 함수 (세탁기 타이머 ID 버그 수정)
function createSetHTML(
  setId,
  washerId,
  dryerId,
  washer,
  dryer,
  wb,
  db,
  columnClass
) {
  return `
    <div class="${columnClass}">
      <div class="washer-dryer-set">
        <div class="set-header">
          <span><i class="fas fa-layer-group me-2"></i>세트 #${setId}</span>
        </div>
        <div class="machines-column">

          <!-- 건조기 -->
          <div class="machine ${dryer.status}" id="dryer${dryerId}">
            <span class="badge ${db.cls} status-badge">${db.text}</span>
            <div class="machine-visual dryer-visual">
              <div class="control-panel">
                <div class="display ${dryer.status}">
                  ${
                    dryer.status === "running"
                      ? "DRY"
                      : dryer.status === "maintenance"
                      ? "ERR"
                      : "OFF"
                  }
                </div>
              </div>
              <div class="drum-container dryer-drum">
                <div class="drum ${
                  dryer.status === "running" ? "spinning" : ""
                }" id="dryer-drum-${dryerId}">
                  ${
                    dryer.status === "running"
                      ? `<div class="heat active"></div><div class="clothes"></div><div class="clothes"></div><div class="clothes"></div>`
                      : `<div class="drum-holes" id="dryer-holes-${dryerId}"></div>`
                  }
                </div>
              </div>
            </div>
            <div class="machine-info">
              <div class="machine-title"><i class="fas fa-wind text-warning"></i>건조기</div>
              <div class="machine-status ${
                dryer.status === "available"
                  ? "text-info"
                  : dryer.status === "running"
                  ? "text-success"
                  : "text-warning"
              }">
                ${
                  dryer.status === "available"
                    ? "사용 가능"
                    : dryer.status === "running"
                    ? ""
                    : "점검 중"
                }
              </div>
              <div class="machine-timer" id="dryer-timer-${dryerId}" style="display:${
    dryer.status === "running" ? "block" : "none"
  };">
                ${
                  dryer.status === "running"
                    ? formatTime(dryer.remaining || 0)
                    : "00:00"
                }
              </div>
            </div>
            <div class="machine-controls">
              ${getButtonHTML(dryer.status, "dryer", dryerId)}
            </div>
          </div>

          <div class="connection-line"></div>

          <!-- 세탁기 (타이머 ID 수정) -->
          <div class="machine ${washer.status}" id="washer${washerId}">
            <span class="badge ${wb.cls} status-badge">${wb.text}</span>
            <div class="machine-visual washer-visual">
              <div class="control-panel">
                <div class="display ${washer.status}">
                  ${
                    washer.status === "running"
                      ? "RUN"
                      : washer.status === "maintenance"
                      ? "ERR"
                      : "OFF"
                  }
                </div>
              </div>
              <div class="drum-container washer-drum">
                <div class="drum ${
                  washer.status === "running" ? "spinning" : ""
                }" id="washer-drum-${washerId}">
                  ${
                    washer.status === "running"
                      ? `<div class="water active"></div><div class="clothes"></div><div class="clothes"></div><div class="clothes"></div>`
                      : `<div class="drum-holes" id="washer-holes-${washerId}"></div>`
                  }
                </div>
              </div>
            </div>
            <div class="machine-info">
              <div class="machine-title"><i class="fas fa-tint text-primary"></i>세탁기</div>
              <div class="machine-status ${
                washer.status === "available"
                  ? "text-info"
                  : washer.status === "running"
                  ? "text-success"
                  : "text-warning"
              }">
                ${
                  washer.status === "available"
                    ? "사용 가능"
                    : washer.status === "running"
                    ? ""
                    : "점검 중"
                }
              </div>
              <div class="machine-timer" id="washer-timer-${washerId}" style="display:${
    washer.status === "running" ? "block" : "none"
  };">
                ${
                  washer.status === "running"
                    ? formatTime(washer.remaining || 0)
                    : "00:00"
                }
              </div>
            </div>
            <div class="machine-controls">
              ${getButtonHTML(washer.status, "washer", washerId)}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// 성별 선택 이벤트 처리
function handleGenderChange() {
  const selectedGender = document.querySelector(
    'input[name="genderSelect"]:checked'
  ).value;
  renderMachineSets("machineSetContainer", selectedGender);
}

// 초기화 함수
async function initialize() {
  try {
    await initMachineData();

    // 초기 렌더링
    renderMachineSets("machineSetContainer", "male");

    console.log("Initialization complete:", { washers, dryers });
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

// ===== 전역 노출 =====
window.openStartModal = openStartModal;
window.openStopModal = openStopModal;
window.handleGenderChange = handleGenderChange;
window.confirmStart = confirmStart;
window.confirmStop = confirmStop;
window.initMachineData = initMachineData;
window.refreshData = refreshData;

// ===== 초기 실행 =====
// DOM 로드 시 초기화
document.addEventListener("DOMContentLoaded", initialize);

// 확인 버튼 이벤트 리스너
document
  .getElementById("confirmStartBtn")
  .addEventListener("click", confirmStart);
document
  .getElementById("confirmStopBtn")
  .addEventListener("click", confirmStop);

// Ajax 성공 시 UI 갱신
$(document).ajaxSuccess(function (event, xhr, settings) {
  if (settings.url.includes("5000/?sex=")) {
    const selectedGender = document.querySelector(
      'input[name="genderSelect"]:checked'
    ).value;
    renderMachineSets("machineSetContainer", selectedGender);
  }
});

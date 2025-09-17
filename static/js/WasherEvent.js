import {
  washers,
  dryers,
  updateMachineStatus,
  setMachineTimer,
  clearMachineTimer,
} from "./WasherState.js";
import { updateTimerDisplay, createDrumHoles } from "./WasherUI.js";
import { changeWasherUser, changeDryerUser, refreshData } from "./request.js";

let selectedType = "";
let selectedId = null;
let stopType = "";
let stopId = null;

/** 시작 모달 열기 */
export function openStartModal(id, type = "washer") {
  selectedType = type;
  selectedId = id;
  document.getElementById("inputUserName").value = "";
  document.getElementById("inputRoomNumber").value = "";
  document.getElementById("inputHours").value = "1";
  document.getElementById("inputMinutes").value = "0";
  const modal = new bootstrap.Modal(
    document.getElementById("startMachineModal")
  );
  modal.show();
}

/** 중단 모달 열기 */
export function openStopModal(id, type = "washer") {
  console.log("openStopModal");
  stopType = type;
  stopId = id;
  const modal = new bootstrap.Modal(
    document.getElementById("stopMachineModal")
  );
  modal.show();
}

/** 시작 확인 */
export function confirmStart() {
  const userName = document.getElementById("inputUserName")?.value.trim() || "";
  const roomNumber =
    document.getElementById("inputRoomNumber")?.value.trim() || "";
  const hours = parseInt(document.getElementById("inputHours")?.value) || 0;
  console.log(hours);
  const minutes = parseInt(document.getElementById("inputMinutes")?.value) || 0;
  console.log(minutes);
  const totalTime = hours * 60 + minutes;
  console.log(totalTime);

  if (!userName || !roomNumber || totalTime <= 0) {
    alert("모든 필드를 올바르게 입력해주세요.");
    return;
  }

  const store = selectedType === "washer" ? washers : dryers;

  // 1. 상태 즉시 업데이트
  store[selectedId] = {
    ...store[selectedId],
    userName,
    roomNumber,
    totalTime,
    remaining: totalTime,
    status: "running",
  };

  // 2. UI 즉시 업데이트 (지연 제거)
  updateMachineUI(selectedType, selectedId, store);
  startTimer(selectedType, selectedId);

  if (selectedId <= 5) {
    refreshData("남자");
  } else {
    refreshData("여자");
  }
  // 4. 모달 닫기
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("startMachineModal")
  );
  if (modal) modal.hide();

  // 5. API 호출 (비동기, UI와 독립적)
  const apiData = {
    id: selectedId,
    name: userName,
    roomNum: roomNumber,
    remain: totalTime,
  };
  (selectedType === "washer" ? changeWasherUser : changeDryerUser)(apiData)
    .then(() => console.log("API 호출 성공"))
    .catch((error) => console.error("API 오류:", error));

  if (selectedId <= 5) {
    refreshData("남자");
  } else {
    refreshData("여자");
  }
}

/** 중단 확인 */
export function confirmStop() {
  console.log("confirmStop");
  const store = stopType === "washer" ? washers : dryers;
  if (!store[stopId]) return;

  // 1. 타이머 즉시 중단
  if (store[stopId].timer) {
    clearInterval(store[stopId].timer);
    store[stopId].timer = null;
  }

  // 2. 상태 즉시 초기화
  store[stopId] = {
    ...store[stopId],
    status: "available",
    userName: 0,
    roomNumber: 0,
    remaining: 0,
    totalTime: 0,
  };

  // 3. UI 즉시 업데이트
  updateMachineUI(stopType, stopId, store);

  if (stopId <= 5) {
    refreshData("남자");
  } else {
    refreshData("여자");
  }

  // 5. 모달 닫기
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("stopMachineModal")
  );
  if (modal) modal.hide();
  console.log(store[stopId].userName, stopId);

  // 5. API 호출 (비동기, UI와 독립적)
  const apiData = {
    id: stopId,
    name: store[stopId].userName,
    roomNum: store[stopId].roomNumber,
    remain: store[stopId].totalTime,
  };
  (stopType === "washer" ? changeWasherUser : changeDryerUser)(apiData)
    .then(() => console.log("API 호출 성공"))
    .catch((error) => console.error("API 오류:", error));

  if (stopId <= 5) {
    refreshData("남자");
  } else {
    refreshData("여자");
  }
}

/** UI 즉시 반영 함수 */
function updateMachineUI(type, id, store) {
  const machineElement = document.querySelector(`#${type}${id}`);
  if (!machineElement) {
    console.error(`Machine element not found: ${type}${id}`);
    return;
  }

  const machine = machineElement.closest(".machine");
  if (!machine) {
    console.error(`Machine container not found for: ${type}${id}`);
    return;
  }

  // 상태 배지 업데이트
  const badge = machine.querySelector(".status-badge");
  if (badge) {
    if (store[id].status === "running") {
      badge.textContent = "가동중";
      badge.className = "badge bg-success status-badge";
    } else {
      badge.textContent = "사용가능";
      badge.className = "badge bg-info status-badge";
    }
  }

  // 상태 텍스트 업데이트 (이름과 호실 표시)
  const statusText = machine.querySelector(".machine-status");
  if (statusText) {
    if (store[id].status === "running") {
      statusText.textContent = `${store[id].userName} (${store[id].roomNumber}호)`;
      statusText.className = "machine-status text-success";
    } else {
      statusText.textContent = "사용 가능";
      statusText.className = "machine-status text-info";
    }
  }

  // 버튼 업데이트
  const button = machine.querySelector(".machine-controls button");
  if (button) {
    if (store[id].status === "running") {
      button.innerHTML = '<i class="fas fa-stop me-1"></i>중지';
      button.className = "btn btn-danger btn-machine";
      button.onclick = () => openStopModal(id, type);
    } else {
      button.innerHTML = '<i class="fas fa-play me-1"></i>시작';
      button.className = "btn btn-info btn-machine";
      button.onclick = () => openStartModal(id, type);
    }
  }

  // 타이머 표시
  const timerElement = document.getElementById(`${type}-timer-${id}`);
  if (timerElement) {
    if (store[id].status === "running") {
      timerElement.style.display = "block";
      updateTimerDisplay(store, type, id);
    } else {
      timerElement.style.display = "none";
      timerElement.textContent = "00:00";
    }
  }

  // 디스플레이 업데이트
  const display = machine.querySelector(".display");
  if (display) {
    if (store[id].status === "running") {
      display.textContent = type === "washer" ? "RUN" : "DRY";
      display.classList.add("running");
    } else {
      display.textContent = "OFF";
      display.classList.remove("running");
    }
  }

  // 드럼 애니메이션
  const drum = document.getElementById(`${type}-drum-${id}`);
  if (drum) {
    if (store[id].status === "running") {
      drum.classList.add("spinning");
      drum.innerHTML =
        type === "washer"
          ? `<div class="water active"></div><div class="clothes"></div><div class="clothes"></div><div class="clothes"></div><div class="drum-holes" id="${type}-holes-${id}"></div>`
          : `<div class="heat active"></div><div class="clothes"></div><div class="clothes"></div><div class="clothes"></div><div class="drum-holes" id="${type}-holes-${id}"></div>`;
    } else {
      drum.classList.remove("spinning");
      drum.innerHTML = `<div class="drum-holes" id="${type}-holes-${id}"></div>`;
    }
    createDrumHoles(store, type, id);
  }
}

/** 타이머 시작 */
export function startTimer(type, id) {
  const store = type === "washer" ? washers : dryers;

  if (store[id].timer) {
    clearInterval(store[id].timer);
    store[id].timer = null;
  }

  updateTimerDisplay(store, type, id);

  store[id].timer = setInterval(() => {
    if (store[id].remaining > 0) {
      store[id].remaining--;
      updateTimerDisplay(store, type, id);
    } else {
      clearInterval(store[id].timer);
      store[id].timer = null;

      // 자동 완료 처리
      store[id].status = "available";
      store[id].userName = "";
      store[id].roomNumber = "";
      store[id].remaining = 0;
      store[id].totalTime = 0;

      updateMachineUI(type, id, store);

      // 통계 업데이트
      if (id <= 5) {
        refreshData("남자");
      } else {
        refreshData("여자");
      }

      // API 호출
      const apiData = { id, name: "", roomNum: "", remain: 0 };
      (type === "washer" ? changeWasherUser : changeDryerUser)(apiData).catch(
        (error) => console.error("완료 API 오류:", error)
      );
    }
  }, 60000);
}

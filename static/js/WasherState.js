import { updateTimerDisplay } from "./WasherUI.js";
import { refreshData } from "./request.js";

// 세탁기/건조기 상태 저장 객체
export const washers = {};
export const dryers = {};

/**
 * 상태 변경
 * @param {Object} store - washers 또는 dryers
 * @param {number} id - 기계 id
 * @param {string} status - "available" / "running" / "maintenance"
 */
export function updateMachineStatus(store, id, status) {
  if (store[id]) store[id].status = status;
}

/**
 * 남은 시간 설정
 * @param {Object} store
 * @param {number} id
 * @param {number} minutes - 남은 시간(초)
 */
export function setMachineTimer(store, id, minutes) {
  if (store[id]) store[id].remaining = minutes;
}

/**
 * 타이머 해제
 * @param {Object} store
 * @param {number} id
 */
export function clearMachineTimer(store, id) {
  if (store[id] && store[id].timer) {
    clearInterval(store[id].timer);
    store[id].timer = null;
  }
}

/**
 * 사용자 정보/총 사용 시간 설정
 * @param {Object} store
 * @param {number} id
 * @param {Object} param2
 * @param {string} param2.userName
 * @param {string} param2.roomNumber
 * @param {number} param2.totalTime
 */
export function updateMachineInfo(
  store,
  id,
  { userName, roomNumber, totalTime }
) {
  if (!store[id]) return;
  store[id].userName = userName;
  store[id].roomNumber = roomNumber;
  store[id].totalTime = totalTime;
}

// /**
//  * 로컬 테스트용 초기 데이터 설정 (남자5, 여자2)
//  * DB 연동 전까지 사용
//  */
// export function initDummyData() {
//   // 남자 5대
//   for (let i = 1; i <= 5; i++) {
//     washers[i] = createMachineData(i, "남자");
//     dryers[i] = createMachineData(i, "남자");
//   }
//   // 여자 2대
//   for (let i = 6; i <= 7; i++) {
//     washers[i] = createMachineData(i, "여자");
//     dryers[i] = createMachineData(i, "여자");
//   }
// }

/**
 * DB 데이터로 초기화
 */
export async function initMachineData() {
  try {
    // 남자/여자 세탁기, 건조기 정보 가져오기
    const femaleMachines = await refreshData("여자");
    const maleMachines = await refreshData("남자");

    console.log("서버 응답:", { maleMachines, femaleMachines });

    // 기본 상태로 초기화
    [1, 2, 3, 4, 5].forEach((id) => {
      washers[id] = createDefaultMachine(id, "남자", "washer");
      dryers[id] = createDefaultMachine(id, "남자", "dryer");
    });
    [6, 7].forEach((id) => {
      washers[id] = createDefaultMachine(id, "여자", "washer");
      dryers[id] = createDefaultMachine(id, "여자", "dryer");
    });

    // 서버 데이터로 상태 업데이트
    if (maleMachines && Array.isArray(maleMachines.washers)) {
      maleMachines.washers.forEach((machine) => {
        if (washers[machine.id]) {
          updateMachineState(washers[machine.id], machine);
        }
      });
    }

    if (maleMachines && Array.isArray(maleMachines.dryers)) {
      maleMachines.dryers.forEach((machine) => {
        if (dryers[machine.id]) {
          updateMachineState(dryers[machine.id], machine);
        }
      });
    }

    // 여성 기계도 동일하게 처리
    if (femaleMachines && Array.isArray(femaleMachines.washers)) {
      femaleMachines.washers.forEach((machine) => {
        if (washers[machine.id]) {
          updateMachineState(washers[machine.id], machine);
        }
      });
    }

    if (femaleMachines && Array.isArray(femaleMachines.dryers)) {
      femaleMachines.dryers.forEach((machine) => {
        if (dryers[machine.id]) {
          updateMachineState(dryers[machine.id], machine);
        }
      });
    }

    console.log("초기화된 상태:", { washers, dryers });
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
}

function createDefaultMachine(id, sex, type) {
  return {
    id: id,
    sex: sex,
    type: type,
    status: "available",
    timer: null,
    remaining: 0,
    totalTime: 0,
    userName: "",
    roomNumber: "",
  };
}

function updateMachineState(machine, serverData) {
  machine.status = serverData.state === "good" ? "available" : "maintenance";
  machine.userName = serverData.name || "";
  machine.roomNumber = serverData.roomNum || "";
  machine.remaining = calculateRemaining(serverData.endTime);
}

function calculateRemaining(endTime) {
  if (!endTime) return 0;
  const remaining = new Date(endTime) - new Date();
  return remaining > 0 ? Math.floor(remaining / 1000) : 0;
}

// 내부 헬퍼: 초기 상태 객체 생성
function createMachineData(id, sex) {
  return {
    _id: id, // MongoDB의 _id와 호환 (숫자형)
    sex, // "남자" / "여자"
    name: "", // DB 연동 시 name 필드
    roomNum: "", // DB 연동 시 roomNum 필드
    endTime: null, // DB 연동 시 Date (ISO 문자열)

    status: "available", // 사용 가능 상태
    timer: null, // 프론트 전용 - setInterval 참조
    remaining: 0, // 프론트 전용 - 남은 시간(초)
    totalTime: 0, // 프론트 전용 - 총 사용 시간(초)
    userName: "", // 프론트 전용 표시용 이름
    roomNumber: "", // 프론트 전용 표시용 호실
  };
}

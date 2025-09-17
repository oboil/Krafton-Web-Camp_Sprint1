/**
 * 세탁기 사용자 변경시 사용
 */

import { washers, dryers } from "./WasherState.js";
import { updateTimerDisplay } from "./WasherUI.js";
function changeWasherUser({ id, name, roomNum, remain }) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `http://ec2-3-34-124-149.ap-northeast-2.compute.amazonaws.com:5000/washers`,
      type: "POST",
      data: { id, name, roomNum, remain },
      success: function (res) {
        console.log("Washer update response:", res);
        resolve(res);
      },
      error: function (err) {
        console.error("Washer update error:", err);
        reject(err);
      },
    });
  });
}

/**
 * 건조기 사용자 변경시 사용
 */
function changeDryerUser({ id, name, roomNum, remain }) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `http://ec2-3-34-124-149.ap-northeast-2.compute.amazonaws.com:5000/dryers`,
      type: "POST",
      data: { id, name, roomNum, remain },
      success: function (res) {
        console.log("Dryer update response:", res);
        resolve(res);
      },
      error: function (err) {
        console.error("Dryer update error:", err);
        reject(err);
      },
    });
  });
}

/**
 * 세탁기 상태 변경시 사용(정상 -> 비정상, 비정상 -> 정상)
 */
function changeWasherState({ id, state }) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `http://ec2-3-34-124-149.ap-northeast-2.compute.amazonaws.com:5000/washers`,
      type: "PATCH",
      data: { id, state }, // JSON 문자열로 변환
      success: function (res) {
        console.log("Washer state change response:", res);
        resolve(res);
      },
      error: function (err) {
        console.error("Washer state change error:", err);
        reject(err);
      },
    });
  });
}

/**
 * 건조기 상태 변경시 사용(정상 -> 비정상, 비정상 -> 정상)
 */
function changeDryerState({ id, state }) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `http://ec2-3-34-124-149.ap-northeast-2.compute.amazonaws.com:5000/dryers`,
      type: "PATCH",
      data: { id, state }, // JSON 문자열로 변환
      success: function (res) {
        console.log("Dryer state change response:", res);
        resolve(res);
      },
      error: function (err) {
        console.error("Dryer state change error:", err);
        reject(err);
      },
    });
  });
}

/**
 * 홈페이지 진입시 실행
 */
function refreshData(sex) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `http://ec2-3-34-124-149.ap-northeast-2.compute.amazonaws.com:5000/refresh?sex=${sex}`,
      type: "GET",
      dataType: "json",
      success: function (res) {
        console.log("API Response:", res);
        document.getElementById("washer-available").innerText =
          res["availableWasherCnt"];
        document.getElementById("washer-running").innerText =
          res["usingWasherCnt"];
        document.getElementById("washer-maintenance").innerText =
          res["notGoodWasherCnt"];
        document.getElementById("washer-next").innerText =
          res["washerMinimumRemainTime"];

        document.getElementById("dryer-available").innerText =
          res["availableDryerCnt"];
        document.getElementById("dryer-running").innerText =
          res["usingDryerCnt"];
        document.getElementById("dryer-maintenance").innerText =
          res["notGoodDryerCnt"];
        document.getElementById("dryer-next").innerText =
          res["dryerMinimumRemainTime"];

        if (sex === "남자") {
          for (let i of res["allDryer"]) {
            restoreMachineTimer("dryer", i, dryers);
          }
          for (let i of res["allWasher"]) {
            restoreMachineTimer("washer", i, washers);
          }
        } else {
          for (let i of res["allDryer"]) {
            restoreMachineTimer("dryer", i, dryers);
          }
          for (let i of res["allWasher"]) {
            restoreMachineTimer("washer", i, washers);
          }
        }
        resolve(res);
      },
      error: function (err) {
        console.error("API Error:", err);
        reject(err);
      },
    });
  });
}

function restoreMachineTimer(type, machineData, store) {
  const id = machineData["_id"];
  const remainTime = machineData["remain"];

  console.log(`복원 시도: ${type}${id}`, machineData); // 디버깅용

  if (remainTime !== 0) {
    // store 객체 존재 확인
    if (!store[id]) {
      console.error(`Store object not found for ${type}${id}`);
      return;
    }

    $(`#${type}${id} .status-badge`)[0].innerText = "가동중";
    $(`#${type}${id} .status-badge`)[0].classList.replace('bg-info', 'bg-success');

    // DOM 요소 존재 확인
    const statusElement = $(`#${type}${id} .text-info`)[0];
    if (!statusElement) {
      console.error(`DOM element not found: #${type}${id} .text-info`);
      return;
    }

    const timerElement = $(`#${type}-timer-${id}`);
    if (timerElement.length === 0) {
      console.error(`Timer element not found: #${type}-timer-${id}`);
      return;
    }

    // 상태 업데이트 (안전하게)
    store[id].status = "running";
    store[id].userName = machineData["name"];
    store[id].roomNumber = machineData["roomNum"];
    store[id].remaining = remainTime;
    store[id].totalTime = remainTime;

    // UI 업데이트
    statusElement.innerText = `${machineData["name"]} (${machineData["roomNum"]} 호)`;
    timerElement.css("display", "block");

    // 초기 시간 표시
    updateTimerDisplay(store, type, id);

    // 기존 타이머 정리
    if (store[id].timer) {
      clearInterval(store[id].timer);
    }

    // 타이머 시작
    const intervalId = setInterval(() => {
      if (!store[id]) return; // 안전 체크

      store[id].remaining--;

      if (store[id].remaining <= 0) {
        clearInterval(intervalId);

        // 완료 처리
        store[id].status = "available";
        store[id].userName = "";
        store[id].roomNumber = "";
        store[id].remaining = 0;
        store[id].timer = null;

        timerElement.css("display", "none");
        if (statusElement) {
          statusElement.innerText = "사용 가능";
        }
      } else {
        updateTimerDisplay(store, type, id);
      }
    }, 60000);

    store[id].timer = intervalId;
  } else {
    // 사용 가능한 경우
    const statusElement = $(`#${type}${id} .text-info`)[0];
    if (statusElement) {
      statusElement.innerText = "사용 가능";
    }
  }
}

// 외부에서 사용할 수 있도록 export
export {
  changeWasherUser,
  changeDryerUser,
  changeWasherState,
  changeDryerState,
  refreshData,
};

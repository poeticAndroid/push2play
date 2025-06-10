/* global YT */

let player,
  music,
  btn,
  openBtn,
  playState,
  duration = 0,
  pauseTimer,
  laste,
  data = {
    titles: { jfKfPfyJRdk: "🎵 Lofi Girl ☕" },
    bookmarks: {},
    vlist: [],
    mlist: ["jfKfPfyJRdk"],
    playbackRate: 1,
  },
  autofillTO,
  jog = 0

function init() {
  document.getElementById("clearBtn").addEventListener("click", clearHistory)
  document.getElementById("resetBmBtn").addEventListener("click", resetBookmarks)
  document.getElementById("deleteBtn").addEventListener("click", deleteFromHistory)
  loadData()
  for (let v of data.vlist) {
    let el = document.createElement("option")
    el.value = v
    el.textContent = data.titles[v]
    document.getElementById("vlist").appendChild(el)
  }
  for (let m of data.mlist) {
    let el = document.createElement("option")
    el.value = m
    el.textContent = data.titles[m]
    document.getElementById("mlist").appendChild(el)
  }

  autofillTO = setInterval(autofill, 32)
  document.getElementsByName("v")[0].addEventListener("focus", clearOnFocus)
  document.getElementsByName("m")[0].addEventListener("focus", clearOnFocus)
  document.getElementById("jsonTxt").addEventListener("change", importJSON)

  if (!location.search) return

  let vid = new URLSearchParams(location.search).get("v")
  if (vid.includes("?")) {
    vid =
      new URLSearchParams(vid.slice(vid.lastIndexOf("?"))).get("v") ||
      new URLSearchParams(vid.slice(vid.lastIndexOf("?"))).get("m") ||
      vid.slice(0, vid.indexOf("?"))
  }
  if (vid.includes("/")) {
    vid = vid.slice(vid.lastIndexOf("/") + 1)
  }
  let mid = new URLSearchParams(location.search).get("m")
  if (mid.includes("?")) {
    mid =
      new URLSearchParams(mid.slice(mid.lastIndexOf("?"))).get("m") ||
      new URLSearchParams(mid.slice(mid.lastIndexOf("?"))).get("v") ||
      mid.slice(0, mid.indexOf("?"))
  }
  if (mid.includes("/")) {
    mid = mid.slice(mid.lastIndexOf("/") + 1)
  }
  if (location.search !== "?v=" + vid + "&m=" + mid) return (location.search = "?v=" + vid + "&m=" + mid)

  player = new YT.Player("yt", {
    width: "100%",
    height: "100%",
    videoId: vid,
    events: {
      onStateChange: update,
    },
  })
  if (mid) music = new YT.Player("myt", { videoId: mid, events: { onStateChange: musicUpdate } })
  setInterval(musicFade, 1024)

  openBtn = document.getElementById("openBtn")
  openBtn.addEventListener("click", (e) => {
    if (player) player.pauseVideo()
    if (music) music.pauseVideo()
    setTimeout((e) => {
      if (sessionStorage.getItem("push2play/menuShown")) history.back()
      sessionStorage.setItem("push2play/menuShown", true)
      setTimeout((e) => {
        location.replace("./")
      }, 1024)
    }, 1024)
  })

  btn = document.getElementById("ptpBtn")
  btn.addEventListener("pointerdown", play)
  btn.addEventListener("pointerup", pause)
  btn.addEventListener("keydown", play)
  btn.addEventListener("keyup", pause)

  addEventListener("blur", pause)
  addEventListener("wheel", (e) => {
    clearTimeout(pauseTimer)
    if (e.deltaX < 0 || e.deltaY < 0 || e.deltaZ < 0) {
      jog = Math.min(-1, jog - 1)
      player.seekTo(player.getCurrentTime() + jog)
    } else {
      jog = Math.max(-5, jog + 1)
      if (jog > 4) {
        player.seekTo(player.getCurrentTime() + jog)
      } else {
        player.playVideo()
      }
    }
    pauseTimer = setTimeout(pause, 1024)
    player.wakeUpControls()
  })

  addEventListener("mouseover", (e) => {
    btn.style.cursor = "pointer"
  })
  addEventListener("keydown", (e) => {
    btn.style.cursor = "none"
  })
  addEventListener("mousedown", (e) => {
    btn.style.cursor = "none"
  })

  data.vlist = data.vlist.filter((id) => id != vid)
  data.vlist.unshift(vid)
  data.mlist = data.mlist.filter((id) => id != mid)
  data.mlist.unshift(mid)
  saveData()
  document.body.classList.remove("start")
}

function autofill() {
  if (document.getElementsByName("v")[0].value == (data.vlist[0] || "")) clearTimeout(autofillTO)
  document.getElementsByName("v")[0].value = data.vlist[0] || ""
  document.getElementsByName("m")[0].value = data.mlist[0] || ""
  if (data.titles[data.mlist[0]]) document.getElementsByName("m")[0].title = data.titles[data.mlist[0]]
  if (data.titles[data.vlist[0]]) document.getElementsByName("v")[0].title = data.titles[data.vlist[0]]
  exportJSON()
}

function play(e) {
  if (e?.altKey) return pause()
  loadData()
  switch (e?.key) {
    case " ":
    case undefined:
      clearTimeout(pauseTimer)
      player.playVideo()
      break
    case "0":
    case "Home":
      data.playbackRate = 1
      if (player) delete data.bookmarks[player.getVideoData().video_id]
      if (music) delete data.bookmarks[music.getVideoData().video_id]
      player.seekTo(0)
      // if (music && !music.getVideoData().isLive) music.seekTo(0)
      break
    case "PageUp":
      player.seekTo(player.getCurrentTime() - 60)
      break
    case "PageDown":
      player.seekTo(player.getCurrentTime() + 60)
      break
    case "ArrowUp":
      player.seekTo(player.getCurrentTime() - 5)
      break
    case "ArrowDown":
      player.seekTo(player.getCurrentTime() + 5)
      break
    case "ArrowLeft":
      break
    case "ArrowRight":
      break
    case "j":
      player.seekTo(player.getCurrentTime() - 10)
      break
    case "k":
      if (player.getPlayerState() == 1) player.pauseVideo()
      else player.playVideo()
      break
    case "l":
      player.seekTo(player.getCurrentTime() + 10)
      break
    case "m":
      if (player.isMuted()) player.unMute()
      else player.mute()
      break
    default:
      console.log("Key:", e.key)
      break
  }
  player.wakeUpControls()
  saveData()
}

function pause(e) {
  if (e) {
    if (e.key === "j" || e.key === "k" || e.key === "l") return clearTimeout(pauseTimer)
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (e.key === "ArrowLeft") player.seekTo(Math.floor(player.getCurrentTime() - 1))
      clearTimeout(pauseTimer)
      player.playVideo()
      pauseTimer = setTimeout(pause, 1024)
      return
    }
  }
  player.pauseVideo()
}

function update(e) {
  if (playState !== player.getPlayerState()) {
    playState = player.getPlayerState()
    console.log("playState:", playState)
    if (playState === 0) {
      // finished
      setTimeout((e) => {
        loadData()
        if (duration <= player.getDuration()) data.bookmarks[player.getVideoData().video_id] = player.getDuration()
        saveData()

        openBtn.classList.remove("hidden")
        if (music) music.playVideo()
      }, 256)
    } else {
      if (duration <= player.getDuration() && data.bookmarks[player.getVideoData().video_id] >= player.getDuration()) {
        loadData()
        delete data.bookmarks[player.getVideoData().video_id]
        saveData()
      }
    }
    if (playState === 1) {
      // playing
      openBtn.classList.add("hidden")
      btn.classList.add("hidden")
      if (music) music.pauseVideo()
    }
    if (playState === 2) {
      // paused
      openBtn.classList.remove("hidden")
      btn.classList.remove("hidden")
      if (music) music.playVideo()
    }
    if (player.getCurrentTime() < 1) {
      player.setPlaybackRate(parseFloat(data.playbackRate) || 1)
      if (Math.floor(data.bookmarks[player.getVideoData().video_id])) player.seekTo(data.bookmarks[player.getVideoData().video_id] || 0)
    } else {
      loadData()
      data.playbackRate = player.getPlaybackRate()
      if (duration <= player.getDuration()) data.bookmarks[player.getVideoData().video_id] = Math.max(0, player.getCurrentTime() - 60)
      saveData()
    }
    setTimeout(() => {
      btn.focus()
    }, 100)
    duration = Math.max(duration || 0, player.getDuration() || 0)
  }
}
function musicUpdate(e) {
  if (music.getPlayerState() === 0) {
    setTimeout((e) => {
      loadData()
      delete data.bookmarks[music.getVideoData().video_id]
      saveData()
    }, 1024)
  }
}

function musicFade() {
  document.title = data.titles[player.getVideoData().video_id] + " - Push to Play"
  loadData()
  if (player) {
    if (!data.titles[player.getVideoData().video_id]) data.titles[player.getVideoData().video_id] = player.getVideoData().title
    if (player.getVideoData().author) {
      data.titles[player.getVideoData().video_id] = `${player.getVideoData().title} (by ${player.getVideoData().author})`
      if (data.bookmarks[player.getVideoData().video_id])
        data.titles[player.getVideoData().video_id] += ` [${Math.round((data.bookmarks[player.getVideoData().video_id] / player.getDuration()) * 100)}%]`
    }
  }
  if (music) {
    if (!data.titles[music.getVideoData().video_id]) data.titles[music.getVideoData().video_id] = music.getVideoData().title
    if (music.getVideoData().author) {
      data.titles[music.getVideoData().video_id] = `${music.getVideoData().title} (by ${music.getVideoData().author})`
      if (data.bookmarks[music.getVideoData().video_id])
        data.titles[music.getVideoData().video_id] += ` [${Math.round((data.bookmarks[music.getVideoData().video_id] / music.getDuration()) * 100)}%]`
    }
  }
  saveData()

  if (jog < 0) jog += 4
  if (jog > 0) jog -= 4
  if (!music) return

  if (player.isMuted()) {
    music.setVolume(0)
    if (music.getVideoData().isLive) {
      music.setPlaybackRate(2)
    } else {
      music.seekTo(0)
      music.pauseVideo()
    }
  } else if (music.getPlayerState() === 1) {
    // playing
    music.setVolume(music.getVolume() + 1)
    if (music.getCurrentTime() < 1) {
      music.unMute()
      music.setVolume(0)
      music.setPlaybackRate(1)
      if (Math.floor(data.bookmarks[music.getVideoData().video_id])) music.seekTo(data.bookmarks[music.getVideoData().video_id] || 0)
    } else {
      loadData()
      if (music.getVideoData().isLive) delete data.bookmarks[music.getVideoData().video_id]
      else data.bookmarks[music.getVideoData().video_id] = Math.max(0, music.getCurrentTime() - 10)
      saveData()
    }
  } else {
    music.setVolume(0)
  }
}

function clearHistory(e) {
  e.preventDefault()
  if (confirm("Are you sure you want to erase ALL your push2play data ?")) {
    localStorage.removeItem(absUrl("save.json"))
    for (let key in localStorage) {
      if (key.substr(0, 10) == "push2play/") localStorage.removeItem(key)
    }
  }
  location.reload(true)
}

function resetBookmarks(e) {
  e.preventDefault()
  if (confirm("Are you sure you want to reset progress on ALL videos ?")) {
    for (let t in data.titles) {
      if (data.titles[t].slice(-1) === "]") data.titles[t] = data.titles[t].slice(0, data.titles[t].lastIndexOf("["))
    }
    delete data.bookmarks
    saveData()
  }
  location.reload()
}

function deleteFromHistory(e) {
  e.preventDefault()
  let v = document.getElementsByName("v")[0].value || document.getElementsByName("m")[0].value
  let t = ""
  if (v) t += JSON.stringify(data.titles[v] || v)
  if (t && confirm("Are you sure you want to delete\n" + t + " ?")) {
    data.vlist = data.vlist.filter((id) => id != v)
    data.mlist = data.mlist.filter((id) => id != v)
    delete data.titles[v]
    delete data.bookmarks[v]
    saveData()
  }
  location.reload()
}

function clearOnFocus(e) {
  e.target.value = ""
  e.target.removeAttribute("title")
  sessionStorage.setItem("push2play/menuShown", true)
  // e.target.removeEventListener("focus", clearOnFocus)
}

function exportOld() {
  let json
  for (let key in localStorage) {
    if (key.substr(0, 10) == "push2play/") {
      json = {} || json
      json[key.replace("push2play/", "")] = JSON.parse(localStorage.getItem(key))
    }
  }
  return json
}

function exportJSON() {
  document.getElementById("jsonTxt").value = JSON.stringify(data, null, 2)
}

function importJSON() {
  data = JSON.parse(document.getElementById("jsonTxt").value)
  saveData()
  location.reload(true)
}

const _absUrl_a = document.createElement("a")
function absUrl(url) {
  _absUrl_a.href = url
  return _absUrl_a.href
}

function loadData() {
  data = JSON.parse(localStorage.getItem(absUrl("save.json"))) || exportOld() || data
}
function saveData() {
  localStorage.setItem(absUrl("save.json"), JSON.stringify(data, null, 2))
}

setTimeout(init)

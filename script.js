console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// Utility to convert seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Fetch songs from a folder
async function getSongs(folder) {
    currFolder = folder;
    let response = await (await fetch(`/${folder}/`)).text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Render songs in UI
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img class="invert" width="34" src="music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Harry</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="playbutton.svg" alt="">
            </div>
        </li>`;
    }

    // Add click events to song items
    document.querySelectorAll(".songList li").forEach(e => {
        e.addEventListener("click", () => {
            const trackName = e.querySelector(".info").firstElementChild.innerText.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

// Play a song
function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg";
    }
    document.querySelector(".songinfo").innerText = decodeURI(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";
}

// Display albums
async function displayAlbums() {
    let response = await (await fetch(`/songs/`)).text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (let e of anchors) {
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];
            try {
                let meta = await (await fetch(`/songs/${folder}/info.json`)).json();
                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                </div>`;
            } catch (err) {
                console.error(`Error loading metadata for ${folder}`, err);
            }
        }
    }

    // Handle album card click
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            songs = await getSongs(`songs/${card.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

// Main function
async function main() {
    const playBtn = document.getElementById("play");
    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("previous");
    const volumeIcon = document.querySelector(".volume > img");
    const volumeSlider = document.querySelector(".range input");

    // Load default songs
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Load album cards
    await displayAlbums();

    // Play/Pause toggle
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "playbutton.svg";
        }
    });

    // Update time and progress
    currentSong.addEventListener("timeupdate", () => {
        const current = secondsToMinutesSeconds(currentSong.currentTime);
        const total = secondsToMinutesSeconds(currentSong.duration);
        document.querySelector(".songtime").innerText = `${current} / ${total}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width);
        currentSong.currentTime = currentSong.duration * percent;
    });

    // Hamburger toggle
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Next/Previous buttons
    nextBtn.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    prevBtn.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    // Volume change
    volumeSlider.addEventListener("input", (e) => {
        const vol = parseInt(e.target.value);
        currentSong.volume = vol / 100;
        volumeIcon.src = vol === 0 ? "mute.svg" : "volume.svg";
    });

    // Mute toggle
    volumeIcon.addEventListener("click", () => {
        if (volumeIcon.src.includes("volume.svg")) {
            currentSong.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.src = "mute.svg";
        } else {
            currentSong.volume = 0.1;
            volumeSlider.value = 10;
            volumeIcon.src = "volume.svg";
        }
    });
}

// Run main
main();

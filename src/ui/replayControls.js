
export class ReplayControls {
  constructor(container, timeMachineSystem, onExit) {
    this.container = container;
    this.timeMachine = timeMachineSystem;
    this.onExit = onExit;
    this.element = this._createDOM();
    this.container.appendChild(this.element);
    this._bindEvents();
    this.lastState = null;
  }

  _createDOM() {
    const el = document.createElement("div");
    el.id = "replay-controls";
    el.className = "replay-controls hidden";
    el.innerHTML = `
      <div class="replay-header">
        <span class="replay-title">REPLAY MODE</span>
        <span class="replay-timestamp" id="replay-time">00:00</span>
      </div>
      <div class="replay-timeline-container">
        <input type="range" id="replay-timeline" min="0" max="100" step="0.1" value="0">
        <div class="replay-markers" id="replay-markers"></div>
      </div>
      <div class="replay-actions">
        <button id="replay-play-pause" class="replay-btn">▶</button>
        <div class="replay-speed-group">
            <button data-speed="0.5" class="replay-speed-btn">0.5x</button>
            <button data-speed="1" class="replay-speed-btn active">1x</button>
            <button data-speed="2" class="replay-speed-btn">2x</button>
            <button data-speed="4" class="replay-speed-btn">4x</button>
        </div>
        <button id="replay-exit" class="replay-btn exit">EXIT REPLAY</button>
      </div>
    `;
    return el;
  }

  _bindEvents() {
    const playPause = this.element.querySelector("#replay-play-pause");
    const timeline = this.element.querySelector("#replay-timeline");
    const exit = this.element.querySelector("#replay-exit");
    const speedBtns = this.element.querySelectorAll(".replay-speed-btn");

    playPause.addEventListener("click", () => {
      this.timeMachine.togglePlaybackPause();
    });

    timeline.addEventListener("input", (e) => {
      // Pause while dragging for smoothness
      if (this.lastState && !this.lastState.paused) {
          this.timeMachine.togglePlaybackPause();
          this.wasPlaying = true;
      }
      const progress = parseFloat(e.target.value) / 100;
      const totalFrames = this.timeMachine.playback.session?.frames?.length || 0;
      if (totalFrames > 0) {
          const frame = Math.floor(progress * (totalFrames - 1));
          this.timeMachine.seekToFrame(frame);
      }
    });

    timeline.addEventListener("change", () => {
        if (this.wasPlaying) {
            this.timeMachine.togglePlaybackPause();
            this.wasPlaying = false;
        }
    });

    exit.addEventListener("click", () => {
      this.timeMachine.stopPlayback();
      if (this.onExit) this.onExit();
    });

    speedBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const speed = parseFloat(e.target.dataset.speed);
            this.timeMachine.setPlaybackSpeed(speed);

            // Update active class locally for immediate feedback
            speedBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
        });
    });
  }

  update(playbackState) {
    if (!playbackState || !playbackState.active) {
      this.element.classList.add("hidden");
      return;
    }

    this.element.classList.remove("hidden");
    this.lastState = playbackState;

    // Update Play/Pause button
    const playPause = this.element.querySelector("#replay-play-pause");
    playPause.textContent = playbackState.paused ? "▶" : "❚❚";

    // Update Timeline
    const timeline = this.element.querySelector("#replay-timeline");
    // Avoid fighting with user drag
    if (document.activeElement !== timeline) {
        timeline.value = (playbackState.progress * 100).toFixed(1);
    }

    // Update Timestamp
    const timeEl = this.element.querySelector("#replay-time");
    timeEl.textContent = this._formatTime(playbackState.currentTime);

    // Update Speed Buttons
    const speedBtns = this.element.querySelectorAll(".replay-speed-btn");
    speedBtns.forEach(btn => {
        const speed = parseFloat(btn.dataset.speed);
        if (Math.abs(speed - playbackState.speed) < 0.01) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
  }

  _formatTime(minutes) {
      const d = Math.floor(minutes / (24 * 60));
      const h = Math.floor((minutes % (24 * 60)) / 60);
      const m = Math.floor(minutes % 60);
      return `T+${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

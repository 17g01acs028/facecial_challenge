import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="demos" class="invisible"> 
  <div class="container">
    <header>
      <h1>Face Challenge Game</h1>
    </header>

    <!-- Progress indicator -->
    <div class="progress-container">
      <div class="progress-step active" data-step="1"></div>
      <div class="progress-step" data-step="2"></div>
      <div class="progress-step" data-step="3"></div>
      <div class="progress-step" data-step="4"></div>
    </div>

    <div id="challenge-instructions" class="hidden">
      <p id="instruction-text">Get ready for the challenges!</p>
      <div id="visual-cue"></div>
    </div>

    <div>
      <div id="liveView" class="video-container">
        <div class="circle-wrapper">
          <div class="circle-container">
            <div class="progress-indicator"></div>
          </div>
          <div class="circle-mask">
            <div class="placeholder"></div>
            <video id="webcam" autoplay playsinline class="hidden"></video>
          </div>
          <div class="loading-spinner hidden" id="loading-message">Preparing camera...</div>
        </div>
      </div>
      <canvas
        class="output_canvas"
        id="output_canvas"
        style="position: absolute; left: 0px; top: 0px"
      ></canvas>
      <div class="blend-shapes">
        <ul class="blend-shapes-list" id="video-blend-shapes"></ul>
      </div>
      <div class="button-container">
        <button id="webcamButton" class="mdc-button mdc-button--raised">
          <span class="mdc-button__ripple"></span>
          <span class="mdc-button__label">Start Challenge</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Challenge completion overlay -->
  <div id="challenge-complete" class="challenge-complete">
    <div class="challenge-complete-content">
      <h2 id="complete-title" class="challenge-complete-title">Challenge Completed!</h2>
      <div id="complete-emoji" class="challenge-complete-emoji">🎉</div>
      <p id="complete-message">Great job! You've completed the challenge.</p>
      <button id="next-challenge-btn" class="challenge-complete-next">Next Challenge</button>
    </div>
  </div>

  <!-- Confetti container for celebration effect -->
  <div class="confetti-container" id="confetti-container"></div>
</section>
`
import './style1.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
 <div class="container">
        <h1 style="text-align: center; color: #333; margin-bottom: 30px;">Face Challenge with Distance Detection</h1>
        
        <div class="progress-container">
            <div class="progress-step active">1</div>
            <div class="progress-step">2</div>
            <div class="progress-step">3</div>
            <div class="progress-step">4</div>
            <div class="progress-step">5</div>
            <div class="progress-step">6</div>
        </div>

        <div class="controls">
            <button id="webcamButton">Start Challenge</button>
        </div>

        <div class="video-container">
            <div class="placeholder">📹</div>
            <video id="webcam" class="hidden" autoplay playsinline></video>
            <canvas id="output_canvas"></canvas>
            <div class="distance-display" id="distance-display">Distance: -- cm</div>
        </div>

        <div class="challenge-info">
            <div class="instruction-text" id="instruction-text">Click "Start Challenge" to begin</div>
            <div class="visual-cue" id="visual-cue">🎯</div>
            <div class="progress-indicator" id="progress-indicator"></div>
        </div>

        <div class="distance-challenge-info hidden" id="distance-challenge-info">
            <div class="distance-range" id="distance-range">Target distance: --</div>
        </div>

        <div class="face-visibility-status face-not-visible" id="face-visibility-status">
            Position your face fully within the frame
        </div>
        <div class="face-visibility-status face-not-visible" id="face-camera-visibility-distance-status">
            Position your face new the camera.
        </div>
        

        <div class="loading-message hidden" id="loading-message">Loading camera...</div>
        <div class="challenge-instructions hidden" id="challenge-instructions"></div>

        <div class="blend-shapes">
            <h3>Blend Shapes</h3>
            <ul id="video-blend-shapes"></ul>
        </div>
    </div>

    <div class="challenge-complete" id="challenge-complete">
        <div class="challenge-complete-content">
            <h2 id="complete-title">Challenge Completed!</h2>
            <div id="complete-emoji" style="font-size: 60px; margin: 20px 0;">🎉</div>
            <p id="complete-message">Great job!</p>
            <button id="next-challenge-btn">Next Challenge</button>
        </div>
    </div>

    <div class="confetti-container" id="confetti-container"></div>
`
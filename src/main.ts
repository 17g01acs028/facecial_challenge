import './style1.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="container">
        <div class="header">
            <h1 class="title">Face verification</h1>
            <p class="subtitle">Look into camera and hold still</p>
        </div>

        <div class="video-container">
            <div class="corner-markers">
                <div class="corner-marker top-left"></div>
                <div class="corner-marker top-right"></div>
                <div class="corner-marker bottom-left"></div>
                <div class="corner-marker bottom-right"></div>
            </div>
            
            <div class="face-outline" id="face-outline"></div>
            
            <div class="placeholder" id="placeholder">📹</div>
            <video id="webcam" class="hidden" autoplay playsinline></video>
            <canvas id="output_canvas"></canvas>
            <div class="distance-display" id="distance-display">Distance: -- cm</div>
        </div>

        <div class="status-message warning" id="face-visibility-status">
            Make sure clearly shows your face in the frame
        </div>

        <div class="status-message warning hidden" id="face-camera-visibility-distance-status">
            Position your face near the camera
        </div>

        <div class="challenge-info">
            <div class="instruction-text" id="instruction-text">Click "Get Started" to begin</div>
            <div class="visual-cue" id="visual-cue">🎯</div>
        </div>

        <div class="progress-section">
            <div class="progress-percentage" id="progress-percentage">0%</div>
            <div class="progress-label" id="progress-label">Verifying Your Face</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
        </div>

        <div class="controls">
            <button id="webcamButton">Get Started</button>
        </div>

        <div class="distance-challenge-info hidden" id="distance-challenge-info">
            <div class="status-message warning">
                <div class="distance-range" id="distance-range">Target distance: --</div>
            </div>
        </div>

        <div class="loading-message hidden" id="loading-message">Loading camera...</div>

        <div class="blend-shapes">
            <h3>Detection Data</h3>
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
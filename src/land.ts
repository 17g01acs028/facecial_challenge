import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;

const demosSection = document.getElementById("demos");
const videoBlendShapes = document.getElementById("video-blend-shapes");
const instructionText = document.getElementById("instruction-text");
const visualCue = document.getElementById("visual-cue");
const loadingMessage = document.getElementById("loading-message");
const webCam = document.getElementById("webcam") as HTMLVideoElement;
const challengeInstructions = document.getElementById("challenge-instructions");
const placeholder = document.querySelector('.placeholder');
const progressSteps = document.querySelectorAll('.progress-step');
const progressIndicator = document.querySelector('.progress-indicator') as HTMLElement;
const challengeCompleteOverlay = document.getElementById('challenge-complete') as HTMLElement;
const completeTitle = document.getElementById('complete-title') as HTMLElement;
const completeEmoji = document.getElementById('complete-emoji') as HTMLElement;
const completeMessage = document.getElementById('complete-message') as HTMLElement;
const nextChallengeBtn = document.getElementById('next-challenge-btn') as HTMLElement;
const confettiContainer = document.getElementById('confetti-container') as HTMLElement;

let faceLandmarker;
let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
let progressValue = 1;
const videoWidth = 370;

interface Challenge {
    name: string;
    key: string;
    threshold: number;
    cue: string;
    animation: string;
    instruction: string;
    emoji: string;
    completionMessage: string;
}

const challenges: Challenge[] = [
    {
        name: "Look Up",
        key: "browInnerUp",
        threshold: 0.7,
        cue: "↑",
        animation: "bounce",
        instruction: "Raise your eyebrows",
        emoji: "😮",
        completionMessage: "Great job raising your eyebrows!"
    },
    {
        name: "Open Mouth",
        key: "jawOpen",
        threshold: 0.4,
        cue: "👄",
        animation: "pulse",
        instruction: "Open your mouth wide",
        emoji: "😲",
        completionMessage: "Perfect mouth opening!"
    },
    {
        name: "Look Left",
        key: "eyeLookInRight",
        threshold: 0.9,
        cue: "→",
        animation: "bounce",
        instruction: "Look to your left",
        emoji: "👀",
        completionMessage: "Nice eye movement to the left!"
    },
    {
        name: "Look Right",
        key: "eyeLookOutRight",
        threshold: 0.9,
        cue: "←",
        animation: "bounce",
        instruction: "Look to your right",
        emoji: "👁️",
        completionMessage: "Excellent eye movement to the right!"
    }
];

let currentChallengeIndex = 0;
let isSystemReady = false;
let challengeProgress = 0;

// Create confetti elements
function createConfetti() {
    confettiContainer.innerHTML = '';
    const colors = ['#3a86ff', '#ff006e', '#ffbe0b', '#38b000', '#fb5607'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
        confetti.style.animation = 'fall ' + (Math.random() * 2 + 2) + 's linear forwards';
        confettiContainer.appendChild(confetti);
    }
}

async function createFaceLandmarker() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode,
        numFaces: 1
    });
    demosSection.classList.remove("invisible");
}
createFaceLandmarker();

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d");

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Show completion overlay with animations
function showCompletionOverlay(challenge: Challenge) {
    // Update overlay content
    completeTitle.textContent = `Challenge ${currentChallengeIndex} Completed!`;
    completeEmoji.textContent = challenge.emoji;
    completeMessage.textContent = challenge.completionMessage;

    // Show overlay with animation
    challengeCompleteOverlay.classList.add('show');

    // Create confetti effect
    createConfetti();

    // Setup next challenge button
    if (currentChallengeIndex < challenges.length) {
        nextChallengeBtn.textContent = "Next Challenge";
        nextChallengeBtn.onclick = () => {
            challengeCompleteOverlay.classList.remove('show');
            startChallenge();

            // Clear confetti
            setTimeout(() => {
                confettiContainer.innerHTML = '';
            }, 300);
        };
    } else {
        nextChallengeBtn.textContent = "Finish";
        nextChallengeBtn.onclick = () => {
            challengeCompleteOverlay.classList.remove('show');

            // Reset everything for a new game
            currentChallengeIndex = 0;
            resetProgressSteps();
            instructionText.innerText = "All challenges completed!";
            visualCue.innerText = "🏆";
            visualCue.classList.remove(...visualCue.classList);
            visualCue.classList.add("celebrate");

            // Clear confetti
            setTimeout(() => {
                confettiContainer.innerHTML = '';
            }, 300);
        };
    }
}

function enableCam(event) {
    if (!faceLandmarker) {
        console.log("Wait! faceLandmarker not loaded yet.");
        return;
    }

    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "Start Challenge";
    } else {
        webcamRunning = true;
        enableWebcamButton.classList.add("hidden");
        enableWebcamButton.innerText = "Stop Challenge";

        const constraints = { video: true };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
            loadingMessage.classList.remove("hidden");
            video.classList.remove('hidden');
            placeholder.classList.add('hidden');
        });
    }
}

function updateProgressStep(index: number, status: 'active' | 'completed') {
    progressSteps.forEach((step, i) => {
        step.classList.remove('active');
        if (i < index) {
            step.classList.add('completed');
        } else if (i === index) {
            step.classList.add(status);
        }
    });
}

function resetProgressSteps() {
    progressSteps.forEach((step, i) => {
        step.classList.remove('active', 'completed');
        if (i === 0) {
            step.classList.add('active');
        }
    });
}

function startChallenge() {
    if (currentChallengeIndex < challenges.length) {
        const currentChallenge = challenges[currentChallengeIndex];

        // Reset challenge progress
        challengeProgress = 0;

        // Update progress steps
        updateProgressStep(currentChallengeIndex, 'active');

        // Update challenge instructions
        instructionText.innerText = `Challenge ${currentChallengeIndex + 1}: ${currentChallenge.instruction}`;
        visualCue.innerText = currentChallenge.cue;

        // Clear previous animation classes
        visualCue.classList.remove(...visualCue.classList);
        visualCue.classList.add(currentChallenge.animation);

        // Show challenge instructions
        challengeInstructions.classList.remove("hidden");
        loadingMessage.classList.add("hidden");

        // Reset progress indicator
        progressIndicator.style.transform = 'rotate(0deg)';
        progressIndicator.classList.add('active');
    }
}

let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);

async function predictWebcam() {
    const radio = video.videoHeight / video.videoWidth;
    video.style.width = videoWidth + "px";
    video.style.height = videoWidth * radio + "px";
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * radio + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await faceLandmarker.setOptions({ runningMode: runningMode });
    }

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = faceLandmarker.detectForVideo(video, startTimeMs);
    }

    if (results.faceBlendshapes) {
        drawBlendShapes(videoBlendShapes, results.faceBlendshapes);

        // Check if the system is ready (i.e., blendShapes data is available)
        if (!isSystemReady && results.faceBlendshapes.length > 0) {
            isSystemReady = true;
            startChallenge(); // Start the first challenge
        }

        checkChallenge(results.faceBlendshapes);
    }

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

function drawBlendShapes(el: HTMLElement, blendShapes: any[]) {
    if (!blendShapes.length) {
        return;
    }

    let htmlMaker = "";
    blendShapes[0].categories
        .filter((shape) => challenges.map(c => c.key).includes(shape.categoryName))
        .map((shape) => {
            htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">${
                shape.displayName || shape.categoryName
            }</span>
          <span class="blend-shapes-value" style="width: calc(${
                +shape.score * 100
            }% - 120px)">${(+shape.score).toFixed(4)}</span>
        </li>
      `;
        });

    el.innerHTML = htmlMaker;
}

function checkChallenge(blendShapes: any[]) {
    if (!blendShapes.length) return;

    const currentChallenge = challenges[currentChallengeIndex];
    const shape = blendShapes[0].categories.find(c => c.categoryName === currentChallenge.key);

    if (shape) {
        // Update progress indicator based on how close we are to threshold
        const progress = Math.min(shape.score / currentChallenge.threshold, 1);
        const rotation = progress * 360; // Full circle is 360 degrees
        progressIndicator.style.transform = `rotate(${rotation}deg)`;

        // Update challenge progress
        challengeProgress = progress;

        // Check if challenge is completed
        if (shape.score >= currentChallenge.threshold) {
            // Complete current challenge
            updateProgressStep(currentChallengeIndex, 'completed');
            progressIndicator.classList.remove('active');

            // Show completion overlay
            showCompletionOverlay(currentChallenge);

            // Move to next challenge
            currentChallengeIndex++;
        }
    }
}

// Add event listener for next challenge button
nextChallengeBtn.addEventListener('click', () => {
    challengeCompleteOverlay.classList.remove('show');
    if (currentChallengeIndex < challenges.length) {
        startChallenge();
    } else {
        // All challenges completed
        instructionText.innerText = "All challenges completed!";
        visualCue.innerText = "🏆";
        visualCue.classList.add("celebrate");
    }
});
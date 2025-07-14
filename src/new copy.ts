  import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
        const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
        let count = 0;

        const videoBlendShapes = document.getElementById("video-blend-shapes");
        const instructionText = document.getElementById("instruction-text");
        const visualCue = document.getElementById("visual-cue");
        const loadingMessage = document.getElementById("loading-message");
        const webCam = document.getElementById("webcam");
        const challengeInstructions = document.getElementById("challenge-instructions");
        const placeholder = document.querySelector('.placeholder');
        const progressSteps = document.querySelectorAll('.progress-step');
        const progressIndicator = document.querySelector('.progress-indicator');
        const challengeCompleteOverlay = document.getElementById('challenge-complete');
        const completeTitle = document.getElementById('complete-title');
        const completeEmoji = document.getElementById('complete-emoji');
        const completeMessage = document.getElementById('complete-message');
        const nextChallengeBtn = document.getElementById('next-challenge-btn');
        const confettiContainer = document.getElementById('confetti-container');
        const distanceDisplay = document.getElementById('distance-display');
        const distanceChallengeInfo = document.getElementById('distance-challenge-info');
        const distanceRange = document.getElementById('distance-range');

        let faceLandmarker;
        let runningMode = "IMAGE";
        let enableWebcamButton;
        let webcamRunning = false;
        let progressValue = 1;
        const videoWidth = 370;

        // Distance calculation variables
        let currentDistance = 0;
        const IRIS_WIDTH_MM = 11.7; // Average iris width in mm
        const NORMALIZED_FOCAL_X = 1.40625; // Logitech HD Pro C922 normalized focal length

        interface Challenge {
            name: string;
            key: string;
            threshold: number;
            cue: string;
            animation: string;
            instruction: string;
            emoji: string;
            completionMessage: string;
            isDistance?: boolean;
            targetDistance?: number;
            distanceRange?: number;
        }

        const challenges = [
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
            },
            {
                name: "Move Closer",
                key: "distance",
                threshold: 0,
                cue: "📏",
                animation: "pulse",
                instruction: "Move closer to the camera",
                emoji: "📍",
                completionMessage: "Perfect! You moved closer to the camera!",
                isDistance: true,
                targetDistance: 25,
                distanceRange: 5
            },
            {
                name: "Move Away",
                key: "distance",
                threshold: 0,
                cue: "📏",
                animation: "pulse",
                instruction: "Move away from the camera",
                emoji: "📏",
                completionMessage: "Excellent! You moved away from the camera!",
                isDistance: true,
                targetDistance: 50,
                distanceRange: 8
            }
        ];

        let currentChallengeIndex = 0;
        let isSystemReady = false;
        let challengeProgress = 0;
        let challengeStartTime = 0;
        const CHALLENGE_HOLD_TIME = 1000; // Hold for 1 second

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
                outputFaceLandmarks: true,
                runningMode,
                numFaces: 1
            });
        }

        createFaceLandmarker();

        const video = document.getElementById("webcam");
        const canvasElement = document.getElementById("output_canvas");
        const canvasCtx = canvasElement.getContext("2d");

        function hasGetUserMedia() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }

        if (hasGetUserMedia()) {
            enableWebcamButton = document.getElementById("webcamButton");
            enableWebcamButton.addEventListener("click", enableCam);
        } else {
            console.warn("getUserMedia() is not supported by your browser");
        }

        // Calculate distance based on iris width
        function calculateDistance(landmarks) {
            if (!landmarks || landmarks.length === 0) return 0;
            
            const leftIrisLandmarks = [
                468, 469, 470, 471, 472
            ];
            
            let irisLeftMinX = -1;
            let irisLeftMaxX = -1;
            
            for (const pointIndex of leftIrisLandmarks) {
                if (pointIndex < landmarks.length) {
                    const point = landmarks[pointIndex];
                    const x = point.x * canvasElement.width;
                    
                    if (irisLeftMinX === -1 || x < irisLeftMinX) {
                        irisLeftMinX = x;
                    }
                    if (irisLeftMaxX === -1 || x > irisLeftMaxX) {
                        irisLeftMaxX = x;
                    }
                }
            }
            
            if (irisLeftMinX !== -1 && irisLeftMaxX !== -1) {
                const dx = irisLeftMaxX - irisLeftMinX;
                const fx = Math.min(canvasElement.width, canvasElement.height) * NORMALIZED_FOCAL_X;
                const distance = (fx * (IRIS_WIDTH_MM / dx)) / 10.0;
                return Math.max(0, distance);
            }
            
            return 0;
        }

        // Show completion overlay with animations
        function showCompletionOverlay(challenge) {
            completeTitle.textContent = `Challenge ${currentChallengeIndex + 1} Completed!`;
            completeEmoji.textContent = challenge.emoji;
            completeMessage.textContent = challenge.completionMessage;

            challengeCompleteOverlay.classList.add('show');
            createConfetti();

            if (currentChallengeIndex < challenges.length - 1) {
                nextChallengeBtn.textContent = "Next Challenge";
                nextChallengeBtn.onclick = () => {
                    challengeCompleteOverlay.classList.remove('show');
                    currentChallengeIndex++;
                    startChallenge();
                    setTimeout(() => {
                        confettiContainer.innerHTML = '';
                    }, 300);
                };
            } else {
                nextChallengeBtn.textContent = "Finish";
                nextChallengeBtn.onclick = () => {
                    challengeCompleteOverlay.classList.remove('show');
                    currentChallengeIndex = 0;
                    resetProgressSteps();
                    instructionText.innerText = "All challenges completed!";
                    visualCue.innerText = "🏆";
                    visualCue.classList.remove(...visualCue.classList);
                    visualCue.classList.add("celebrate");
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

        function updateProgressStep(index, status) {
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
                challengeProgress = 0;
                challengeStartTime = 0;

                updateProgressStep(currentChallengeIndex, 'active');
                instructionText.innerText = `Challenge ${currentChallengeIndex + 1}: ${currentChallenge.instruction}`;
                visualCue.innerText = currentChallenge.cue;

                visualCue.classList.remove(...visualCue.classList);
                visualCue.classList.add(currentChallenge.animation);

                challengeInstructions.classList.remove("hidden");
                loadingMessage.classList.add("hidden");

                progressIndicator.style.background = 'conic-gradient(#3a86ff 0deg, #e9ecef 0deg)';
                progressIndicator.classList.add('active');

                // Show/hide distance challenge info
                if (currentChallenge.isDistance) {
                    distanceChallengeInfo.classList.remove('hidden');
                    distanceRange.textContent = `Target distance: ${currentChallenge.targetDistance}cm (±${currentChallenge.distanceRange}cm)`;
                } else {
                    distanceChallengeInfo.classList.add('hidden');
                }
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

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // Calculate and display distance

               if(count === 0){
                  console.log("Land Marks ", results.faceLandmarks[0]);
                  count++
               }

                
                
                currentDistance = calculateDistance(results.faceLandmarks[0]);
                distanceDisplay.textContent = `Distance: ${currentDistance.toFixed(1)} cm`;
                
                // Draw distance on canvas
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                canvasCtx.fillStyle = "red";
                canvasCtx.font = "20px Arial";
                canvasCtx.fillText(`${currentDistance.toFixed(1)} cm`, canvasElement.width * 0.75, 30);
            }

            if (results.faceBlendshapes) {
                drawBlendShapes(videoBlendShapes, results.faceBlendshapes);

                if (!isSystemReady && results.faceBlendshapes.length > 0) {
                    isSystemReady = true;
                    startChallenge();
                }

                checkChallenge(results.faceBlendshapes, results.faceLandmarks);
            }

            if (webcamRunning === true) {
                window.requestAnimationFrame(predictWebcam);
            }
        }

        function drawBlendShapes(el, blendShapes) {
            if (!blendShapes.length) {
                return;
            }

            let htmlMaker = "";
            blendShapes[0].categories
                .filter((shape) => challenges.map(c => c.key).includes(shape.categoryName))
                .map((shape) => {
                    htmlMaker += `
                <li class="blend-shapes-item">
                  <span class="blend-shapes-label">${shape.displayName || shape.categoryName}</span>
                  <span class="blend-shapes-value" style="width: calc(${+shape.score * 100}% - 120px)">${(+shape.score).toFixed(4)}</span>
                </li>
              `;
                });

            el.innerHTML = htmlMaker;
        }

        function checkChallenge(blendShapes, faceLandmarks) {
            if (!blendShapes.length) return;

            const currentChallenge = challenges[currentChallengeIndex];
            let challengeMet = false;
            let progress = 0;

            if (currentChallenge.isDistance) {
                // Distance challenge
                if (currentDistance > 0) {
                    const targetDistance = currentChallenge.targetDistance;
                    const tolerance = currentChallenge.distanceRange;
                    const distance = Math.abs(currentDistance - targetDistance);
                    
                    if (distance <= tolerance) {
                        challengeMet = true;
                        progress = 1;
                    } else {
                        // Calculate progress based on how close we are
                        const maxDistance = 100; // Maximum expected distance
                        progress = Math.max(0, 1 - (distance / maxDistance));
                    }
                }
            } else {
                // Regular blend shape challenge
                const shape = blendShapes[0].categories.find(c => c.categoryName === currentChallenge.key);
                if (shape) {
                    progress = Math.min(shape.score / currentChallenge.threshold, 1);
                    challengeMet = shape.score >= currentChallenge.threshold;
                }
            }

            // Update progress indicator
            const rotation = progress * 360;
            progressIndicator.style.background = `conic-gradient(#3a86ff ${rotation}deg, #e9ecef ${rotation}deg)`;
            challengeProgress = progress;

            // Check if challenge is met and held for required time
            if (challengeMet) {
                if (challengeStartTime === 0) {
                    challengeStartTime = Date.now();
                }
                
                const holdTime = Date.now() - challengeStartTime;
                const holdProgress = Math.min(holdTime / CHALLENGE_HOLD_TIME, 1);
                
                // Update progress indicator to show hold progress
                const holdRotation = holdProgress * 360;
                progressIndicator.style.background = `conic-gradient(#28a745 ${holdRotation}deg, #3a86ff ${holdRotation}deg, #e9ecef ${holdRotation}deg)`;
                
                if (holdTime >= CHALLENGE_HOLD_TIME) {
                    // Challenge completed
                    updateProgressStep(currentChallengeIndex, 'completed');
                    progressIndicator.classList.remove('active');
                    showCompletionOverlay(currentChallenge);
                }
            } else {
                challengeStartTime = 0;
            }
        }

        nextChallengeBtn.addEventListener('click', () => {
            challengeCompleteOverlay.classList.remove('show');
            if (currentChallengeIndex < challenges.length - 1) {
                currentChallengeIndex++;
                startChallenge();
            } else {
                instructionText.innerText = "All challenges completed!";
                visualCue.innerText = "🏆";
                visualCue.classList.add("celebrate");
            }
        });
document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Core Engines ---
    const bodySim = new BodySimulator('canvasContainer');
    const planner = new HealthPlanner();

    // --- DOM Elements ---
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Form elements
    const metricsForm = document.getElementById('metricsForm');
    const inputName = document.getElementById('userName');
    const selectGender = document.getElementById('userGender');
    const inputAge = document.getElementById('userAge');
    const selectGoal = document.getElementById('userGoal');
    const selectActivity = document.getElementById('activityLevel');
    
    const sliderHeight = document.getElementById('height');
    const sliderWeight = document.getElementById('weight');
    const sliderFat = document.getElementById('bodyFat');
    const sliderMuscle = document.getElementById('muscleMass');

    // Val labels
    const valHeight = document.getElementById('heightVal');
    const valWeight = document.getElementById('weightVal');
    const valFat = document.getElementById('bodyFatVal');
    const valMuscle = document.getElementById('muscleMassVal');

    // Viewport control buttons
    const btnRealistic = document.getElementById('modeRealistic');
    const btnMuscle = document.getElementById('modeMuscle');
    const btnFat = document.getElementById('modeFat');
    const btnWireframe = document.getElementById('modeWireframe');
    
    const toggleMeasurements = document.getElementById('toggleMeasurements');
    const toggleSkeleton = document.getElementById('toggleSkeleton');
    const btnResetCamera = document.getElementById('resetCamera');

    // Upload & Drag/Drop
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const scannerOverlay = document.getElementById('scannerOverlay');
    const scanStatus = document.getElementById('scanStatus');

    // --- Tab Navigation Setup ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const activeTabContent = document.getElementById(tab.dataset.tab);
            activeTabContent.classList.add('active');

            // Trigger canvas resize when switching to 3D tab
            if (tab.dataset.tab === 'simulation-tab') {
                bodySim.onWindowResize();
            }
        });
    });

    // --- Viewport Modes Toggles ---
    const setViewModeButton = (activeBtn) => {
        [btnRealistic, btnMuscle, btnFat, btnWireframe].forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    };

    btnRealistic.addEventListener('click', () => {
        bodySim.setMode('realistic');
        setViewModeButton(btnRealistic);
    });

    btnMuscle.addEventListener('click', () => {
        bodySim.setMode('muscle');
        setViewModeButton(btnMuscle);
    });

    btnFat.addEventListener('click', () => {
        bodySim.setMode('fat');
        setViewModeButton(btnFat);
    });

    btnWireframe.addEventListener('click', () => {
        bodySim.setMode('wireframe');
        setViewModeButton(btnWireframe);
    });

    toggleMeasurements.addEventListener('change', (e) => {
        bodySim.setShowMeasurements(e.target.checked);
    });

    toggleSkeleton.addEventListener('change', (e) => {
        bodySim.setShowSkeleton(e.target.checked);
    });

    btnResetCamera.addEventListener('click', () => {
        bodySim.resetCamera();
    });

    // --- Parameter Observers & Updaters ---
    const gatherInputs = () => {
        return {
            name: inputName.value,
            gender: selectGender.value,
            age: parseInt(inputAge.value) || 25,
            goal: selectGoal.value,
            activityLevel: selectActivity.value,
            height: parseFloat(sliderHeight.value),
            weight: parseFloat(sliderWeight.value),
            bfp: parseFloat(sliderFat.value),
            smm: parseFloat(sliderMuscle.value)
        };
    };

    const updateAllDashboards = () => {
        const inputs = gatherInputs();

        // 1. Update text slider readouts
        valHeight.innerText = `${inputs.height} cm`;
        valWeight.innerText = `${inputs.weight.toFixed(1)} kg`;
        valFat.innerText = `${inputs.bfp.toFixed(1)}%`;
        valMuscle.innerText = `${inputs.smm.toFixed(1)} kg`;

        // 2. Compute health metrics
        const metrics = planner.calculateMetrics(inputs);

        // Populate bottom sidebar quick-stats
        document.getElementById('bmiVal').innerText = metrics.bmi;
        document.getElementById('ffmVal').innerText = `${metrics.ffm} kg`;
        document.getElementById('bmrVal').innerText = metrics.bmr;

        // 3. Update 3D Simulator Model
        bodySim.setParams({
            gender: inputs.gender,
            height: inputs.height,
            weight: inputs.weight,
            bfp: inputs.bfp,
            smm: inputs.smm
        });

        // 4. Update Nutrition Tab
        document.getElementById('targetCalories').innerText = `${metrics.targetCalories.toLocaleString()} Kcal`;
        document.getElementById('targetCaloriesSmall').innerText = metrics.targetCalories;
        document.getElementById('goalDescription').innerText = metrics.goalDescription;

        // Update SVG Donut Macros Chart
        const m = metrics.macros;
        document.getElementById('proteinGram').innerText = `${m.protein.grams}g`;
        document.getElementById('proteinPct').innerText = m.protein.pct;
        document.getElementById('carbsGram').innerText = `${m.carbs.grams}g`;
        document.getElementById('carbsPct').innerText = m.carbs.pct;
        document.getElementById('fatsGram').innerText = `${m.fats.grams}g`;
        document.getElementById('fatsPct').innerText = m.fats.pct;

        const pCircle = document.getElementById('svgProtein');
        const cCircle = document.getElementById('svgCarbs');
        const fCircle = document.getElementById('svgFats');

        // SVG math based on radius 15.9155 (girth circumference = 100)
        pCircle.setAttribute('stroke-dasharray', `${m.protein.pct}, 100`);
        cCircle.setAttribute('stroke-dasharray', `${m.carbs.pct}, 100`);
        cCircle.setAttribute('stroke-dashoffset', `-${m.protein.pct}`);
        fCircle.setAttribute('stroke-dasharray', `${m.fats.pct}, 100`);
        fCircle.setAttribute('stroke-dashoffset', `-${m.protein.pct + m.carbs.pct}`);

        // Generate and render meal cards
        const meals = planner.generateMealPlan(metrics.targetCalories, m);
        const mealsGrid = document.getElementById('mealsGrid');
        mealsGrid.innerHTML = '';
        
        meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'meal-card glass-panel';
            card.innerHTML = `
                <div class="meal-card-header">
                    <span class="tag">${meal.type}</span>
                    <span class="kcal">${meal.calories} Kcal</span>
                </div>
                <h4 class="meal-title">${meal.name}</h4>
                <ul class="meal-items">
                    ${meal.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
                <div class="meal-macros">
                    <span>P: ${meal.protein}g</span>
                    <span>C: ${meal.carbs}g</span>
                    <span>F: ${meal.fats}g</span>
                </div>
            `;
            mealsGrid.appendChild(card);
        });

        // 5. Update Workout Tab
        const workout = planner.generateWorkoutPlan(inputs);
        document.getElementById('splitName').innerText = workout.splitName;
        document.getElementById('splitDescription').innerText = workout.splitDesc;
        document.getElementById('weeklyDays').innerText = workout.frequency;

        document.getElementById('cardioType').innerText = workout.cardio.type;
        document.getElementById('cardioFreq').innerText = workout.cardio.frequency;
        document.getElementById('cardioDuration').innerText = workout.cardio.duration;
        document.getElementById('cardioReason').innerText = workout.cardio.reason;

        document.getElementById('hz1').innerText = workout.hrZones.hz1;
        document.getElementById('hz2').innerText = workout.hrZones.hz2;
        document.getElementById('hz3').innerText = workout.hrZones.hz3;
        document.getElementById('hz4').innerText = workout.hrZones.hz4;

        // Render workout split days
        const splitContainer = document.getElementById('workoutSplitContainer');
        splitContainer.innerHTML = '';
        workout.strengthDays.forEach(day => {
            const isRest = day.type === 'Recovery';
            const card = document.createElement('div');
            card.className = `workout-day-card glass-panel ${isRest ? 'rest-day-card' : ''}`;
            card.innerHTML = `
                <div class="day-card-title-row">
                    <h4>${day.day}</h4>
                    <span class="tag">${day.type}</span>
                </div>
                <div class="exercise-list">
                    ${day.exercises.map(ex => `
                        <div class="exercise-item">
                            <span>${ex.name}</span>
                            <strong>${ex.volume}</strong>
                        </div>
                    `).join('')}
                </div>
            `;
            splitContainer.appendChild(card);
        });
    };

    // Attach listeners to sliders & select options
    [sliderHeight, sliderWeight, sliderFat, sliderMuscle].forEach(slider => {
        slider.addEventListener('input', updateAllDashboards);
    });

    [selectGender, selectGoal, selectActivity, inputAge, inputName].forEach(input => {
        input.addEventListener('change', updateAllDashboards);
    });

    // --- Simulated OCR Scanning Logic ---
    const runSimulatedScan = () => {
        scannerOverlay.classList.add('active');
        
        const scanSteps = [
            { time: 0, text: "Scanning layout geometry..." },
            { time: 800, text: "Extracting client demographic data..." },
            { time: 1600, text: "Reading Body Composition Analysis parameters..." },
            { time: 2400, text: "Validating muscle-fat ratios..." },
            { time: 3000, text: "Completed! Compiling customized plans..." }
        ];

        scanSteps.forEach(step => {
            setTimeout(() => {
                scanStatus.innerText = step.text;
            }, step.time);
        });

        setTimeout(() => {
            scannerOverlay.classList.remove('active');
            
            // Generate a random healthy/active dataset mock
            const randomGender = Math.random() > 0.5 ? 'male' : 'female';
            const randomHeight = randomGender === 'male' ? Math.round(172 + Math.random() * 15) : Math.round(158 + Math.random() * 14);
            const randomWeight = randomGender === 'male' ? Math.round(75 + Math.random() * 25) : Math.round(55 + Math.random() * 20);
            
            // logical fat ranges (10% to 35% male, 16% to 42% female)
            const randomFat = randomGender === 'male' ? (12 + Math.random() * 20).toFixed(1) : (18 + Math.random() * 22).toFixed(1);
            
            // logical SMM ranges (roughly 35%-46% of male weight, 30%-38% of female weight)
            const smmMultiplier = randomGender === 'male' ? (0.38 + Math.random() * 0.08) : (0.31 + Math.random() * 0.06);
            const randomMuscle = (randomWeight * smmMultiplier).toFixed(1);
            
            const firstNames = ["James", "Emma", "Ryan", "Chloe", "David", "Sophia", "Marcus", "Olivia"];
            const lastNames = ["Miller", "Davis", "Carter", "Thompson", "Harris", "Walker"];
            const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            
            // Populate form values
            inputName.value = randomName;
            selectGender.value = randomGender;
            inputAge.value = Math.round(20 + Math.random() * 25);
            sliderHeight.value = randomHeight;
            sliderWeight.value = randomWeight;
            sliderFat.value = randomFat;
            sliderMuscle.value = randomMuscle;
            
            // Trigger interface update
            updateAllDashboards();
            
        }, 3400);
    };

    // Setup drag and drop events
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            runSimulatedScan();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            runSimulatedScan();
        }
    });

    // --- Initial Run to Render UI ---
    updateAllDashboards();
});

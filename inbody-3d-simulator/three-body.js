class BodySimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Body mesh parts references
        this.bodyGroup = new THREE.Group();
        this.parts = {};
        this.measurementRings = {};
        
        // Mode settings
        this.mode = 'realistic'; // 'realistic', 'muscle', 'fat', 'wireframe'
        this.showMeasurements = true;
        this.showSkeleton = false;

        // Current parameters
        this.params = {
            gender: 'male',
            height: 180,
            weight: 85,
            bfp: 22,
            smm: 38
        };

        this.init();
        this.createLighting();
        this.buildBody();
        this.createMeasurementRings();
        this.animate();

        // Listen for container resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Camera
        this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 1.2, 4.0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below ground
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 6;
        this.controls.target.set(0, 1.0, 0);
    }

    createLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);

        // Key Light - soft warm white
        const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.0);
        keyLight.position.set(2.5, 4.0, 3.5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.bias = -0.001;
        this.scene.add(keyLight);

        // Fill Light - cool ambient blue
        const fillLight = new THREE.DirectionalLight(0x80d8ff, 0.55);
        fillLight.position.set(-2.5, 2.0, 2.5);
        this.scene.add(fillLight);

        // Rim Light - high contrast highlight
        const rimLight = new THREE.DirectionalLight(0xffab40, 0.85);
        rimLight.position.set(0, 3.0, -4.0);
        this.scene.add(rimLight);

        // Ground reflection light
        const floorLight = new THREE.DirectionalLight(0xffffff, 0.15);
        floorLight.position.set(0, -3.0, 0);
        this.scene.add(floorLight);
    }

    // Material definitions based on current mode
    getMaterial(partName, isSkeleton = false) {
        if (isSkeleton) {
            return new THREE.MeshStandardMaterial({
                color: 0xe0e0e0,
                roughness: 0.7,
                metalness: 0.1,
                transparent: true,
                opacity: this.showSkeleton ? 0.9 : 0.0
            });
        }

        let wireframe = this.mode === 'wireframe';
        let color = 0xddb49f; // Realistic skin tone base
        let roughness = 0.55;
        let metalness = 0.0;
        let emissive = 0x220c06; // Subsurface scattering approximation (warm blood color under skin)

        // Adjust skin color tone based on gender/parameters slightly for realism
        if (this.params.gender === 'female') {
            color = 0xe5c3b2;
        }

        // Apply custom color filters based on modes
        if (this.mode === 'muscle') {
            // Highlight muscle groups in active electric cyan
            const muscleParts = [
                'chestUpper', 'chestLower', 'absUpper', 'shoulders', 'shoulderL', 'shoulderR', 
                'armUpperL', 'armUpperR', 'armForeL', 'armForeR', 'thighL', 'thighR', 'calfL', 'calfR'
            ];
            if (muscleParts.some(p => partName.toLowerCase().includes(p.toLowerCase()))) {
                color = 0x00f2fe;
                emissive = 0x002c3a;
                roughness = 0.25;
                metalness = 0.3;
            } else {
                color = 0x111622;
                emissive = 0x05070a;
                roughness = 0.8;
            }
        } else if (this.mode === 'fat') {
            // Highlight fat-retaining regions in active safety amber
            const fatParts = ['waist', 'hips', 'glutes', 'absLower', 'chestLower'];
            if (fatParts.some(p => partName.toLowerCase().includes(p.toLowerCase()))) {
                color = 0xffb300;
                emissive = 0x3a2500;
                roughness = 0.35;
                metalness = 0.2;
            } else {
                color = 0x111622;
                emissive = 0x05070a;
                roughness = 0.8;
            }
        }

        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness,
            metalness: metalness,
            emissive: emissive,
            wireframe: wireframe,
            transparent: true,
            opacity: this.showSkeleton ? 0.25 : 0.95
        });
    }

    // Creates contoured segments (lathe/spline curves or multi-slice cylinders) for anatomical realism
    buildBody() {
        this.scene.add(this.bodyGroup);

        const addPart = (name, geometry, relativePos, parentGroup = this.bodyGroup) => {
            const mesh = new THREE.Mesh(geometry, this.getMaterial(name));
            mesh.position.copy(relativePos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            parentGroup.add(mesh);
            this.parts[name] = mesh;
            return mesh;
        };

        // 1. Torso Segmentation (Multi-slice cylinder stacking for smooth curvature)
        // High resolution torso slices (Top to bottom)
        const slices = [
            { name: 'chestUpper', topR: 0.22, botR: 0.24, height: 0.12, y: 1.34 },
            { name: 'chestLower', topR: 0.24, botR: 0.22, height: 0.12, y: 1.22 },
            { name: 'absUpper',   topR: 0.22, botR: 0.19, height: 0.12, y: 1.10 },
            { name: 'waist',      topR: 0.19, botR: 0.20, height: 0.12, y: 0.98 },
            { name: 'absLower',   topR: 0.20, botR: 0.22, height: 0.12, y: 0.86 },
            { name: 'hips',       topR: 0.22, botR: 0.25, height: 0.14, y: 0.73 }
        ];

        slices.forEach(slice => {
            const geom = new THREE.CylinderGeometry(slice.topR, slice.botR, slice.height, 24);
            addPart(slice.name, geom, new THREE.Vector3(0, slice.y, 0));
        });

        // Gluteal region (buttocks) adding volume to hips in 3D
        const gluteGeom = new THREE.SphereGeometry(0.15, 16, 16);
        addPart('glutesL', gluteGeom, new THREE.Vector3(-0.09, 0.70, -0.07));
        addPart('glutesR', gluteGeom, new THREE.Vector3(0.09, 0.70, -0.07));

        // 2. Head and Neck
        const headGeom = new THREE.SphereGeometry(0.115, 24, 24);
        const neckGeom = new THREE.CylinderGeometry(0.062, 0.072, 0.11, 16);
        addPart('head', headGeom, new THREE.Vector3(0, 1.54, 0.01));
        addPart('neck', neckGeom, new THREE.Vector3(0, 1.44, 0));

        // 3. Realistic Contoured Limbs
        // Shoulders (Deltoids)
        const deltGeom = new THREE.SphereGeometry(0.07, 16, 16);
        addPart('shoulderL', deltGeom, new THREE.Vector3(-0.30, 1.34, 0));
        addPart('shoulderR', deltGeom, new THREE.Vector3(0.30, 1.34, 0));

        // Upper Arms (Bicep/Tricep curves)
        // Thicker in middle (tapered cylinder)
        const armUpperGeom = new THREE.CylinderGeometry(0.046, 0.040, 0.27, 16);
        addPart('armUpperL', armUpperGeom, new THREE.Vector3(-0.31, 1.17, 0));
        addPart('armUpperR', armUpperGeom, new THREE.Vector3(0.31, 1.17, 0));

        // Elbow joints
        const elbowGeom = new THREE.SphereGeometry(0.040, 12, 12);
        addPart('elbowL', elbowGeom, new THREE.Vector3(-0.31, 1.02, 0));
        addPart('elbowR', elbowGeom, new THREE.Vector3(0.31, 1.02, 0));

        // Forearms (tapering to wrist)
        const armForeGeom = new THREE.CylinderGeometry(0.040, 0.028, 0.25, 16);
        addPart('armForeL', armForeGeom, new THREE.Vector3(-0.31, 0.88, 0));
        addPart('armForeR', armForeGeom, new THREE.Vector3(0.31, 0.88, 0));

        // Wrist/Hand spheres
        const handGeom = new THREE.SphereGeometry(0.032, 12, 12);
        addPart('handL', handGeom, new THREE.Vector3(-0.31, 0.74, 0));
        addPart('handR', handGeom, new THREE.Vector3(0.31, 0.74, 0));

        // Thighs (thicker at the top)
        const thighGeom = new THREE.CylinderGeometry(0.092, 0.070, 0.40, 20);
        addPart('thighL', thighGeom, new THREE.Vector3(-0.125, 0.46, 0));
        addPart('thighR', thighGeom, new THREE.Vector3(0.125, 0.46, 0));

        // Knee joints
        const kneeGeom = new THREE.SphereGeometry(0.065, 16, 16);
        addPart('kneeL', kneeGeom, new THREE.Vector3(-0.125, 0.25, 0));
        addPart('kneeR', kneeGeom, new THREE.Vector3(0.125, 0.25, 0));

        // Calves (curved profile)
        const calfGeom = new THREE.CylinderGeometry(0.068, 0.045, 0.36, 16);
        addPart('calfL', calfGeom, new THREE.Vector3(-0.125, 0.08, 0));
        addPart('calfR', calfGeom, new THREE.Vector3(0.125, 0.08, 0));

        // Ankle/Foot
        const footGeom = new THREE.BoxGeometry(0.075, 0.055, 0.19);
        addPart('footL', footGeom, new THREE.Vector3(-0.125, -0.11, 0.04));
        addPart('footR', footGeom, new THREE.Vector3(0.125, -0.11, 0.04));

        // 4. Detailed Skeletal indicator
        const spineGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.95, 8);
        const spine = new THREE.Mesh(spineGeom, this.getMaterial('spine', true));
        spine.position.set(0, 1.1, -0.01);
        this.bodyGroup.add(spine);
        this.parts['spine'] = spine;

        const ribGeom = new THREE.TorusGeometry(0.16, 0.01, 8, 24);
        const ribUpper = new THREE.Mesh(ribGeom, this.getMaterial('ribUpper', true));
        ribUpper.position.set(0, 1.26, 0);
        ribUpper.rotation.x = Math.PI / 2;
        this.bodyGroup.add(ribUpper);
        this.parts['ribUpper'] = ribUpper;

        const ribLower = new THREE.Mesh(ribGeom, this.getMaterial('ribLower', true));
        ribLower.position.set(0, 1.14, 0);
        ribLower.rotation.x = Math.PI / 2;
        this.bodyGroup.add(ribLower);
        this.parts['ribLower'] = ribLower;

        const pelvisBoneGeom = new THREE.TorusGeometry(0.18, 0.014, 8, 24);
        const pelvisBone = new THREE.Mesh(pelvisBoneGeom, this.getMaterial('pelvisBone', true));
        pelvisBone.position.set(0, 0.76, 0);
        pelvisBone.rotation.x = Math.PI / 2;
        this.bodyGroup.add(pelvisBone);
        this.parts['pelvisBone'] = pelvisBone;
    }

    createMeasurementRings() {
        const ringMat = new THREE.LineBasicMaterial({
            color: 0x00f2fe,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });

        const drawRing = (name, yPos, colorHex) => {
            const geom = new THREE.BufferGeometry();
            const points = [];
            const segments = 64;
            const radius = 0.3; 
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(theta) * radius, yPos, Math.sin(theta) * radius));
            }
            geom.setFromPoints(points);
            
            const mat = ringMat.clone();
            mat.color.setHex(colorHex);
            
            const line = new THREE.Line(geom, mat);
            this.bodyGroup.add(line);
            this.measurementRings[name] = line;
        };

        drawRing('chest', 1.28, 0x00f2fe);
        drawRing('waist', 0.98, 0xffb300);
        drawRing('hips', 0.73, 0x9b51e0);
    }

    updateMorphology() {
        const p = this.params;

        // Base factors scaled relative to standards
        const heightScale = p.height / 175;
        const SMMRatio = p.smm / (p.weight * 0.45);
        const fatRatio = p.bfp / 100;

        let chestScale = 1.0;
        let waistScale = 1.0;
        let hipsScale = 1.0;
        let limbsScale = 1.0;
        let shoulderWidth = 1.0;

        if (p.gender === 'male') {
            // Male: Muscle widens shoulders, chest, and arms. Fat targets waist and chest.
            shoulderWidth = 1.0 + (p.smm - 30) * 0.014 + (p.weight - 70) * 0.003;
            chestScale = 1.0 + (p.smm - 30) * 0.009 + (p.bfp - 15) * 0.007 + (p.weight - 70) * 0.004;
            waistScale = 0.94 + (p.bfp - 15) * 0.018 + (p.weight - 70) * 0.006;
            hipsScale = 0.98 + (p.bfp - 15) * 0.008 + (p.weight - 70) * 0.003;
            limbsScale = 1.0 + (p.smm - 30) * 0.012 + (p.bfp - 15) * 0.004;
        } else {
            // Female: Wider hips, narrower waist. Fat goes to hips, thighs, glutes.
            shoulderWidth = 0.88 + (p.smm - 22) * 0.009 + (p.weight - 55) * 0.002;
            chestScale = 0.90 + (p.bfp - 22) * 0.011 + (p.weight - 55) * 0.003;
            waistScale = 0.85 + (p.bfp - 22) * 0.017 + (p.weight - 55) * 0.005;
            hipsScale = 1.12 + (p.bfp - 22) * 0.014 + (p.weight - 55) * 0.005;
            limbsScale = 0.88 + (p.smm - 22) * 0.009 + (p.bfp - 22) * 0.005;
        }

        // Clamp scales to prevent distortion
        chestScale = Math.max(0.65, Math.min(1.8, chestScale));
        waistScale = Math.max(0.60, Math.min(1.8, waistScale));
        hipsScale = Math.max(0.70, Math.min(2.0, hipsScale));
        limbsScale = Math.max(0.68, Math.min(1.7, limbsScale));
        shoulderWidth = Math.max(0.70, Math.min(1.7, shoulderWidth));

        // --- Apply Scales to Hierarchical Mesh ---
        
        // Height scaling (Vertical)
        this.bodyGroup.scale.set(1, heightScale, 1);

        // Keep head from stretching vertically
        this.parts['head'].scale.set(1, 1 / heightScale, 1);
        this.parts['neck'].scale.set(1, 1, 1);

        // Torso Slices Morphing
        this.parts['chestUpper'].scale.set(chestScale * 1.05 * shoulderWidth * 0.9, 1, chestScale * 0.95);
        this.parts['chestLower'].scale.set(chestScale * 1.02 * shoulderWidth * 0.95, 1, chestScale * 0.98);
        this.parts['absUpper'].scale.set(chestScale * 0.95 + waistScale * 0.05, 1, chestScale * 0.95 + waistScale * 0.05);
        this.parts['waist'].scale.set(waistScale, 1, waistScale);
        this.parts['absLower'].scale.set(waistScale * 0.9 + hipsScale * 0.1, 1, waistScale * 0.9 + hipsScale * 0.1);
        this.parts['hips'].scale.set(hipsScale, 1, hipsScale);

        // Glute volume (Female gets higher multiplier relative to fat/hips)
        const gluteVolume = hipsScale * (p.gender === 'female' ? 1.15 : 0.98);
        this.parts['glutesL'].scale.set(gluteVolume * 0.95, gluteVolume * 0.95, gluteVolume * 1.1);
        this.parts['glutesR'].scale.set(gluteVolume * 0.95, gluteVolume * 0.95, gluteVolume * 1.1);

        // Deltoids and shoulder width positioning
        const shDist = 0.30 * shoulderWidth;
        this.parts['shoulderL'].position.x = -shDist;
        this.parts['shoulderR'].position.x = shDist;
        this.parts['shoulderL'].scale.set(limbsScale * 1.05, limbsScale * 1.05, limbsScale * 1.05);
        this.parts['shoulderR'].scale.set(limbsScale * 1.05, limbsScale * 1.05, limbsScale * 1.05);

        // Arm alignment based on shoulder width
        const armXOffset = shDist + 0.01;
        this.parts['armUpperL'].position.x = -armXOffset;
        this.parts['armUpperR'].position.x = armXOffset;
        this.parts['elbowL'].position.x = -armXOffset;
        this.parts['elbowR'].position.x = armXOffset;
        this.parts['armForeL'].position.x = -armXOffset;
        this.parts['armForeR'].position.x = armXOffset;
        this.parts['handL'].position.x = -armXOffset;
        this.parts['handR'].position.x = armXOffset;

        // Arm thicknesses
        this.parts['armUpperL'].scale.set(limbsScale, 1, limbsScale);
        this.parts['armUpperR'].scale.set(limbsScale, 1, limbsScale);
        this.parts['elbowL'].scale.set(limbsScale * 0.95, limbsScale * 0.95, limbsScale * 0.95);
        this.parts['elbowR'].scale.set(limbsScale * 0.95, limbsScale * 0.95, limbsScale * 0.95);
        this.parts['armForeL'].scale.set(limbsScale * 0.9, 1, limbsScale * 0.9);
        this.parts['armForeR'].scale.set(limbsScale * 0.9, 1, limbsScale * 0.9);
        this.parts['handL'].scale.set(limbsScale * 0.85, limbsScale * 0.85, limbsScale * 0.85);
        this.parts['handR'].scale.set(limbsScale * 0.85, limbsScale * 0.85, limbsScale * 0.85);

        // Legs alignment (Adjust width dynamically relative to hips scale)
        const thighXOffset = 0.125 * Math.sqrt(hipsScale);
        this.parts['thighL'].position.x = -thighXOffset;
        this.parts['thighR'].position.x = thighXOffset;
        this.parts['kneeL'].position.x = -thighXOffset;
        this.parts['kneeR'].position.x = thighXOffset;
        this.parts['calfL'].position.x = -thighXOffset;
        this.parts['calfR'].position.x = thighXOffset;
        this.parts['footL'].position.x = -thighXOffset;
        this.parts['footR'].position.x = thighXOffset;

        // Thighs, knees, calves, feet scales
        this.parts['thighL'].scale.set(limbsScale * 1.1, 1, limbsScale * 1.1);
        this.parts['thighR'].scale.set(limbsScale * 1.1, 1, limbsScale * 1.1);
        this.parts['kneeL'].scale.set(limbsScale * 0.95, limbsScale * 0.95, limbsScale * 0.95);
        this.parts['kneeR'].scale.set(limbsScale * 0.95, limbsScale * 0.95, limbsScale * 0.95);
        this.parts['calfL'].scale.set(limbsScale * 0.9, 1, limbsScale * 0.9);
        this.parts['calfR'].scale.set(limbsScale * 0.9, 1, limbsScale * 0.9);
        
        // Prevent feet stretching vertically
        this.parts['footL'].scale.set(limbsScale * 0.9, 1 / heightScale, limbsScale * 0.9);
        this.parts['footR'].scale.set(limbsScale * 0.9, 1 / heightScale, limbsScale * 0.9);

        // --- Skeleton bone scales & visibility ---
        this.parts['spine'].material = this.getMaterial('spine', true);
        this.parts['ribUpper'].material = this.getMaterial('ribUpper', true);
        this.parts['ribLower'].material = this.getMaterial('ribLower', true);
        this.parts['pelvisBone'].material = this.getMaterial('pelvisBone', true);

        this.parts['spine'].visible = this.showSkeleton;
        this.parts['ribUpper'].visible = this.showSkeleton;
        this.parts['ribLower'].visible = this.showSkeleton;
        this.parts['pelvisBone'].visible = this.showSkeleton;

        this.parts['ribUpper'].scale.set(chestScale * 0.8, chestScale * 0.8, 1);
        this.parts['ribLower'].scale.set(chestScale * 0.75, chestScale * 0.75, 1);
        this.parts['pelvisBone'].scale.set(hipsScale * 0.85, hipsScale * 0.85, 1);

        // --- Update Measurement Rings (Virtual Tape) ---
        const updateRingGeometry = (name, baseRadius, scaleVal, yPos) => {
            const ring = this.measurementRings[name];
            if (!ring) return;

            ring.visible = this.showMeasurements;

            const points = [];
            const segments = 64;
            const finalRadius = baseRadius * scaleVal * 1.05;
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(theta) * finalRadius, yPos, Math.sin(theta) * finalRadius));
            }
            ring.geometry.dispose();
            ring.geometry = new THREE.BufferGeometry().setFromPoints(points);
        };

        // Upper chest level = 1.28
        updateRingGeometry('chest', 0.24, chestScale, 1.28);
        // Waist level = 0.98
        updateRingGeometry('waist', 0.20, waistScale, 0.98);
        // Hip level = 0.73
        updateRingGeometry('hips', 0.25, hipsScale, 0.73);

        // Refresh material properties for all outer parts
        Object.keys(this.parts).forEach(part => {
            const bones = ['spine', 'ribUpper', 'ribLower', 'pelvisBone'];
            if (!bones.includes(part)) {
                this.parts[part].material = this.getMaterial(part);
            }
        });

        // Compute simulated tape measure readouts in cm
        const chestCm = Math.round(96 * chestScale * (p.height / 175));
        const waistCm = Math.round(80 * waistScale * (p.height / 175));
        const hipsCm = Math.round(95 * hipsScale * (p.height / 175));

        document.getElementById('chestGirthVal').innerText = `${chestCm} cm`;
        document.getElementById('waistGirthVal').innerText = `${waistCm} cm`;
        document.getElementById('hipGirthVal').innerText = `${hipsCm} cm`;
    }

    setParams(newParams) {
        this.params = { ...this.params, ...newParams };
        this.updateMorphology();
    }

    setMode(mode) {
        this.mode = mode;
        this.updateMorphology();
    }

    setShowMeasurements(show) {
        this.showMeasurements = show;
        this.updateMorphology();
    }

    setShowSkeleton(show) {
        this.showSkeleton = show;
        this.updateMorphology();
    }

    resetCamera() {
        this.controls.reset();
        this.camera.position.set(0, 1.2, 4.0);
        this.controls.target.set(0, 1.0, 0);
    }

    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Slow auto-rotation when user is idle
        if (!this.controls.state == -1) {
            this.bodyGroup.rotation.y += 0.004;
        } else {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

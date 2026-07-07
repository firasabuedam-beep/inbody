class HealthPlanner {
    constructor() {
        // Base meal database with relative portion weights
        this.mealDatabase = {
            breakfast: [
                { name: "Egg White & Spinach Omelet", proteinFactor: 0.35, carbFactor: 0.15, fatFactor: 0.25, items: ["4 Large Egg Whites", "1 Whole Egg", "50g Baby Spinach", "1 Slice Whole Grain Toast", "5g Coconut Oil"] },
                { name: "High-Protein Berry Oatmeal", proteinFactor: 0.30, carbFactor: 0.40, fatFactor: 0.15, items: ["60g Rolled Oats", "1 Scoop Whey Protein Isolate", "75g Fresh Blueberries", "15g Chia Seeds", "150ml Unsweetened Almond Milk"] }
            ],
            lunch: [
                { name: "Grilled Chicken & Sweet Potato Bowl", proteinFactor: 0.40, carbFactor: 0.35, fatFactor: 0.15, items: ["150g Grilled Chicken Breast", "180g Baked Sweet Potato", "100g Steamed Broccoli", "10g Olive Oil dressing", "Fresh Herbs"] },
                { name: "Tuna Avocado Salad Wrap", proteinFactor: 0.38, carbFactor: 0.25, fatFactor: 0.22, items: ["1 Can Solid Light Tuna", "1/2 Medium Avocado", "1 Whole Wheat Tortilla Wrap", "Mixed Salad Greens", "50g Cherry Tomatoes"] }
            ],
            dinner: [
                { name: "Pan-Seared Salmon & Quinoa", proteinFactor: 0.32, carbFactor: 0.28, fatFactor: 0.35, items: ["140g Atlantic Salmon Fillet", "120g Cooked Quinoa", "120g Asparagus Spears", "Lemon Juice & Garlic", "5g Butter"] },
                { name: "Lean Sirloin Steak & Rice", proteinFactor: 0.42, carbFactor: 0.32, fatFactor: 0.20, items: ["160g Lean Sirloin Steak", "150g Cooked Jasmine Rice", "80g Sautéed Mushrooms", "100g Green Beans", "5ml Sesame Oil"] }
            ],
            snack: [
                { name: "Greek Yogurt & Almond Bowl", proteinFactor: 0.45, carbFactor: 0.15, fatFactor: 0.30, items: ["200g Non-fat Greek Yogurt", "20g Raw Almonds", "10g Raw Honey", "Dash of Cinnamon"] },
                { name: "Protein Shake & Rice Cakes", proteinFactor: 0.60, carbFactor: 0.30, fatFactor: 0.05, items: ["1.5 Scoops Whey Protein Isolate", "3 Brown Rice Cakes", "15g Natural Peanut Butter"] }
            ]
        };

        // Workout database based on split
        this.workoutSplits = {
            ppl: [
                {
                    day: "Day 1: Push (Chest, Shoulders, Triceps)",
                    type: "Strength / Hypertrophy",
                    exercises: [
                        { name: "Incline Barbell Bench Press", volume: "4 sets x 6-8 reps" },
                        { name: "Dumbbell Shoulder Press", volume: "3 sets x 8-10 reps" },
                        { name: "Chest Dips (Weighted)", volume: "3 sets x 10 reps" },
                        { name: "Cable Lateral Raises", volume: "4 sets x 12-15 reps" },
                        { name: "Overhead Dumbbell Extension", volume: "3 sets x 12 reps" }
                    ]
                },
                {
                    day: "Day 2: Pull (Back, Rear Delts, Biceps)",
                    type: "Strength / Hypertrophy",
                    exercises: [
                        { name: "Barbell Deadlift / RDL", volume: "3 sets x 5 reps" },
                        { name: "Lat Pulldown (Wide Grip)", volume: "4 sets x 8-10 reps" },
                        { name: "Chest Supported Dumbbell Row", volume: "3 sets x 10-12 reps" },
                        { name: "Face Pulls", volume: "4 sets x 15 reps" },
                        { name: "Incline Alternating Bicep Curls", volume: "3 sets x 12 reps" }
                    ]
                },
                {
                    day: "Day 3: Active Rest / LISS Cardio",
                    type: "Recovery",
                    exercises: [
                        { name: "Zone 2 Steady-State Cardio", volume: "35 mins" },
                        { name: "Dynamic Stretching & Mobility", volume: "15 mins" }
                    ]
                },
                {
                    day: "Day 4: Legs (Quads, Hamstrings, Calves)",
                    type: "Strength / Hypertrophy",
                    exercises: [
                        { name: "Barbell Back Squat", volume: "4 sets x 6-8 reps" },
                        { name: "Romanian Deadlift", volume: "3 sets x 8-10 reps" },
                        { name: "Leg Press (Foot Placement Mid)", volume: "3 sets x 10-12 reps" },
                        { name: "Leg Curls", volume: "3 sets x 12-15 reps" },
                        { name: "Standing Calf Raises", volume: "4 sets x 15 reps" }
                    ]
                },
                {
                    day: "Day 5: Upper Body (Focus & Details)",
                    type: "Hypertrophy Pump",
                    exercises: [
                        { name: "Dumbbell Flat Bench Press", volume: "3 sets x 10 reps" },
                        { name: "Barbell Rows", volume: "3 sets x 10 reps" },
                        { name: "Incline Dumbbell Flyes", volume: "3 sets x 12 reps" },
                        { name: "Hammer Curls super-setted with Skull Crushers", volume: "3 sets x 12 reps" }
                    ]
                }
            ],
            arnold: [
                {
                    day: "Day 1: Chest & Back",
                    type: "Antagonist Strength",
                    exercises: [
                        { name: "Barbell Flat Bench Press", volume: "4 sets x 6-8 reps" },
                        { name: "Weighted Pull-ups", volume: "4 sets x 8 reps" },
                        { name: "Incline Dumbbell Press", volume: "3 sets x 10 reps" },
                        { name: "Bent Over Barbell Rows", volume: "3 sets x 10 reps" },
                        { name: "Dumbbell Pullovers", volume: "3 sets x 12 reps" }
                    ]
                },
                {
                    day: "Day 2: Shoulders & Arms",
                    type: "Hypertrophy Split",
                    exercises: [
                        { name: "Barbell Overhead Press", volume: "4 sets x 6-8 reps" },
                        { name: "Standing Barbell Bicep Curls", volume: "3 sets x 10 reps" },
                        { name: "Lying French Press (EZ Bar)", volume: "3 sets x 10 reps" },
                        { name: "Dumbbell Lateral Raises", volume: "4 sets x 12 reps" },
                        { name: "Incline Hammer Curls super-setted with Rope Pushdowns", volume: "3 sets x 12 reps" }
                    ]
                },
                {
                    day: "Day 3: Legs & Abs",
                    type: "Lower Body Focus",
                    exercises: [
                        { name: "Barbell Back Squat", volume: "4 sets x 6-8 reps" },
                        { name: "Leg Curls", volume: "4 sets x 12 reps" },
                        { name: "Leg Extensions", volume: "3 sets x 15 reps" },
                        { name: "Seated Calf Raises", volume: "4 sets x 15 reps" },
                        { name: "Hanging Leg Raises", volume: "3 sets x max reps" }
                    ]
                },
                {
                    day: "Day 4: Active Rest",
                    type: "Recovery",
                    exercises: [
                        { name: "Light Yoga / Core Work", volume: "25 mins" },
                        { name: "Active Outdoor Walking", volume: "45 mins" }
                    ]
                }
            ],
            fullbody: [
                {
                    day: "Day 1: Full Body A (Heavy)",
                    type: "Compound Focus",
                    exercises: [
                        { name: "Barbell Back Squat", volume: "3 sets x 6 reps" },
                        { name: "Barbell Flat Bench Press", volume: "3 sets x 6 reps" },
                        { name: "Barbell Rows", volume: "3 sets x 8 reps" },
                        { name: "Dumbbell Shoulder Press", volume: "3 sets x 10 reps" },
                        { name: "Cable Crunch", volume: "3 sets x 15 reps" }
                    ]
                },
                {
                    day: "Day 2: Rest Day",
                    type: "Recovery",
                    exercises: [
                        { name: "Mobilization & Foam Rolling", volume: "20 mins" }
                    ]
                },
                {
                    day: "Day 3: Full Body B (Hypertrophy)",
                    type: "Moderate Load Split",
                    exercises: [
                        { name: "Romanian Deadlift", volume: "3 sets x 8-10 reps" },
                        { name: "Incline Dumbbell Press", volume: "3 sets x 10 reps" },
                        { name: "Lat Pulldown", volume: "3 sets x 10 reps" },
                        { name: "Leg Press", volume: "3 sets x 12 reps" },
                        { name: "Dumbbell Lateral Raises", volume: "3 sets x 15 reps" }
                    ]
                },
                {
                    day: "Day 4: Rest Day",
                    type: "Recovery",
                    exercises: [
                        { name: "Light Walk / Heart Health Walk", volume: "30 mins" }
                    ]
                },
                {
                    day: "Day 5: Full Body C (Power & Endurance)",
                    type: "Mixed Load Split",
                    exercises: [
                        { name: "Leg Curls", volume: "3 sets x 12 reps" },
                        { name: "Overhead Barbell Press", volume: "3 sets x 8 reps" },
                        { name: "Chest Supported Machine Row", volume: "3 sets x 12 reps" },
                        { name: "Dumbbell Bicep Curls", volume: "3 sets x 12 reps" },
                        { name: "Dips", volume: "3 sets x 10 reps" }
                    ]
                }
            ]
        };
    }

    calculateMetrics(params) {
        const { height, weight, bfp, smm, age, gender, activityLevel, goal } = params;

        // 1. Fat Free Mass (Lean Body Mass)
        const ffm = weight * (1 - bfp / 100);

        // 2. Basal Metabolic Rate (Katch-McArdle is highly specific to body composition)
        const bmr = Math.round(370 + (21.6 * ffm));

        // 3. TDEE based on activity multipliers
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725
        };
        const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

        // 4. Goal-oriented Daily Calorie Target
        let targetCalories = tdee;
        let goalDescription = "";
        
        if (goal === 'cut') {
            targetCalories = tdee - 500;
            goalDescription = "Caloric deficit designed to lose approx 0.5kg of body fat weekly while maintaining muscle.";
        } else if (goal === 'bulk') {
            targetCalories = tdee + 300;
            goalDescription = "Caloric surplus designed to build skeletal muscle mass while minimizing body fat gains.";
        } else {
            targetCalories = tdee;
            goalDescription = "Caloric maintenance optimized for body recomposition (building muscle & losing fat simultaneously).";
        }

        // Ensure calories don't drop below healthy minimums
        const absoluteMin = gender === 'male' ? 1500 : 1200;
        targetCalories = Math.max(absoluteMin, targetCalories);

        // 5. Macronutrients Breakdown
        // Protein (g): Scaled based on FFM (Fat Free Mass) to preserve or build muscle
        let proteinGrams = 0;
        if (goal === 'cut') {
            proteinGrams = Math.round(ffm * 2.5); // high protein on deficit
        } else if (goal === 'bulk') {
            proteinGrams = Math.round(ffm * 2.0); // moderate high protein on surplus
        } else {
            proteinGrams = Math.round(ffm * 2.2); // recomp standard
        }

        // Fats (g): 25% of target calories
        let fatCalories = targetCalories * 0.25;
        let fatGrams = Math.round(fatCalories / 9);

        // Carbs (g): Remainder of calories
        let proteinCalories = proteinGrams * 4;
        let carbCalories = targetCalories - (proteinCalories + fatCalories);
        let carbGrams = Math.round(carbCalories / 4);

        // Percentages
        let proteinPct = Math.round((proteinCalories / targetCalories) * 100);
        let fatPct = 25;
        let carbPct = 100 - (proteinPct + fatPct);

        // 6. BMI
        const heightMeters = height / 100;
        const bmi = (weight / (heightMeters * heightMeters)).toFixed(1);

        return {
            ffm: ffm.toFixed(1),
            bmr,
            tdee,
            targetCalories,
            goalDescription,
            bmi,
            macros: {
                protein: { grams: proteinGrams, pct: proteinPct },
                carbs: { grams: carbGrams, pct: carbPct },
                fats: { grams: fatGrams, pct: fatPct }
            }
        };
    }

    generateMealPlan(targetCalories, macros) {
        // Distribute calories across 4 meals:
        // Breakfast (25%), Lunch (30%), Dinner (30%), Snack (15%)
        const mealsConfig = [
            { type: 'Breakfast', pct: 0.25, db: this.mealDatabase.breakfast },
            { type: 'Lunch', pct: 0.30, db: this.mealDatabase.lunch },
            { type: 'Dinner', pct: 0.30, db: this.mealDatabase.dinner },
            { type: 'Snack', pct: 0.15, db: this.mealDatabase.snack }
        ];

        // Randomly select one recipe from database for each meal
        const seed = Math.floor(Math.random() * 2);

        return mealsConfig.map(meal => {
            const mealCalories = Math.round(targetCalories * meal.pct);
            const recipe = meal.db[seed % meal.db.length];
            
            // Scaled macros for this specific meal
            const mealP = Math.round((mealCalories * (macros.protein.pct / 100)) / 4);
            const mealC = Math.round((mealCalories * (macros.carbs.pct / 100)) / 4);
            const mealF = Math.round((mealCalories * (macros.fats.pct / 100)) / 9);

            return {
                type: meal.type,
                name: recipe.name,
                calories: mealCalories,
                protein: mealP,
                carbs: mealC,
                fats: mealF,
                items: recipe.items
            };
        });
    }

    generateWorkoutPlan(params) {
        const { smm, weight, bfp, goal, age } = params;

        // Choose Strength Split based on muscle mass & goals
        // If SMM relative to weight is very low, fullbody is great for beginners. High SMM can handle PPL or Arnold.
        const smmRatio = smm / weight;
        let splitType = 'ppl';
        let splitName = "Push / Pull / Legs (PPL)";
        let splitDesc = "Classic high-frequency split targeting muscle hypertrophy. Allows optimal volume and structural recovery.";
        let frequency = "4-5 Days / week";

        if (smmRatio < 0.38) {
            splitType = 'fullbody';
            splitName = "Full Body Compound Split";
            splitDesc = "Tailored for base strength building. Compound lifts trigger full body anabolic response, perfect for correcting lower SMM.";
            frequency = "3 Days / week";
        } else if (goal === 'bulk') {
            splitType = 'arnold';
            splitName = "Arnold Golden Era Split";
            splitDesc = "High-volume split linking opposing muscle groups (Chest/Back, Shoulders/Arms). Ideal for seasoned lifters building mass.";
            frequency = "5-6 Days / week";
        }

        const strengthDays = this.workoutSplits[splitType];

        // 2. Cardio recommendations based on Fat %
        let cardioType = "Steady State Cardio (LISS)";
        let cardioFreq = "2-3x per week";
        let cardioDuration = "20-30 mins";
        let cardioReason = "";

        if (bfp > 28) {
            cardioType = "Fast Walking / LISS Cardio";
            cardioFreq = "4-5x per week";
            cardioDuration = "35-45 mins";
            cardioReason = `With body fat at ${bfp}%, high-volume Low-Intensity Steady State (LISS) cardio is prescribed in the fat-burning zone to maximize caloric expenditure without adding joint stress.`;
        } else if (bfp >= 18 && bfp <= 28) {
            cardioType = "HIIT + LISS Mixed Cardio";
            cardioFreq = "3x per week";
            cardioDuration = "25-35 mins";
            cardioReason = `Based on your body fat of ${bfp}%, a mixture of High Intensity Interval Training (HIIT) for cardiovascular capacity and LISS for lipid mobilization is recommended.`;
        } else {
            cardioType = "Performance LISS Cardio";
            cardioFreq = "2x per week";
            cardioDuration = "20 mins";
            cardioReason = `At ${bfp}% body fat, cardio volume is minimized to protect existing skeletal muscle mass and support muscle recovery. focus on cardiovascular health.`;
        }

        // 3. Heart Rate Zones based on age (Karvonen formula approximation)
        const maxHR = 220 - age;
        const hz1 = `${Math.round(maxHR * 0.5)} - ${Math.round(maxHR * 0.6)} bpm`;
        const hz2 = `${Math.round(maxHR * 0.65)} - ${Math.round(maxHR * 0.75)} bpm`;
        const hz3 = `${Math.round(maxHR * 0.75)} - ${Math.round(maxHR * 0.85)} bpm`;
        const hz4 = `${Math.round(maxHR * 0.85)} - ${Math.round(maxHR * 0.95)} bpm`;

        return {
            splitName,
            splitDesc,
            frequency,
            strengthDays,
            cardio: {
                type: cardioType,
                frequency: cardioFreq,
                duration: cardioDuration,
                reason: cardioReason
            },
            hrZones: { hz1, hz2, hz3, hz4 }
        };
    }
}

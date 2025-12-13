function StepInstructions({ step = 0 }) {
    const instructions = [
        {
            title: 'Step 1: Standing Position',
            description: 'Stand straight with feet shoulder-width apart. Look at the camera.',
        },
        {
            title: 'Step 2: Single Leg Balance',
            description: 'Balance on your affected leg for 30 seconds. Keep your arms at your sides.',
        },
        {
            title: 'Step 3: Squat Movement',
            description: 'Perform a controlled squat. Lower yourself slowly and return to standing.',
        },
        {
            title: 'Step 4: Landing Test',
            description: 'Jump forward and land on both feet. Maintain balance upon landing.',
        },
    ];

    const currentInstruction = instructions[step] || instructions[0];

    return (
        <div className="step-instructions">
            <h3>{currentInstruction.title}</h3>
            <p>{currentInstruction.description}</p>
            <div className="progress">
                Step {step + 1} of {instructions.length}
            </div>
        </div>
    );
}

export default StepInstructions;

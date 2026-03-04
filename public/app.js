document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const btnText = startBtn.querySelector('.btn-text');
    const spinner = startBtn.querySelector('.loader');
    const continueBtn = document.getElementById('continueToInstructionsBtn');
    const instructionSection = document.getElementById('instructionSection');
    const configSection = document.getElementById('configSection');
    const statusSection = document.getElementById('statusSection');
    
    const statusTitle = document.getElementById('statusTitle');
    const statusDesc = document.getElementById('statusDesc');
    const progressFill = document.getElementById('progressFill');
    const downloadSection = document.getElementById('downloadSection');
    const downloadBtn = document.getElementById('downloadBtn');

    // Dynamic Preview Logic
    const dummyData = {
        name: 'CPT204-Tutorial-D1/2',
        activityType: 'Tutorial',
        moduleId: 'CPT204',
        staff: 'John Doe, Jane Smith',
        location: 'SIP-SB123',
        week: 2
    };

    function processTemplate(template, data) {
        if (!template) return '';
        return template.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    function updatePreviews() {
        const titleVal = document.getElementById('titleInput').value;
        const locVal = document.getElementById('locationInput').value;
        const descVal = document.getElementById('descInput').value;

        document.getElementById('titlePreview').textContent = processTemplate(titleVal, dummyData);
        document.getElementById('locationPreview').textContent = processTemplate(locVal, dummyData);
        document.getElementById('descPreview').textContent = processTemplate(descVal, dummyData);
    }

    document.getElementById('titleInput').addEventListener('input', updatePreviews);
    document.getElementById('locationInput').addEventListener('input', updatePreviews);
    document.getElementById('descInput').addEventListener('input', updatePreviews);

    // Initial update
    updatePreviews();

    const enableReminderCheckbox = document.getElementById('enableReminder');
    const reminderInputContainer = document.getElementById('reminderInputContainer');

    enableReminderCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            reminderInputContainer.classList.remove('hidden');
        } else {
            reminderInputContainer.classList.add('hidden');
        }
    });

    continueBtn.addEventListener('click', () => {
        configSection.classList.add('hidden');
        instructionSection.classList.remove('hidden');
    });

    startBtn.addEventListener('click', async () => {
        const semesterChosen = document.getElementById('semesterSelect').value;
        const reminderMinutes = document.getElementById('reminderInput').value;
        const titleTemplate = document.getElementById('titleInput').value;
        const locationTemplate = document.getElementById('locationInput').value;
        const descTemplate = document.getElementById('descInput').value;

        const enableReminder = document.getElementById('enableReminder').checked;

        // UI Update
        btnText.textContent = 'Connecting...';
        spinner.classList.remove('hidden');
        startBtn.disabled = true;

        try {
            // Initiate the scraping API
            const response = await fetch('/api/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    semesterIndex: parseInt(semesterChosen),
                    enableReminder,
                    reminder: parseInt(reminderMinutes) || 15,
                    titleTemplate,
                    locationTemplate,
                    descTemplate
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start the process.');
            }

            const data = await response.json();
            
            // Switch UI views
            instructionSection.classList.add('hidden');
            statusSection.classList.remove('hidden');

            // Start listening to SSE for progress
            const eventSource = new EventSource('/api/status');

            eventSource.onmessage = (event) => {
                const status = JSON.parse(event.data);
                
                statusTitle.textContent = status.title;
                statusDesc.textContent = status.message;
                progressFill.style.width = `${status.progress}%`;

                if (status.state === 'complete') {
                    eventSource.close();
                    progressFill.style.backgroundColor = 'hsl(var(--primary))'; // or a green tone
                    downloadSection.classList.remove('hidden');
                    downloadBtn.href = status.downloadUrl;
                } else if (status.state === 'error') {
                    eventSource.close();
                    progressFill.style.backgroundColor = 'hsl(var(--destructive))';
                    statusTitle.style.color = 'hsl(var(--destructive))';
                }
            };
            
            eventSource.onerror = () => {
                console.error('SSE Error occurred');
            };

        } catch (error) {
            console.error(error);
            btnText.textContent = 'Connect E-Bridge';
            spinner.classList.add('hidden');
            startBtn.disabled = false;
            alert('Could not connect to the backend server.');
        }
    });
});

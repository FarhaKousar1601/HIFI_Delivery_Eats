let currentStep = 0;

function trackOrder() {
    const steps = document.querySelectorAll(".tracking-step");
    const progress = document.querySelector(".progress");

    if (currentStep < steps.length) {
        steps[currentStep].classList.add("active");
        progress.style.width = `${(currentStep + 1) * 25}%`;
        currentStep++;
    }
}

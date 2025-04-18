// DOM Elements
const editToggleBtn = document.getElementById('edit-toggle-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editButtons = document.getElementById('edit-buttons');
const profileForm = document.getElementById('profile-form');
const formInputs = profileForm.querySelectorAll('input, textarea, select');
const imageUploadBtn = document.getElementById('image-upload-btn');
const profileImageInput = document.getElementById('profile-image-input');
const profileImg = document.getElementById('profile-img');
const toast = document.getElementById('toast');

let originalFormValues = {};

// Initialize: disable inputs (read-only view)
disableEditMode();

function enableEditMode() {
    storeOriginalValues();
    formInputs.forEach(input => {
        input.disabled = false;
    });
    // Make sure the file input container is visible.
    imageUploadBtn.classList.remove('hidden');
    editButtons.classList.remove('hidden');
    
    // Change button text to "Save"
    editToggleBtn.innerHTML = `
        <svg class="btn-icon icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path>
        </svg>
        Save
    `;
}

function disableEditMode() {
    formInputs.forEach(input => {
        input.disabled = true;
    });
    editButtons.classList.add('hidden');
    imageUploadBtn.classList.add('hidden');
    
    // Change button back to "Edit"
    editToggleBtn.innerHTML = `
        <svg class="btn-icon icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
        </svg>
        Edit
    `;
}

function storeOriginalValues() {
    originalFormValues = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        deliveryArea: document.getElementById('deliveryArea').value,
        bio: document.getElementById('bio').value,
        available: document.getElementById('available').checked,
        profileImage: profileImg.src
    };
}

function restoreOriginalValues() {
    document.getElementById('name').value = originalFormValues.name;
    document.getElementById('email').value = originalFormValues.email;
    document.getElementById('phone').value = originalFormValues.phone;
    document.getElementById('deliveryArea').value = originalFormValues.deliveryArea;
    document.getElementById('bio').value = originalFormValues.bio;
    document.getElementById('available').checked = originalFormValues.available;
    profileImg.src = originalFormValues.profileImage;
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Event Listeners
editToggleBtn.addEventListener('click', () => {
    // If button shows "Edit", enter edit mode; if it shows "Save", submit the form.
    if (editToggleBtn.textContent.trim() === "Edit") {
        enableEditMode();
    } else {
        // Ensure all inputs are enabled before submitting.
        formInputs.forEach(input => input.disabled = false);
        profileForm.submit();
    }
});

cancelBtn.addEventListener('click', () => {
    restoreOriginalValues();
    disableEditMode();
});

// Preview updated profile image when a file is selected.
profileImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            profileImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

(function () {
  const form = document.getElementById('addAddressForm');
  const toggleBtn = document.getElementById('toggleAddAddress');
  const submitBtn = document.getElementById('addrSubmitBtn');
  if (!form) return;

  const fields = {
    id: document.getElementById('addrIdField'),
    label: document.getElementById('addrLabelField'),
    full_name: document.getElementById('addrFullNameField'),
    phone: document.getElementById('addrPhoneField'),
    line1: document.getElementById('addrLine1Field'),
    line2: document.getElementById('addrLine2Field'),
    city: document.getElementById('addrCityField'),
    state: document.getElementById('addrStateField'),
    pincode: document.getElementById('addrPincodeField'),
    is_default: document.getElementById('addrIsDefaultField'),
  };

  // Hidden by default; shown when the person clicks "+ Add New Address" or "Edit".
  form.style.display = 'none';

  function resetForm() {
    form.reset();
    fields.id.value = '';
    submitBtn.textContent = 'Save Address';
  }

  function openForm() {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  toggleBtn && toggleBtn.addEventListener('click', () => {
    const isHidden = form.style.display === 'none';
    if (isHidden) {
      resetForm();
      openForm();
    } else {
      form.style.display = 'none';
    }
  });

  document.querySelectorAll('.edit-address-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      fields.id.value = btn.dataset.id;
      fields.label.value = btn.dataset.label;
      fields.full_name.value = btn.dataset.fullName;
      fields.phone.value = btn.dataset.phone;
      fields.line1.value = btn.dataset.line1;
      fields.line2.value = btn.dataset.line2;
      fields.city.value = btn.dataset.city;
      fields.state.value = btn.dataset.state;
      fields.pincode.value = btn.dataset.pincode;
      fields.is_default.checked = btn.dataset.isDefault === '1';
      submitBtn.textContent = 'Update Address';
      openForm();
    });
  });

  // Live preview of the profile photo before it's uploaded.
  const avatarInput = document.querySelector('.avatar-upload-btn input[type="file"]');
  const avatarPreview = document.querySelector('.avatar-preview');
  avatarInput && avatarInput.addEventListener('change', () => {
    const file = avatarInput.files && avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarPreview.innerHTML = `<img src="${reader.result}" alt="Profile photo preview">`;
    };
    reader.readAsDataURL(file);
  });
})();

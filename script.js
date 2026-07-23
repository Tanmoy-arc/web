let products = [];
let isAdmin = false;
let cropper = null;

const navBtns = document.querySelectorAll('.nav-btn[data-page]');
const pageSections = document.querySelectorAll('.page-section');
const homeProductRow = document.getElementById('homeProductRow');
const mainProductGrid = document.getElementById('mainProductGrid');
const productCountText = document.getElementById('productCountText');
const btnSeeAll = document.getElementById('btnSeeAll');

const loginModal = document.getElementById('loginModal');
const btnOpenLogin = document.getElementById('btnOpenLogin');
const btnCloseLogin = document.getElementById('btnCloseLogin');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const uploadModal = document.getElementById('uploadModal');
const btnOpenUpload = document.getElementById('btnOpenUpload');
const btnCloseUpload = document.getElementById('btnCloseUpload');
const uploadForm = document.getElementById('uploadForm');
const prodImageInput = document.getElementById('prodImage');
const cropArea = document.getElementById('cropArea');
const imageToCrop = document.getElementById('imageToCrop');

async function loadProducts() {
  try {
    const response = await fetch('data/products.json');
    if (response.ok) {
      products = await response.json();
    } else {
      const fallbackResponse = await fetch('products.json');
      if (fallbackResponse.ok) {
        products = await fallbackResponse.json();
      }
    }
  } catch (e) {
    products = JSON.parse(localStorage.getItem('noor_products')) || [];
  }
  renderProducts();
}

function navigateTo(pageId) {
  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
  });

  pageSections.forEach(section => {
    section.classList.toggle('active', section.id === `${pageId}Page`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.getAttribute('data-page'));
  });
});

if (btnSeeAll) {
  btnSeeAll.addEventListener('click', () => navigateTo('products'));
}

function exportProductsFile() {
  localStorage.setItem('noor_products', JSON.stringify(products));
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "products.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function renderProducts() {
  homeProductRow.innerHTML = '';
  const homeItems = products.slice(0, 4);

  if (homeItems.length === 0) {
    homeProductRow.innerHTML = `<p style="color: #8c93a0; grid-column: 1/-1;">No products available yet.</p>`;
  } else {
    homeItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${item.image}" alt="${item.title}" class="product-img">
        </div>
        <div class="card-content">
          <h3 class="product-title">${item.title}</h3>
          <p class="product-description">${item.desc}</p>
        </div>
        ${isAdmin ? `<div class="product-footer"><button class="btn-delete" onclick="deleteProduct('${item.id}')">Delete</button></div>` : ''}
      `;
      homeProductRow.appendChild(card);
    });
  }

  mainProductGrid.innerHTML = '';
  productCountText.textContent = `${products.length} items found`;

  if (products.length === 0) {
    mainProductGrid.innerHTML = `<p style="color: #8c93a0; grid-column: 1/-1;">No products found in catalogue.</p>`;
  } else {
    products.forEach(item => {
      const card = document.createElement('div');
      card.className = 'grid-card';
      card.innerHTML = `
        <div class="grid-image-box">
          <img src="${item.image}" alt="${item.title}" class="grid-img">
        </div>
        <div class="grid-card-info">
          <div class="grid-title-wrapper">
            <h4 class="grid-title">${item.title}</h4>
          </div>
          <div class="grid-actions">
            ${isAdmin ? `<button class="btn-delete" onclick="deleteProduct('${item.id}')">Delete</button>` : ''}
          </div>
        </div>
      `;
      mainProductGrid.appendChild(card);
    });
  }
}

btnOpenLogin.addEventListener('click', () => {
  if (isAdmin) {
    isAdmin = false;
    btnOpenLogin.textContent = 'Login';
    btnOpenLogin.classList.remove('logout');
    btnOpenUpload.classList.add('hidden');
    renderProducts();
  } else {
    loginModal.classList.add('active');
  }
});

btnCloseLogin.addEventListener('click', () => {
  loginModal.classList.remove('active');
  loginError.classList.add('hidden');
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('userId').value.trim();
  const pass = document.getElementById('userPassword').value.trim();

  if (id === 'tanmoy' && pass === 'tanmoy') {
    isAdmin = true;
    loginModal.classList.remove('active');
    loginForm.reset();
    loginError.classList.add('hidden');

    btnOpenLogin.textContent = 'Logout';
    btnOpenUpload.classList.remove('hidden');

    renderProducts();
  } else {
    loginError.classList.remove('hidden');
  }
});

btnOpenUpload.addEventListener('click', () => {
  uploadModal.classList.add('active');
});

btnCloseUpload.addEventListener('click', () => {
  destroyCropper();
  uploadModal.classList.remove('active');
  uploadForm.reset();
});

prodImageInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      imageToCrop.src = event.target.result;
      cropArea.classList.remove('hidden');

      destroyCropper();

      cropper = new Cropper(imageToCrop, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        autoCropArea: 0.9,
      });
    };

    reader.readAsDataURL(file);
  }
});

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  cropArea.classList.add('hidden');
}

uploadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('prodTitle').value.trim();
  const desc = document.getElementById('prodDesc').value.trim();
  let imageBase64 = "https://via.placeholder.com/300x300/1e1e24/ffffff?text=No+Image";

  if (cropper) {
    const canvas = cropper.getCroppedCanvas({
      width: 400,
      height: 400,
    });
    imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
  }

  const newProd = {
    id: Date.now().toString(),
    title,
    desc,
    image: imageBase64
  };

  products.unshift(newProd);
  renderProducts();

  destroyCropper();
  uploadForm.reset();
  uploadModal.classList.remove('active');
  
  exportProductsFile();
});

window.deleteProduct = function(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    products = products.filter(p => p.id !== id);
    renderProducts();
    exportProductsFile();
  }
};

loadProducts();

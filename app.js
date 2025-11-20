// Claves de almacenamiento
const STORAGE_PRODUCTS = 'tejidos-products';
const STORAGE_CART = 'tejidos-cart';
const STORAGE_OWNER = 'tejidos-owner';

// Credenciales dueño (podés cambiarlas)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1234';

// Helper: ID único
const generateId = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Productos iniciales
const defaultProducts = [
  {
    id: generateId(),
    name: 'Juego de sábanas algodón 400 hilos',
    description: 'Tejido satinado, tacto sedoso y respirable. Incluye funda reversible.',
    price: 42999,
    stock: 8,
    image:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: generateId(),
    name: 'Edredón de lino premium',
    description: 'Relleno hipoalergénico anti ácaros. Ideal para todas las estaciones.',
    price: 59999,
    stock: 5,
    image:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: generateId(),
    name: 'Manta tejida a mano',
    description: 'Hilado grueso, súper abrigada. Ideal para pie de cama o sillón.',
    price: 32999,
    stock: 10,
    image:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: generateId(),
    name: 'Almohadas viscoelásticas',
    description: 'Pack x2 almohadas memory foam, funda de algodón extraíble.',
    price: 25999,
    stock: 12,
    image:
      'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=900&q=80',
  },
];

// Estado principal
const state = {
  products: JSON.parse(localStorage.getItem(STORAGE_PRODUCTS)) ?? defaultProducts,
  cart: JSON.parse(localStorage.getItem(STORAGE_CART)) ?? [],
  isOwner: localStorage.getItem(STORAGE_OWNER) === 'true',
};

// Referencias DOM (pueden ser null según la página)
const productList = document.getElementById('product-list');
const productCount = document.getElementById('product-count');
const productForm = document.getElementById('product-form');

const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const emptyCart = document.getElementById('empty-cart');
const checkoutAlert = document.getElementById('checkout-alert');

const statProducts = document.getElementById('stat-products');
const statStock = document.getElementById('stat-stock');
const statValue = document.getElementById('stat-value');

const yearEl = document.getElementById('year');

// Login dueño (solo existe en admin.html)
const btnOwnerLogin = document.getElementById('btn-owner-login');
const btnOwnerLogout = document.getElementById('btn-owner-logout');
const loginOverlay = document.getElementById('owner-login-overlay');
const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginCancel = document.getElementById('login-cancel');
const loginError = document.getElementById('login-error');

// Helpers
const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

const persistState = () => {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(state.products));
  localStorage.setItem(STORAGE_CART, JSON.stringify(state.cart));
  localStorage.setItem(STORAGE_OWNER, state.isOwner ? 'true' : 'false');
};

// Actualizar UI según si es dueño o no
const updateOwnerUI = () => {
  document.querySelectorAll('.owner-only').forEach((el) => {
    el.classList.toggle('d-none', !state.isOwner);
  });

  if (btnOwnerLogin && btnOwnerLogout) {
    btnOwnerLogin.classList.toggle('d-none', state.isOwner);
    btnOwnerLogout.classList.toggle('d-none', !state.isOwner);
  }

  renderProducts();
};

// Render catálogo
const renderProducts = () => {
  if (!productList) return; // página que no tiene catálogo

  if (!state.products.length) {
    productList.innerHTML =
      '<div class="col"><div class="alert alert-info mb-0">No hay productos cargados.</div></div>';
    if (productCount) productCount.textContent = '0 productos';
    return;
  }

  productList.innerHTML = state.products
    .map((product) => {
      const canAdd = product.stock > 0;
      const inCart = state.cart.find((i) => i.id === product.id);
      const quantityInCart = inCart ? inCart.quantity : 0;
      const addDisabled = !canAdd || quantityInCart >= product.stock;

      return `
      <div class="col-md-6 col-lg-4">
        <div class="card product-card h-100">
          <img
            src="${product.image ||
              'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=800&q=80'}"
            class="card-img-top"
            alt="${product.name}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between mb-2">
              <h5 class="card-title mb-0">${product.name}</h5>
              <span class="badge bg-light text-dark">${product.stock} u.</span>
            </div>
            <p class="card-text flex-grow-1 text-muted">${product.description}</p>
            <div class="fw-bold fs-5 mb-3">${formatCurrency(product.price)}</div>
            <div class="d-flex gap-2">
              ${
                state.isOwner
                  ? `<button class="btn btn-outline-secondary w-100" data-action="remove-product" data-id="${product.id}">Eliminar</button>`
                  : `<button class="btn btn-primary w-100" data-action="add-to-cart" data-id="${product.id}" ${
                      addDisabled ? 'disabled' : ''
                    }>Agregar</button>`
              }
            </div>
          </div>
        </div>
      </div>`;
    })
    .join('');

  if (productCount) {
    productCount.textContent = `${state.products.length} ${
      state.products.length === 1 ? 'producto' : 'productos'
    }`;
  }
};

// Render carrito
const renderCart = () => {
  if (!cartItems || !cartTotal || !cartCount || !emptyCart) return;

  if (!state.cart.length) {
    cartItems.innerHTML = '';
    emptyCart.classList.remove('d-none');
    cartCount.textContent = '0 artículos';
    cartTotal.textContent = '$0';
    return;
  }

  emptyCart.classList.add('d-none');

  cartItems.innerHTML = state.cart
    .map(
      (item) => `
    <li class="list-group-item d-flex justify-content-between align-items-start py-3">
      <div class="me-auto">
        <div class="fw-semibold">${item.name}</div>
        <small class="text-muted">x${item.quantity} · ${formatCurrency(item.price)}</small>
      </div>
      <div class="d-flex align-items-center gap-2">
        <input
          type="number"
          min="1"
          step="1"
          data-action="update-qty"
          data-id="${item.id}"
          value="${item.quantity}"
          class="form-control form-control-sm"
          style="width: 70px;">
        <button class="btn btn-sm btn-link text-danger"
          data-action="remove-from-cart"
          data-id="${item.id}">
          Quitar
        </button>
      </div>
    </li>`
    )
    .join('');

  const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = state.cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  cartCount.textContent = `${totalItems} ${
    totalItems === 1 ? 'artículo' : 'artículos'
  }`;
  cartTotal.textContent = formatCurrency(totalPrice);
};

// Stats
const updateStats = () => {
  if (!statProducts || !statStock || !statValue) return;
  const totalStock = state.products.reduce(
    (acc, prod) => acc + Number(prod.stock || 0),
    0
  );
  const totalValue = state.products.reduce(
    (acc, prod) => acc + prod.price * (prod.stock || 0),
    0
  );

  statProducts.textContent = state.products.length;
  statStock.textContent = totalStock;
  statValue.textContent = formatCurrency(totalValue);
};

// Productos
const addProduct = ({ name, description, price, stock, image }) => {
  const product = {
    id: generateId(),
    name,
    description,
    price,
    stock,
    image,
  };
  state.products.push(product);
  persistState();
  renderProducts();
  updateStats();
};

const removeProduct = (id) => {
  state.products = state.products.filter((p) => p.id !== id);
  state.cart = state.cart.filter((c) => c.id !== id);
  persistState();
  renderProducts();
  renderCart();
  updateStats();
};

// Carrito
const addToCart = (id) => {
  const product = state.products.find((p) => p.id === id);
  if (!product || product.stock <= 0) return;

  const existing = state.cart.find((i) => i.id === id);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty >= product.stock) return;

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }
  persistState();
  renderCart();
  renderProducts();
};

const updateCartQuantity = (id, quantity) => {
  const item = state.cart.find((i) => i.id === id);
  const product = state.products.find((p) => p.id === id);
  if (!item || !product) return;

  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }

  item.quantity = Math.min(quantity, product.stock);
  persistState();
  renderCart();
  renderProducts();
};

const removeFromCart = (id) => {
  state.cart = state.cart.filter((i) => i.id !== id);
  persistState();
  renderCart();
  renderProducts();
};

const clearCart = () => {
  state.cart = [];
  persistState();
  renderCart();
  renderProducts();
};

// EVENTOS

// Formulario producto (solo admin.html)
if (productForm) {
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!productForm.checkValidity()) {
      productForm.classList.add('was-validated');
      return;
    }

    const name = document.getElementById('productName').value.trim();
    const description = document
      .getElementById('productDescription')
      .value.trim();
    const price = Number(document.getElementById('productPrice').value);
    const stock = Number(document.getElementById('productStock').value);
    const image = document.getElementById('productImage').value.trim();

    if (!name || !description || price < 0 || stock < 0) return;

    addProduct({
      name,
      description,
      price,
      stock,
      image: image || '',
    });

    productForm.reset();
    productForm.classList.remove('was-validated');
  });
}

// Click en tarjetas de productos
if (productList) {
  productList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const { action, id } = btn.dataset;

    if (action === 'add-to-cart') {
      addToCart(id);
    } else if (action === 'remove-product' && state.isOwner) {
      removeProduct(id);
    }
  });
}

// Carrito
if (cartItems) {
  cartItems.addEventListener('input', (e) => {
    if (e.target.dataset.action !== 'update-qty') return;
    const quantity = Number(e.target.value);
    updateCartQuantity(e.target.dataset.id, quantity);
  });

  cartItems.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="remove-from-cart"]');
    if (!btn) return;
    removeFromCart(btn.dataset.id);
  });
}

const clearCartBtn = document.getElementById('clear-cart');
if (clearCartBtn) {
  clearCartBtn.addEventListener('click', clearCart);
}

const checkoutBtn = document.getElementById('checkout');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (!state.cart.length) return;

    if (checkoutAlert) {
      checkoutAlert.classList.remove('d-none');
      setTimeout(() => checkoutAlert.classList.add('d-none'), 2500);
    }

    clearCart();
  });
}

// Login dueño (solo admin.html)
const openLoginOverlay = () => {
  if (!loginOverlay) return;
  loginOverlay.classList.remove('d-none');
  if (loginError) loginError.classList.add('d-none');
  if (loginUsername) loginUsername.value = '';
  if (loginPassword) loginPassword.value = '';
  if (loginUsername) loginUsername.focus();
};

const closeLoginOverlay = () => {
  if (!loginOverlay) return;
  loginOverlay.classList.add('d-none');
};

if (btnOwnerLogin) {
  btnOwnerLogin.addEventListener('click', openLoginOverlay);
}

if (btnOwnerLogout) {
  btnOwnerLogout.addEventListener('click', () => {
    state.isOwner = false;
    persistState();
    updateOwnerUI();
  });
}

if (loginCancel) {
  loginCancel.addEventListener('click', closeLoginOverlay);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = loginUsername.value.trim();
    const pass = loginPassword.value.trim();

    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      state.isOwner = true;
      persistState();
      closeLoginOverlay();
      updateOwnerUI();
    } else if (loginError) {
      loginError.classList.remove('d-none');
    }
  });
}

// Cerrar login haciendo click fuera de la tarjeta
if (loginOverlay) {
  loginOverlay.addEventListener('click', (e) => {
    if (e.target === loginOverlay) {
      closeLoginOverlay();
    }
  });
}

// Inicialización
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

updateOwnerUI();
renderCart();
updateStats();

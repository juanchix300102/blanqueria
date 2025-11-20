const storageKey = 'tejidos-products';
const cartKey = 'tejidos-cart';
const modeKey = 'tejidos-mode';

// ID simple para productos
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
        image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: generateId(),
        name: 'Edredón de lino premium',
        description: 'Relleno hipoalergénico anti ácaros. Ideal para todas las estaciones.',
        price: 59999,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: generateId(),
        name: 'Manta tejida a mano',
        description: 'Hilado grueso, súper abrigada. Ideal para pie de cama o sillón.',
        price: 32999,
        stock: 10,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: generateId(),
        name: 'Almohadas viscoelásticas',
        description: 'Pack x2 almohadas memory foam, funda de algodón extraíble.',
        price: 25999,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=900&q=80'
    }
];

// Estado principal
const state = {
    products: JSON.parse(localStorage.getItem(storageKey)) ?? defaultProducts,
    cart: JSON.parse(localStorage.getItem(cartKey)) ?? [],
    mode: localStorage.getItem(modeKey) ?? 'buyer' // buyer | owner
};

// Referencias DOM
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

const btnBuyer = document.getElementById('btn-buyer');
const btnOwner = document.getElementById('btn-owner');

// Formato de moneda
const formatCurrency = value =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(value);

// Guardar en localStorage
function persistState() {
    localStorage.setItem(storageKey, JSON.stringify(state.products));
    localStorage.setItem(cartKey, JSON.stringify(state.cart));
    localStorage.setItem(modeKey, state.mode);
}

// Cambiar modo (Dueño / Comprador)
function setMode(mode) {
    state.mode = mode;
    localStorage.setItem(modeKey, mode);

    if (btnBuyer && btnOwner) {
        btnBuyer.classList.toggle('active', mode === 'buyer');
        btnOwner.classList.toggle('active', mode === 'owner');
    }

    document.querySelectorAll('.buyer-only').forEach(el => {
        el.classList.toggle('d-none', mode === 'owner');
    });

    document.querySelectorAll('.owner-only').forEach(el => {
        el.classList.toggle('d-none', mode === 'buyer');
    });

    renderProducts();
}

// Pintar catálogo
function renderProducts() {
    if (!state.products.length) {
        productList.innerHTML =
            '<div class="col"><div class="alert alert-info mb-0">No hay productos cargados. Agregá el primero desde el panel administrador.</div></div>';
        productCount.textContent = '0 productos';
        return;
    }

    const isOwner = state.mode === 'owner';

    productList.innerHTML = state.products.map(product => `
        <div class="col-md-6 col-lg-4">
            <div class="card product-card h-100">
                <img src="${product.image || 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=800&q=80'}"
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
                        ${isOwner
                            ? `<button class="btn btn-outline-secondary w-100" data-action="remove-product" data-id="${product.id}">Eliminar</button>`
                            : `<button class="btn btn-primary w-100" data-action="add-to-cart" data-id="${product.id}" ${product.stock ? '' : 'disabled'}>Agregar</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    productCount.textContent = `${state.products.length} ${state.products.length === 1 ? 'producto' : 'productos'}`;
}

// Pintar carrito
function renderCart() {
    if (!state.cart.length) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('d-none');
        cartCount.textContent = '0 artículos';
        cartTotal.textContent = '$0';
        return;
    }

    emptyCart.classList.add('d-none');

    cartItems.innerHTML = state.cart.map(item => `
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
        </li>
    `).join('');

    const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`;
    cartTotal.textContent = formatCurrency(totalPrice);
}

// Stats de administración
function updateStats() {
    const totalStock = state.products.reduce((acc, prod) => acc + Number(prod.stock), 0);
    const totalValue = state.products.reduce((acc, prod) => acc + prod.price * prod.stock, 0);

    if (statProducts) statProducts.textContent = state.products.length;
    if (statStock) statStock.textContent = totalStock;
    if (statValue) statValue.textContent = formatCurrency(totalValue);
}

// CRUD de productos
function addProduct({ name, description, price, stock, image }) {
    const product = {
        id: generateId(),
        name,
        description,
        price,
        stock,
        image
    };
    state.products.push(product);
    persistState();
    renderProducts();
    updateStats();
}

function removeProduct(id) {
    state.products = state.products.filter(product => product.id !== id);
    state.cart = state.cart.filter(item => item.id !== id);
    persistState();
    renderProducts();
    renderCart();
    updateStats();
}

// Carrito
function addToCart(id) {
    const product = state.products.find(prod => prod.id === id);
    if (!product || product.stock <= 0) return;

    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, product.stock);
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    persistState();
    renderCart();
}

function updateCartQuantity(id, quantity) {
    const item = state.cart.find(cartItem => cartItem.id === id);
    const product = state.products.find(prod => prod.id === id);
    if (!item || !product) return;

    if (quantity <= 0) {
        removeFromCart(id);
        return;
    }

    item.quantity = Math.min(quantity, product.stock);
    persistState();
    renderCart();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(item => item.id !== id);
    persistState();
    renderCart();
}

function clearCart() {
    state.cart = [];
    persistState();
    renderCart();
}

// Eventos

// Enviar form de producto (Dueño)
if (productForm) {
    productForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!productForm.checkValidity()) {
            productForm.classList.add('was-validated');
            return;
        }

        const name = document.getElementById('productName').value.trim();
        const description = document.getElementById('productDescription').value.trim();
        const price = Number(document.getElementById('productPrice').value);
        const stock = Number(document.getElementById('productStock').value);
        const image = document.getElementById('productImage').value.trim();

        if (!name || !description || price < 0 || stock < 0) return;

        addProduct({
            name,
            description,
            price,
            stock,
            image: image || ''
        });

        productForm.reset();
        productForm.classList.remove('was-validated');
    });
}

// Click en tarjetas de productos
if (productList) {
    productList.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const { action, id } = button.dataset;

        if (action === 'add-to-cart') {
            addToCart(id);
        } else if (action === 'remove-product') {
            removeProduct(id);
        }
    });
}

// Eventos en carrito
if (cartItems) {
    cartItems.addEventListener('input', (event) => {
        if (event.target.dataset.action !== 'update-qty') return;
        const quantity = Number(event.target.value);
        updateCartQuantity(event.target.dataset.id, quantity);
    });

    cartItems.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action="remove-from-cart"]');
        if (!button) return;
        removeFromCart(button.dataset.id);
    });
}

// Botones carrito
const clearCartBtn = document.getElementById('clear-cart');
if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
}

const checkoutBtn = document.getElementById('checkout');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (!state.cart.length) return;

        checkoutAlert.classList.remove('d-none');
        setTimeout(() => checkoutAlert.classList.add('d-none'), 3000);

        clearCart();
    });
}

// Selector de modo
if (btnBuyer) {
    btnBuyer.addEventListener('click', () => setMode('buyer'));
}
if (btnOwner) {
    btnOwner.addEventListener('click', () => setMode('owner'));
}

// Inicialización
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

setMode(state.mode);
renderCart();
updateStats();

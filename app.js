const storageKey = 'tejidos-products';
const cartKey = 'tejidos-cart';

const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`);

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
        description: 'Relleno hipoalergénico anti ácaros. Ideal todas las estaciones.',
        price: 59999,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: generateId(),
        name: 'Manta waffle XL',
        description: 'Textura waffle con terminación fringed. Perfecta para deco.',
        price: 27999,
        stock: 12,
        image: 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=900&q=80'
    }
];

const state = {
    products: JSON.parse(localStorage.getItem(storageKey)) ?? defaultProducts,
    cart: JSON.parse(localStorage.getItem(cartKey)) ?? []
};

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

const formatCurrency = value => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
}).format(value);

function persistState() {
    localStorage.setItem(storageKey, JSON.stringify(state.products));
    localStorage.setItem(cartKey, JSON.stringify(state.cart));
}

function renderProducts() {
    if (!state.products.length) {
        productList.innerHTML = '<div class="col"><div class="alert alert-info mb-0">No hay productos. Agregá el primero desde el panel administrador.</div></div>';
        productCount.textContent = '0 productos';
        return;
    }

    productList.innerHTML = state.products.map(product => `
        <div class="col-md-6 col-lg-4">
            <div class="card product-card h-100">
                <img src="${product.image || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'}" class="card-img-top" alt="${product.name}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between mb-2">
                        <h5 class="card-title mb-0">${product.name}</h5>
                        <span class="badge bg-light text-dark">${product.stock} u.</span>
                    </div>
                    <p class="card-text flex-grow-1 text-muted">${product.description}</p>
                    <div class="fw-bold fs-5 mb-3">${formatCurrency(product.price)}</div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary w-50" data-action="remove-product" data-id="${product.id}">Eliminar</button>
                        <button class="btn btn-primary w-50" data-action="add-to-cart" data-id="${product.id}" ${product.stock ? '' : 'disabled'}>Agregar</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    productCount.textContent = `${state.products.length} ${state.products.length === 1 ? 'producto' : 'productos'}`;
}

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
                <input data-action="update-qty" data-id="${item.id}" type="number" min="1" max="99" value="${item.quantity}" class="form-control form-control-sm" style="width: 70px;">
                <button class="btn btn-sm btn-link text-danger" data-action="remove-from-cart" data-id="${item.id}">Quitar</button>
            </div>
        </li>
    `).join('');

    const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = state.cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`;
    cartTotal.textContent = formatCurrency(totalPrice);
}

function updateStats() {
    const totalStock = state.products.reduce((acc, prod) => acc + Number(prod.stock), 0);
    const totalValue = state.products.reduce((acc, prod) => acc + prod.price * prod.stock, 0);

    statProducts.textContent = state.products.length;
    statStock.textContent = totalStock;
    statValue.textContent = formatCurrency(totalValue);
}

function addProduct(product) {
    state.products.unshift(product);
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

function addToCart(id) {
    const product = state.products.find(prod => prod.id === id);
    if (!product || product.stock <= 0) return;

    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, product.stock);
    } else {
        state.cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    persistState();
    renderCart();
}

function updateCartQuantity(id, quantity) {
    const item = state.cart.find(cartItem => cartItem.id === id);
    const product = state.products.find(prod => prod.id === id);
    if (!item || !product) return;

    const safeQty = Math.max(1, Math.min(quantity, product.stock));
    item.quantity = safeQty;
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

productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = Number(document.getElementById('productPrice').value);
    const stock = Number(document.getElementById('productStock').value);
    const image = document.getElementById('productImage').value.trim();

    if (!name || !description || price <= 0 || stock < 0) return;

    addProduct({
        id: generateId(),
        name,
        description,
        price,
        stock,
        image
    });

    event.target.reset();
});

productList.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    const id = event.target.dataset.id;
    if (!action || !id) return;

    if (action === 'add-to-cart') {
        addToCart(id);
    }

    if (action === 'remove-product') {
        removeProduct(id);
    }
});

cartItems.addEventListener('input', (event) => {
    if (event.target.dataset.action !== 'update-qty') return;
    updateCartQuantity(event.target.dataset.id, Number(event.target.value));
});

cartItems.addEventListener('click', (event) => {
    if (event.target.dataset.action !== 'remove-from-cart') return;
    removeFromCart(event.target.dataset.id);
});

document.getElementById('clear-cart').addEventListener('click', clearCart);

document.getElementById('checkout').addEventListener('click', () => {
    if (!state.cart.length) return;

    checkoutAlert.classList.remove('d-none');
    setTimeout(() => checkoutAlert.classList.add('d-none'), 3000);

    clearCart();
});

yearEl.textContent = new Date().getFullYear();

renderProducts();
renderCart();
updateStats();

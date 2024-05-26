import axios from 'axios'; // Импортируем библиотеку axios для выполнения HTTP-запросов.

interface Food {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
} // Определяем интерфейс Food, который описывает объект еды с полями id, name, price, image и quantity.

async function fetchData(category: string): Promise<Food[]> {
    try {
        const response = await axios.get(`http://localhost:3000/${category}`);
        return response.data;
    } catch (error) {
        console.error(`Ошибка при загрузке данных для категории ${category}:`, error);
        return [];
    }
} // Асинхронная функция fetchData, которая принимает категорию, выполняет GET-запрос на сервер и возвращает массив объектов Food. В случае ошибки возвращается пустой массив.

function createMenuItem(food: Food) {
    const div = document.createElement('div');
    div.classList.add('menu-item');

    const img = document.createElement('img');
    img.src = food.image;

    const h3 = document.createElement('h3');
    h3.textContent = food.name;

    const p = document.createElement('p');
    p.textContent = `Цена: ${food.price}₽`;

    const button = document.createElement('button');
    button.textContent = 'Добавить в корзину';
    button.addEventListener('click', () => addToCart(food));

    div.appendChild(img);
    div.appendChild(h3);
    div.appendChild(p);
    div.appendChild(button);

    return div;
} // Функция createMenuItem создает HTML-элемент для каждого элемента меню (объекта food). Добавляет изображение, название, цену и кнопку для добавления в корзину. Возвращает созданный элемент div.

async function renderMenu(sectionId: string, category: string) {
    const section = document.querySelector(`#${sectionId} .menu-items`);
    if (section) {
        const foods = await fetchData(category);
        foods.forEach(food => {
            const menuItem = createMenuItem(food);
            section.appendChild(menuItem);
        });
    } else {
    }
} // Асинхронная функция renderMenu принимает идентификатор секции и категорию. Получает данные о еде, создает элементы меню и добавляет их в указанную секцию.

document.addEventListener('DOMContentLoaded', () => {
    renderMenu('soups', 'soups');
    renderMenu('drinks', 'drinks');
    renderMenu('desserts', 'desserts');
    renderMenu('main-courses', 'mainCourses').then(() => {
        initializeCart();
    });
}); // После загрузки содержимого документа вызываются функции renderMenu для различных категорий. После завершения инициализируется корзина.

interface CartItem extends Food {
    totalPrice: number;
} // Определяем интерфейс CartItem, который расширяет интерфейс Food и добавляет поле totalPrice.

let cart: CartItem[] = []; // Объявляем переменную cart как массив объектов CartItem. Изначально пустой.

function initializeCart() {
    const checkoutButton = document.getElementById('checkout');
    const clearCartButton = document.getElementById('clear-cart');

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            alert('Ваш заказ успешно оформлен!');
            clearCart();
        });
    }

    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    loadCartFromLocalStorage();
    renderCart();

    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const selectedCategoryId = link.getAttribute('href')?.substring(1);
            const menuSections = document.querySelectorAll('main.menu > section') as NodeListOf<HTMLElement>;
            if (selectedCategoryId === 'cart') {
                showCart();
                renderCart();
            } else {
                menuSections.forEach(section => {
                    section.style.display = section.id === selectedCategoryId ? 'block' : 'none';
                });
            }
        });
    });

    const cartNavItem = document.querySelector('.cart-items');
    if (cartNavItem) {
        cartNavItem.addEventListener('click', () => {
            showCart();
            renderCart();
        });
    }
} // Функция initializeCart инициализирует корзину: добавляет обработчики событий для кнопок оформления и очистки корзины, загружает данные корзины из localStorage, отображает корзину, добавляет обработчики событий для навигационных ссылок и кнопки корзины.

function addToCart(food: Food) {
    const existingItem = cart.find(item => item.id === food.id);
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalPrice += food.price;
    } else {
        cart.push({
            ...food,
            totalPrice: food.price
        });
    }
    renderCart();
    saveCartToLocalStorage();

    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = `Товар "${food.name}" добавлен в корзину`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 1500);
    updateTotalPrice();
} // Функция addToCart добавляет товар в корзину или увеличивает его количество, отображает обновленную корзину, сохраняет корзину в localStorage и показывает уведомление о добавлении товара.

function renderCart() {
    const cartItemsContainer = document.querySelector('#cart .cart-items') as HTMLElement;
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        cart.forEach(food => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');

            const img = document.createElement('img');
            img.src = food.image;

            const name = document.createElement('div');
            name.textContent = `Название: ${food.name}`;

            const priceElement = document.createElement('div');
            priceElement.textContent = `Цена за шт.: ${food.price}₽ | Общая цена: ${food.totalPrice}₽`;

            const quantityLabel = document.createElement('label');
            quantityLabel.textContent = 'Количество: ';

            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.value = food.quantity.toString();
            quantityInput.addEventListener('input', () => {
                let newQuantity = parseInt(quantityInput.value);
                if (newQuantity < 1) {
                    removeFromCart(food);
                    renderCart();
                } else {
                    food.quantity = newQuantity;
                    food.totalPrice = food.price * newQuantity;
                    priceElement.textContent = `Цена за шт.: ${food.price}₽ | Общая цена: ${food.totalPrice}₽`;
                    updateTotalPrice();
                    saveCartToLocalStorage();
                }
            });

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Удалить из корзины';
            removeButton.addEventListener('click', () => {
                removeFromCart(food);
                renderCart();
            });

            cartItem.appendChild(img);
            cartItem.appendChild(name);
            cartItem.appendChild(priceElement);
            cartItem.appendChild(quantityLabel);
            cartItem.appendChild(quantityInput);
            cartItem.appendChild(removeButton);

            cartItemsContainer.appendChild(cartItem);
        });
        updateTotalPrice();
    }
} // Функция renderCart отображает содержимое корзины: создает элементы для каждого товара в корзине, добавляет их в контейнер корзины, добавляет обработчики событий для изменения количества и удаления товара. Обновляет общую цену.

function updateTotalPrice() {
    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        let totalPrice = 0;
        cart.forEach(food => {
            totalPrice += food.totalPrice;
        });
        totalPriceElement.textContent = `Общая сумма: ${totalPrice}₽`;
    }
} // Функция updateTotalPrice обновляет элемент отображения общей суммы в корзине, вычисляя сумму totalPrice для всех товаров в корзине.

function clearCart() {
    cart = [];
    renderCart();
    saveCartToLocalStorage();
} // Функция clearCart очищает корзину, отображает обновленную корзину и сохраняет изменения в localStorage.

function removeFromCart(food: CartItem) {
    const index = cart.findIndex(item => item.id === food.id);
    if (index !== -1) {
        cart.splice(index, 1);
        console.log('Удалено из корзины:', food);
        updateTotalPrice();
    }
    saveCartToLocalStorage();
} // Функция removeFromCart удаляет товар из корзины по его id, обновляет общую цену и сохраняет изменения в localStorage.

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        renderCart();
        updateTotalPrice();
    }
} // Функция loadCartFromLocalStorage загружает сохраненную корзину из localStorage, если она существует, и отображает её.

function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
} // Функция saveCartToLocalStorage сохраняет текущую корзину в localStorage.

function showCart() {
    const menuSections = document.querySelectorAll('main.menu > section') as NodeListOf<HTMLElement>;
    menuSections.forEach(section => {
        section.style.display = section.id === 'cart' ? 'block' : 'none';
    });
} // Функция showCart отображает секцию корзины и скрывает остальные секции меню.

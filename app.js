// ============================================
// ПЕРЕКУП КАЛЬКУЛЯТОР - JavaScript
// ============================================

class PerecupCalculator {
    constructor() {
        this.operations = [];
        this.currentFilter = 'all';
        this.currentPeriod = 'all';
        this.searchQuery = '';
        this.sortDescending = true;
        
        this.init();
        this.loadFromStorage();
        this.render();
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    init() {
        // Установить сегодняшнюю дату
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('date').max = today;
        
        // Обработчики событий
        this.setupEventListeners();
        
        // Показать приветствие
        this.showNotification('Добро пожаловать в Перекуп Калькулятор!', 'info', 4000);
    }
    
    setupEventListeners() {
        // Кнопка добавления
        document.getElementById('addBtn').addEventListener('click', () => this.showModal());
        document.getElementById('quickAddBtn').addEventListener('click', () => this.showModal());
        
        // Кнопки в модальном окне
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
        
        // Клик вне модалки
        document.getElementById('addModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('addModal')) {
                this.hideModal();
            }
        });
        
        // Форма добавления
        document.getElementById('operationForm').addEventListener('submit', (e) => this.addOperation(e));
        
        // Кнопки типа операции
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('operationType').value = btn.dataset.type;
            });
        });
        
        // Фильтры
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
        
        // Период
        document.getElementById('periodSelect').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.render();
        });
        
        // Поиск
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });
        
        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.searchQuery = '';
            this.render();
        });
        
        // Сортировка
        document.getElementById('sortDateBtn').addEventListener('click', () => {
            this.sortDescending = !this.sortDescending;
            this.render();
        });
        
        // Экспорт/Импорт
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        
        // Очистка данных
        document.getElementById('clearBtn').addEventListener('click', () => this.clearData());
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Ctrl+N - новая сделка
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showModal();
            }
            // Esc - закрыть модалку
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }
    
    // ========== РАБОТА С ДАННЫМИ ==========
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('perecup-calculator-data');
            if (saved) {
                const data = JSON.parse(saved);
                this.operations = data.operations || [];
                this.showNotification('Данные загружены из локального хранилища', 'success');
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }
    
    saveToStorage() {
        try {
            const data = {
                operations: this.operations,
                lastSave: new Date().toISOString(),
                version: '2.0'
            };
            localStorage.setItem('perecup-calculator-data', JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
        }
    }
    
    // ========== ОПЕРАЦИИ ==========
    addOperation(e) {
        e.preventDefault();
        
        const type = document.getElementById('operationType').value;
        const amount = parseInt(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        const date = document.getElementById('date').value;
        
        // Валидация
        if (!description || isNaN(amount) || amount <= 0) {
            this.showNotification('Заполните все поля корректно!', 'error');
            return;
        }
        
        // Создаём операцию
        const operation = {
            id: Date.now(),
            type: type,
            amount: amount,
            category: category,
            description: description,
            date: date,
            createdAt: new Date().toISOString()
        };
        
        // Добавляем
        this.operations.push(operation);
        
        // Сохраняем
        this.saveToStorage();
        
        // Закрываем модалку
        this.hideModal();
        
        // Сбрасываем форму
        e.target.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('operationType').value = 'income';
        document.querySelectorAll('.type-btn')[0].click();
        
        // Показываем уведомление
        this.showNotification('Сделка успешно добавлена!', 'success');
        
        // Обновляем интерфейс
        this.render();
    }
    
    deleteOperation(id) {
        if (!confirm('Удалить эту сделку? Это действие нельзя отменить.')) {
            return;
        }
        
        this.operations = this.operations.filter(op => op.id !== id);
        this.saveToStorage();
        this.showNotification('Сделка удалена', 'warning');
        this.render();
    }
    
    // ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========
    getFilteredOperations() {
        let filtered = [...this.operations];
        
        // Фильтр по типу
        if (this.currentFilter === 'income') {
            filtered = filtered.filter(op => op.type === 'income');
        } else if (this.currentFilter === 'expense') {
            filtered = filtered.filter(op => op.type === 'expense');
        }
        
        // Фильтр по периоду
        if (this.currentPeriod !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            switch (this.currentPeriod) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            filtered = filtered.filter(op => {
                const opDate = new Date(op.date + 'T00:00:00');
                return opDate >= startDate;
            });
        }
        
        // Поиск
        if (this.searchQuery) {
            filtered = filtered.filter(op => 
                op.description.toLowerCase().includes(this.searchQuery) ||
                op.category.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Сортировка по дате
        filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return this.sortDescending ? dateB - dateA : dateA - dateB;
        });
        
        return filtered;
    }
    
    // ========== СТАТИСТИКА ==========
    calculateStats(operations = null) {
        const ops = operations || this.getFilteredOperations();
        
        let income = 0;
        let expense = 0;
        
        ops.forEach(op => {
            if (op.type === 'income') {
                income += op.amount;
            } else {
                expense += op.amount;
            }
        });
        
        return {
            total: ops.length,
            income: income,
            expense: expense,
            profit: income - expense
        };
    }
    
    // ========== РЕНДЕРИНГ ==========
    render() {
        const operations = this.getFilteredOperations();
        const stats = this.calculateStats(operations);
        const allStats = this.calculateStats(this.operations);
        
        // Обновляем общую статистику
        this.updateElement('totalOperations', allStats.total);
        this.updateElement('totalIncome', this.formatCurrency(allStats.income));
        this.updateElement('totalExpense', this.formatCurrency(allStats.expense));
        this.updateElement('totalProfit', this.formatCurrency(allStats.profit));
        
        // Обновляем быструю статистику (с фильтрами)
        this.updateElement('quickIncome', this.formatCurrency(stats.income));
        this.updateElement('quickExpense', this.formatCurrency(stats.expense));
        this.updateElement('quickProfit', this.formatCurrency(stats.profit));
        
        // Обновляем счётчики поиска
        this.updateElement('foundCount', operations.length);
        this.updateElement('totalCount', this.operations.length);
        
        // Рендерим таблицу
        this.renderTable(operations);
    }
    
    renderTable(operations) {
        const tableBody = document.getElementById('operationsTable');
        
        if (operations.length === 0) {
            const message = this.searchQuery ? 'По вашему запросу ничего не найдено' : 'Пока нет сделок';
            const hint = this.searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Начните добавлять сделки по перепродажам';
            
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <div class="empty-message">
                            <i class="fas fa-${this.searchQuery ? 'search' : 'box-open'}"></i>
                            <h4>${message}</h4>
                            <p>${hint}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        
        operations.forEach(op => {
            const row = document.createElement('tr');
            
            // Категории
            const categoryNames = {
                'clothes': 'Одежда',
                'shoes': 'Обувь',
                'accessories': 'Аксессуары',
                'other': 'Другое'
            };
            
            row.innerHTML = `
                <td>
                    <div class="op-type ${op.type}">
                        <i class="fas fa-${op.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i>
                    </div>
                </td>
                <td class="amount-cell ${op.type}">
                    ${op.type === 'income' ? '+' : '-'}${this.formatCurrency(op.amount)}
                </td>
                <td>${op.description}</td>
                <td><span class="category-tag">${categoryNames[op.category] || op.category}</span></td>
                <td>${new Date(op.date).toLocaleDateString('ru-RU')}</td>
                <td>
                    <button class="action-btn" onclick="calculator.deleteOperation(${op.id})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }
    
    formatCurrency(amount) {
        return '$' + amount.toLocaleString('ru-RU');
    }
    
    showModal() {
        document.getElementById('addModal').classList.add('show');
    }
    
    hideModal() {
        document.getElementById('addModal').classList.remove('show');
    }
    
    // ========== УВЕДОМЛЕНИЯ ==========
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.getElementById('notification');
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        // Иконка в зависимости от типа
        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
    
    // ========== ЭКСПОРТ/ИМПОРТ ==========
    exportData() {
        const data = {
            operations: this.operations,
            exportedAt: new Date().toISOString(),
            totalOperations: this.operations.length,
            stats: this.calculateStats(this.operations)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `перекуп-калькулятор-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Данные успешно экспортированы', 'success');
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.operations || !Array.isArray(data.operations)) {
                    throw new Error('Неверный формат файла');
                }
                
                // Подтверждение импорта
                if (!confirm(`Импортировать ${data.operations.length} сделок? Текущие данные будут сохранены.`)) {
                    return;
                }
                
                // Сохраняем текущие данные как резервную копию
                const backup = {
                    operations: this.operations,
                    backedUpAt: new Date().toISOString()
                };
                localStorage.setItem('perecup-calculator-backup', JSON.stringify(backup));
                
                // Импортируем новые данные
                this.operations = data.operations;
                this.saveToStorage();
                this.render();
                
                this.showNotification(`Успешно импортировано ${data.operations.length} сделок`, 'success');
                
                // Очищаем input файла
                event.target.value = '';
                
            } catch (error) {
                this.showNotification('Ошибка при импорте файла: ' + error.message, 'error');
                console.error('Ошибка импорта:', error);
            }
        };
        
        reader.readAsText(file);
    }
    
    // ========== ОЧИСТКА ДАННЫХ ==========
    clearData() {
        if (!confirm('ВНИМАНИЕ! Вы собираетесь удалить ВСЕ данные.\n\nЭто действие нельзя отменить!\n\nПеред удалением рекомендуется экспортировать данные.')) {
            return;
        }
        
        if (confirm('Последнее предупреждение! Удалить ВСЕ данные безвозвратно?')) {
            this.operations = [];
            localStorage.removeItem('perecup-calculator-data');
            this.render();
            this.showNotification('Все данные успешно очищены', 'warning');
        }
    }
}

// ========== ЗАПУСК ПРИЛОЖЕНИЯ ==========

let calculator;

document.addEventListener('DOMContentLoaded', () => {
    calculator = new PerecupCalculator();
    window.calculator = calculator;
    
    // Глобальные функции
    window.addOperation = () => calculator.showModal();
    window.exportData = () => calculator.exportData();
    window.importData = () => document.getElementById('importFile').click();
    window.clearData = () => calculator.clearData();
});

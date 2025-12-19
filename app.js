// Бизнес-трекер для GTA RP
class BusinessTracker {
    constructor() {
        this.operations = [];
        this.profiles = [
            { id: 'resale', name: 'Перепродажи', icon: 'fa-tshirt', color: '#3b82f6' },
            { id: 'auto', name: 'Автобизнес', icon: 'fa-car', color: '#ef4444' },
            { id: 'realty', name: 'Недвижимость', icon: 'fa-home', color: '#10b981' }
        ];
        this.currentProfile = 'all';
        this.currentPeriod = 'today';
        
        this.initialize();
        this.loadFromStorage();
        this.render();
    }
    
    initialize() {
        // Инициализация даты
        document.getElementById('opDate').valueAsDate = new Date();
        
        // Обработчики кнопок
        document.getElementById('addOperationBtn').addEventListener('click', () => this.toggleModal('operationModal'));
        document.getElementById('quickAddBtn').addEventListener('click', () => this.toggleModal('operationModal'));
        document.getElementById('addProfileBtn').addEventListener('click', () => this.toggleModal('profileModal'));
        
        // Обработчики закрытия модальных окон
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
            });
        });
        
        // Форма добавления операции
        document.getElementById('operationForm').addEventListener('submit', (e) => this.addOperation(e));
        
        // Форма добавления профиля
        document.getElementById('profileForm').addEventListener('submit', (e) => this.addProfile(e));
        
        // Кнопки выбора типа операции
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('opType').value = btn.dataset.type;
            });
        });
        
        // Кнопки выбора иконки
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('profileIcon').value = btn.dataset.icon;
            });
        });
        
        // Фильтры профилей
        document.querySelectorAll('.btn-sidebar').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'addProfileBtn') return;
                
                document.querySelectorAll('.btn-sidebar').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentProfile = btn.dataset.profile;
                this.updateProfileTitle();
                this.render();
            });
        });
        
        // Фильтры периода
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.render();
            });
        });
        
        // Поиск
        document.getElementById('searchInput').addEventListener('input', () => this.render());
        
        // Закрытие модальных окон при клике на фон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Добавление тестовых данных (можно удалить)
        if (this.operations.length === 0) {
            this.addTestData();
        }
    }
    
    addTestData() {
        const testData = [
            { type: 'income', amount: 30000, comment: 'Продал нереальные джинсы', profile: 'resale', date: this.getFormattedDate() },
            { type: 'income', amount: 10000, comment: 'Крутая куртка', profile: 'resale', date: this.getFormattedDate() },
            { type: 'expense', amount: 2000, comment: 'Бензин', profile: 'auto', date: this.getFormattedDate() },
            { type: 'expense', amount: 15000, comment: 'Покупка Sultan', profile: 'auto', date: this.getFormattedDate(-1) },
            { type: 'income', amount: 25000, comment: 'Продажа квартиры', profile: 'realty', date: this.getFormattedDate(-2) }
        ];
        
        testData.forEach(data => this.operations.push(data));
        this.saveToStorage();
    }
    
    toggleModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    addOperation(e) {
        e.preventDefault();
        
        const operation = {
            id: Date.now(),
            type: document.getElementById('opType').value,
            amount: parseInt(document.getElementById('opAmount').value),
            comment: document.getElementById('opComment').value,
            profile: document.getElementById('opProfile').value,
            date: document.getElementById('opDate').value
        };
        
        this.operations.push(operation);
        this.saveToStorage();
        this.render();
        
        // Сброс формы и закрытие модального окна
        document.getElementById('operationForm').reset();
        document.getElementById('opDate').valueAsDate = new Date();
        document.getElementById('opType').value = 'income';
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'income') btn.classList.add('active');
        });
        
        document.getElementById('operationModal').classList.remove('active');
        
        // Показать уведомление
        this.showNotification(`Операция "${operation.comment}" добавлена!`, 'success');
    }
    
    addProfile(e) {
        e.preventDefault();
        
        const profile = {
            id: 'profile_' + Date.now(),
            name: document.getElementById('profileName').value,
            icon: document.getElementById('profileIcon').value,
            color: document.getElementById('profileColor').value
        };
        
        this.profiles.push(profile);
        this.saveToStorage();
        
        // Добавление кнопки в сайдбар
        const sidebar = document.querySelector('.sidebar-section:first-child');
        const newBtn = document.createElement('button');
        newBtn.className = 'btn-sidebar';
        newBtn.dataset.profile = profile.id;
        newBtn.innerHTML = `<i class="fas ${profile.icon}"></i> ${profile.name}`;
        newBtn.style.borderLeft = `3px solid ${profile.color}`;
        
        newBtn.addEventListener('click', () => {
            document.querySelectorAll('.btn-sidebar').forEach(b => b.classList.remove('active'));
            newBtn.classList.add('active');
            this.currentProfile = profile.id;
            this.updateProfileTitle();
            this.render();
        });
        
        sidebar.insertBefore(newBtn, document.getElementById('addProfileBtn'));
        
        // Сброс формы и закрытие модального окна
        document.getElementById('profileForm').reset();
        document.getElementById('profileModal').classList.remove('active');
        
        this.showNotification(`Профиль "${profile.name}" создан!`, 'success');
    }
    
    deleteOperation(id) {
        this.operations = this.operations.filter(op => op.id !== id);
        this.saveToStorage();
        this.render();
        this.showNotification('Операция удалена!', 'danger');
    }
    
    updateProfileTitle() {
        if (this.currentProfile === 'all') {
            document.getElementById('currentProfile').textContent = 'Все операции';
        } else {
            const profile = this.profiles.find(p => p.id === this.currentProfile);
            document.getElementById('currentProfile').textContent = profile ? profile.name : 'Операции';
        }
    }
    
    getFormattedDate(daysOffset = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }
    
    getFilteredOperations() {
        let filtered = [...this.operations];
        
        // Фильтрация по профилю
        if (this.currentProfile !== 'all') {
            filtered = filtered.filter(op => op.profile === this.currentProfile);
        }
        
        // Фильтрация по периоду
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
            case 'all':
                startDate = new Date(0); // Начало времён
                break;
        }
        
        filtered = filtered.filter(op => {
            const opDate = new Date(op.date);
            return opDate >= startDate && opDate <= now;
        });
        
        // Фильтрация по поиску
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(op => 
                op.comment.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    calculateStats() {
        const operations = this.getFilteredOperations();
        
        let income = 0;
        let expense = 0;
        
        operations.forEach(op => {
            if (op.type === 'income') {
                income += op.amount;
            } else {
                expense += op.amount;
            }
        });
        
        const profit = income - expense;
        
        return { income, expense, profit };
    }
    
    formatCurrency(amount) {
        return '$' + amount.toLocaleString('ru-RU');
    }
    
    render() {
        const operations = this.getFilteredOperations();
        const stats = this.calculateStats();
        
        // Обновление статистики
        document.getElementById('totalIncome').textContent = this.formatCurrency(stats.income);
        document.getElementById('totalExpense').textContent = this.formatCurrency(stats.expense);
        document.getElementById('totalProfit').textContent = this.formatCurrency(stats.profit);
        
        document.getElementById('incomeCard').textContent = this.formatCurrency(stats.income);
        document.getElementById('expenseCard').textContent = this.formatCurrency(stats.expense);
        document.getElementById('profitCard').textContent = this.formatCurrency(stats.profit);
        
        // Обновление меток периода
        const periodLabels = document.querySelectorAll('#periodLabel, #periodLabel2, #periodLabel3');
        const periodTexts = {
            'today': 'сегодня',
            'week': 'неделю',
            'month': 'месяц',
            'all': 'всё время'
        };
        periodLabels.forEach(label => {
            label.textContent = periodTexts[this.currentPeriod];
        });
        
        // Отрисовка таблицы
        const tableBody = document.getElementById('operationsTable');
        tableBody.innerHTML = '';
        
        if (operations.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-clipboard-list" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Нет операций за выбранный период
                    </td>
                </tr>
            `;
            return;
        }
        
        operations.forEach(op => {
            const profile = this.profiles.find(p => p.id === op.profile) || this.profiles[0];
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <div class="operation-type ${op.type}">
                        <i class="fas fa-${op.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i>
                    </div>
                </td>
                <td class="operation-amount ${op.type}">
                    ${op.type === 'income' ? '+' : '-'}${this.formatCurrency(op.amount)}
                </td>
                <td>${op.comment}</td>
                <td>
                    <span class="profile-badge" style="background: ${profile.color}20; color: ${profile.color};">
                        <i class="fas ${profile.icon}"></i>
                        ${profile.name}
                    </span>
                </td>
                <td>${new Date(op.date).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" title="Удалить" onclick="tracker.deleteOperation(${op.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    showNotification(message, type = 'info') {
        // Создаём уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Добавляем анимации в CSS
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    saveToStorage() {
        localStorage.setItem('business-tracker-operations', JSON.stringify(this.operations));
        localStorage.setItem('business-tracker-profiles', JSON.stringify(this.profiles));
    }
    
    loadFromStorage() {
        const savedOperations = localStorage.getItem('business-tracker-operations');
        const savedProfiles = localStorage.getItem('business-tracker-profiles');
        
        if (savedOperations) {
            this.operations = JSON.parse(savedOperations);
        }
        
        if (savedProfiles) {
            this.profiles = JSON.parse(savedProfiles);
        }
    }
}

// Инициализация приложения
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new BusinessTracker();
});
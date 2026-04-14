// Глобальные переменные
let canvas, ctx;
let isDrawing = false;
let currentModule = null;
let currentExercise = null;
let currentExerciseIndex = 0;
let moduleExercises = [];
let startTime = null;
let exerciseCompleted = false;
let targetZone = null; // Зона для проверки попадания
let stats = {
    totalExercises: 0,
    successfulExercises: 0,
    totalTime: 0
};

// Переменные для модуля 2 (Дорожки)
let pathPoints = []; // Точки центральной траектории
let userPath = []; // Путь пользователя
let exitCount = 0; // Количество выходов за границы
let isOutOfBounds = false; // Флаг выхода за границы
let finishZone = null; // Зона финиша

// Переменные для упражнений с подзадачами (Модуль 3)
let currentSubTask = 0; // Текущая подзадача
let totalSubTasks = 0; // Всего подзадач
let completedSubTasks = []; // Массив завершенных подзадач (какие линии реально провел пользователь)

// Загрузка статистики из localStorage
function loadStats() {
    const saved = localStorage.getItem('graphomotorStats');
    if (saved) {
        stats = JSON.parse(saved);
    }
}

// Сохранение статистики
function saveStats() {
    localStorage.setItem('graphomotorStats', JSON.stringify(stats));
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    // Не инициализируем canvas сразу, только когда он понадобится
});

// Навигация
function showMainMenu() {
    hideAllScreens();
    document.querySelector('.main-menu').classList.remove('hidden');
}

function showExercises() {
    hideAllScreens();
    document.getElementById('exercises-menu').classList.remove('hidden');
}

function showResults() {
    hideAllScreens();
    document.getElementById('results-screen').classList.remove('hidden');
    updateResultsDisplay();
}

function showInfo() {
    hideAllScreens();
    document.getElementById('info-screen').classList.remove('hidden');
}

function hideAllScreens() {
    document.querySelector('.main-menu').classList.add('hidden');
    document.getElementById('exercises-menu').classList.add('hidden');
    document.getElementById('exercise-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('info-screen').classList.add('hidden');
}

// Начать занятие (автоматический набор упражнений)
function startLesson() {
    const lessonModules = [1, 2, 4, 7]; // Разминка, траектории, серийность, самоконтроль
    currentModule = lessonModules[0];
    loadModule(currentModule);
}

// Загрузка модуля
function loadModule(moduleNum) {
    currentModule = moduleNum;
    currentExerciseIndex = 0;
    moduleExercises = getModuleExercises(moduleNum);
    
    hideAllScreens();
    document.getElementById('exercise-screen').classList.remove('hidden');
    
    // Небольшая задержка для корректного отображения canvas
    setTimeout(() => {
        // Инициализируем canvas после показа экрана
        if (!canvas) {
            initCanvas();
        } else {
            resizeCanvas();
        }
        
        currentExercise = moduleExercises[currentExerciseIndex];
        displayExercise(currentExercise);
        startTime = Date.now();
    }, 50);
}

// Получение упражнений модуля
function getModuleExercises(moduleNum) {
    const modules = {
        1: [
            { title: 'Поставь точку в центре', type: 'point-center', instruction: 'Коснись центра экрана' },
            { title: 'Поставь точку вверху', type: 'point-top', instruction: 'Коснись верхней части экрана' },
            { title: 'Поставь точку внизу', type: 'point-bottom', instruction: 'Коснись нижней части экрана' },
            { title: 'Поставь точку слева', type: 'point-left', instruction: 'Коснись левой части экрана' },
            { title: 'Поставь точку справа', type: 'point-right', instruction: 'Коснись правой части экрана' }
        ],
        2: [
            { title: 'Проведи по прямой дорожке', type: 'path-straight', instruction: 'Веди пальцем по дорожке слева направо' },
            { title: 'Поднимись по столбику', type: 'path-vertical', instruction: 'Веди пальцем снизу вверх' },
            { title: 'Перепрыгни через кочки', type: 'path-zigzag', instruction: 'Веди пальцем по зигзагу' },
            { title: 'Проплыви по волнам', type: 'path-wave', instruction: 'Веди пальцем по волнистой линии' },
            { title: 'Закрути улитку', type: 'path-spiral', instruction: 'Веди пальцем по спирали от центра' }
        ],
        3: [
            { title: 'Прямые линии', type: 'path-lines', instruction: 'Обведи все прямые линии сверху вниз', subTasks: 5 },
            { title: 'Наклонные линии', type: 'path-diagonal', instruction: 'Обведи все наклонные линии', subTasks: 8 },
            { title: 'Круги', type: 'path-circles', instruction: 'Обведи все круги по контуру', subTasks: 5 },
            { title: 'Дуги', type: 'path-arcs', instruction: 'Обведи все дуги плавным движением', subTasks: 8 },
            { title: 'Пружинка', type: 'path-loops', instruction: 'Обведи пружинку слева направо', subTasks: 3 }
        ],
        4: [
            { title: 'Продолжи узор', type: 'pattern', instruction: 'Продолжи последовательность элементов' },
            { title: 'Чередование', type: 'alternating', instruction: 'Чередуй короткие и длинные линии' }
        ],
        5: [
            { title: 'Повтори узор', type: 'copy', instruction: 'Повтори узор справа' },
            { title: 'Дострой фигуру', type: 'complete', instruction: 'Дорисуй вторую половину' }
        ],
        6: [
            { title: 'Графический диктант', type: 'dictation', instruction: 'Следуй стрелкам' },
            { title: 'Маршрут по клеткам', type: 'grid', instruction: 'Пройди по клеткам: вверх, вправо, вниз' }
        ],
        7: [
            { title: 'Найди ошибку', type: 'find-error', instruction: 'Найди неправильный элемент' },
            { title: 'Сравни узоры', type: 'compare', instruction: 'Выбери правильный узор' }
        ],
        8: [
            { title: 'Укрась дорожку', type: 'decorate', instruction: 'Укрась дорожку точками' },
            { title: 'Соедини пары', type: 'connect', instruction: 'Соедини одинаковые фигуры' }
        ]
    };
    
    return modules[moduleNum] || modules[1];
}

// Отображение упражнения
function displayExercise(exercise) {
    if (!exercise) {
        console.error('No exercise provided!');
        return;
    }
    
    console.log('Displaying exercise:', exercise.title, exercise.type);
    
    document.getElementById('exercise-title').textContent = exercise.title;
    document.getElementById('instruction').textContent = exercise.instruction;
    document.getElementById('feedback').classList.add('hidden');
    
    exerciseCompleted = false;
    targetZone = null;
    
    // Сброс переменных для модуля 2
    pathPoints = [];
    userPath = [];
    exitCount = 0;
    isOutOfBounds = false;
    finishZone = null;
    
    // Сброс переменных для подзадач
    currentSubTask = 0;
    totalSubTasks = exercise.subTasks || 0;
    completedSubTasks = []; // Пустой массив - никто ничего не провел
    
    if (canvas && ctx) {
        clearCanvas();
        drawExerciseTemplate(exercise);
    } else {
        console.error('Canvas not initialized!');
    }
}

// Инициализация canvas
function initCanvas() {
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    // Удаляем старые обработчики, если они есть
    canvas.removeEventListener('touchstart', handleCanvasTouch);
    canvas.removeEventListener('mousedown', handleCanvasClick);
    canvas.removeEventListener('touchmove', draw);
    canvas.removeEventListener('touchend', stopDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    
    // События для точечных упражнений (клик/тап)
    canvas.addEventListener('touchstart', handleCanvasTouch);
    canvas.addEventListener('mousedown', handleCanvasClick);
    
    // События для рисования (для других модулей)
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    
    // Удаляем старый обработчик resize, если есть
    window.removeEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    
    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
}

function resizeCanvas() {
    if (!canvas) return;
    
    // Получаем размеры контейнера canvas
    const container = canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    console.log('Canvas resized:', canvas.width, 'x', canvas.height);
    
    // Перерисовываем шаблон после изменения размера
    if (currentExercise) {
        drawExerciseTemplate(currentExercise);
    }
}

// Обработка касания/клика на canvas
function handleCanvasTouch(e) {
    e.preventDefault();
    
    if (exerciseCompleted) return;
    
    const pos = getPosition(e);
    
    // Модуль 1: Точечные упражнения
    if (currentExercise && currentExercise.type.startsWith('point-')) {
        checkPointPlacement(pos);
    } 
    // Модуль 2: Дорожки
    else if (currentExercise && currentExercise.type.startsWith('path-')) {
        startDrawingPath(e);
    } 
    else {
        startDrawing(e);
    }
}

function handleCanvasClick(e) {
    e.preventDefault();
    
    if (exerciseCompleted) return;
    
    const pos = getPosition(e);
    
    // Модуль 1: Точечные упражнения
    if (currentExercise && currentExercise.type.startsWith('point-')) {
        checkPointPlacement(pos);
    } 
    // Модуль 2: Дорожки
    else if (currentExercise && currentExercise.type.startsWith('path-')) {
        startDrawingPath(e);
    } 
    else {
        startDrawing(e);
    }
}

// Проверка размещения точки
function checkPointPlacement(pos) {
    if (!targetZone) return;
    
    const distance = Math.sqrt(
        Math.pow(pos.x - targetZone.x, 2) + 
        Math.pow(pos.y - targetZone.y, 2)
    );
    
    if (distance <= targetZone.radius) {
        // Успех!
        drawSuccessPoint(pos);
        showSuccessFeedback();
        exerciseCompleted = true;
        
        // Автоматически переходим к следующему через 1.5 секунды
        setTimeout(() => {
            nextExercise();
        }, 1500);
    } else {
        // Промах
        drawErrorPoint(pos);
        showErrorFeedback();
        
        // Убираем красную точку через 1 секунду
        setTimeout(() => {
            clearCanvas();
            drawExerciseTemplate(currentExercise);
        }, 1000);
    }
}

// Рисование успешной точки
function drawSuccessPoint(pos) {
    // Зеленая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Белый центр
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Анимация успеха - круги расходятся
    animateSuccess(pos);
}

// Рисование ошибочной точки
function drawErrorPoint(pos) {
    // Красная точка
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Крестик
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x - 6, pos.y - 6);
    ctx.lineTo(pos.x + 6, pos.y + 6);
    ctx.moveTo(pos.x + 6, pos.y - 6);
    ctx.lineTo(pos.x - 6, pos.y + 6);
    ctx.stroke();
}

// Анимация успеха
function animateSuccess(pos) {
    let radius = 20;
    let opacity = 1;
    
    const animate = () => {
        if (opacity <= 0) return;
        
        // Сохраняем текущее состояние
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Рисуем расходящийся круг
        ctx.strokeStyle = `rgba(76, 175, 80, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        radius += 3;
        opacity -= 0.05;
        
        if (opacity > 0) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

// Показ обратной связи об успехе
function showSuccessFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '✓ Отлично! Точно в цель!';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
}

// Показ обратной связи об ошибке
function showErrorFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '↻ Попробуй еще раз, ближе к середине';
    feedback.className = 'feedback error';
    feedback.classList.remove('hidden');
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 2000);
}

// Рисование
function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getPosition(e);
    
    // Модуль 2: Проверка границ дорожки
    if (currentExercise && currentExercise.type.startsWith('path-')) {
        drawPathWithCheck(pos);
        return;
    }
    
    // Обычное рисование для других модулей
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function stopDrawing(e) {
    if (!isDrawing) return;
    e.preventDefault();
    isDrawing = false;
    ctx.closePath();
    
    // Модуль 2: Проверка достижения финиша
    if (currentExercise && currentExercise.type.startsWith('path-')) {
        checkPathFinish();
    }
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

// ============================================
// МОДУЛЬ 2: ДОРОЖКИ И ТРАЕКТОРИИ
// ============================================

// Начало рисования по дорожке
function startDrawingPath(e) {
    e.preventDefault();
    
    if (exerciseCompleted) return;
    
    const pos = getPosition(e);
    
    // Для упражнений с несколькими линиями - проверяем близость к любой стартовой точке
    if (totalSubTasks > 0) {
        let nearStart = false;
        
        if (currentExercise.type === 'path-lines') {
            // Прямые линии
            const spacing = 90;
            const startX = 80;
            const startY = canvas.height / 2 - 90;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const lineX = startX + i * spacing;
                    const distance = Math.sqrt(
                        Math.pow(pos.x - lineX, 2) + 
                        Math.pow(pos.y - startY, 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
        } else if (currentExercise.type === 'path-diagonal') {
            // Наклонные линии
            const spacing = 100;
            const startX = 100;
            const topY = canvas.height / 2 - 120;
            const bottomY = canvas.height / 2 + 40;
            
            // Проверяем 4 линии сверху
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const x1 = startX + i * spacing;
                    const distance = Math.sqrt(
                        Math.pow(pos.x - x1, 2) + 
                        Math.pow(pos.y - topY, 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
            
            // Проверяем 4 линии снизу
            if (!nearStart) {
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i + 4)) {
                        const x1 = startX + i * spacing;
                        const distance = Math.sqrt(
                            Math.pow(pos.x - x1, 2) + 
                            Math.pow(pos.y - bottomY, 2)
                        );
                        
                        if (distance <= 30) {
                            nearStart = true;
                            break;
                        }
                    }
                }
            }
        } else if (currentExercise.type === 'path-circles') {
            // Круги
            const spacing = 90;
            const radius = 35;
            const startX = 90;
            const centerY = canvas.height / 2;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = startX + i * spacing;
                    const distance = Math.sqrt(
                        Math.pow(pos.x - cx, 2) + 
                        Math.pow(pos.y - (centerY - radius), 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
        } else if (currentExercise.type === 'path-arcs') {
            // Дуги
            const spacing = 120;
            const radius = 40;
            const startX = 80;
            const topY = canvas.height / 2 - 120;
            const bottomY = canvas.height / 2 + 120;
            
            // Проверяем 4 дуги сверху (стартовая точка справа)
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = startX + i * spacing;
                    const startX_point = cx + radius; // Справа
                    const startY_point = topY;
                    const distance = Math.sqrt(
                        Math.pow(pos.x - startX_point, 2) + 
                        Math.pow(pos.y - startY_point, 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
            
            // Проверяем 4 дуги снизу (стартовая точка слева)
            if (!nearStart) {
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i + 4)) {
                        const cx = startX + i * spacing;
                        const startX_point = cx - radius; // Слева
                        const startY_point = bottomY;
                        const distance = Math.sqrt(
                            Math.pow(pos.x - startX_point, 2) + 
                            Math.pow(pos.y - startY_point, 2)
                        );
                        
                        if (distance <= 30) {
                            nearStart = true;
                            break;
                        }
                    }
                }
            }
        } else if (currentExercise.type === 'path-loops') {
            // Пружинка (горизонтальная спираль)
            const spiralSpacing = 180;
            const spiralWidth = 140;
            const spiralHeight = 80;
            const coilsPerSpiral = 4;
            const startX = 60;
            const centerY = canvas.height / 2;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const spiralStartX = startX + i * spiralSpacing;
                    const startY = centerY; // Начинаем по центру
                    const distance = Math.sqrt(
                        Math.pow(pos.x - spiralStartX, 2) + 
                        Math.pow(pos.y - startY, 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
        }
        
        if (!nearStart) {
            return; // Не начинаем рисование, если далеко от стартовых точек
        }
    } else {
        // Для обычных упражнений - проверяем близость к единственной стартовой точке
        if (pathPoints.length > 0) {
            const startPoint = pathPoints[0];
            const distanceToStart = Math.sqrt(
                Math.pow(pos.x - startPoint.x, 2) + 
                Math.pow(pos.y - startPoint.y, 2)
            );
            
            if (distanceToStart > 30) {
                return;
            }
        }
    }
    
    // Полное обнуление переменных состояния для чистой попытки
    // НО НЕ ТРОГАЕМ pathPoints - это шаблон траектории!
    isDrawing = true;
    userPath = [];
    exitCount = 0;
    isOutOfBounds = false;
    
    userPath.push(pos);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

// Рисование с проверкой границ
function drawPathWithCheck(pos) {
    userPath.push(pos);
    
    // Проверяем расстояние до центральной линии
    const distanceToPath = getDistanceToPath(pos);
    
    // Отладка: если pathPoints пустой, что-то не так
    if (pathPoints.length === 0) {
        console.error('pathPoints is empty! Cannot check boundaries.');
        return;
    }
    
    // Проверка выхода за границы (20px от центра - это граница серой зоны)
    if (distanceToPath > 20) {
        // Вышли за границы - немедленно прерываем рисование
        if (!isOutOfBounds) {
            isOutOfBounds = true;
            exitCount++;
            vibrateDevice(); // Вибрация при выходе
            
            // Показываем ошибку
            const feedback = document.getElementById('feedback');
            feedback.textContent = '⚠️ Вышел за границы! Попробуй снова';
            feedback.className = 'feedback error';
            feedback.classList.remove('hidden');
            
            // Рисуем красную линию в месте выхода
            ctx.strokeStyle = '#ff5252';
            ctx.lineTo(pos.x, pos.y);
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // Немедленно прерываем рисование
            isDrawing = false;
            ctx.closePath();
            
            // Через 1 секунду очищаем и заставляем проходить уровень заново
            setTimeout(() => {
                clearCanvas();
                drawExerciseTemplate(currentExercise);
                feedback.classList.add('hidden');
                // Полное обнуление состояния для новой попытки
                userPath = [];
                exitCount = 0;
                isOutOfBounds = false;
            }, 1000);
        }
        return;
    }
    
    // В пределах границ - рисуем зеленым
    ctx.strokeStyle = '#4caf50'; // Зеленый цвет
    
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Проверяем достижение финиша в реальном времени
    if (totalSubTasks > 0) {
        // Для упражнений с несколькими линиями - проверяем все финишные зоны
        if (currentExercise.type === 'path-lines') {
            // Прямые линии
            const spacing = 90;
            const startX = 80;
            const startY = canvas.height / 2 - 90;
            const lineLength = 180;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const lineX = startX + i * spacing;
                    const finishY = startY + lineLength;
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - lineX, 2) + 
                        Math.pow(pos.y - finishY, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-diagonal') {
            // Наклонные линии
            const spacing = 100;
            const lineLength = 100;
            const startX = 100;
            const topY = canvas.height / 2 - 120;
            const bottomY = canvas.height / 2 + 40;
            
            // Проверяем 4 линии сверху (наклон вправо)
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const x1 = startX + i * spacing;
                    const x2 = x1 + lineLength * 0.6;
                    const y2 = topY + lineLength;
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - x2, 2) + 
                        Math.pow(pos.y - y2, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
            
            // Проверяем 4 линии снизу (наклон влево)
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i + 4)) {
                    const x1 = startX + i * spacing;
                    const x2 = x1 - lineLength * 0.6;
                    const y2 = bottomY + lineLength;
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - x2, 2) + 
                        Math.pow(pos.y - y2, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-circles') {
            // Круги - проверяем возврат к стартовой точке (полный круг)
            const spacing = 90;
            const radius = 35;
            const startX = 90;
            const centerY = canvas.height / 2;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = startX + i * spacing;
                    const startY = centerY - radius;
                    
                    // Проверяем, вернулся ли пользователь к стартовой точке
                    const distanceToStart = Math.sqrt(
                        Math.pow(pos.x - cx, 2) + 
                        Math.pow(pos.y - startY, 2)
                    );
                    
                    // Также проверяем, что пользователь прошел достаточно пути (хотя бы половину круга)
                    if (distanceToStart <= 30 && userPath.length > 50) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-arcs') {
            // Дуги
            const spacing = 120;
            const radius = 40;
            const startX = 80;
            const topY = canvas.height / 2 - 120;
            const bottomY = canvas.height / 2 + 120;
            
            // Проверяем 4 дуги сверху (финиш слева)
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = startX + i * spacing;
                    const endX_point = cx - radius; // Слева
                    const endY_point = topY;
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - endX_point, 2) + 
                        Math.pow(pos.y - endY_point, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
            
            // Проверяем 4 дуги снизу (финиш справа)
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i + 4)) {
                    const cx = startX + i * spacing;
                    const endX_point = cx + radius; // Справа
                    const endY_point = bottomY;
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - endX_point, 2) + 
                        Math.pow(pos.y - endY_point, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        } else if (currentExercise.type === 'path-loops') {
            // Пружинка (горизонтальная спираль)
            const spiralSpacing = 180;
            const spiralWidth = 140;
            const spiralHeight = 80;
            const coilsPerSpiral = 4;
            const startX = 60;
            const centerY = canvas.height / 2;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const spiralStartX = startX + i * spiralSpacing;
                    const spiralEndX = spiralStartX + spiralWidth;
                    
                    // Финишная точка (справа, в конце последнего витка)
                    const finalAngle = coilsPerSpiral * Math.PI * 2;
                    const endY = centerY + Math.sin(finalAngle) * spiralHeight / 2;
                    
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - spiralEndX, 2) + 
                        Math.pow(pos.y - endY, 2)
                    );
                    
                    if (distanceToFinish <= 30) {
                        completePathExercise();
                        return;
                    }
                }
            }
        }
    } else if (finishZone) {
        // Для обычных упражнений - проверяем единственную финишную зону
        const distanceToFinish = Math.sqrt(
            Math.pow(pos.x - finishZone.x, 2) + 
            Math.pow(pos.y - finishZone.y, 2)
        );
        
        if (distanceToFinish <= finishZone.radius) {
            completePathExercise();
        }
    }
}

// Вычисление расстояния от точки до ближайшей точки траектории
function getDistanceToPath(point) {
    if (pathPoints.length === 0) return 0;
    
    let minDistance = Infinity;
    
    for (let i = 0; i < pathPoints.length; i++) {
        const pathPoint = pathPoints[i];
        const distance = Math.sqrt(
            Math.pow(point.x - pathPoint.x, 2) + 
            Math.pow(point.y - pathPoint.y, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
        }
    }
    
    return minDistance;
}

// Проверка достижения финиша
function checkPathFinish() {
    if (exerciseCompleted || !finishZone || userPath.length === 0) return;
    
    const lastPoint = userPath[userPath.length - 1];
    const distanceToFinish = Math.sqrt(
        Math.pow(lastPoint.x - finishZone.x, 2) + 
        Math.pow(lastPoint.y - finishZone.y, 2)
    );
    
    if (distanceToFinish <= finishZone.radius) {
        completePathExercise();
    }
}

// Завершение упражнения с дорожкой
function completePathExercise() {
    if (exerciseCompleted) return;
    
    // СТРОГАЯ ПРОВЕРКА: переход только при идеальном прохождении (0 ошибок)
    if (exitCount === 0) {
        // Для упражнений с несколькими линиями - определяем, какую линию завершили
        if (totalSubTasks > 0) {
            // Определяем, на какой линии пользователь закончил
            const lastPoint = userPath[userPath.length - 1];
            let completedLine = -1;
            let minDistance = Infinity;
            
            if (currentExercise.type === 'path-lines') {
                // Прямые линии
                const spacing = 90;
                const startX = 80;
                const startY = canvas.height / 2 - 90;
                const lineLength = 180;
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const lineX = startX + i * spacing;
                        const finishY = startY + lineLength;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - lineX, 2) + 
                            Math.pow(lastPoint.y - finishY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-diagonal') {
                // Наклонные линии
                const spacing = 100;
                const lineLength = 100;
                const startX = 100;
                const topY = canvas.height / 2 - 120;
                const bottomY = canvas.height / 2 + 40;
                
                // Проверяем 4 линии сверху (наклон вправо)
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const x2 = startX + i * spacing + lineLength * 0.6;
                        const y2 = topY + lineLength;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - x2, 2) + 
                            Math.pow(lastPoint.y - y2, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
                
                // Проверяем 4 линии снизу (наклон влево)
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i + 4)) {
                        const x2 = startX + i * spacing - lineLength * 0.6;
                        const y2 = bottomY + lineLength;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - x2, 2) + 
                            Math.pow(lastPoint.y - y2, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i + 4;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-circles') {
                // Круги
                const spacing = 90;
                const radius = 35;
                const startX = 90;
                const centerY = canvas.height / 2;
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cx = startX + i * spacing;
                        const startY = centerY - radius;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - cx, 2) + 
                            Math.pow(lastPoint.y - startY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-arcs') {
                // Дуги
                const spacing = 120;
                const radius = 40;
                const startX = 80;
                const topY = canvas.height / 2 - 120;
                const bottomY = canvas.height / 2 + 120;
                
                // Проверяем 4 дуги сверху (финиш слева)
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cx = startX + i * spacing;
                        const endX_point = cx - radius;
                        const endY_point = topY;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - endX_point, 2) + 
                            Math.pow(lastPoint.y - endY_point, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
                
                // Проверяем 4 дуги снизу (финиш справа)
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i + 4)) {
                        const cx = startX + i * spacing;
                        const endX_point = cx + radius;
                        const endY_point = bottomY;
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - endX_point, 2) + 
                            Math.pow(lastPoint.y - endY_point, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i + 4;
                        }
                    }
                }
            } else if (currentExercise.type === 'path-loops') {
                // Пружинка (горизонтальная спираль)
                const spiralSpacing = 180;
                const spiralWidth = 140;
                const spiralHeight = 80;
                const coilsPerSpiral = 4;
                const startX = 60;
                const centerY = canvas.height / 2;
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const spiralStartX = startX + i * spiralSpacing;
                        const spiralEndX = spiralStartX + spiralWidth;
                        
                        // Финишная точка (справа, в конце последнего витка)
                        const finalAngle = coilsPerSpiral * Math.PI * 2;
                        const endY = centerY + Math.sin(finalAngle) * spiralHeight / 2;
                        
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - spiralEndX, 2) + 
                            Math.pow(lastPoint.y - endY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 30) {
                            minDistance = distance;
                            completedLine = i;
                        }
                    }
                }
            }
            
            if (completedLine !== -1) {
                // Отмечаем линию как завершенную
                completedSubTasks.push(completedLine);
                
                const feedback = document.getElementById('feedback');
                
                // Проверяем, все ли линии завершены
                if (completedSubTasks.length >= totalSubTasks) {
                    // Все линии завершены - переход к следующему упражнению
                    exerciseCompleted = true;
                    isDrawing = false;
                    
                    feedback.textContent = `🎉 Идеально! Все ${totalSubTasks} линии выполнены!`;
                    feedback.className = 'feedback';
                    feedback.classList.remove('hidden');
                    
                    // Автоматический переход к следующему упражнению
                    setTimeout(() => {
                        nextExercise();
                    }, 1500);
                } else {
                    // Еще есть незавершенные линии
                    feedback.textContent = `✓ Отлично! Линия ${completedSubTasks.length} из ${totalSubTasks}. Проведи остальные!`;
                    feedback.className = 'feedback';
                    feedback.classList.remove('hidden');
                    
                    // Через 1 секунду перерисовываем
                    setTimeout(() => {
                        clearCanvas();
                        drawExerciseTemplate(currentExercise);
                        feedback.classList.add('hidden');
                        // Обнуляем состояние для новой линии
                        userPath = [];
                        exitCount = 0;
                        isOutOfBounds = false;
                    }, 1000);
                }
            }
        } else {
            // Обычное упражнение без подзадач
            exerciseCompleted = true;
            isDrawing = false;
            
            drawFinishMark();
            
            const feedback = document.getElementById('feedback');
            feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
            feedback.className = 'feedback';
            feedback.classList.remove('hidden');
            
            setTimeout(() => {
                nextExercise();
            }, 1500);
        }
    } else {
        // Если были ошибки - не засчитываем, заставляем пройти заново
        isDrawing = false;
        
        const feedback = document.getElementById('feedback');
        feedback.textContent = '⚠️ Были выходы за границы. Попробуй еще раз!';
        feedback.className = 'feedback error';
        feedback.classList.remove('hidden');
        
        // Через 1.5 секунды очищаем и даем пройти уровень заново
        setTimeout(() => {
            clearCanvas();
            drawExerciseTemplate(currentExercise);
            feedback.classList.add('hidden');
            // Полное обнуление состояния
            userPath = [];
            exitCount = 0;
            isOutOfBounds = false;
        }, 1500);
    }
}

// Рисование финишной отметки
function drawFinishMark() {
    if (!finishZone) return;
    
    // Зеленый круг
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(finishZone.x, finishZone.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Белая галочка
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(finishZone.x - 8, finishZone.y);
    ctx.lineTo(finishZone.x - 2, finishZone.y + 6);
    ctx.lineTo(finishZone.x + 8, finishZone.y - 6);
    ctx.stroke();
}

// Вибрация устройства
function vibrateDevice() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50); // 50ms вибрация
    }
}

// Шаблоны упражнений
function drawExerciseTemplate(exercise) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch(exercise.type) {
        // Модуль 1: Точечные упражнения
        case 'point-center':
            drawCenterTarget();
            break;
        case 'point-top':
            drawTopTarget();
            break;
        case 'point-bottom':
            drawBottomTarget();
            break;
        case 'point-left':
            drawLeftTarget();
            break;
        case 'point-right':
            drawRightTarget();
            break;
        
        // Модуль 2: Дорожки
        case 'path-straight':
            drawStraightPath();
            break;
        case 'path-vertical':
            drawVerticalPath();
            break;
        case 'path-zigzag':
            drawZigzagPath();
            break;
        case 'path-wave':
            drawWavePath();
            break;
        case 'path-spiral':
            drawSpiralPath();
            break;
        
        // Модуль 3: Базовые элементы
        case 'path-lines':
            drawPathLines();
            break;
        case 'path-line-1':
        case 'path-line-2':
        case 'path-line-3':
        case 'path-line-4':
        case 'path-line-5':
            drawPathSingleLine();
            break;
        case 'path-diagonal':
            drawPathDiagonal();
            break;
        case 'path-circles':
            drawPathCircles();
            break;
        case 'path-arcs':
            drawPathArcs();
            break;
        case 'path-loops':
            drawPathLoops();
            break;
        
        // Другие модули
        case 'line':
            drawLineGuide();
            break;
        case 'path':
            drawPath();
            break;
        case 'wave':
            drawWaveGuide();
            break;
        case 'lines':
            drawLinesTemplate();
            break;
        case 'ovals':
            drawOvalsTemplate();
            break;
        case 'pattern':
            drawPatternTemplate();
            break;
        case 'copy':
            drawCopyTemplate();
            break;
        case 'grid':
            drawGrid();
            break;
        default:
            drawDefaultTemplate();
    }
}

function drawCenterTarget() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Устанавливаем целевую зону
    targetZone = { x: cx, y: cy, radius: 50 };
    
    // Рисуем концентрические круги
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    
    // Внешний круг
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Средний круг
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    // Внутренний круг
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Центральная точка
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawTopTarget() {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.2;
    
    targetZone = { x: cx, y: cy, radius: 50 };
    
    // Стрелка вверх
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy + 60);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx, cy + 20);
    ctx.lineTo(cx - 15, cy + 35);
    ctx.lineTo(cx + 15, cy + 35);
    ctx.closePath();
    ctx.fill();
    
    // Целевой круг
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
}

function drawBottomTarget() {
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.8;
    
    targetZone = { x: cx, y: cy, radius: 50 };
    
    // Стрелка вниз
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx, cy - 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx - 15, cy - 35);
    ctx.lineTo(cx + 15, cy - 35);
    ctx.closePath();
    ctx.fill();
    
    // Целевой круг
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
}

function drawLeftTarget() {
    const cx = canvas.width * 0.2;
    const cy = canvas.height / 2;
    
    targetZone = { x: cx, y: cy, radius: 50 };
    
    // Стрелка влево
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(cx + 60, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy);
    ctx.lineTo(cx + 35, cy - 15);
    ctx.lineTo(cx + 35, cy + 15);
    ctx.closePath();
    ctx.fill();
    
    // Целевой круг
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
}

function drawRightTarget() {
    const cx = canvas.width * 0.8;
    const cy = canvas.height / 2;
    
    targetZone = { x: cx, y: cy, radius: 50 };
    
    // Стрелка вправо
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy);
    ctx.lineTo(cx - 20, cy);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx - 35, cy - 15);
    ctx.lineTo(cx - 35, cy + 15);
    ctx.closePath();
    ctx.fill();
    
    // Целевой круг
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
}

// ============================================
// МОДУЛЬ 2: ОТРИСОВКА ДОРОЖЕК
// ============================================

// Прямая горизонтальная дорожка
function drawStraightPath() {
    const startX = 50;
    const endX = canvas.width - 50;
    const y = canvas.height / 2;
    
    pathPoints = [];
    for (let x = startX; x <= endX; x += 5) {
        pathPoints.push({ x: x, y: y });
    }
    
    // Фон дорожки (широкая серая линия)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    finishZone = { x: endX, y: y, radius: 30 };
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(endX, y, 15, 0, Math.PI * 2);
    ctx.stroke();
}

// Вертикальная дорожка (столбик)
function drawVerticalPath() {
    const x = canvas.width / 2;
    const startY = canvas.height - 50;
    const endY = 50;
    
    pathPoints = [];
    for (let y = startY; y >= endY; y -= 5) {
        pathPoints.push({ x: x, y: y });
    }
    
    // Фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(x, startY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    finishZone = { x: x, y: endY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, endY, 15, 0, Math.PI * 2);
    ctx.stroke();
}

// Зигзаг (кочки)
function drawZigzagPath() {
    const startX = 50;
    const endX = canvas.width - 50;
    const centerY = canvas.height / 2;
    const amplitude = 60;
    const segments = 5;
    const segmentWidth = (endX - startX) / segments;
    
    pathPoints = [];
    
    // Стартовая Y-координата (первая точка зигзага)
    const startY = centerY - amplitude;
    
    // Генерируем все точки траектории
    for (let i = 0; i <= segments; i++) {
        const x1 = startX + i * segmentWidth;
        const y1 = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
        
        if (i < segments) {
            const x2 = startX + (i + 1) * segmentWidth;
            const y2 = (i + 1) % 2 === 0 ? centerY - amplitude : centerY + amplitude;
            
            // Интерполируем точки между вершинами зигзага
            const steps = Math.ceil(segmentWidth / 5);
            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                const px = x1 + (x2 - x1) * t;
                const py = y1 + (y2 - y1) * t;
                pathPoints.push({ x: px, y: py });
            }
        } else {
            // Добавляем последнюю точку
            pathPoints.push({ x: x1, y: y1 });
        }
    }
    
    // Рисуем фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    ctx.moveTo(startX, startY);
    
    for (let i = 0; i <= segments; i++) {
        const x = startX + i * segmentWidth;
        const y = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let i = 0; i <= segments; i++) {
        const x = startX + i * segmentWidth;
        const y = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка (на первой вершине зигзага)
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, startY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона (на последней вершине зигзага)
    const finalY = segments % 2 === 0 ? centerY - amplitude : centerY + amplitude;
    finishZone = { x: endX, y: finalY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(endX, finalY, 15, 0, Math.PI * 2);
    ctx.stroke();
}

// Волнистая дорожка
function drawWavePath() {
    const startX = 50;
    const endX = canvas.width - 50;
    const centerY = canvas.height / 2;
    const amplitude = 40;
    const frequency = 0.02;
    
    pathPoints = [];
    
    // Фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    
    for (let x = startX; x <= endX; x += 5) {
        const y = centerY + Math.sin((x - startX) * frequency) * amplitude;
        ctx.lineTo(x, y);
        pathPoints.push({ x: x, y: y });
    }
    ctx.stroke();
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    for (let x = startX; x <= endX; x += 5) {
        const y = centerY + Math.sin((x - startX) * frequency) * amplitude;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    const finalY = centerY + Math.sin((endX - startX) * frequency) * amplitude;
    finishZone = { x: endX, y: finalY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(endX, finalY, 15, 0, Math.PI * 2);
    ctx.stroke();
}

// Спираль (улитка)
function drawSpiralPath() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 60;
    const turns = 3;
    const points = 200;
    
    pathPoints = [];
    
    // Фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const angle = t * turns * Math.PI * 2;
        const radius = t * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        if (i % 3 === 0) {
            pathPoints.push({ x: x, y: y });
        }
    }
    ctx.stroke();
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
        const t = i / points;
        const angle = t * turns * Math.PI * 2;
        const radius = t * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка (центр)
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона (конец спирали)
    const finalAngle = turns * Math.PI * 2;
    const finalX = centerX + Math.cos(finalAngle) * maxRadius;
    const finalY = centerY + Math.sin(finalAngle) * maxRadius;
    finishZone = { x: finalX, y: finalY, radius: 30 };
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(finalX, finalY, 15, 0, Math.PI * 2);
    ctx.stroke();
}

// ============================================
// МОДУЛЬ 3: БАЗОВЫЕ ЭЛЕМЕНТЫ
// ============================================

// Прямые линии - 5 вертикальных линий на одном экране (все активны одновременно)
function drawPathLines() {
    const spacing = 90;
    const lineLength = 180;
    const startX = 80;
    const startY = canvas.height / 2 - 90;
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ линий сразу
    for (let i = 0; i < 5; i++) {
        const x = startX + i * spacing;
        for (let y = startY; y <= startY + lineLength; y += 5) {
            pathPoints.push({ x: x, y: y });
        }
    }
    
    // Рисуем все 5 линий
    for (let i = 0; i < 5; i++) {
        const x = startX + i * spacing;
        const isCompleted = completedSubTasks.includes(i); // Завершенные линии
        
        // Фон линии (серая зона)
        if (isCompleted) {
            // Завершенные линии - зеленый фон
            ctx.strokeStyle = '#c8e6c9';
        } else {
            // Активные линии - обычный серый фон
            ctx.strokeStyle = '#e0e0e0';
        }
        ctx.lineWidth = 35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + lineLength);
        ctx.stroke();
        
        // Целевая траектория (пунктир)
        if (isCompleted) {
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
        }
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY + lineLength);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка
        if (isCompleted) {
            // Галочка на завершенных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 5, startY);
            ctx.lineTo(x - 1, startY + 4);
            ctx.lineTo(x + 5, startY - 4);
            ctx.stroke();
        } else {
            // Зеленая точка на активных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            // Зеленая галочка на завершенных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY + lineLength, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 5, startY + lineLength);
            ctx.lineTo(x - 1, startY + lineLength + 4);
            ctx.lineTo(x + 5, startY + lineLength - 4);
            ctx.stroke();
        } else {
            // Оранжевый финиш на активных линиях
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, startY + lineLength, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Финишные зоны для всех незавершенных линий
    // (проверка будет в drawPathWithCheck)
}

// Одна прямая линия (используется для других упражнений если нужно)
function drawPathSingleLine() {
    const lineLength = 180;
    const centerX = canvas.width / 2;
    const startY = canvas.height / 2 - 90;
    
    pathPoints = [];
    
    // Генерируем точки траектории
    for (let y = startY; y <= startY + lineLength; y += 5) {
        pathPoints.push({ x: centerX, y: y });
    }
    
    // Фон линии (серая зона)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 35;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, startY);
    ctx.lineTo(centerX, startY + lineLength);
    ctx.stroke();
    
    // Целевая траектория (пунктир)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, startY);
    ctx.lineTo(centerX, startY + lineLength);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, startY, 14, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
    finishZone = { x: centerX, y: startY + lineLength, radius: 30 };
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, startY + lineLength, 14, 0, Math.PI * 2);
    ctx.stroke();
}

// Наклонные линии - 4 линии вправо сверху + 4 линии влево снизу (все активны одновременно)
function drawPathDiagonal() {
    const spacing = 100;
    const lineLength = 100;
    const startX = 100;
    const topY = canvas.height / 2 - 120;
    const bottomY = canvas.height / 2 + 40;
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ линий сразу
    // 4 линии сверху (наклон вправо)
    for (let i = 0; i < 4; i++) {
        const x1 = startX + i * spacing;
        const y1 = topY;
        const x2 = x1 + lineLength * 0.6;
        const y2 = topY + lineLength;
        
        const steps = Math.ceil(lineLength / 5);
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // 4 линии снизу (наклон влево)
    for (let i = 0; i < 4; i++) {
        const x1 = startX + i * spacing;
        const y1 = bottomY;
        const x2 = x1 - lineLength * 0.6;
        const y2 = bottomY + lineLength;
        
        const steps = Math.ceil(lineLength / 5);
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 8 линий
    // 4 линии сверху (наклон вправо)
    for (let i = 0; i < 4; i++) {
        const x1 = startX + i * spacing;
        const y1 = topY;
        const x2 = x1 + lineLength * 0.6;
        const y2 = topY + lineLength;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон линии
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1 - 5, y1);
            ctx.lineTo(x1 - 1, y1 + 4);
            ctx.lineTo(x1 + 5, y1 - 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x2, y2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x2 - 5, y2);
            ctx.lineTo(x2 - 1, y2 + 4);
            ctx.lineTo(x2 + 5, y2 - 4);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x2, y2, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 4 линии снизу (наклон влево)
    for (let i = 0; i < 4; i++) {
        const x1 = startX + i * spacing;
        const y1 = bottomY;
        const x2 = x1 - lineLength * 0.6;
        const y2 = bottomY + lineLength;
        const isCompleted = completedSubTasks.includes(i + 4); // Индексы 4-7
        
        // Фон линии
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1 - 5, y1);
            ctx.lineTo(x1 - 1, y1 + 4);
            ctx.lineTo(x1 + 5, y1 - 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x2, y2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x2 - 5, y2);
            ctx.lineTo(x2 - 1, y2 + 4);
            ctx.lineTo(x2 + 5, y2 - 4);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x2, y2, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Круги - 5 кругов (все активны одновременно)
function drawPathCircles() {
    const spacing = 90;
    const radius = 35;
    const startX = 90;
    const centerY = canvas.height / 2;
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ кругов сразу
    for (let i = 0; i < 5; i++) {
        const cx = startX + i * spacing;
        
        // Генерируем точки траектории круга
        const steps = 100;
        for (let j = 0; j <= steps; j++) {
            const angle = (j / steps) * Math.PI * 2;
            const px = cx + Math.cos(angle) * radius;
            const py = centerY + Math.sin(angle) * radius;
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 5 кругов
    for (let i = 0; i < 5; i++) {
        const cx = startX + i * spacing;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон круга (широкая серая линия)
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.arc(cx, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.arc(cx, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (сверху круга)
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(cx, centerY - radius, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 5, centerY - radius);
            ctx.lineTo(cx - 1, centerY - radius + 4);
            ctx.lineTo(cx + 5, centerY - radius - 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(cx, centerY - radius, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (тоже сверху круга, рядом со стартом)
        if (isCompleted) {
            // Не рисуем финиш на завершенных кругах, там уже галочка
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, centerY - radius, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Дуги - 4 дуги сверху (вверх) + 4 дуги снизу (вниз) (все активны одновременно)
function drawPathArcs() {
    const spacing = 120;
    const radius = 40;
    const startX = 80;
    const topY = canvas.height / 2 - 120;
    const bottomY = canvas.height / 2 + 120;
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ дуг сразу
    // 4 дуги сверху (смотрят вверх)
    for (let i = 0; i < 4; i++) {
        const cx = startX + i * spacing;
        const startAngle = 0;
        const endAngle = Math.PI;
        
        const steps = 50;
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const angle = startAngle + (endAngle - startAngle) * t;
            const px = cx + Math.cos(angle) * radius;
            const py = topY - Math.sin(angle) * radius; // Минус для направления вверх
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // 4 дуги снизу (смотрят вниз)
    for (let i = 0; i < 4; i++) {
        const cx = startX + i * spacing;
        const startAngle = Math.PI;
        const endAngle = Math.PI * 2;
        
        const steps = 50;
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const angle = startAngle + (endAngle - startAngle) * t;
            const px = cx + Math.cos(angle) * radius;
            const py = bottomY + Math.sin(angle) * radius; // Плюс для направления вниз
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 8 дуг
    // 4 дуги сверху (смотрят вверх)
    for (let i = 0; i < 4; i++) {
        const cx = startX + i * spacing;
        const isCompleted = completedSubTasks.includes(i);
        const startAngle = 0;
        const endAngle = Math.PI;
        
        // Фон дуги
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, topY, radius, startAngle, endAngle);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.arc(cx, topY, radius, startAngle, endAngle);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (справа)
        const startX_point = cx + Math.cos(startAngle) * radius;
        const startY_point = topY - Math.sin(startAngle) * radius;
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX_point - 5, startY_point);
            ctx.lineTo(startX_point - 1, startY_point + 4);
            ctx.lineTo(startX_point + 5, startY_point - 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (слева)
        const endX_point = cx + Math.cos(endAngle) * radius;
        const endY_point = topY - Math.sin(endAngle) * radius;
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(endX_point, endY_point, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(endX_point - 5, endY_point);
            ctx.lineTo(endX_point - 1, endY_point + 4);
            ctx.lineTo(endX_point + 5, endY_point - 4);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(endX_point, endY_point, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 4 дуги снизу (смотрят вниз)
    for (let i = 0; i < 4; i++) {
        const cx = startX + i * spacing;
        const isCompleted = completedSubTasks.includes(i + 4); // Индексы 4-7
        const startAngle = Math.PI;
        const endAngle = Math.PI * 2;
        
        // Фон дуги
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, bottomY, radius, startAngle, endAngle);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.arc(cx, bottomY, radius, startAngle, endAngle);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (слева)
        const startX_point = cx + Math.cos(startAngle) * radius;
        const startY_point = bottomY + Math.sin(startAngle) * radius;
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX_point - 5, startY_point);
            ctx.lineTo(startX_point - 1, startY_point + 4);
            ctx.lineTo(startX_point + 5, startY_point - 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (справа)
        const endX_point = cx + Math.cos(endAngle) * radius;
        const endY_point = bottomY + Math.sin(endAngle) * radius;
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(endX_point, endY_point, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(endX_point - 5, endY_point);
            ctx.lineTo(endX_point - 1, endY_point + 4);
            ctx.lineTo(endX_point + 5, endY_point - 4);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(endX_point, endY_point, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Пружинка - горизонтальная спираль с 4-5 витками (все активны одновременно)
function drawPathLoops() {
    const spiralCount = 3; // Количество пружинок (уменьшено до 3)
    const spiralSpacing = 180; // Увеличенное расстояние между пружинками
    const spiralWidth = 140; // Увеличенная ширина одной пружинки
    const spiralHeight = 80; // Увеличенная высота витков
    const coilsPerSpiral = 4; // Количество витков в каждой пружинке
    const startX = 60; // Сдвинуто левее для лучшего размещения
    const centerY = canvas.height / 2;
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ пружинок сразу
    for (let i = 0; i < spiralCount; i++) {
        const spiralStartX = startX + i * spiralSpacing;
        
        // Генерируем точки траектории пружинки (горизонтальная спираль)
        const totalSteps = 200; // Больше точек для плавной кривой
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            
            // Горизонтальное движение слева направо
            const px = spiralStartX + t * spiralWidth;
            
            // Вертикальные колебания (синусоида с увеличивающейся частотой)
            const angle = t * coilsPerSpiral * Math.PI * 2;
            const py = centerY + Math.sin(angle) * spiralHeight / 2;
            
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 3 пружинки
    for (let i = 0; i < spiralCount; i++) {
        const spiralStartX = startX + i * spiralSpacing;
        const spiralEndX = spiralStartX + spiralWidth;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон пружинки (широкая серая линия)
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = 30; // Увеличенная толщина линии
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        // Рисуем траекторию пружинки
        const totalSteps = 200;
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            const px = spiralStartX + t * spiralWidth;
            const angle = t * coilsPerSpiral * Math.PI * 2;
            const py = centerY + Math.sin(angle) * spiralHeight / 2;
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        
        // Целевая траектория (пунктир)
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            const px = spiralStartX + t * spiralWidth;
            const angle = t * coilsPerSpiral * Math.PI * 2;
            const py = centerY + Math.sin(angle) * spiralHeight / 2;
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (слева, в начале первого витка)
        const startY = centerY; // Начинаем по центру
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(spiralStartX, startY, 15, 0, Math.PI * 2); // Увеличенный размер точки
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(spiralStartX - 6, startY);
            ctx.lineTo(spiralStartX - 2, startY + 5);
            ctx.lineTo(spiralStartX + 6, startY - 5);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(spiralStartX, startY, 15, 0, Math.PI * 2); // Увеличенный размер точки
            ctx.fill();
        }
        
        // Финишная точка (справа, в конце последнего витка)
        const finalAngle = coilsPerSpiral * Math.PI * 2;
        const endY = centerY + Math.sin(finalAngle) * spiralHeight / 2;
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(spiralEndX, endY, 15, 0, Math.PI * 2); // Увеличенный размер точки
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(spiralEndX - 6, endY);
            ctx.lineTo(spiralEndX - 2, endY + 5);
            ctx.lineTo(spiralEndX + 6, endY - 5);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(spiralEndX, endY, 15, 0, Math.PI * 2); // Увеличенный размер точки
            ctx.stroke();
        }
    }
}

function drawLineGuide() {
    const y = canvas.height / 2;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(canvas.width - 50, y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPath() {
    const startY = canvas.height / 2;
    const width = canvas.width - 100;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(50, startY);
    ctx.lineTo(canvas.width - 50, startY);
    ctx.stroke();
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, startY);
    ctx.lineTo(canvas.width - 50, startY);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawWaveGuide() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, canvas.height / 2);
    
    for (let x = 50; x < canvas.width - 50; x += 20) {
        const y = canvas.height / 2 + Math.sin(x / 30) * 40;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawLinesTemplate() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < 5; i++) {
        const x = 80 + i * 80;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 250);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawOvalsTemplate() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < 4; i++) {
        const x = 80 + i * 100;
        const y = canvas.height / 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 30, 50, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawPatternTemplate() {
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    
    // Образец
    for (let i = 0; i < 3; i++) {
        const x = 60 + i * 80;
        // Короткая линия
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 130);
        ctx.stroke();
        // Длинная линия
        ctx.beginPath();
        ctx.moveTo(x + 40, 100);
        ctx.lineTo(x + 40, 160);
        ctx.stroke();
    }
    
    // Пунктир для продолжения
    ctx.strokeStyle = '#e0e0e0';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, 250);
    ctx.lineTo(canvas.width - 50, 250);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawCopyTemplate() {
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    
    // Образец слева
    ctx.beginPath();
    ctx.moveTo(80, 150);
    ctx.lineTo(120, 150);
    ctx.lineTo(100, 180);
    ctx.closePath();
    ctx.stroke();
    
    // Рамка справа для копирования
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 + 20, 120, 100, 100);
}

function drawGrid() {
    const cellSize = 40;
    const cols = Math.floor(canvas.width / cellSize);
    const rows = Math.floor(canvas.height / cellSize);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
}

function drawDefaultTemplate() {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Управление упражнением
function clearCanvas() {
    if (!canvas || !ctx) {
        console.warn('Canvas not available for clearing');
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentExercise) {
        drawExerciseTemplate(currentExercise);
    }
}

function showHint() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '💡 Выполняй задание медленно и аккуратно';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 2000);
}

function nextExercise() {
    if (exerciseCompleted) {
        // Сохранение результата
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        stats.totalExercises++;
        stats.successfulExercises++;
        stats.totalTime += timeSpent;
        saveStats();
    }
    
    // Переход к следующему упражнению в модуле
    currentExerciseIndex++;
    
    if (currentExerciseIndex < moduleExercises.length) {
        // Есть еще упражнения в модуле
        currentExercise = moduleExercises[currentExerciseIndex];
        displayExercise(currentExercise);
        startTime = Date.now();
    } else {
        // Модуль завершен
        showModuleCompleteFeedback();
        setTimeout(() => {
            exitExercise();
        }, 2000);
    }
}

function showModuleCompleteFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '🎉 Отлично! Все упражнения выполнены!';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
}

function exitExercise() {
    showMainMenu();
}

// Обновление результатов
function updateResultsDisplay() {
    document.getElementById('total-exercises').textContent = stats.totalExercises;
    
    const successRate = stats.totalExercises > 0 
        ? Math.round((stats.successfulExercises / stats.totalExercises) * 100)
        : 0;
    document.getElementById('success-rate').textContent = successRate + '%';
    
    const avgTime = stats.totalExercises > 0
        ? Math.round(stats.totalTime / stats.totalExercises)
        : 0;
    document.getElementById('avg-time').textContent = avgTime;
    
    document.getElementById('progress-fill').style.width = Math.min(successRate, 100) + '%';
}

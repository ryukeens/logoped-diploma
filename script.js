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
    // Разрешаем скролл в меню
    document.body.style.overflow = 'auto';
}

function showExercises() {
    hideAllScreens();
    document.getElementById('exercises-menu').classList.remove('hidden');
    // Разрешаем скролл в меню выбора упражнений
    document.body.style.overflow = 'auto';
}

function showResults() {
    hideAllScreens();
    document.getElementById('results-screen').classList.remove('hidden');
    updateResultsDisplay();
    // Разрешаем скролл на экране результатов
    document.body.style.overflow = 'auto';
}

function showInfo() {
    hideAllScreens();
    document.getElementById('info-screen').classList.remove('hidden');
    // Разрешаем скролл на экране информации
    document.body.style.overflow = 'auto';
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
            // Пересчитываем размеры с учетом позиции кнопок
            resizeCanvas();
        }
        
        currentExercise = moduleExercises[currentExerciseIndex];
        displayExercise(currentExercise);
        startTime = Date.now();
    }, 100); // Увеличена задержка до 100ms для надежности
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
            { title: 'Круги', type: 'path-circles', instruction: 'Обведи все круги по контуру', subTasks: 6 },
            { title: 'Дуги', type: 'path-arcs', instruction: 'Обведи все дуги плавным движением', subTasks: 5 },
            { title: 'Пружинка', type: 'path-loops', instruction: 'Обведи волнистые линии слева направо', subTasks: 3 }
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

// Переход к следующему упражнению
function nextExercise() {
    if (exerciseCompleted) {
        stats.successfulExercises++;
        stats.totalTime += Date.now() - startTime;
    }
    stats.totalExercises++;
    saveStats();
    
    currentExerciseIndex++;
    
    if (currentExerciseIndex >= moduleExercises.length) {
        // Модуль завершен - автоматически переходим к экрану выбора модулей
        showExercises();
    } else {
        currentExercise = moduleExercises[currentExerciseIndex];
        displayExercise(currentExercise);
        startTime = Date.now();
    }
}

// Выход из упражнения
function exitExercise() {
    showExercises();
    // Разрешаем скролл при выходе из упражнения
    document.body.style.overflow = 'auto';
}

// Обновление отображения результатов
function updateResultsDisplay() {
    const accuracy = stats.totalExercises > 0 ? 
        Math.round((stats.successfulExercises / stats.totalExercises) * 100) : 0;
    const avgTime = stats.successfulExercises > 0 ? 
        Math.round(stats.totalTime / stats.successfulExercises / 1000) : 0;
    
    document.getElementById('total-exercises').textContent = stats.totalExercises;
    document.getElementById('successful-exercises').textContent = stats.successfulExercises;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('average-time').textContent = avgTime + ' сек';
}

// Сброс статистики
function resetStats() {
    stats = {
        totalExercises: 0,
        successfulExercises: 0,
        totalTime: 0
    };
    saveStats();
    updateResultsDisplay();
}

// Отображение упражнения
function displayExercise(exercise) {
    if (!exercise) {
        console.error('No exercise provided!');
        return;
    }
    
    console.log('Displaying exercise:', exercise.title, exercise.type);
    
    // Блокируем скролл во время выполнения упражнения
    document.body.style.overflow = 'hidden';
    
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
        // Пересчитываем размеры canvas перед отрисовкой
        resizeCanvas();
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
    
    // Получаем контейнер canvas
    const container = canvas.parentElement;
    if (!container) return;
    
    // Получаем блок с кнопками управления
    const controlsBlock = document.querySelector('.controls');
    if (!controlsBlock) return;
    
    // Получаем позиции элементов
    const containerRect = container.getBoundingClientRect();
    const controlsRect = controlsBlock.getBoundingClientRect();
    
    // Безопасный отступ между canvas и кнопками (15px)
    const safeMargin = 15;
    
    // Вычисляем доступную высоту: от верха контейнера до верха кнопок минус безопасный отступ
    const availableHeight = controlsRect.top - containerRect.top - safeMargin;
    
    // Устанавливаем размеры canvas
    // Ширина - по контейнеру
    canvas.width = Math.floor(containerRect.width);
    
    // Высота - максимально доступная до кнопок
    canvas.height = Math.floor(Math.max(availableHeight, 200)); // Минимум 200px для безопасности
    
    console.log('Canvas resized:', canvas.width, 'x', canvas.height, 'Available height:', availableHeight);
    
    // Перерисовываем шаблон после изменения размера
    if (currentExercise) {
        drawExerciseTemplate(currentExercise);
    }
}

// Очистка canvas
function clearCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Перерисовываем шаблон после очистки
        if (currentExercise) {
            drawExerciseTemplate(currentExercise);
        }
    }
}

// Показать подсказку
function showHint() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '💡 Веди пальцем медленно и аккуратно по пунктирной линии';
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
    
    setTimeout(() => {
        feedback.classList.add('hidden');
    }, 3000);
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
            // Прямые линии - используем те же относительные координаты, что и в drawPathLines
            const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
            const startY = canvas.height * 0.35;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const lineX = canvas.width * linePositions[i];
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
            // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
            const linePositions = [0.2, 0.4, 0.6, 0.8];
            const topY = canvas.height * 0.4;
            const bottomY = canvas.height * 0.55;
            
            // Проверяем 4 линии сверху
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const x1 = canvas.width * linePositions[i];
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
                        const x1 = canvas.width * linePositions[i];
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
            // Круги - 6 кругов (3 слева в столбик, 3 справа в столбик)
            const radius = Math.min(28, canvas.width * 0.055);
            const leftX = canvas.width * 0.28;
            const rightX = canvas.width * 0.72;
            const topY = canvas.height * 0.25;
            const middleY = canvas.height * 0.5;
            const bottomY = canvas.height * 0.75;
            
            const circlePositions = [
                { x: leftX, y: topY },     // 0: левый верхний
                { x: leftX, y: middleY },  // 1: левый средний
                { x: leftX, y: bottomY },  // 2: левый нижний
                { x: rightX, y: topY },    // 3: правый верхний
                { x: rightX, y: middleY }, // 4: правый средний
                { x: rightX, y: bottomY }  // 5: правый нижний
            ];
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = circlePositions[i].x;
                    const cy = circlePositions[i].y;
                    const distance = Math.sqrt(
                        Math.pow(pos.x - cx, 2) + 
                        Math.pow(pos.y - (cy - radius), 2)
                    );
                    
                    if (distance <= 30) {
                        nearStart = true;
                        break;
                    }
                }
            }
        } else if (currentExercise.type === 'path-arcs') {
            // Дуги - 5 дуг по центру, смотрящих вниз
            const radius = Math.min(32, canvas.width * 0.065);
            const centerX = canvas.width * 0.5;
            const topY1 = canvas.height * 0.18;
            const topY2 = canvas.height * 0.33;
            const topY3 = canvas.height * 0.5;
            const topY4 = canvas.height * 0.67;
            const topY5 = canvas.height * 0.82;
            
            // Проверяем 5 дуг (стартовая точка слева)
            const yPositions = [topY1, topY2, topY3, topY4, topY5];
            for (let i = 0; i < 5; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cy = yPositions[i];
                    const startX_point = centerX - radius; // Слева
                    const startY_point = cy;
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
        } else if (currentExercise.type === 'path-loops') {
            // Пружинка - 3 волнистые линии в столбик
            const waveWidth = Math.min(200, canvas.width * 0.6);
            const startX = (canvas.width - waveWidth) / 2;
            const topY = canvas.height * 0.25;
            const middleY = canvas.height * 0.5;
            const bottomY = canvas.height * 0.75;
            const yPositions = [topY, middleY, bottomY];
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const centerY = yPositions[i];
                    const distance = Math.sqrt(
                        Math.pow(pos.x - startX, 2) + 
                        Math.pow(pos.y - centerY, 2)
                    );
                    
                    if (distance <= 40) { // Увеличенная зона старта для мобильных
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
    
    // Проверка выхода за границы - увеличенная зона допуска для мобильных устройств
    let boundaryTolerance = 20; // По умолчанию
    
    // Для упражнения "Пружинка" делаем более мягкие границы
    if (currentExercise && currentExercise.type === 'path-loops') {
        boundaryTolerance = 30; // Увеличенная зона допуска для волнистых линий
    }
    
    // Для упражнения "Спираль" (улитка) делаем еще более мягкие границы
    if (currentExercise && currentExercise.type === 'path-spiral') {
        boundaryTolerance = 30; // Увеличенная зона допуска для спирали
    }
    
    if (distanceToPath > boundaryTolerance) {
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
            // Прямые линии - используем те же относительные координаты, что и в drawPathLines
            const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
            const lineLength = canvas.height * 0.3;
            const startY = canvas.height * 0.35;
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const lineX = canvas.width * linePositions[i];
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
            // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
            const linePositions = [0.2, 0.4, 0.6, 0.8];
            const lineLength = canvas.height * 0.1;
            const topY = canvas.height * 0.4;
            const bottomY = canvas.height * 0.55;
            const diagonalOffset = canvas.width * 0.05;
            
            // Проверяем 4 линии сверху (наклон вправо)
            for (let i = 0; i < 4; i++) {
                if (!completedSubTasks.includes(i)) {
                    const x1 = canvas.width * linePositions[i];
                    const x2 = x1 + diagonalOffset;
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
                    const x1 = canvas.width * linePositions[i];
                    const x2 = x1 - diagonalOffset;
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
            const radius = Math.min(28, canvas.width * 0.055);
            const leftX = canvas.width * 0.28;
            const rightX = canvas.width * 0.72;
            const topY = canvas.height * 0.25;
            const middleY = canvas.height * 0.5;
            const bottomY = canvas.height * 0.75;
            
            const circlePositions = [
                { x: leftX, y: topY },     // 0: левый верхний
                { x: leftX, y: middleY },  // 1: левый средний
                { x: leftX, y: bottomY },  // 2: левый нижний
                { x: rightX, y: topY },    // 3: правый верхний
                { x: rightX, y: middleY }, // 4: правый средний
                { x: rightX, y: bottomY }  // 5: правый нижний
            ];
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cx = circlePositions[i].x;
                    const cy = circlePositions[i].y;
                    const startY = cy - radius;
                    
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
            // Дуги - 5 дуг по центру, смотрящих вниз
            const radius = Math.min(32, canvas.width * 0.065);
            const centerX = canvas.width * 0.5;
            const topY1 = canvas.height * 0.18;
            const topY2 = canvas.height * 0.33;
            const topY3 = canvas.height * 0.5;
            const topY4 = canvas.height * 0.67;
            const topY5 = canvas.height * 0.82;
            
            // Проверяем 5 дуг (финиш справа)
            const yPositions = [topY1, topY2, topY3, topY4, topY5];
            for (let i = 0; i < 5; i++) {
                if (!completedSubTasks.includes(i)) {
                    const cy = yPositions[i];
                    const endX_point = centerX + radius; // Справа
                    const endY_point = cy;
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
            // Пружинка - 3 волнистые линии в столбик
            const waveWidth = Math.min(200, canvas.width * 0.6);
            const waveHeight = Math.min(40, canvas.height * 0.08);
            const wavesPerLine = 2.5;
            const startX = (canvas.width - waveWidth) / 2;
            const topY = canvas.height * 0.25;
            const middleY = canvas.height * 0.5;
            const bottomY = canvas.height * 0.75;
            const yPositions = [topY, middleY, bottomY];
            
            for (let i = 0; i < totalSubTasks; i++) {
                if (!completedSubTasks.includes(i)) {
                    const centerY = yPositions[i];
                    const waveEndX = startX + waveWidth;
                    
                    // Финишная точка (справа)
                    const finalAngle = wavesPerLine * Math.PI * 2;
                    const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
                    
                    const distanceToFinish = Math.sqrt(
                        Math.pow(pos.x - waveEndX, 2) + 
                        Math.pow(pos.y - endY, 2)
                    );
                    
                    if (distanceToFinish <= 40) { // Увеличенная зона финиша для мобильных
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
    
    // ПРОВЕРКА ПРОХОЖДЕНИЯ: для спирали разрешаем несколько ошибок, для остальных - строго
    let allowedErrors = 0; // По умолчанию строгая проверка
    
    // Для упражнения "Спираль" (улитка) разрешаем до 3 выходов за границы
    if (currentExercise && currentExercise.type === 'path-spiral') {
        allowedErrors = 3;
    }
    
    if (exitCount <= allowedErrors) {
        // Для упражнений с несколькими линиями - определяем, какую линию завершили
        if (totalSubTasks > 0) {
            // Определяем, на какой линии пользователь закончил
            const lastPoint = userPath[userPath.length - 1];
            let completedLine = -1;
            let minDistance = Infinity;
            
            if (currentExercise.type === 'path-lines') {
                // Прямые линии - используем те же относительные координаты, что и в drawPathLines
                const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85];
                const lineLength = canvas.height * 0.3;
                const startY = canvas.height * 0.35;
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const lineX = canvas.width * linePositions[i];
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
                // Наклонные линии - используем те же относительные координаты, что и в drawPathDiagonal
                const linePositions = [0.2, 0.4, 0.6, 0.8];
                const lineLength = canvas.height * 0.1;
                const topY = canvas.height * 0.4;
                const bottomY = canvas.height * 0.55;
                const diagonalOffset = canvas.width * 0.05;
                
                // Проверяем 4 линии сверху (наклон вправо)
                for (let i = 0; i < 4; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const x2 = canvas.width * linePositions[i] + diagonalOffset;
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
                        const x2 = canvas.width * linePositions[i] - diagonalOffset;
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
                const radius = Math.min(28, canvas.width * 0.055);
                const leftX = canvas.width * 0.28;
                const rightX = canvas.width * 0.72;
                const topY = canvas.height * 0.25;
                const middleY = canvas.height * 0.5;
                const bottomY = canvas.height * 0.75;
                
                const circlePositions = [
                    { x: leftX, y: topY },     // 0: левый верхний
                    { x: leftX, y: middleY },  // 1: левый средний
                    { x: leftX, y: bottomY },  // 2: левый нижний
                    { x: rightX, y: topY },    // 3: правый верхний
                    { x: rightX, y: middleY }, // 4: правый средний
                    { x: rightX, y: bottomY }  // 5: правый нижний
                ];
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cx = circlePositions[i].x;
                        const cy = circlePositions[i].y;
                        const startY = cy - radius;
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
                // Дуги - 5 дуг по центру, смотрящих вниз
                const radius = Math.min(32, canvas.width * 0.065);
                const centerX = canvas.width * 0.5;
                const topY1 = canvas.height * 0.18;
                const topY2 = canvas.height * 0.33;
                const topY3 = canvas.height * 0.5;
                const topY4 = canvas.height * 0.67;
                const topY5 = canvas.height * 0.82;
                
                // Проверяем 5 дуг (финиш справа)
                const yPositions = [topY1, topY2, topY3, topY4, topY5];
                for (let i = 0; i < 5; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const cy = yPositions[i];
                        const endX_point = centerX + radius;
                        const endY_point = cy;
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
            } else if (currentExercise.type === 'path-loops') {
                // Пружинка - 3 волнистые линии в столбик
                const waveWidth = Math.min(200, canvas.width * 0.6);
                const waveHeight = Math.min(40, canvas.height * 0.08);
                const wavesPerLine = 2.5;
                const startX = (canvas.width - waveWidth) / 2;
                const topY = canvas.height * 0.25;
                const middleY = canvas.height * 0.5;
                const bottomY = canvas.height * 0.75;
                const yPositions = [topY, middleY, bottomY];
                
                for (let i = 0; i < totalSubTasks; i++) {
                    if (!completedSubTasks.includes(i)) {
                        const centerY = yPositions[i];
                        const waveEndX = startX + waveWidth;
                        
                        // Финишная точка (справа)
                        const finalAngle = wavesPerLine * Math.PI * 2;
                        const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
                        
                        const distance = Math.sqrt(
                            Math.pow(lastPoint.x - waveEndX, 2) + 
                            Math.pow(lastPoint.y - endY, 2)
                        );
                        
                        if (distance < minDistance && distance <= 40) { // Увеличенная зона для мобильных
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
            
            // Специальное сообщение для спирали с учетом допустимых ошибок
            if (currentExercise && currentExercise.type === 'path-spiral') {
                if (exitCount === 0) {
                    feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
                } else {
                    feedback.textContent = `✅ Отлично! ${exitCount} касаний границ (до 3 разрешено)`;
                }
            } else {
                feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
            }
            
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
        
        // Специальное сообщение об ошибке для спирали
        if (currentExercise && currentExercise.type === 'path-spiral') {
            feedback.textContent = `⚠️ Слишком много касаний границ (${exitCount}/3). Попробуй аккуратнее!`;
        } else {
            feedback.textContent = '⚠️ Были выходы за границы. Попробуй еще раз!';
        }
        
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
    const cy = canvas.height * 0.25; // Поднимаем выше - 25% от верха
    
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
    const cy = canvas.height * 0.75; // Опускаем ниже - 75% от верха
    
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
    const cx = canvas.width * 0.25; // Сдвигаем ближе к краю - 25% от левого края
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
    const cx = canvas.width * 0.75; // Сдвигаем ближе к краю - 75% от левого края
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

// Прямая горизонтальная дорожка - центрированная
function drawStraightPath() {
    // Центрированная прямая дорожка с увеличенными отступами
    const totalWidth = canvas.width * 0.7; // 70% от ширины экрана
    const startX = (canvas.width - totalWidth) / 2; // Центрируем
    const endX = startX + totalWidth;
    const y = canvas.height / 2;
    
    pathPoints = [];
    for (let x = startX; x <= endX; x += 5) {
        pathPoints.push({ x: x, y: y });
    }
    
    // Фон дорожки (широкая серая линия)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
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

// Вертикальная дорожка (столбик) - центрированная
function drawVerticalPath() {
    const x = canvas.width / 2; // Уже центрирована
    // Центрированная вертикальная дорожка с увеличенными отступами
    const totalHeight = canvas.height * 0.6; // 60% от высоты экрана
    const startY = canvas.height - (canvas.height - totalHeight) / 2 - totalHeight * 0.1; // Немного выше центра
    const endY = startY - totalHeight;
    
    pathPoints = [];
    for (let y = startY; y >= endY; y -= 5) {
        pathPoints.push({ x: x, y: y });
    }
    
    // Фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
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
    // Центрированный зигзаг с увеличенными отступами
    const totalWidth = canvas.width * 0.7; // 70% от ширины экрана
    const startX = (canvas.width - totalWidth) / 2; // Центрируем
    const endX = startX + totalWidth;
    const centerY = canvas.height / 2;
    const amplitude = Math.min(50, canvas.height * 0.12); // Адаптивная амплитуда
    const segments = 4; // Уменьшено количество сегментов
    const segmentWidth = totalWidth / segments;
    
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
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
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

// Волнистая дорожка - центрированная
function drawWavePath() {
    // Центрированная волнистая дорожка с увеличенными отступами
    const totalWidth = canvas.width * 0.7; // 70% от ширины экрана
    const startX = (canvas.width - totalWidth) / 2; // Центрируем
    const endX = startX + totalWidth;
    const centerY = canvas.height / 2;
    const amplitude = Math.min(35, canvas.height * 0.08); // Адаптивная амплитуда
    const frequency = 0.025; // Немного увеличена частота
    
    pathPoints = [];
    
    // Фон дорожки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = Math.min(35, canvas.width * 0.08); // Адаптивная толщина
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

// Спираль (улитка) - увеличенная для мобильных
function drawSpiralPath() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.35 + 20; // Увеличен радиус
    const turns = 3;
    const steps = 200;
    
    pathPoints = [];
    
    // Генерируем точки спирали
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * turns * Math.PI * 2;
        const radius = t * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        pathPoints.push({ x: x, y: y });
    }
    
    // Фон спирали (увеличенная толщина)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 60; // Увеличена толщина с 40 до 60
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
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
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
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
    
    // Стартовая точка (в центре)
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона (на конце спирали)
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
// МОДУЛЬ 3: БАЗОВЫЕ ЭЛЕМЕНТЫ (ОБНОВЛЕННЫЕ)
// ============================================

// Прямые линии - 5 вертикальных линий на одном экране (адаптировано для мобильных)
function drawPathLines() {
    // Центрированное распределение 5 линий с увеличенными отступами
    const linePositions = [0.15, 0.3, 0.45, 0.6, 0.85]; // Более широкое распределение
    const lineLength = canvas.height * 0.3; // Уменьшенная длина линии - 30% от высоты экрана
    const startY = canvas.height * 0.35; // Спускаем ниже - 35% от верха (центрирование)
    const lineWidth = Math.min(25, canvas.width * 0.05); // Уменьшенная толщина линии
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ линий сразу
    for (let i = 0; i < 5; i++) {
        const x = canvas.width * linePositions[i];
        for (let y = startY; y <= startY + lineLength; y += 5) {
            pathPoints.push({ x: x, y: y });
        }
    }
    
    // Рисуем все 5 линий
    for (let i = 0; i < 5; i++) {
        const x = canvas.width * linePositions[i];
        const isCompleted = completedSubTasks.includes(i); // Завершенные линии
        
        // Фон линии (серая зона)
        if (isCompleted) {
            // Завершенные линии - зеленый фон
            ctx.strokeStyle = '#c8e6c9';
        } else {
            // Активные линии - обычный серый фон
            ctx.strokeStyle = '#e0e0e0';
        }
        ctx.lineWidth = lineWidth;
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
        const pointSize = Math.min(12, canvas.width * 0.025);
        if (isCompleted) {
            // Галочка на завершенных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - pointSize * 0.4, startY);
            ctx.lineTo(x - pointSize * 0.1, startY + pointSize * 0.3);
            ctx.lineTo(x + pointSize * 0.4, startY - pointSize * 0.3);
            ctx.stroke();
        } else {
            // Зеленая точка на активных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            // Зеленая галочка на завершенных линиях
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x, startY + lineLength, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - pointSize * 0.4, startY + lineLength);
            ctx.lineTo(x - pointSize * 0.1, startY + lineLength + pointSize * 0.3);
            ctx.lineTo(x + pointSize * 0.4, startY + lineLength - pointSize * 0.3);
            ctx.stroke();
        } else {
            // Оранжевый финиш на активных линиях
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, startY + lineLength, pointSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Наклонные линии - 4 линии вправо сверху + 4 линии влево снизу (адаптировано для мобильных)
function drawPathDiagonal() {
    // Центрированное распределение 4 линий в ряду с увеличенными отступами
    const linePositions = [0.2, 0.4, 0.6, 0.8]; // Более широкое распределение
    const lineLength = canvas.height * 0.1; // Уменьшенная длина линии - 10% от высоты экрана
    const topY = canvas.height * 0.4; // Верхние линии - 40% от верха (спускаем в центр)
    const bottomY = canvas.height * 0.55; // Нижние линии - 55% от верха (спускаем в центр)
    const diagonalOffset = canvas.width * 0.05; // Уменьшенное смещение по диагонали - 5% от ширины
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ линий сразу
    // 4 линии сверху (наклон вправо)
    for (let i = 0; i < 4; i++) {
        const x1 = canvas.width * linePositions[i];
        const y1 = topY;
        const x2 = x1 + diagonalOffset;
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
        const x1 = canvas.width * linePositions[i];
        const y1 = bottomY;
        const x2 = x1 - diagonalOffset;
        const y2 = bottomY + lineLength;
        
        const steps = Math.ceil(lineLength / 5);
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Адаптивная толщина линий и размер точек
    const lineWidth = Math.min(20, canvas.width * 0.04);
    const pointSize = Math.min(12, canvas.width * 0.025);
    
    // Рисуем все 8 линий
    // 4 линии сверху (наклон вправо)
    for (let i = 0; i < 4; i++) {
        const x1 = canvas.width * linePositions[i];
        const y1 = topY;
        const x2 = x1 + diagonalOffset;
        const y2 = topY + lineLength;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон линии
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = lineWidth;
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
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1 - pointSize * 0.4, y1);
            ctx.lineTo(x1 - pointSize * 0.1, y1 + pointSize * 0.3);
            ctx.lineTo(x1 + pointSize * 0.4, y1 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x2 - pointSize * 0.4, y2);
            ctx.lineTo(x2 - pointSize * 0.1, y2 + pointSize * 0.3);
            ctx.lineTo(x2 + pointSize * 0.4, y2 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 4 линии снизу (наклон влево)
    for (let i = 0; i < 4; i++) {
        const x1 = canvas.width * linePositions[i];
        const y1 = bottomY;
        const x2 = x1 - diagonalOffset;
        const y2 = bottomY + lineLength;
        const isCompleted = completedSubTasks.includes(i + 4); // Индексы 4-7
        
        // Фон линии
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = lineWidth;
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
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1 - pointSize * 0.4, y1);
            ctx.lineTo(x1 - pointSize * 0.1, y1 + pointSize * 0.3);
            ctx.lineTo(x1 + pointSize * 0.4, y1 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x1, y1, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x2 - pointSize * 0.4, y2);
            ctx.lineTo(x2 - pointSize * 0.1, y2 + pointSize * 0.3);
            ctx.lineTo(x2 + pointSize * 0.4, y2 - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x2, y2, pointSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Круги - 6 кругов (3 слева в столбик, 3 справа в столбик) с увеличенными отступами
function drawPathCircles() {
    // Адаптивные размеры для мобильных устройств
    const radius = Math.min(28, canvas.width * 0.055); // Немного уменьшенный радиус
    const leftX = canvas.width * 0.28; // Сдвинуты ближе к центру
    const rightX = canvas.width * 0.72; // Сдвинуты ближе к центру
    
    // Увеличенные отступы между кругами по вертикали
    const topY = canvas.height * 0.25;    // Верхний круг
    const middleY = canvas.height * 0.5;  // Средний круг
    const bottomY = canvas.height * 0.75; // Нижний круг
    
    pathPoints = [];
    
    // Позиции всех 6 кругов
    const circlePositions = [
        { x: leftX, y: topY },     // 0: левый верхний
        { x: leftX, y: middleY },  // 1: левый средний
        { x: leftX, y: bottomY },  // 2: левый нижний
        { x: rightX, y: topY },    // 3: правый верхний
        { x: rightX, y: middleY }, // 4: правый средний
        { x: rightX, y: bottomY }  // 5: правый нижний
    ];
    
    // Генерируем точки траектории для ВСЕХ кругов сразу
    for (let i = 0; i < 6; i++) {
        const cx = circlePositions[i].x;
        const cy = circlePositions[i].y;
        
        // Генерируем точки траектории круга
        const steps = 100;
        for (let j = 0; j <= steps; j++) {
            const angle = (j / steps) * Math.PI * 2;
            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 6 кругов
    for (let i = 0; i < 6; i++) {
        const cx = circlePositions[i].x;
        const cy = circlePositions[i].y;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон круга (широкая серая линия)
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = Math.min(16, canvas.width * 0.028); // Уменьшенная толщина
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (сверху круга)
        const pointSize = Math.min(12, canvas.width * 0.025);
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - pointSize * 0.4, cy - radius);
            ctx.lineTo(cx - pointSize * 0.1, cy - radius + pointSize * 0.3);
            ctx.lineTo(cx + pointSize * 0.4, cy - radius - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (тоже сверху круга, рядом со стартом)
        if (!isCompleted) {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy - radius, pointSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Дуги - 5 дуг по центру, смотрящих вниз, с увеличенными отступами
function drawPathArcs() {
    // Адаптивные размеры для мобильных устройств
    const radius = Math.min(32, canvas.width * 0.065); // Немного уменьшенный радиус
    const centerX = canvas.width * 0.5; // Центр экрана
    
    // Позиции 5 дуг в столбик по центру с увеличенными отступами
    const topY1 = canvas.height * 0.18;    // Первая дуга (выше)
    const topY2 = canvas.height * 0.33;    // Вторая дуга
    const topY3 = canvas.height * 0.5;     // Третья дуга (центр)
    const topY4 = canvas.height * 0.67;    // Четвертая дуга
    const topY5 = canvas.height * 0.82;    // Пятая дуга (ниже)
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ дуг сразу
    // 5 дуг по центру (смотрят вниз)
    const yPositions = [topY1, topY2, topY3, topY4, topY5];
    for (let i = 0; i < 5; i++) {
        const cy = yPositions[i];
        const startAngle = Math.PI;
        const endAngle = Math.PI * 2;
        
        const steps = 50;
        for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const angle = startAngle + (endAngle - startAngle) * t;
            const px = centerX + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius; // Плюс для направления вниз
            pathPoints.push({ x: px, y: py });
        }
    }
    
    const lineWidth = Math.min(18, canvas.width * 0.035); // Немного уменьшенная толщина
    const pointSize = Math.min(12, canvas.width * 0.025);
    
    // Рисуем все 5 дуг (смотрят вниз)
    for (let i = 0; i < 5; i++) {
        const cy = yPositions[i];
        const isCompleted = completedSubTasks.includes(i);
        const startAngle = Math.PI;
        const endAngle = Math.PI * 2;
        
        // Фон дуги
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, cy, radius, startAngle, endAngle);
        ctx.stroke();
        
        // Целевая траектория
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash(isCompleted ? [] : [10, 5]);
        ctx.beginPath();
        ctx.arc(centerX, cy, radius, startAngle, endAngle);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (слева)
        const startX_point = centerX + Math.cos(startAngle) * radius;
        const startY_point = cy + Math.sin(startAngle) * radius;
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX_point - pointSize * 0.4, startY_point);
            ctx.lineTo(startX_point - pointSize * 0.1, startY_point + pointSize * 0.3);
            ctx.lineTo(startX_point + pointSize * 0.4, startY_point - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX_point, startY_point, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (справа)
        const endX_point = centerX + Math.cos(endAngle) * radius;
        const endY_point = cy + Math.sin(endAngle) * radius;
        if (!isCompleted) {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(endX_point, endY_point, pointSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Пружинка - 3 волнистые линии в столбик для мобильных устройств
function drawPathLoops() {
    // Адаптивные размеры для мобильных устройств
    const waveWidth = Math.min(200, canvas.width * 0.6); // Ширина волнистой линии
    const waveHeight = Math.min(40, canvas.height * 0.08); // Высота волн
    const wavesPerLine = 2.5; // Количество волн в линии
    const startX = (canvas.width - waveWidth) / 2; // Центрируем по горизонтали
    
    // Позиции 3 пружинок в столбик
    const topY = canvas.height * 0.25;    // Верхняя пружинка
    const middleY = canvas.height * 0.5;  // Средняя пружинка
    const bottomY = canvas.height * 0.75; // Нижняя пружинка
    const yPositions = [topY, middleY, bottomY];
    
    pathPoints = [];
    
    // Генерируем точки траектории для ВСЕХ волнистых линий сразу
    for (let i = 0; i < 3; i++) {
        const centerY = yPositions[i];
        
        // Генерируем точки для волнистой линии
        const totalSteps = 150;
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            
            // Горизонтальное движение слева направо
            const px = startX + t * waveWidth;
            
            // Плавные волны (синусоида)
            const angle = t * wavesPerLine * Math.PI * 2;
            const py = centerY + Math.sin(angle) * waveHeight / 2;
            
            pathPoints.push({ x: px, y: py });
        }
    }
    
    // Рисуем все 3 волнистые линии
    for (let i = 0; i < 3; i++) {
        const centerY = yPositions[i];
        const waveEndX = startX + waveWidth;
        const isCompleted = completedSubTasks.includes(i);
        
        // Фон волнистой линии (широкая серая зона для мобильных)
        ctx.strokeStyle = isCompleted ? '#c8e6c9' : '#e0e0e0';
        ctx.lineWidth = Math.min(70, canvas.width * 0.12); // Адаптивная ширина зоны допуска
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        // Рисуем траекторию волнистой линии
        const totalSteps = 150;
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            const px = startX + t * waveWidth;
            const angle = t * wavesPerLine * Math.PI * 2;
            const py = centerY + Math.sin(angle) * waveHeight / 2;
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        
        // Целевая траектория (пунктир)
        ctx.strokeStyle = isCompleted ? '#4caf50' : '#667eea';
        ctx.lineWidth = 4;
        ctx.setLineDash(isCompleted ? [] : [15, 8]); // Крупный пунктир
        ctx.beginPath();
        
        for (let j = 0; j <= totalSteps; j++) {
            const t = j / totalSteps;
            const px = startX + t * waveWidth;
            const angle = t * wavesPerLine * Math.PI * 2;
            const py = centerY + Math.sin(angle) * waveHeight / 2;
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Стартовая точка (слева)
        const pointSize = Math.min(18, canvas.width * 0.035);
        if (isCompleted) {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX, centerY, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX - pointSize * 0.4, centerY);
            ctx.lineTo(startX - pointSize * 0.1, centerY + pointSize * 0.3);
            ctx.lineTo(startX + pointSize * 0.4, centerY - pointSize * 0.3);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(startX, centerY, pointSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Финишная точка (справа)
        const finalAngle = wavesPerLine * Math.PI * 2;
        const endY = centerY + Math.sin(finalAngle) * waveHeight / 2;
        if (!isCompleted) {
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(waveEndX, endY, pointSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Остальные шаблоны (для других модулей)
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
        ctx.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawPatternTemplate() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Рисуем образец узора
    const startX = 50;
    const y = canvas.height / 2;
    
    for (let i = 0; i < 3; i++) {
        const x = startX + i * 60;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 30);
        ctx.arc(x + 15, y - 30, 15, Math.PI, 0);
        ctx.lineTo(x + 30, y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawCopyTemplate() {
    const y = canvas.height / 2;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Левая половина - образец
    ctx.beginPath();
    ctx.arc(100, y, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // Правая половина - для копирования
    ctx.strokeStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(canvas.width - 100, y, 40, 0, Math.PI, true);
    ctx.stroke();
    
    ctx.setLineDash([]);
}

function drawGrid() {
    const gridSize = 40;
    const startX = 50;
    const startY = 50;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(startX + i * gridSize, startY);
        ctx.lineTo(startX + i * gridSize, startY + 8 * gridSize);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(startX, startY + i * gridSize);
        ctx.lineTo(startX + 9 * gridSize, startY + i * gridSize);
        ctx.stroke();
    }
}

function drawDefaultTemplate() {
    ctx.fillStyle = '#667eea';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Упражнение в разработке', canvas.width / 2, canvas.height / 2);
}
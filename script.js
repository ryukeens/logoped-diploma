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
    totalTime: 0,
    moduleStats: {
        module1: 0,
        module2: 0,
        module3: 0,
        module4: 0,
        module5: 0,
        module6: 0,
        module7: 0,
        module8: 0
    }
};

// Переменные для модуля 2 (Дорожки)
let pathPoints = []; // Точки центральной траектории
let userPath = []; // Путь пользователя
let exitCount = 0; // Количество выходов за границы
let isOutOfBounds = false; // Флаг выхода за границы
let finishZone = null; // Зона финиша
let startZone = null; // Зона старта
let pathStarted = false; // Флаг начала движения
let pathWidth = 40; // Ширина дорожки

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
            { title: 'Вертикальные палочки', type: 'basic-lines', instruction: 'Нарисуй вертикальные линии по образцу' },
            { title: 'Обведи овалы', type: 'basic-ovals', instruction: 'Обведи овалы по контуру' },
            { title: 'Нарисуй круги', type: 'basic-circles', instruction: 'Нарисуй круги в указанных местах' },
            { title: 'Горизонтальные линии', type: 'basic-horizontal', instruction: 'Проведи горизонтальные линии' },
            { title: 'Наклонные линии', type: 'basic-diagonal', instruction: 'Проведи наклонные линии' }
        ],
        4: [
            { title: 'Точка - Черточка', type: 'pattern-dots-dashes', instruction: 'Продолжи ритм: точка, черточка...' },
            { title: 'Большой - Маленький круг', type: 'pattern-circles', instruction: 'Чередуй большие и маленькие круги' },
            { title: 'Треугольник - Круг - Квадрат', type: 'pattern-shapes', instruction: 'Продолжи последовательность фигур' }
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
    startZone = null;
    pathStarted = false;
    
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
    
    const pos = getPosition(e);
    
    // Проверяем, начал ли пользователь со стартовой зоны
    if (startZone && !pathStarted) {
        const distanceToStart = Math.sqrt(
            Math.pow(pos.x - startZone.x, 2) + 
            Math.pow(pos.y - startZone.y, 2)
        );
        
        if (distanceToStart > startZone.radius) {
            showErrorFeedback('Начни со стартовой точки!');
            return;
        }
    }
    
    isDrawing = true;
    pathStarted = true;
    userPath = [];
    exitCount = 0;
    
    userPath.push(pos);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

// Рисование с проверкой границ
function drawPathWithCheck(pos) {
    userPath.push(pos);
    
    // Проверяем расстояние до центральной линии
    const distanceToPath = getDistanceToPath(pos);
    const wasOutOfBounds = isOutOfBounds;
    
    // Проверка выхода за границы (25px от центра)
    if (distanceToPath > 25) {
        if (!isOutOfBounds) {
            isOutOfBounds = true;
            exitCount++;
            vibrateDevice(); // Вибрация при выходе
        }
        ctx.strokeStyle = '#ff5252'; // Красный цвет
    } else {
        if (isOutOfBounds) {
            isOutOfBounds = false;
        }
        ctx.strokeStyle = '#4caf50'; // Зеленый цвет
    }
    
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Проверяем достижение финиша в реальном времени
    if (finishZone) {
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
    
    exerciseCompleted = true;
    isDrawing = false;
    
    // Проверяем точность прохождения пути
    const pathAccurate = checkPathAccuracy();
    
    if (!pathAccurate) {
        // Упражнение не засчитано
        showPathFailureFeedback();
        return;
    }
    
    // Рисуем финишную отметку
    drawFinishMark();
    
    // Показываем результат
    const feedback = document.getElementById('feedback');
    if (exitCount === 0) {
        feedback.textContent = '🎉 Идеально! Ни разу не вышел за границы!';
    } else if (exitCount <= 2) {
        feedback.textContent = '✓ Отлично! Почти без ошибок!';
    } else {
        feedback.textContent = '✓ Хорошо! Продолжай тренироваться!';
    }
    feedback.className = 'feedback';
    feedback.classList.remove('hidden');
    
    // Автоматический переход
    setTimeout(() => {
        nextExercise();
    }, 2000);
}

// Проверка точности прохождения пути
function checkPathAccuracy() {
    // Проверка 1: Путь должен быть проведен от А до Б
    if (userPath.length < 10) {
        return false; // Слишком короткий путь
    }
    
    // Проверка 2: Не более 3 выходов за границы
    if (exitCount > 3) {
        return false;
    }
    
    // Проверка 3: Большинство точек должны быть внутри серой зоны (25px от центра)
    let pointsInBounds = 0;
    for (let i = 0; i < userPath.length; i++) {
        const distance = getDistanceToPath(userPath[i]);
        if (distance <= 25) {
            pointsInBounds++;
        }
    }
    
    const accuracy = pointsInBounds / userPath.length;
    
    // Требуем минимум 70% точек внутри зоны
    return accuracy >= 0.7;
}

// Показ сообщения о неудаче
function showPathFailureFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '⚠️ Старайся не покидать дорожку! Попробуй еще раз.';
    feedback.className = 'feedback error';
    feedback.classList.remove('hidden');
    
    // Показываем кнопку "Попробовать снова"
    showTryAgainButton();
}

// Показ кнопки "Попробовать снова"
function showTryAgainButton() {
    const controls = document.querySelector('.controls');
    
    // Проверяем, есть ли уже кнопка
    let tryAgainBtn = document.getElementById('try-again-btn');
    if (!tryAgainBtn) {
        tryAgainBtn = document.createElement('button');
        tryAgainBtn.id = 'try-again-btn';
        tryAgainBtn.className = 'control-btn primary';
        tryAgainBtn.textContent = '🔄 Попробовать снова';
        tryAgainBtn.onclick = retryExercise;
        
        // Вставляем перед кнопкой "Дальше"
        const nextBtn = controls.querySelector('.control-btn.primary');
        if (nextBtn) {
            controls.insertBefore(tryAgainBtn, nextBtn);
        } else {
            controls.appendChild(tryAgainBtn);
        }
    }
}

// Повтор упражнения
function retryExercise() {
    // Удаляем кнопку "Попробовать снова"
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.remove();
    }
    
    // Сбрасываем состояние
    exerciseCompleted = false;
    displayExercise(currentExercise);
    startTime = Date.now();
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
        case 'basic-lines':
            drawBasicLinesTemplate();
            break;
        case 'basic-ovals':
            drawBasicOvalsTemplate();
            break;
        case 'basic-circles':
            drawBasicCirclesTemplate();
            break;
        case 'basic-horizontal':
            drawBasicHorizontalTemplate();
            break;
        case 'basic-diagonal':
            drawBasicDiagonalTemplate();
            break;
        
        // Модуль 4: Серийность
        case 'pattern-dots-dashes':
            drawPatternDotsDashes();
            break;
        case 'pattern-circles':
            drawPatternCircles();
            break;
        case 'pattern-shapes':
            drawPatternShapes();
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
    
    // Серая зона (полупрозрачная дорожка)
    ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    
    // Границы дорожки
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, y - 25);
    ctx.lineTo(endX, y - 25);
    ctx.moveTo(startX, y + 25);
    ctx.lineTo(endX, y + 25);
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
    startZone = { x: startX, y: y, radius: 15 };
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
    
    // Серая зона (полупрозрачная дорожка)
    ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
    
    // Границы дорожки
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 25, startY);
    ctx.lineTo(x - 25, endY);
    ctx.moveTo(x + 25, startY);
    ctx.lineTo(x + 25, endY);
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
    startZone = { x: x, y: startY, radius: 15 };
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
    
    // Серая зона (полупрозрачная дорожка)
    ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    let currentY = centerY;
    ctx.moveTo(startX, currentY);
    
    for (let i = 0; i <= segments; i++) {
        const x = startX + i * segmentWidth;
        currentY = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
        ctx.lineTo(x, currentY);
        
        // Добавляем точки для проверки
        for (let j = 0; j < segmentWidth; j += 5) {
            const px = startX + (i - 1) * segmentWidth + j;
            const prevY = (i - 1) % 2 === 0 ? centerY - amplitude : centerY + amplitude;
            const t = j / segmentWidth;
            const py = prevY + (currentY - prevY) * t;
            if (px >= startX && px <= endX) {
                pathPoints.push({ x: px, y: py });
            }
        }
    }
    ctx.stroke();
    
    // Целевая траектория
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    currentY = centerY;
    ctx.moveTo(startX, currentY);
    for (let i = 0; i <= segments; i++) {
        const x = startX + i * segmentWidth;
        currentY = i % 2 === 0 ? centerY - amplitude : centerY + amplitude;
        ctx.lineTo(x, currentY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Стартовая точка
    startZone = { x: startX, y: centerY, radius: 15 };
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(startX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Финишная зона
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
    
    // Серая зона (полупрозрачная дорожка)
    ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
    ctx.lineWidth = 50;
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
    startZone = { x: startX, y: centerY, radius: 15 };
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
    
    // Серая зона (полупрозрачная дорожка)
    ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)';
    ctx.lineWidth = 50;
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
    startZone = { x: centerX, y: centerY, radius: 15 };
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

function drawBasicLinesTemplate() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Образец (первые 2 линии)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    for (let i = 0; i < 2; i++) {
        const x = 80 + i * 80;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 200);
        ctx.stroke();
    }
    
    // Пунктирные направляющие для остальных
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (let i = 2; i < 5; i++) {
        const x = 80 + i * 80;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x, 200);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawBasicOvalsTemplate() {
    // Образец (первый овал)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(100, canvas.height / 2, 30, 50, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Пунктирные овалы для обводки
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (let i = 1; i < 4; i++) {
        const x = 100 + i * 120;
        ctx.beginPath();
        ctx.ellipse(x, canvas.height / 2, 30, 50, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawBasicCirclesTemplate() {
    // Показываем места для кругов
    const positions = [
        { x: canvas.width * 0.25, y: canvas.height * 0.3 },
        { x: canvas.width * 0.75, y: canvas.height * 0.3 },
        { x: canvas.width * 0.25, y: canvas.height * 0.7 },
        { x: canvas.width * 0.75, y: canvas.height * 0.7 }
    ];
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]);
}

function drawBasicHorizontalTemplate() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Образец (первые 2 линии)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    for (let i = 0; i < 2; i++) {
        const y = 100 + i * 60;
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(canvas.width - 80, y);
        ctx.stroke();
    }
    
    // Пунктирные направляющие
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (let i = 2; i < 5; i++) {
        const y = 100 + i * 60;
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(canvas.width - 80, y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawBasicDiagonalTemplate() {
    // Образец (первые 2 линии)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    for (let i = 0; i < 2; i++) {
        const x = 80 + i * 80;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x + 60, 200);
        ctx.stroke();
    }
    
    // Пунктирные направляющие
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    for (let i = 2; i < 5; i++) {
        const x = 80 + i * 80;
        ctx.beginPath();
        ctx.moveTo(x, 100);
        ctx.lineTo(x + 60, 200);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

// ============================================
// МОДУЛЬ 4: СЕРИЙНОСТЬ И ДИНАМИЧЕСКИЙ ПРАКСИС
// ============================================

// Переменные для модуля 4
let patternSequence = []; // Последовательность элементов паттерна
let userSequence = []; // Последовательность пользователя
let currentPatternIndex = 0; // Текущий индекс в паттерне
let targetZones = []; // Зоны для размещения элементов

function drawPatternDotsDashes() {
    patternSequence = ['dot', 'dash', 'dot', 'dash', 'dot', 'dash'];
    userSequence = [];
    currentPatternIndex = 0;
    targetZones = [];
    
    const startX = 60;
    const spacing = 80;
    const y = canvas.height / 2;
    
    // Рисуем образец (первые 3 элемента)
    ctx.strokeStyle = '#667eea';
    ctx.fillStyle = '#667eea';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 3; i++) {
        const x = startX + i * spacing;
        if (patternSequence[i] === 'dot') {
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(x - 15, y);
            ctx.lineTo(x + 15, y);
            ctx.stroke();
        }
    }
    
    // Подсветка целевой зоны для следующего элемента
    const nextX = startX + 3 * spacing;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(nextX - 25, y - 25, 50, 50);
    ctx.setLineDash([]);
    
    // Сохраняем целевые зоны
    for (let i = 3; i < patternSequence.length; i++) {
        const x = startX + i * spacing;
        targetZones.push({ x: x, y: y, type: patternSequence[i] });
    }
    
    // Инструкция
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Продолжи ритм: точка, черточка...', canvas.width / 2, 50);
}

function drawPatternCircles() {
    patternSequence = ['big', 'small', 'big', 'small', 'big', 'small'];
    userSequence = [];
    currentPatternIndex = 0;
    targetZones = [];
    
    const startX = 80;
    const spacing = 100;
    const y = canvas.height / 2;
    
    // Рисуем образец (первые 2 элемента)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 2; i++) {
        const x = startX + i * spacing;
        const radius = patternSequence[i] === 'big' ? 30 : 15;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Подсветка целевой зоны
    const nextX = startX + 2 * spacing;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(nextX - 40, y - 40, 80, 80);
    ctx.setLineDash([]);
    
    // Сохраняем целевые зоны
    for (let i = 2; i < patternSequence.length; i++) {
        const x = startX + i * spacing;
        targetZones.push({ x: x, y: y, type: patternSequence[i] });
    }
}

function drawPatternShapes() {
    patternSequence = ['triangle', 'circle', 'square', 'triangle', 'circle', 'square'];
    userSequence = [];
    currentPatternIndex = 0;
    targetZones = [];
    
    const startX = 70;
    const spacing = 90;
    const y = canvas.height / 2;
    
    // Рисуем образец (первые 3 элемента)
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 3; i++) {
        const x = startX + i * spacing;
        drawShape(x, y, patternSequence[i], 25);
    }
    
    // Подсветка целевой зоны
    const nextX = startX + 3 * spacing;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(nextX - 35, y - 35, 70, 70);
    ctx.setLineDash([]);
    
    // Сохраняем целевые зоны
    for (let i = 3; i < patternSequence.length; i++) {
        const x = startX + i * spacing;
        targetZones.push({ x: x, y: y, type: patternSequence[i] });
    }
}

// Вспомогательная функция для рисования фигур
function drawShape(x, y, type, size) {
    ctx.beginPath();
    switch(type) {
        case 'triangle':
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
            break;
        case 'circle':
            ctx.arc(x, y, size, 0, Math.PI * 2);
            break;
        case 'square':
            ctx.rect(x - size, y - size, size * 2, size * 2);
            break;
    }
    ctx.stroke();
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
    // Удаляем кнопку "Попробовать снова" если она есть
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.remove();
    }
    
    if (exerciseCompleted) {
        // Сохранение результата
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        stats.totalExercises++;
        stats.successfulExercises++;
        stats.totalTime += timeSpent;
        
        // Сохранение статистики по модулям
        if (currentModule) {
            const moduleKey = `module${currentModule}`;
            if (stats.moduleStats[moduleKey] !== undefined) {
                stats.moduleStats[moduleKey]++;
            }
        }
        
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
    // Удаляем кнопку "Попробовать снова" если она есть
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
        tryAgainBtn.remove();
    }
    
    showMainMenu();
}

// Обновление результатов
function updateResultsDisplay() {
    const totalEx = stats.totalExercises || 0;
    const successEx = stats.successfulExercises || 0;
    const totalTime = stats.totalTime || 0;
    
    document.getElementById('total-exercises').textContent = totalEx;
    
    const successRate = totalEx > 0 
        ? Math.round((successEx / totalEx) * 100)
        : 0;
    document.getElementById('success-rate').textContent = successRate + '%';
    
    const avgTime = totalEx > 0
        ? Math.round(totalTime / totalEx)
        : 0;
    document.getElementById('avg-time').textContent = avgTime;
    
    // Обновление прогресс-бара
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = Math.min(successRate, 100) + '%';
    progressFill.textContent = successRate + '%';
    
    // Обновление оценки
    updateAchievementMessage(successRate, totalEx);
    
    // Обновление статистики по модулям
    updateModuleStats();
}

// Обновление сообщения о достижениях
function updateAchievementMessage(successRate, totalEx) {
    const achievementCard = document.getElementById('achievement-message');
    const icon = achievementCard.querySelector('.achievement-icon');
    const text = achievementCard.querySelector('.achievement-text');
    
    if (totalEx === 0) {
        icon.textContent = '🎯';
        text.textContent = 'Начни выполнять упражнения, чтобы увидеть свой прогресс!';
        achievementCard.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    } else if (successRate >= 90) {
        icon.textContent = '🏆';
        text.textContent = 'Превосходно! У тебя отличный уровень контроля и точности!';
        achievementCard.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else if (successRate >= 80) {
        icon.textContent = '⭐';
        text.textContent = 'Отлично! Ты очень хорошо справляешься с заданиями!';
        achievementCard.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else if (successRate >= 70) {
        icon.textContent = '👍';
        text.textContent = 'Хорошо! Продолжай тренироваться, и результат будет ещё лучше!';
        achievementCard.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else if (successRate >= 50) {
        icon.textContent = '💪';
        text.textContent = 'Неплохо! Ты на правильном пути, продолжай стараться!';
        achievementCard.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    } else {
        icon.textContent = '🌱';
        text.textContent = 'Начало положено! Не сдавайся, с каждым разом будет получаться лучше!';
        achievementCard.style.background = 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)';
    }
}

// Обновление статистики по модулям
function updateModuleStats() {
    const moduleStats = stats.moduleStats || {};
    
    document.getElementById('module1-count').textContent = moduleStats.module1 || 0;
    document.getElementById('module2-count').textContent = moduleStats.module2 || 0;
    document.getElementById('module3-count').textContent = moduleStats.module3 || 0;
    document.getElementById('module4-count').textContent = moduleStats.module4 || 0;
}

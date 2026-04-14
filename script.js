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
            { title: 'Вертикальные палочки', type: 'lines', instruction: 'Нарисуй вертикальные палочки' },
            { title: 'Обведи овалы', type: 'ovals', instruction: 'Обведи овалы по контуру' }
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
    
    // Проверяем, что начинаем рисование в допустимой зоне (рядом со стартом)
    if (pathPoints.length > 0) {
        const startPoint = pathPoints[0];
        const distanceToStart = Math.sqrt(
            Math.pow(pos.x - startPoint.x, 2) + 
            Math.pow(pos.y - startPoint.y, 2)
        );
        
        // Если слишком далеко от старта, не начинаем рисование
        if (distanceToStart > 30) {
            return;
        }
    }
    
    // Полное обнуление переменных состояния для чистой попытки
    // НО НЕ ТРОГАЕМ pathPoints - это шаблон траектории!
    isDrawing = true;
    userPath = [];
    exitCount = 0;
    isOutOfBounds = false;
    
    userPath.push(pos);
    
    // Очищаем canvas и перерисовываем шаблон для чистой попытки
    clearCanvas();
    drawExerciseTemplate(currentExercise);
    
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
    
    // СТРОГАЯ ПРОВЕРКА: переход только при идеальном прохождении (0 ошибок)
    if (exitCount === 0) {
        exerciseCompleted = true;
        isDrawing = false;
        
        // Рисуем финишную отметку
        drawFinishMark();
        
        // Показываем результат успеха
        const feedback = document.getElementById('feedback');
        feedback.textContent = '🎉 Идеально! Переход к следующему уровню!';
        feedback.className = 'feedback';
        feedback.classList.remove('hidden');
        
        // Автоматический переход к следующему упражнению ТОЛЬКО при идеальном прохождении
        setTimeout(() => {
            nextExercise();
        }, 1500);
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

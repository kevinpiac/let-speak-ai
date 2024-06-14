
export const calculateBarData = (
    frequencyData: Uint8Array,
    width: number,
    barWidth: number,
    gap: number
): number[] => {
    // Here we divide by two to display two sides of the audio visualizer
    let units = width / 4 / (barWidth + gap);
    let step = Math.floor(frequencyData.length / units);

    if (units > frequencyData.length) {
        units = frequencyData.length;
        step = 1;
    }

    const data: number[] = [];

    for (let i = 0; i < units; i++) {
        let sum = 0;

        for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
            sum += frequencyData[i * step + j];
        }
        data.push(sum / step);
    }
    return data;
};

export const draw = (
    data: number[],
    canvas: HTMLCanvasElement,
    barWidth: number,
    gap: number,
): void => {

    const backgroundColor = 'transparent';
    const amp = canvas.height / 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const dataReverse = data.slice().reverse();
    const symetricData = dataReverse.concat(data);

    const totalBars = symetricData.length;
    const totalWidth = totalBars * barWidth + (totalBars - 1) * gap;

    // Calculate the starting x position to center the drawing
    const startX = (canvas.width - totalWidth) / 2;

    symetricData.forEach((dp, i) => {
        const grad= ctx.createLinearGradient(0,0, 280,0);
        grad.addColorStop(0, "#3b93eb");
        grad.addColorStop(1, "#3b93eb");

        ctx.fillStyle = grad;

        const x = startX + i * (barWidth + gap);
        const y = amp - dp / 2;
        const w = barWidth;
        const h = dp || 1;

        ctx.beginPath();
        if (ctx.roundRect) {
            // making sure roundRect is supported by the browser
            ctx.roundRect(x, y, w, h, 50);
            ctx.fill();
        } else {
            // fallback for browsers that do not support roundRect
            ctx.fillRect(x, y, w, h);
        }
    });
};
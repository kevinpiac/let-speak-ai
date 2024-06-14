import React, {useEffect, FC, useState, useRef, useCallback} from 'react';

interface Props {
    mediaRecorder: MediaRecorder,
}
const MyAudioVisualizer: FC<Props> = ({ mediaRecorder }) => {

    const fftSize = 1024
    const maxDecibels = -10
    const minDecibels = -90
    const smoothingTimeConstant = 0.4

    const [context] = useState(() => new AudioContext());
    const [analyser, setAnalyser] = useState<AnalyserNode>();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!mediaRecorder?.stream) {
            return;
        }

        const analyserNode = context.createAnalyser();
        setAnalyser(analyserNode);
        analyserNode.fftSize = fftSize;
        analyserNode.minDecibels = minDecibels;
        analyserNode.maxDecibels = maxDecibels;
        analyserNode.smoothingTimeConstant = smoothingTimeConstant;
        const source = context.createMediaStreamSource(mediaRecorder.stream);
        source.connect(analyserNode);
    }, [mediaRecorder.stream]);

    useEffect(() => {
        if (analyser && mediaRecorder.state === "recording") {
            report();
        }
    }, [analyser, mediaRecorder.state]);

    const report = useCallback(() => {
        if (!analyser) return;

        const data = new Uint8Array(analyser?.frequencyBinCount);

        console.log('mediaRecorder.state', mediaRecorder.state);

        if (mediaRecorder.state === "recording") {
            analyser?.getByteFrequencyData(data);
            processFrequencyData(data);
            requestAnimationFrame(report);
        } else if (
            mediaRecorder.state === "inactive" &&
            context.state !== "closed"
        ) {
            context.close();
        }
    }, [analyser, context.state]);

    const calculateBarData = (
        frequencyData: Uint8Array,
        width: number,
        barWidth: number,
        gap: number
    ): number[] => {
        let units = width / (barWidth + gap);
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

    const draw = (
        data: number[],
        canvas: HTMLCanvasElement,
        barWidth: number,
        gap: number,
        backgroundColor: string,
        barColor: string
    ): void => {
        const amp = canvas.height / 2;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (backgroundColor !== "transparent") {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const dataReverse = data.reverse();

        dataReverse.forEach((dp, i) => {
            ctx.fillStyle = barColor;

            const x = i * (barWidth + gap);
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
        })

        data.forEach((dp, i) => {
            ctx.fillStyle = barColor;

            const x = i * (barWidth + gap);
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

    const processFrequencyData = (data: Uint8Array): void => {
        if (!canvasRef.current) return;

        const dataPoints = calculateBarData(
            data,
            canvasRef.current.width,
            5,
            3
        );

        draw(dataPoints, canvasRef.current, 5, 3, "transparent", "lightblue");

        console.log('data points', dataPoints);
    };

    return (
        <>
            <canvas ref={canvasRef} width={200} height={100}></canvas>
        </>
    )


};

export default MyAudioVisualizer;
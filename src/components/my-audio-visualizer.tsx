import React, { useEffect, FC, useState, useRef, useCallback } from 'react';
import { calculateBarData, draw } from "@/utils";

interface Props {
    audioDataUrl: string;
    onReadComplete: () => void;
}

const MyAudioVisualizer: FC<Props> = ({ audioDataUrl, onReadComplete }) => {
    const BAR_GAP = 6
    const BAR_WIDTH = 10
    const FFT_SIZE = 1024;
    const MAX_DB = -10;
    const MIN_DB = -90;
    const SMOOTHING_TIME_CONSTANT = 0.4;
    const SILENCE_THRESHOLD = 5;
    const TOLERATED_SILENCE_DURATION_MS = 2000;

    const [context] = useState(() => new AudioContext());
    const [analyser, setAnalyser] = useState<AnalyserNode>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!audioDataUrl) {
            return;
        }

        const analyserNode = context.createAnalyser();
        setAnalyser(analyserNode)
        analyserNode.fftSize = FFT_SIZE;
        analyserNode.minDecibels = MIN_DB;
        analyserNode.maxDecibels = MAX_DB;
        analyserNode.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;

        const audio = new Audio(audioDataUrl);
        audio.addEventListener('canplay', () => {
            console.log('Audio can play, setting up source and analyser');
            const source = context.createMediaElementSource(audio);
            source.connect(analyserNode);
            analyserNode.connect(context.destination);

            audio.play();
            requestAnimationFrame(report);
        });

        audio.addEventListener('ended', () => {
            onReadComplete();
        })
    }, [audioDataUrl]);

    useEffect(() => {
        console.log('analyser', analyser)
        if (analyser) {
            report();
        }
    }, [analyser]);

    const report = useCallback(() => {
        if (!analyser) return;

        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        console.log('data', data);

        processFrequencyData(data);
        requestAnimationFrame(report);

    }, [analyser]);

    const mean = (arr: Uint8Array) => {
        return arr.reduce((acc, val) => acc + val, 0) / arr.length;
    }

    const processFrequencyData = (data: Uint8Array): void => {
        if (!canvasRef.current) return;

        const meanValue = mean(data);

        const isSilence = meanValue <= SILENCE_THRESHOLD;

        console.log('MEAN VALUE =>', meanValue);

        if (isSilence) {
            if (!timeoutRef.current) {
                const timeout = setTimeout(() => {
                    context.close();
                }, TOLERATED_SILENCE_DURATION_MS);

                timeoutRef.current = timeout;
            }
        } else if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null;
        }

        const dataPoints = calculateBarData(
            data,
            canvasRef.current.width,
            BAR_WIDTH,
            BAR_GAP,
        );

        draw(dataPoints, canvasRef.current, BAR_WIDTH, BAR_GAP);
    };

    return (
        <>
            <canvas ref={canvasRef} width={200} height={100}></canvas>
        </>
    )
};


export default MyAudioVisualizer;
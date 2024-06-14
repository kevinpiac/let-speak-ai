import React, {useEffect, FC, useState, useRef, useCallback} from 'react';
import {calculateBarData, draw} from "@/utils";

interface Props {
    mediaRecorder: MediaRecorder,
    onStoppedSpeaking: () => void;
}
const MyLiveAudioVisualizer: FC<Props> = ({ mediaRecorder, onStoppedSpeaking }) => {

    const BAR_GAP = 6
    const BAR_WIDTH = 10
    const FFT_SIZE = 1024
    const MAX_DB = -10
    const MIN_DB = -90
    const SMOOTHING_TIME_CONSTANT = 0.4
    const SILENCE_THRESHOLD = 5
    const TOLERATED_SILENCE_DURATION_MS = 2000

    const [context] = useState(() => new AudioContext());
    const [analyser, setAnalyser] = useState<AnalyserNode>();
    const [hadStartedToSpeak, setHadStartedToSpeak] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasStartedToSpeakRef = useRef(false);

    useEffect(() => {
        if (!mediaRecorder?.stream) {
            return;
        }

        const analyserNode = context.createAnalyser();
        setAnalyser(analyserNode);
        analyserNode.fftSize = FFT_SIZE;
        analyserNode.minDecibels = MIN_DB;
        analyserNode.maxDecibels = MAX_DB;
        analyserNode.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
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

    const mean = (arr: Uint8Array) => {
        // for every arr compute the mean
        return arr.reduce((acc, val) => acc + val, 0) / arr.length;
    }

    const processFrequencyData = (data: Uint8Array): void => {
        if (!canvasRef.current) return;

        const meanValue = mean(data);

        const isSilence = meanValue <= SILENCE_THRESHOLD;

        if (isSilence) {
            console.log('SILENCE', hasStartedToSpeakRef.current);
            if (!timeoutRef.current && hasStartedToSpeakRef.current) {
                const timeout = setTimeout(() => {
                    onStoppedSpeaking();
                }, TOLERATED_SILENCE_DURATION_MS);

                timeoutRef.current = timeout;
            }
        } else {
            hasStartedToSpeakRef.current = true;
            console.log('STARTED SPEAKING');
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null;
            }
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
            <canvas ref={canvasRef} width={150} height={100}></canvas>
        </>
    )


};

export default MyLiveAudioVisualizer;
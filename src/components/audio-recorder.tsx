import React, {useEffect, useRef, FC, useState} from 'react';
import useAudioRecorder from "@/hooks/useAudioRecorder";
import MyLiveAudioVisualizer from "@/components/my-live-audio-visualizer";
import MicIcon from "@/components/mic-icon";

interface Props {
    onRecordingComplete: (blob: Blob) => void;
    autoStart: boolean;
}

const MyAudioRecorder: FC<Props> = ({ onRecordingComplete, autoStart }) => {
   const { mediaRecorder, startRecording, stopRecording, isRecording, recordingBlob } = useAudioRecorder();
   const assistantSoundRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (recordingBlob) {
            onRecordingComplete(recordingBlob)

            if (assistantSoundRef.current) {
                assistantSoundRef.current.src = '/uploading-sound.wav'
                assistantSoundRef.current.play();
            }
        }
    }, [recordingBlob]);

    const handleStartRecording = () => {
        console.log('start recording', assistantSoundRef.current);
        if (assistantSoundRef.current) {
            assistantSoundRef.current.src = '/speak-sound.wav'
            assistantSoundRef.current.play();
        }

        startRecording();
    }


    useEffect(() => {
        if (!isRecording && autoStart) {
            handleStartRecording();
        }
    }, []);

    return (
        <>
            <audio className={'hidden'} controls src={'/uploading-sound.wav'} ref={assistantSoundRef}/>
            {isRecording && mediaRecorder && (
                <div className={'flex items-center justify-center flex-col gap-4'}>
                    <div>
                        <button className={'text-black w-[100px] h-[100px] font-medium antialiased rounded-full bg-[#3b93eb] flex items-center justify-center animate-pulse'}>
                            <span className={'text-white antialiased'}>Speak</span>
                        </button>
                    </div>
                    <MyLiveAudioVisualizer mediaRecorder={mediaRecorder} onStoppedSpeaking={stopRecording}/>
                </div>
            )}

            {!isRecording && !autoStart && (
                <div>
                    <button onClick={handleStartRecording} className={'text-black w-[100px] h-[100px] font-medium antialiased rounded-full bg-[#3b93eb] flex items-center justify-center animate-scale hover:shadow-rounded'}>
                        <MicIcon />
                    </button>
                </div>
            )}

        </>
    )


};

export default MyAudioRecorder;
'use client'

import {useEffect, useState} from "react";
import useAudioRecorder from '@/hooks/useAudioRecorder';
import {sendAudio} from "@/actions";
import MyAudioRecorder from "@/components/audio-recorder";
import MyAudioVisualizer from "@/components/my-audio-visualizer";
import BlobLoader from "@/components/blob-loader";
import { SignedOut, LoginButton, SignedIn } from "@kobbleio/next/client";
import {UserInfo} from "@/components/user-info";

export default function Home() {

  const [blob, setBlob] = useState<Blob | null>(null);
    const [isLoading, setIsLoading] = useState(false);
  const [blobres, setBlobres] = useState<string | null>(null);
  const recorder = useAudioRecorder();
  const [displayLoginButton, setDisplayLoginButton] = useState(false);
  const [autoStart, setAutoStart] = useState(false);


    const sendFormData = async (formData: FormData) => {
        setAutoStart(true)
        setIsLoading(true);
        setBlob(null)
        setBlobres(null);

        const result = await sendAudio(formData);

        if (result.isError) {
            alert('You have reached your message quota. Please upgrade your plan to generate more audio.');
            return;
        }

        const { dataUrl, needsAuthentication } = result;

        setIsLoading(false);

        if (needsAuthentication) {
            setAutoStart(false);
            setDisplayLoginButton(true);
        }

        setBlobres(dataUrl);
    }

    useEffect(() => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const formData = new FormData();
            formData.append('audio', blob, 'audio.wav');
            sendFormData(formData);
        }
    }, [blob]);

  return (
    <div className={'h-screen flex flex-col bg-[#101010] relative'}>
        <SignedIn>
            <div className={'grow-0 shrink-0 p-5 z-10 flex items-center justify-end'}>
                <UserInfo />
            </div>
        </SignedIn>
        <div className={'z-10 flex items-center justify-center flex-col grow'}>
            <div className={'flex flex-col items-center justify-center'}>
                { !blobres && !displayLoginButton && <MyAudioRecorder onRecordingComplete={setBlob} autoStart={autoStart} /> }

                {isLoading &&   <BlobLoader /> }

                { !!blobres && <MyAudioVisualizer audioDataUrl={blobres} onReadComplete={() => setBlobres(null)} /> }

                { displayLoginButton && (
                    <SignedOut>
                        <div className={'mt-10 m-auto'}>
                            <LoginButton><button className={'bg-white rounded-md py-2 px-4 hover:shadow-2xl'}>Log in to continue</button></LoginButton>
                        </div>
                    </SignedOut>
                )
                }
            </div>
        </div>
        <div className={'absolute left-0 top-0 right-0 bottom-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-0'}></div>
    </div>
  );
}

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

function App() {
    const [recording, setRecording] = useState(false);
    const [videoURL, setVideoURL] = useState(null);
    const [videoBlob, setVideoBlob] = useState(null);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // Paramètres pour le composant Webcam
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    // Activer la caméra
    const enableCamera = () => {
        setCameraEnabled(true);
    };

    // Démarrer l'enregistrement
    const startRecording = useCallback(() => {
        setRecording(true);
        chunksRef.current = []; // Réinitialiser les chunks
        mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
            mimeType: 'video/webm' // Format recommandé pour les navigateurs modernes
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setVideoBlob(blob);
            setVideoURL(url);
        };

        mediaRecorderRef.current.start();
    }, [webcamRef, setRecording]);

    // Arrêter l'enregistrement
    const stopRecording = useCallback(() => {
        mediaRecorderRef.current.stop();
        setRecording(false);
    }, [mediaRecorderRef, setRecording]);

    // Réinitialiser l'enregistrement
    const resetRecording = () => {
        setVideoURL(null);
        setVideoBlob(null);
    };

    // Envoyer la vidéo au serveur
    const uploadVideo = async () => {
        if (!videoBlob) return;
        
        const formData = new FormData();
        formData.append('video', videoBlob, 'video.webm');

        try {
            const response = await axios.post('https://your-backend-url/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log("Vidéo envoyée avec succès :", response.data);
        } catch (err) {
            console.error("Erreur lors de l'envoi de la vidéo :", err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Enregistreur de Vidéo</h2>

            {!cameraEnabled ? (
                <button
                    onClick={enableCamera}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                    Activer la Caméra
                </button>
            ) : (
                !videoURL && (
                    <div className="w-full max-w-md">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="rounded-lg shadow-lg w-full mb-4"
                        />
                        <div className="flex justify-between space-x-2">
                            {!recording ? (
                                <button
                                    onClick={startRecording}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    Démarrer l'Enregistrement
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                                >
                                    Arrêter l'Enregistrement
                                </button>
                            )}
                        </div>
                    </div>
                )
            )}

            {videoURL && (
                <div className="w-full max-w-md">
                    <video src={videoURL} controls className="rounded-lg shadow-lg w-full mb-4"></video>
                    <div className="flex justify-between space-x-2">
                        <button
                            onClick={uploadVideo}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Envoyer la Vidéo
                        </button>
                        <button
                            onClick={resetRecording}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Supprimer la Vidéo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
